package de.grahl.serverwahl;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.TextComponent;
import net.kyori.adventure.text.format.NamedTextColor;
import net.kyori.adventure.text.format.TextDecoration;

import org.bukkit.Bukkit;
import org.bukkit.Color;
import org.bukkit.Location;
import org.bukkit.Material;
import org.bukkit.NamespacedKey;
import org.bukkit.OfflinePlayer;
import org.bukkit.Registry;
import org.bukkit.Tag;
import org.bukkit.World;
import org.bukkit.block.Block;
import org.bukkit.configuration.ConfigurationSection;
import org.bukkit.configuration.file.YamlConfiguration;
import org.bukkit.entity.Entity;
import org.bukkit.entity.Player;
import org.bukkit.entity.TextDisplay;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import org.bukkit.event.block.Action;
import org.bukkit.event.inventory.InventoryCloseEvent;
import org.bukkit.event.player.PlayerInteractEvent;
import org.bukkit.event.player.PlayerJoinEvent;
import org.bukkit.inventory.EquipmentSlot;
import org.bukkit.inventory.Inventory;
import org.bukkit.inventory.InventoryHolder;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.PotionMeta;
import org.bukkit.plugin.Plugin;
import org.bukkit.potion.PotionEffect;
import org.bukkit.potion.PotionEffectType;

/**
 * Server-Mission „Weihnachtsinsel“ (Pascal 28.10., Bau und Wunschlisten: Spawn & Welt, spawn/mission.json). Gespendet wird über den Slot
 * „Weihnachtsinsel“ im Ender-Kisten-Menü der Spark-Insel (eine eigene Spendenkiste gibt es nur, wenn mission.json eine „kiste“ nennt).
 * Angenommen wird nur, was die aktuelle Stufe wünscht; Ziel je Wunsch = Grundmenge × Spieler der letzten 7 Tage, beim Stufenstart festgezurrt.
 * Der Bau wächst schrittweise mit (Pascal 28.10.): je 1/teile Fortschritt der Stufe (über alle Wünsche) ruft serverwahl den nächsten Bauabschnitt
 * auf (Standard weihnachtsinsel:stufe_N_teil_K), bei 100 % den Abschluss (stufe_N) und startet sofort die nächste Stufe; nach der letzten die Feier.
 * Erledigte Abschnitte stehen im Stand, nichts läuft doppelt (die Funktionen im Datapack sind zusätzlich idempotent).
 * Jeder Spieler bekommt je geschaffter Stufe traenke-je-stufe Tränke, auch wer später dazukommt (Nachlieferung beim Login,
 * bei vollem Inventar per Rechtsklick auf den Menü-Slot oder /mission abholen). Die Tafel (text_display mit Tag) zeigt Fortschritt und Top-Spender.
 * Stand in plugins/Serverwahl/mission-stand.yml (kommt mit dem Instanz-Backup), nach jeder Änderung gespeichert.
 */
final class Mission implements Listener {

    private record Stufe(String name, String funktion, String teilFunktion, LinkedHashMap<String, Integer> wuensche, JsonObject trank) {
    }

    private static final class Fenster implements InventoryHolder {
        private Inventory inv;

        @Override
        public Inventory getInventory() {
            return inv;
        }
    }

    private final Plugin plugin;
    /** Anzeigename (Nick oder Kontoname) für die Tafel */
    private final Function<Player, String> anzeige;
    private boolean aktiv;
    private Path jsonDatei;
    private LocalDate start;
    private ZoneId zone = ZoneId.of("Europe/Berlin");
    private int trankAnzahl = 3;
    private int aktivTage = 7;
    private String feierFunktion;
    private String vorbereitenFunktion;
    private String kisteWelt;
    private boolean mitKiste;
    private int teile = 10;
    private int kx, ky, kz;
    private String tafelTag;
    private Location tafelOrt;
    private final List<Stufe> stufen = new ArrayList<>();

