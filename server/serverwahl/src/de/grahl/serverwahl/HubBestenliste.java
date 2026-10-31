package de.grahl.serverwahl;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.destroystokyo.paper.profile.PlayerProfile;
import com.destroystokyo.paper.profile.ProfileProperty;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import io.papermc.paper.datacomponent.item.ResolvableProfile;
import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.format.NamedTextColor;
import net.kyori.adventure.text.format.TextDecoration;
import org.bukkit.Bukkit;
import org.bukkit.Chunk;
import org.bukkit.Location;
import org.bukkit.Material;
import org.bukkit.NamespacedKey;
import org.bukkit.World;
import org.bukkit.configuration.ConfigurationSection;
import org.bukkit.configuration.file.YamlConfiguration;
import org.bukkit.entity.Display;
import org.bukkit.entity.Entity;
import org.bukkit.entity.Mannequin;
import org.bukkit.entity.Pose;
import org.bukkit.entity.TextDisplay;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import org.bukkit.event.entity.EntityDamageEvent;
import org.bukkit.event.player.PlayerInteractAtEntityEvent;
import org.bukkit.event.player.PlayerInteractEntityEvent;
import org.bukkit.event.player.PlayerJoinEvent;
import org.bukkit.event.world.EntitiesLoadEvent;
import org.bukkit.inventory.EntityEquipment;
import org.bukkit.inventory.EquipmentSlot;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.ItemMeta;
import org.bukkit.plugin.java.JavaPlugin;
import org.bukkit.scheduler.BukkitTask;

/**
 * Hub-Bestenlisten (Pascal 31.10.): auf jedem der 8 Plätze steht die Nummer 1 der Liste als Mannequin mit echtem Skin,
 * darüber ein Text-Display mit Titel, Untertitel und Top 5. Quelle: bestenliste.json der Statistik (statistik/DATENFORMAT.md, „Hub-Datei“),
 * Listen mit hub: true in Datei-Reihenfolge = Platz 1–8.
 * Die Entitäten sind nicht persistent: beim Start neu gesetzt, beim Beenden entfernt, also nie doppelt. Ihre Chunks hält ein Plugin-Ticket geladen.
 * Bei neuem Stand nur Text und ggf. Profil ändern, nicht neu spawnen.
 * Skins: der Hub merkt sich beim Beitritt die Textur jedes Spielers (skins.yml), auch Bedrock (Floodgate liefert sie über Velocity).
 * Ohne gemerkte Textur löst der Server den Namen bei Mojang auf; klappt das nicht (Bedrock-Name mit Präfix), bleibt der Standard-Skin.
 */
final class HubBestenliste implements Listener {

    static final String TAG = "hub_bestenliste";

    /** ein Eintrag der Hub-Datei, nur hub: true */
    record Liste(String id, String titel, String unter, List<String[]> plaetze) {
        String erster() {
            return plaetze.isEmpty() ? null : plaetze.get(0)[0];
        }
    }

    /** liste = id der Liste auf diesem Platz (leer: Platz i = i-te Hub-Liste der Datei) */
    private record Ort(String liste, String welt, double x, double y, double z, float blick) {}

    private record Ausstattung(Pose pose, ItemStack hand, ItemStack nebenhand, ItemStack brust) {}

    private final JavaPlugin plugin;
    private Path datei;
    private final List<Ort> orte = new ArrayList<>();
    private final Map<String, Ausstattung> ausstattung = new HashMap<>();
    private double textHoehe;
    private BukkitTask aufgabe;
    private long zuletztGeaendert = -1;
    /** nach Start/Reload einmal den Stand ins Log schreiben */
    private boolean gemeldet;
    /** Platz-Index → zuletzt gesetzter Text bzw. Name der Figur */
    private final Map<Integer, String> textStand = new HashMap<>();
    private final Map<Integer, String> figurStand = new HashMap<>();
    private final Map<Integer, Mannequin> figuren = new HashMap<>();
    private final Map<Integer, TextDisplay> texte = new HashMap<>();
    private final List<Chunk> tickets = new ArrayList<>();
    private java.io.File skinDatei;
    private YamlConfiguration skins;

    HubBestenliste(JavaPlugin plugin) {
        this.plugin = plugin;
    }