    private File standDatei;
    private YamlConfiguration stand = new YamlConfiguration();

    Mission(Plugin plugin, Function<Player, String> anzeige) {
        this.plugin = plugin;
        this.anzeige = anzeige;
        Bukkit.getScheduler().runTaskTimer(plugin, this::minute, 200L, 1200L);
    }

    void laden(ConfigurationSection c) {
        aktiv = c != null && c.getBoolean("aktiv", false);
        if (!aktiv) {
            return;
        }
        trankAnzahl = Math.max(1, c.getInt("traenke-je-stufe", 3));
        aktivTage = Math.max(1, c.getInt("aktive-tage", 7));
        zone = ZoneId.of(c.getString("zeitzone", "Europe/Berlin"));
        String pfad = c.getString("datei", "mission.json");
        jsonDatei = Path.of(pfad).isAbsolute() ? Path.of(pfad) : plugin.getDataFolder().toPath().resolve(pfad);
        try {
            jsonLaden();
        } catch (IOException | RuntimeException e) {
            plugin.getLogger().severe("Mission: " + jsonDatei + " nicht lesbar: " + e);
            aktiv = false;
            return;
        }
        // Generalprobe (Leitung 30.10.): start in der Config überschreibt mission.json, ohne die Datei von Spawn & Welt anzufassen
        String startOverride = c.getString("start", "").trim();
        if (!startOverride.isEmpty()) {
            try {
                start = LocalDate.parse(startOverride);
            } catch (java.time.format.DateTimeParseException e) {
                plugin.getLogger().warning("Mission: start „" + startOverride + "“ ungültig, es gilt mission.json");
            }
        }
        standDatei = new File(plugin.getDataFolder(), "mission-stand.yml");
        stand = YamlConfiguration.loadConfiguration(standDatei);
        plugin.getLogger().info("Mission: " + stufen.size() + " Stufen, Stand Stufe " + stufe() + ", Start " + start);
    }

    private void jsonLaden() throws IOException {
        JsonObject j = JsonParser.parseString(Files.readString(jsonDatei)).getAsJsonObject();
        start = LocalDate.parse(j.get("start").getAsString());
        // Spawn & Welt 28.10.: stufe_4 macht die Feier selbst; ein eigenes "feier" in mission.json ist optional
        feierFunktion = j.has("feier") && j.get("feier").isJsonObject() ? j.getAsJsonObject("feier").get("funktion").getAsString() : null;
        vorbereitenFunktion = j.has("vorbereiten") ? j.get("vorbereiten").getAsString() : null;
        // Bauabschnitte nur, wenn mission.json sie nennt (Datapack liefert stufe_N_teil_K); sonst Bau erst bei voller Stufe
        teile = j.has("teile") ? Math.max(0, j.get("teile").getAsInt()) : 0;
        mitKiste = j.has("kiste") && j.get("kiste").isJsonObject();
        if (mitKiste) {
            JsonObject k = j.getAsJsonObject("kiste");
            kx = k.get("x").getAsInt();
            ky = k.get("y").getAsInt();
            kz = k.get("z").getAsInt();
        }
        JsonObject t = j.getAsJsonObject("tafel");
        tafelTag = t.get("tag").getAsString();
        kisteWelt = t.has("welt") ? t.get("welt").getAsString() : mitKiste ? j.getAsJsonObject("kiste").get("welt").getAsString() : "world";
        World w = Bukkit.getWorld(kisteWelt);
        tafelOrt = w == null ? null : new Location(w, t.get("x").getAsDouble(), t.get("y").getAsDouble(), t.get("z").getAsDouble());
        stufen.clear();
        for (JsonElement e : j.getAsJsonArray("stufen")) {
            JsonObject s = e.getAsJsonObject();
            LinkedHashMap<String, Integer> w2 = new LinkedHashMap<>();
            s.getAsJsonObject("wuensche").entrySet().forEach(x -> w2.put(x.getKey(), x.getValue().getAsInt()));
            String f = s.get("funktion").getAsString();
            String teil = s.has("teil_funktion") ? s.get("teil_funktion").getAsString() : f + "_teil_{k}";
            stufen.add(new Stufe(s.get("name").getAsString(), f, teil, w2, s.getAsJsonObject("trank")));
        }
    }

    // ---------- Stand ----------

    /** aktuelle Stufe 1…n, 0 = noch nicht gestartet, n+1 = fertig */
    private int stufe() {
        return stand.getInt("stufe", 0);
    }

    private int geschafft() {
        return Math.max(0, stufe() - 1);
    }

    private void speichern() {
        try {
            stand.save(standDatei);
        } catch (IOException e) {
            plugin.getLogger().warning("Mission: Stand nicht gespeichert: " + e.getMessage());
        }
    }

    private int ziel(String wunsch) {
        return stand.getInt("ziele." + schluessel(wunsch), 0);
    }

    private int gesamt(int stufe, String wunsch) {
        return stand.getInt("summe." + stufe + "." + schluessel(wunsch), 0);
    }

    /** YAML-Pfade vertragen keine Punkte/Doppelpunkte als Trenner sauber → Schlüssel umschreiben */
    private static String schluessel(String wunsch) {
        return wunsch.replace(':', '~').replace('#', '^');
    }

    private int aktiveSpieler() {
        long grenze = System.currentTimeMillis() - aktivTage * 86_400_000L;
        int n = 0;
        for (OfflinePlayer o : Bukkit.getOfflinePlayers()) {
            if (o.isOnline() || o.getLastSeen() >= grenze) {
                n++;
            }
        }
        return Math.max(1, n);
    }

    /** Stufe starten: Ziele festzurren */
    private void stufeStarten(int n) {
        stand.set("stufe", n);
        stand.set("ziele", null);
        if (n >= 1 && n <= stufen.size()) {
            int spieler = aktiveSpieler();
            stufen.get(n - 1).wuensche().forEach((w, grund) -> stand.set("ziele." + schluessel(w), grund * spieler));
            stand.set("spieler-beim-start." + n, spieler);
            Bukkit.broadcast(Component.text().append(Component.text("[Weihnachtsinsel] ", NamedTextColor.GOLD, TextDecoration.BOLD))
                    .append(Component.text("Stufe " + n + ": " + stufen.get(n - 1).name() + (mitKiste ? " – bringt eure Spenden zur Spendenkiste!" : " – spendet über die Ender-Kiste am Spawn („Spenden für die Weihnachtsinsel“)!"), NamedTextColor.WHITE))
                    .build());
            plugin.getLogger().info("Mission: Stufe " + n + " gestartet, " + spieler + " aktive Spieler");
        }
        speichern();
        tafel();
    }

    /** Fortschritt der Stufe 0…1 über alle Wünsche (jeder Wunsch zählt höchstens bis zu seinem Ziel) */
    private double fortschritt(int n) {
        long summe = 0;
        long ziele = 0;
        for (String w : stufen.get(n - 1).wuensche().keySet()) {
            int z = ziel(w);
            summe += Math.min(gesamt(n, w), z);
            ziele += z;
        }
        return ziele == 0 ? 1 : (double) summe / ziele;
    }

    /** fällige Bauabschnitte aufrufen (je 1/teile Fortschritt), bei 100 % abschließen. Nachholend nach Neustart/Zieländerung */
    private void pruefen() {
        int n = stufe();
        if (n < 1 || n > stufen.size()) {
            return;
        }
        Stufe s = stufen.get(n - 1);
        if (teile == 0) {
            if (fortschritt(n) >= 1) {
                abschliessen(n);
            }
            return;
        }
        int faellig = (int) Math.floor(fortschritt(n) * teile + 1e-9);
        int erledigt = stand.getInt("teile." + n, 0);
        for (int k = erledigt + 1; k <= Math.min(faellig, teile); k++) {
            konsole(s.teilFunktion().replace("{k}", String.valueOf(k)));
            stand.set("teile." + n, k);
            speichern();
            plugin.getLogger().info("Mission: Stufe " + n + " Bauabschnitt " + k + "/" + teile);
        }
        if (faellig >= teile) {
            abschliessen(n);
        }
    }