    void laden(ConfigurationSection c, boolean istHub) {
        entfernen();
        orte.clear();
        ausstattung.clear();
        String d = c == null || !istHub ? "" : c.getString("datei", "");
        datei = d.isBlank() ? null : Path.of(d);
        if (datei == null) {
            return;
        }
        textHoehe = c.getDouble("text-hoehe", 2.3);
        for (Map<?, ?> o : c.getMapList("plaetze")) {
            orte.add(new Ort(o.get("liste") == null ? null : String.valueOf(o.get("liste")), String.valueOf(o.get("welt") == null ? "world" : o.get("welt")), zahl(o.get("x")), zahl(o.get("y")), zahl(o.get("z")),
                    (float) zahl(o.get("blick"))));
        }
        ConfigurationSection a = c.getConfigurationSection("figuren");
        if (a != null) {
            for (String id : a.getKeys(false)) {
                ConfigurationSection f = a.getConfigurationSection(id);
                Pose pose;
                try {
                    pose = Pose.valueOf(f.getString("pose", "STANDING"));
                } catch (IllegalArgumentException ex) {
                    plugin.getLogger().warning("Bestenliste: unbekannte Pose " + f.getString("pose") + " (" + id + ")");
                    pose = Pose.STANDING;
                }
                ausstattung.put(id, new Ausstattung(pose, gegenstand(f.getString("hand")), gegenstand(f.getString("nebenhand")), gegenstand(f.getString("brust"))));
            }
        }
        skinDatei = new java.io.File(plugin.getDataFolder(), "skins.yml");
        skins = YamlConfiguration.loadConfiguration(skinDatei);
        zuletztGeaendert = -1;
        gemeldet = false;
        if (orte.isEmpty()) {
            plugin.getLogger().info("Bestenliste: keine Plätze eingetragen, aus");
            return;
        }
        int sek = Math.max(10, c.getInt("pruefen-sekunden", 60));
        aufgabe = Bukkit.getScheduler().runTaskTimer(plugin, this::pruefen, 40L, sek * 20L);
    }

    private static double zahl(Object o) {
        return o instanceof Number n ? n.doubleValue() : o == null ? 0 : Double.parseDouble(o.toString());
    }

    /** „MATERIAL“ oder „MATERIAL@namespace:modell“ (Modell aus dem Ressourcenpaket), leer = nichts */
    private ItemStack gegenstand(String s) {
        if (s == null || s.isBlank()) {
            return null;
        }
        String[] t = s.split("@", 2);
        Material m = Material.matchMaterial(t[0].trim());
        if (m == null) {
            plugin.getLogger().warning("Bestenliste: unbekanntes Material " + s);
            return null;
        }
        ItemStack item = new ItemStack(m);
        if (t.length == 2) {
            ItemMeta meta = item.getItemMeta();
            meta.setItemModel(NamespacedKey.fromString(t[1].trim()));
            item.setItemMeta(meta);
        }
        return item;
    }

    /** Hub-Datei lesen: Listen mit hub: true in Datei-Reihenfolge, je Liste die Plätze als {name, text} */
    static List<Liste> lesen(String json) {
        List<Liste> listen = new ArrayList<>();
        JsonObject wurzel = JsonParser.parseString(json).getAsJsonObject();
        for (JsonElement e : wurzel.getAsJsonArray("listen")) {
            JsonObject l = e.getAsJsonObject();
            if (!l.has("hub") || !l.get("hub").getAsBoolean()) {
                continue;
            }
            List<String[]> plaetze = new ArrayList<>();
            JsonArray p = l.has("plaetze") ? l.getAsJsonArray("plaetze") : new JsonArray();
            for (JsonElement pe : p) {
                JsonObject po = pe.getAsJsonObject();
                plaetze.add(new String[] {po.get("name").getAsString(), po.has("text") ? po.get("text").getAsString() : String.valueOf(po.get("wert"))});
                if (plaetze.size() == 5) {
                    break;
                }
            }
            listen.add(new Liste(l.get("id").getAsString(), l.get("titel").getAsString(), l.has("unter") ? l.get("unter").getAsString() : "", plaetze));
        }
        return listen;
    }

    static Component text(Liste l) {
        Component c = Component.text(l.titel(), NamedTextColor.GOLD, TextDecoration.BOLD)
                .append(Component.newline())
                .append(Component.text(l.unter(), NamedTextColor.GRAY).decoration(TextDecoration.BOLD, false));
        if (l.plaetze().isEmpty()) {
            return c.append(Component.newline()).append(Component.newline())
                    .append(Component.text("Noch frei", NamedTextColor.DARK_GRAY).decoration(TextDecoration.BOLD, false));
        }
        NamedTextColor[] farben = {NamedTextColor.YELLOW, NamedTextColor.WHITE, NamedTextColor.GOLD, NamedTextColor.GRAY, NamedTextColor.GRAY};
        c = c.append(Component.newline());
        for (int i = 0; i < l.plaetze().size(); i++) {
            String[] p = l.plaetze().get(i);
            c = c.append(Component.newline())
                    .append(Component.text((i + 1) + ". " + p[0], farben[i]).decoration(TextDecoration.BOLD, false))
                    .append(Component.text("  " + p[1], NamedTextColor.GRAY).decoration(TextDecoration.BOLD, false));
        }
        return c;
    }