    private void abschliessen(int n) {
        Stufe s = stufen.get(n - 1);
        for (int k = stand.getInt("teile." + n, 0) + 1; k <= teile; k++) {
            konsole(s.teilFunktion().replace("{k}", String.valueOf(k)));
            stand.set("teile." + n, k);
        }
        speichern();
        konsole(s.funktion());
        plugin.getLogger().info("Mission: Stufe " + n + " geschafft");
        stufeStarten(n + 1);
        Bukkit.getOnlinePlayers().forEach(this::liefern);
        if (n == stufen.size() && feierFunktion != null) {
            // Pascal 28.10.: Feier sofort; kurz warten, damit die Lichter der letzten Stufe erst angehen
            Bukkit.getScheduler().runTaskLater(plugin, () -> {
                if (!stand.getBoolean("feier", false)) {
                    stand.set("feier", true);
                    speichern();
                    konsole(feierFunktion);
                }
            }, 400L);
        }
    }

    private static void konsole(String funktion) {
        Bukkit.dispatchCommand(Bukkit.getConsoleSender(), "execute in minecraft:overworld run function " + funktion);
    }

    /** jede Minute: Start am Starttag, Tafel aktualisieren */
    private void minute() {
        if (!aktiv) {
            return;
        }
        if (stufe() == 0 && !LocalDate.now(zone).isBefore(start)) {
            stufeStarten(1);
        }
        pruefen();
        tafel();
    }

    // ---------- Spendenkiste ----------

    private boolean istKiste(Block b) {
        return mitKiste && b != null && b.getX() == kx && b.getY() == ky && b.getZ() == kz && b.getWorld().getName().equals(kisteWelt);
    }

    /** vor WorldGuard (LOWEST): Klick auf die Kiste abbrechen und das Spendenfenster öffnen */
    @EventHandler(priority = EventPriority.LOWEST)
    public void beimKlick(PlayerInteractEvent e) {
        if (!aktiv || e.getAction() != Action.RIGHT_CLICK_BLOCK || !istKiste(e.getClickedBlock())) {
            return;
        }
        e.setCancelled(true);
        if (e.getHand() == EquipmentSlot.HAND) {
            spendenOeffnen(e.getPlayer());
        }
    }

    /** Spendenfenster (aus dem Ender-Kisten-Menü bzw. einer Spendenkiste); liefert vorher offene Tränke */
    void spendenOeffnen(Player p) {
        if (!aktiv) {
            p.sendMessage(Component.text("Die Weihnachtsinsel ist gerade aus.", NamedTextColor.GRAY));
            return;
        }
        liefern(p);
        int n = stufe();
        if (n < 1) {
            p.sendMessage(Component.text("Die Weihnachtsinsel startet am " + start.getDayOfMonth() + "." + start.getMonthValue() + ".", NamedTextColor.GRAY));
            return;
        }
        if (n > stufen.size()) {
            p.sendMessage(Component.text("Die Weihnachtsinsel ist fertig – danke an alle Spender!", NamedTextColor.GOLD));
            return;
        }
        Fenster f = new Fenster();
        f.inv = Bukkit.createInventory(f, 54, Component.text("Spenden – Stufe " + n + ": " + stufen.get(n - 1).name()));
        p.openInventory(f.inv);
        p.sendMessage(Component.text("Lege deine Spenden hinein und schließe das Fenster. Gebraucht wird:", NamedTextColor.GRAY));
        for (String w : stufen.get(n - 1).wuensche().keySet()) {
            p.sendMessage(Component.text().append(Component.text("  • ", NamedTextColor.DARK_GRAY)).append(itemName(w))
                    .append(Component.text(" " + gesamt(n, w) + "/" + ziel(w), NamedTextColor.WHITE)).build());
        }
    }