    private void pruefen() {
        if (datei == null) {
            return;
        }
        String json;
        try {
            long m = Files.exists(datei) ? Files.getLastModifiedTime(datei).toMillis() : 0;
            // unverändert und alles steht noch → nichts tun (nach kill @e, z. B. function hub:aufbau, wird neu gesetzt)
            if (m == zuletztGeaendert && texte.size() == orte.size() && texte.values().stream().allMatch(Entity::isValid)
                    && figuren.values().stream().allMatch(Entity::isValid)) {
                return;
            }
            zuletztGeaendert = m;
            json = m == 0 ? null : Files.readString(datei, StandardCharsets.UTF_8);
        } catch (IOException ex) {
            plugin.getLogger().warning("Bestenliste: " + datei + " nicht lesbar: " + ex.getMessage());
            return;
        }
        List<Liste> listen;
        try {
            listen = json == null ? List.of() : lesen(json);
        } catch (RuntimeException ex) {
            plugin.getLogger().warning("Bestenliste: " + datei + " fehlerhaft: " + ex.getMessage());
            return;
        }
        for (int i = 0; i < orte.size(); i++) {
            String id = orte.get(i).liste();
            Liste l = id == null ? (i < listen.size() ? listen.get(i) : null)
                    : listen.stream().filter(x -> x.id().equals(id)).findFirst().orElse(null);
            platz(i, l);
        }
        if (!gemeldet) {
            gemeldet = true;
            plugin.getLogger().info(status() + ", " + listen.size() + " Listen in der Datei");
        }
    }

    private void platz(int i, Liste l) {
        Ort o = orte.get(i);
        World w = Bukkit.getWorld(o.welt());
        if (w == null) {
            return;
        }
        Location fuss = new Location(w, o.x(), o.y(), o.z(), o.blick(), 0f);
        Chunk ch = fuss.getChunk();
        if (!tickets.contains(ch)) {
            ch.addPluginChunkTicket(plugin);
            tickets.add(ch);
        }
        platzhalterWeg(w.getNearbyEntities(fuss, 4, 6, 4));
        // Text
        TextDisplay t = texte.get(i);
        if (t == null || !t.isValid()) {
            t = w.spawn(fuss.clone().add(0, textHoehe, 0), TextDisplay.class, d -> {
                grund(d);
                d.setBillboard(Display.Billboard.CENTER);
                d.setAlignment(TextDisplay.TextAlignment.CENTER);
                d.setLineWidth(220);
                d.setBackgroundColor(org.bukkit.Color.fromARGB(0x60, 0, 0, 0));
            });
            texte.put(i, t);
            textStand.remove(i);
        }
        Component inhalt = l == null ? Component.text("Bestenliste", NamedTextColor.GOLD) : text(l);
        String signatur = net.kyori.adventure.text.serializer.plain.PlainTextComponentSerializer.plainText().serialize(inhalt);
        if (!signatur.equals(textStand.get(i))) {
            t.text(inhalt);
            textStand.put(i, signatur);
        }
        // Figur: nur mit einer Nummer 1, sonst keine
        String erster = l == null ? null : l.erster();
        Mannequin f = figuren.get(i);
        if (erster == null) {
            if (f != null) {
                f.remove();
                figuren.remove(i);
                figurStand.remove(i);
            }
            return;
        }
        if (f == null || !f.isValid()) {
            Ausstattung a = ausstattung.get(l.id());
            f = w.spawn(fuss, Mannequin.class, m -> {
                grund(m);
                m.setImmovable(true);
                m.setInvulnerable(true);
                m.setSilent(true);
                m.setGravity(false);
                m.setCollidable(false);
                m.setAI(false);
                m.setCanPickupItems(false);
                m.setRemoveWhenFarAway(false);
                m.setDescription(null);
                if (a != null) {
                    EntityEquipment eq = m.getEquipment();
                    setze(eq, EquipmentSlot.HAND, a.hand());
                    setze(eq, EquipmentSlot.OFF_HAND, a.nebenhand());
                    setze(eq, EquipmentSlot.CHEST, a.brust());
                    if (a.pose() != Pose.STANDING) {
                        m.setPose(a.pose(), true);
                    }
                }
            });
            figuren.put(i, f);
            figurStand.remove(i);
        }
        if (!erster.equals(figurStand.get(i))) {
            f.setProfile(profil(erster));
            figurStand.put(i, erster);
        }
    }

    private static void setze(EntityEquipment eq, EquipmentSlot slot, ItemStack item) {
        if (item != null) {
            eq.setItem(slot, item.clone());
        }
    }

    private void grund(Entity e) {
        e.setPersistent(false);
        e.addScoreboardTag(TAG);
        e.addScoreboardTag("hub");
    }

    /** gemerkte Textur (Beitritt im Hub) bevorzugt, sonst Name zur Auflösung, sonst Standard-Skin */
    ResolvableProfile profil(String name) {
        ConfigurationSection s = skins.getConfigurationSection("skins." + name.toLowerCase(java.util.Locale.ROOT));
        try {
            if (s != null && s.getString("textur") != null) {
                ResolvableProfile.Builder b = ResolvableProfile.resolvableProfile().addProperty(new ProfileProperty("textures", s.getString("textur"), s.getString("signatur")));
                if (s.getString("uuid") != null) {
                    b.uuid(java.util.UUID.fromString(s.getString("uuid")));
                }
                return b.build();
            }
            return ResolvableProfile.resolvableProfile().name(name).build();
        } catch (RuntimeException ex) {
            plugin.getLogger().info("Bestenliste: kein Skin für " + name + " (" + ex.getMessage() + "), Standard-Skin");
            return Mannequin.defaultProfile();
        }
    }

    /** Textur jedes Spielers beim Beitritt merken (Name klein → Textur, Signatur, UUID) */
    @EventHandler
    public void beimBeitritt(PlayerJoinEvent e) {
        if (datei == null || skins == null) {
            return;
        }
        PlayerProfile pp = e.getPlayer().getPlayerProfile();
        for (ProfileProperty p : pp.getProperties()) {
            if (!p.getName().equals("textures")) {
                continue;
            }
            String k = "skins." + e.getPlayer().getName().toLowerCase(java.util.Locale.ROOT);
            if (p.getValue().equals(skins.getString(k + ".textur"))) {
                return;
            }
            skins.set(k + ".textur", p.getValue());
            skins.set(k + ".signatur", p.getSignature());
            skins.set(k + ".uuid", e.getPlayer().getUniqueId().toString());
            try {
                skins.save(skinDatei);
            } catch (IOException ex) {
                plugin.getLogger().warning("Bestenliste: skins.yml nicht schreibbar: " + ex.getMessage());
            }
            // steht der Spieler gerade auf einem Platz: Skin sofort tauschen
            figurStand.entrySet().removeIf(en -> en.getValue().equalsIgnoreCase(e.getPlayer().getName()));
            zuletztGeaendert = -2;
            return;
        }
    }

    /** Reste aus einem Absturz (nicht sauber entfernt) beim Laden der Chunks wegräumen */
    @EventHandler
    public void beimLadenVonEntities(EntitiesLoadEvent e) {
        for (Entity en : e.getEntities()) {
            if (en.getScoreboardTags().contains(TAG) && !figuren.containsValue(en) && !texte.containsValue(en)) {
                en.remove();
            }
        }
        if (!orte.isEmpty()) {
            platzhalterWeg(e.getEntities());
        }
    }

    /** Platzhalter-Texte des Hub-Datapacks (Tags hub_bestenliste_1…8, y 237.5, stünden der Figur im Kopf): das Plugin übernimmt die Plätze */
    private static void platzhalterWeg(java.util.Collection<Entity> entities) {
        for (Entity en : entities) {
            if (en.getScoreboardTags().stream().anyMatch(t -> t.startsWith(TAG + "_") && t.length() > TAG.length() + 1 && t.substring(TAG.length() + 1).chars().allMatch(Character::isDigit))) {
                en.remove();
            }
        }
    }

    @EventHandler(priority = EventPriority.LOWEST)
    public void beiKlick(PlayerInteractEntityEvent e) {
        if (e.getRightClicked().getScoreboardTags().contains(TAG)) {
            e.setCancelled(true);
        }
    }

    @EventHandler(priority = EventPriority.LOWEST)
    public void beiKlickAt(PlayerInteractAtEntityEvent e) {
        if (e.getRightClicked().getScoreboardTags().contains(TAG)) {
            e.setCancelled(true);
        }
    }

    @EventHandler(priority = EventPriority.LOWEST)
    public void beiSchaden(EntityDamageEvent e) {
        if (e.getEntity().getScoreboardTags().contains(TAG)) {
            e.setCancelled(true);
        }
    }

    /** /serverwahl bestenliste: sofort neu lesen */
    void neuLesen() {
        zuletztGeaendert = -2;
        pruefen();
    }

    String status() {
        return "Bestenliste: " + (datei == null ? "aus" : orte.size() + " Plätze, " + figuren.size() + " Figuren, Datei " + datei);
    }

    void entfernen() {
        if (aufgabe != null) {
            aufgabe.cancel();
            aufgabe = null;
        }
        figuren.values().forEach(Entity::remove);
        texte.values().forEach(Entity::remove);
        figuren.clear();
        texte.clear();
        textStand.clear();
        figurStand.clear();
        tickets.forEach(c -> c.removePluginChunkTicket(plugin));
        tickets.clear();
    }
}