    @EventHandler
    public void beimSchliessen(InventoryCloseEvent e) {
        if (!(e.getInventory().getHolder() instanceof Fenster) || !(e.getPlayer() instanceof Player p)) {
            return;
        }
        int n = stufe();
        List<ItemStack> zurueck = new ArrayList<>();
        Map<String, Integer> angenommen = new LinkedHashMap<>();
        for (ItemStack it : e.getInventory().getContents()) {
            if (it == null || it.getType().isAir()) {
                continue;
            }
            String w = n >= 1 && n <= stufen.size() ? passenderWunsch(stufen.get(n - 1), it) : null;
            int rest = w == null ? 0 : Math.max(0, ziel(w) - gesamt(n, w));
            int nehmen = Math.min(rest, it.getAmount());
            if (nehmen > 0) {
                String sw = schluessel(w);
                stand.set("summe." + n + "." + sw, gesamt(n, w) + nehmen);
                String pfad = "spender." + n + "." + p.getUniqueId();
                stand.set(pfad, stand.getInt(pfad, 0) + nehmen);
                stand.set("gesamt-spender." + p.getUniqueId(), stand.getInt("gesamt-spender." + p.getUniqueId(), 0) + nehmen);
                stand.set("namen." + p.getUniqueId(), anzeige.apply(p));
                angenommen.merge(w, nehmen, Integer::sum);
            }
            if (nehmen < it.getAmount()) {
                ItemStack r = it.clone();
                r.setAmount(it.getAmount() - nehmen);
                zurueck.add(r);
            }
        }
        e.getInventory().clear();
        // nicht Gewünschtes und Überschuss zurück, was nicht passt vor die Füße
        p.getInventory().addItem(zurueck.toArray(new ItemStack[0])).values()
                .forEach(x -> p.getWorld().dropItemNaturally(p.getLocation(), x));
        if (!angenommen.isEmpty()) {
            speichern();
            Component dank = Component.text("Danke! Angenommen: ", NamedTextColor.GREEN);
            boolean erster = true;
            for (Map.Entry<String, Integer> a : angenommen.entrySet()) {
                dank = dank.append(Component.text((erster ? "" : ", ") + a.getValue() + "× ", NamedTextColor.WHITE)).append(itemName(a.getKey()));
                erster = false;
            }
            p.sendMessage(dank);
            plugin.getLogger().info("Mission: " + p.getName() + " spendet " + angenommen);
            pruefen();
            tafel();
        }
        if (!zurueck.isEmpty()) {
            p.sendMessage(Component.text("Nicht gewünschte Sachen und Überschuss hast du zurückbekommen.", NamedTextColor.GRAY));
        }
    }

    /** Wunsch-Schlüssel, zu dem der Gegenstand passt (Material-ID oder Item-Tag mit #), sonst null */
    private static String passenderWunsch(Stufe s, ItemStack it) {
        for (String w : s.wuensche().keySet()) {
            if (w.startsWith("#")) {
                Tag<Material> tag = Bukkit.getTag(Tag.REGISTRY_ITEMS, NamespacedKey.fromString(w.substring(1)), Material.class);
                if (tag != null && tag.isTagged(it.getType())) {
                    return w;
                }
            } else if (it.getType().getKey().toString().equals(w)) {
                return w;
            }
        }
        return null;
    }

    private static Component itemName(String w) {
        if (w.startsWith("#")) {
            String k = w.substring(w.indexOf(':') + 1);
            return Component.text(k.equals("candles") ? "Kerzen (jede Farbe)" : k, NamedTextColor.AQUA);
        }
        Material m = Material.matchMaterial(w);
        return m == null ? Component.text(w, NamedTextColor.AQUA) : Component.translatable(m.translationKey(), NamedTextColor.AQUA);
    }

    // ---------- Menü-Slot (Ender-Kisten-Menü) ----------

    boolean aktiv() {
        return aktiv;
    }

    /** Gegenstand für den Slot „Weihnachtsinsel“ mit Stufe, Fortschritt und offenen Tränken */
    ItemStack menuePunkt(Player p) {
        int n = stufe();
        ItemStack it = new ItemStack(n > stufen.size() ? Material.NETHER_STAR : Material.SPRUCE_SAPLING);
        var m = it.getItemMeta();
        m.displayName(Component.text("Spenden für die Weihnachtsinsel", NamedTextColor.GOLD).decoration(TextDecoration.ITALIC, false));
        List<Component> lore = new ArrayList<>();
        if (n < 1) {
            lore.add(grau("Start am " + start.getDayOfMonth() + "." + start.getMonthValue() + "."));
        } else if (n > stufen.size()) {
            lore.add(grau("Fertig – danke an alle Spender!"));
        } else {
            lore.add(grau("Stufe " + n + "/" + stufen.size() + ": " + stufen.get(n - 1).name()));
            lore.add(grau("Fortschritt " + (int) Math.floor(fortschritt(n) * 100) + " %"));
            lore.add(Component.empty());
            lore.add(Component.text("Klicken zum Spenden", NamedTextColor.YELLOW).decoration(TextDecoration.ITALIC, false));
        }
        int offen = offeneTraenke(p);
        if (offen > 0) {
            lore.add(Component.text("Rechtsklick: " + offen + " Tränke abholen", NamedTextColor.GREEN).decoration(TextDecoration.ITALIC, false));
        }
        m.lore(lore);
        it.setItemMeta(m);
        return it;
    }

    private static Component grau(String t) {
        return Component.text(t, NamedTextColor.GRAY).decoration(TextDecoration.ITALIC, false);
    }

    /** Klick auf den Menü-Slot: Rechtsklick holt Tränke ab, sonst Spendenfenster */
    void menueKlick(Player p, boolean rechts) {
        if (rechts && offeneTraenke(p) > 0) {
            p.closeInventory();
            liefern(p);
            return;
        }
        p.closeInventory();
        spendenOeffnen(p);
    }

    private int offeneTraenke(Player p) {
        int offen = 0;
        for (int n = 1; n <= Math.min(geschafft(), stufen.size()); n++) {
            int anzahl = stufen.get(n - 1).trank().has("anzahl") ? stufen.get(n - 1).trank().get("anzahl").getAsInt() : trankAnzahl;
            offen += Math.max(0, anzahl - stand.getInt("traenke." + p.getUniqueId() + "." + n, 0));
        }
        return offen;
    }

    // ---------- Tränke ----------

    @EventHandler
    public void beimBeitritt(PlayerJoinEvent e) {
        if (aktiv) {
            Bukkit.getScheduler().runTaskLater(plugin, () -> liefern(e.getPlayer()), 60L);
        }
    }

    /** alle noch offenen Tränke der geschafften Stufen geben; was nicht passt, bleibt offen (Abholen an der Kiste) */
    private void liefern(Player p) {
        if (!aktiv || !p.isOnline()) {
            return;
        }
        boolean voll = false;
        int bekommen = 0;
        for (int n = 1; n <= Math.min(geschafft(), stufen.size()); n++) {
            String pfad = "traenke." + p.getUniqueId() + "." + n;
            int schon = stand.getInt(pfad, 0);
            int anzahl = stufen.get(n - 1).trank().has("anzahl") ? stufen.get(n - 1).trank().get("anzahl").getAsInt() : trankAnzahl;
            for (int i = schon; i < anzahl; i++) {
                if (p.getInventory().firstEmpty() < 0) {
                    voll = true;
                    break;
                }
                p.getInventory().addItem(trank(n));
                stand.set(pfad, i + 1);
                bekommen++;
            }
        }
        if (bekommen > 0) {
            speichern();
            p.sendMessage(Component.text("Weihnachtsinsel: " + bekommen + " Belohnungs-Tränke ins Inventar gelegt.", NamedTextColor.GOLD));
        }
        if (voll) {
            p.sendMessage(Component.text("Dein Inventar ist voll – weitere Tränke holst du per Rechtsklick auf „Weihnachtsinsel“ im Ender-Kisten-Menü ab (oder /mission abholen).", NamedTextColor.YELLOW));
        }
    }

    private ItemStack trank(int n) {
        JsonObject t = stufen.get(n - 1).trank();
        ItemStack it = new ItemStack(Material.POTION);
        PotionMeta m = (PotionMeta) it.getItemMeta();
        m.setColor(Color.fromRGB(t.get("farbe").getAsInt() & 0xFFFFFF));
        JsonArray effekte = t.getAsJsonArray("effekte");
        for (JsonElement e : effekte) {
            JsonObject ef = e.getAsJsonObject();
            PotionEffectType typ = Registry.EFFECT.get(NamespacedKey.fromString(ef.get("id").getAsString()));
            if (typ != null) {
                m.addCustomEffect(new PotionEffect(typ, ef.get("sekunden").getAsInt() * 20, ef.get("stufe").getAsInt()), true);
            }
        }
        m.itemName(Component.text(t.get("name").getAsString(), NamedTextColor.GOLD));
        m.lore(List.of(Component.text("Weihnachtsinsel 2026 – Stufe " + n, NamedTextColor.AQUA).decoration(TextDecoration.ITALIC, false)));
        if (t.has("glanz") && t.get("glanz").getAsBoolean()) {
            m.setEnchantmentGlintOverride(true);
        }
        it.setItemMeta(m);
        return it;
    }

    // ---------- Tafel ----------

    private void tafel() {
        if (!aktiv || tafelOrt == null || !tafelOrt.isChunkLoaded()) {
            return;
        }
        TextDisplay d = null;
        for (Entity e : tafelOrt.getWorld().getNearbyEntities(tafelOrt, 4, 4, 4)) {
            if (e instanceof TextDisplay td && td.getScoreboardTags().contains(tafelTag)) {
                d = td;
                break;
            }
        }
        if (d == null) {
            return;
        }
        int n = stufe();
        TextComponent.Builder b = Component.text().append(Component.text("❄ Weihnachtsinsel ❄", NamedTextColor.GOLD, TextDecoration.BOLD));
        if (n < 1) {
            b.append(Component.newline()).append(Component.text("Start am " + start.getDayOfMonth() + "." + start.getMonthValue() + ".", NamedTextColor.GRAY));
        } else if (n > stufen.size()) {
            b.append(Component.newline()).append(Component.text("Fertig – danke an alle!", NamedTextColor.GREEN));
        } else {
            b.append(Component.newline()).append(Component.text("Stufe " + n + "/" + stufen.size() + ": " + stufen.get(n - 1).name()
                    + " – " + (int) Math.floor(fortschritt(n) * 100) + " %", NamedTextColor.WHITE));
            for (String w : stufen.get(n - 1).wuensche().keySet()) {
                int g = gesamt(n, w);
                int z = ziel(w);
                b.append(Component.newline()).append(itemName(w))
                        .append(Component.text(" " + g + "/" + z, g >= z ? NamedTextColor.GREEN : NamedTextColor.WHITE));
            }
            b.append(Component.newline()).append(Component.text("Top dieser Stufe: ", NamedTextColor.YELLOW)).append(Component.text(top("spender." + n, 3), NamedTextColor.WHITE));
        }
        b.append(Component.newline()).append(Component.text("Top gesamt:", NamedTextColor.YELLOW));
        b.append(Component.newline()).append(Component.text(top("gesamt-spender", 5), NamedTextColor.WHITE));
        d.text(b.build());
    }

    private String top(String pfad, int anzahl) {
        ConfigurationSection s = stand.getConfigurationSection(pfad);
        if (s == null) {
            return "–";
        }
        Map<String, Integer> m = new HashMap<>();
        s.getKeys(false).forEach(k -> m.put(k, s.getInt(k)));
        StringBuilder sb = new StringBuilder();
        m.entrySet().stream().sorted((a, c) -> c.getValue() - a.getValue()).limit(anzahl).forEach(x -> {
            if (!sb.isEmpty()) {
                sb.append(" · ");
            }
            sb.append(stand.getString("namen." + x.getKey(), "?")).append(" ").append(x.getValue());
        });
        return sb.isEmpty() ? "–" : sb.toString();
    }

    // ---------- Befehle ----------

    /** /mission (Spieler): Stand bzw. abholen */
    String spieler(Player p, String[] args) {
        if (!aktiv) {
            return "Die Weihnachtsinsel ist gerade aus.";
        }
        if (args.length >= 1 && args[0].equalsIgnoreCase("abholen")) {
            liefern(p);
            return "Offene Tränke geprüft.";
        }
        int n = stufe();
        return n < 1 ? "Start am " + start : n > stufen.size() ? "Fertig!"
                : "Stufe " + n + ": " + stufen.get(n - 1).name() + " – " + (int) Math.floor(fortschritt(n) * 100) + " %, spenden über die Ender-Kiste am Spawn";
    }

    /** /serverwahl mission status | stufe <n> | ziel <wunsch> <menge> | weiter | neu-laden | vorbereiten */
    String admin(String[] args) {
        if (!aktiv) {
            return "Mission aus (Config mission.aktiv)";
        }
        String was = args.length >= 2 ? args[1] : "status";
        switch (was) {
            case "stufe" -> {
                int n = args.length >= 3 ? Integer.parseInt(args[2]) : 1;
                stufeStarten(n);
                return "Stufe " + n + " gestartet (Ziele neu festgezurrt)";
            }
            case "ziel" -> {
                if (args.length < 4) {
                    return "/serverwahl mission ziel <wunsch, z. B. minecraft:dirt> <menge>";
                }
                stand.set("ziele." + schluessel(args[2]), Integer.parseInt(args[3]));
                speichern();
                pruefen();
                tafel();
                return "Ziel " + args[2] + " = " + args[3];
            }
            case "weiter" -> {
                int n = stufe();
                if (n < 1 || n > stufen.size()) {
                    return "Keine laufende Stufe";
                }
                abschliessen(n);
                return "Stufe " + n + " abgeschlossen";
            }
            case "neu-laden" -> {
                try {
                    jsonLaden();
                } catch (IOException | RuntimeException e) {
                    return "mission.json fehlerhaft: " + e.getMessage();
                }
                tafel();
                return "mission.json neu geladen (" + stufen.size() + " Stufen)";
            }
            case "vorbereiten" -> {
                if (vorbereitenFunktion != null) {
                    konsole(vorbereitenFunktion);
                }
                return "vorbereiten aufgerufen";
            }
            default -> {
                int n = stufe();
                StringBuilder b = new StringBuilder("Mission: Stufe " + n + " von " + stufen.size() + (n >= 1 && n <= stufen.size()
                        ? ", " + (int) Math.floor(fortschritt(n) * 100) + " %, Abschnitte " + stand.getInt("teile." + n, 0) + "/" + teile : "")
                        + ", aktive Spieler jetzt " + aktiveSpieler()
                        + ", Tränke je Stufe " + trankAnzahl);
                if (n >= 1 && n <= stufen.size()) {
                    stufen.get(n - 1).wuensche().keySet().forEach(w -> b.append("\n  ").append(w).append(" ").append(gesamt(n, w)).append("/").append(ziel(w)));
                }
                return b.toString();
            }
        }
    }
}
