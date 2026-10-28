package de.grahl.serverwahl;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.format.NamedTextColor;

import org.bukkit.Bukkit;
import org.bukkit.Location;
import org.bukkit.Material;
import org.bukkit.World;
import org.bukkit.block.Block;
import org.bukkit.block.Jukebox;
import org.bukkit.configuration.ConfigurationSection;
import org.bukkit.entity.Entity;
import org.bukkit.entity.Interaction;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import org.bukkit.event.entity.EntityDamageByEntityEvent;
import org.bukkit.event.player.PlayerInteractAtEntityEvent;
import org.bukkit.event.player.PlayerInteractEntityEvent;
import org.bukkit.inventory.EquipmentSlot;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.Merchant;
import org.bukkit.inventory.MerchantRecipe;
import org.bukkit.plugin.Plugin;

/**
 * Weihnachtsmann im Iglu der Weihnachtsinsel (Pascal 28.10., Bau und Ware: Spawn & Welt, spawn/weihnachtsmann.json). Erscheint mit Stufe 4
 * (Mannequin + Interaction aus dem Datapack); ein Klick auf die Interaction öffnet hier ein Händlerfenster mit der Ware gegen Smaragde.
 * Ganzjährig; jeden Dezember (echte Uhr) kostet alles dezemberFaktor (Hälfte, aufgerundet, mindestens 1), ab 01.01. Normalpreis – ohne Neustart,
 * die Preise werden bei jedem Öffnen neu gesetzt. Händlerfenster ohne Verbrauch (Angebote unbegrenzt), Erfahrung gibt es keine.
 * Jukebox auf der Insel: legt die Weihnachtsplatten nacheinander ein, aber nur, solange ein Spieler in der Nähe ist (sonst aus, keine Last).
 */
final class Inselhaendler implements Listener {

    private record Ware(ItemStack item, int preis) {
    }

    private final Plugin plugin;
    private boolean aktiv;
    private String klickTag;
    private String waehrung = "minecraft:emerald";
    private double dezemberFaktor = 0.5;
    private ZoneId zone = ZoneId.of("Europe/Berlin");
    private final List<Ware> ware = new ArrayList<>();
    private final Map<UUID, Long> zuletzt = new HashMap<>();

    // Jukebox
    private Location jukebox;
    private double jukeboxRadius = 48;
    private final List<String> platten = new ArrayList<>();
    private final Map<String, Integer> laenge = new HashMap<>();
    private int naechste;
    private long endeMs;

    Inselhaendler(Plugin plugin) {
        this.plugin = plugin;
        Bukkit.getScheduler().runTaskTimer(plugin, this::jukeboxTakt, 100L, 20L);
    }

    void laden(ConfigurationSection c) {
        aktiv = c != null && c.getBoolean("aktiv", false);
        ware.clear();
        jukebox = null;
        if (!aktiv) {
            return;
        }
        zone = ZoneId.of(c.getString("zeitzone", "Europe/Berlin"));
        jukeboxRadius = c.getDouble("jukebox-radius", 48);
        String pfad = c.getString("datei", "weihnachtsmann.json");
        Path datei = Path.of(pfad).isAbsolute() ? Path.of(pfad) : plugin.getDataFolder().toPath().resolve(pfad);
        try {
            JsonObject j = JsonParser.parseString(Files.readString(datei)).getAsJsonObject();
            klickTag = j.getAsJsonObject("mannequin").get("klick").getAsString();
            waehrung = j.has("waehrung") ? j.get("waehrung").getAsString() : waehrung;
            dezemberFaktor = j.has("dezemberFaktor") ? j.get("dezemberFaktor").getAsDouble() : dezemberFaktor;
            for (JsonElement e : j.getAsJsonArray("ware")) {
                JsonObject w = e.getAsJsonObject();
                try {
                    ItemStack it = Bukkit.getItemFactory().createItemStack(w.get("item").getAsString());
                    it.setAmount(w.has("anzahl") ? w.get("anzahl").getAsInt() : 1);
                    ware.add(new Ware(it, w.get("preis").getAsInt()));
                } catch (IllegalArgumentException ex) {
                    plugin.getLogger().warning("Inselhändler: Ware „" + w.get("name") + "“ übersprungen: " + ex.getMessage());
                }
            }
            JsonObject jb = j.getAsJsonObject("jukebox");
            World w = jb == null ? null : Bukkit.getWorld(jb.get("welt").getAsString());
            if (w != null) {
                jukebox = new Location(w, jb.get("x").getAsInt(), jb.get("y").getAsInt(), jb.get("z").getAsInt());
                plattenLaden(jb.get("platten").getAsString());
            }
            plugin.getLogger().info("Inselhändler: " + ware.size() + " Angebote, " + platten.size() + " Platten" + (jukebox == null ? ", ohne Jukebox" : ""));
        } catch (IOException | RuntimeException e) {
            plugin.getLogger().warning("Inselhändler: " + datei + " nicht lesbar: " + e);
            aktiv = false;
        }
    }

    /** Platten „ns:präfix*“ aus den jukebox_song-Dateien der Welt-Datapacks, mit Länge in Sekunden */
    private void plattenLaden(String muster) throws IOException {
        platten.clear();
        String ns = muster.substring(0, muster.indexOf(':'));
        String praefix = muster.substring(muster.indexOf(':') + 1).replace("*", "");
        Path dp = Bukkit.getWorlds().get(0).getWorldFolder().toPath().resolve("datapacks");
        if (!Files.isDirectory(dp)) {
            return;
        }
        try (var packs = Files.list(dp)) {
            for (Path pack : packs.toList()) {
                Path songs = pack.resolve("data").resolve(ns).resolve("jukebox_song");
                if (!Files.isDirectory(songs)) {
                    continue;
                }
                try (var dateien = Files.list(songs)) {
                    for (Path d : dateien.sorted().toList()) {
                        String name = d.getFileName().toString().replace(".json", "");
                        if (!name.startsWith(praefix)) {
                            continue;
                        }
                        JsonObject s = JsonParser.parseString(Files.readString(d)).getAsJsonObject();
                        platten.add(ns + ":" + name);
                        laenge.put(ns + ":" + name, (int) Math.ceil(s.get("length_in_seconds").getAsDouble()));
                    }
                }
            }
        }
    }

    // ---------- Händler ----------

    private boolean istHaendler(Entity e) {
        return aktiv && klickTag != null && e instanceof Interaction && e.getScoreboardTags().contains(klickTag);
    }

    @EventHandler(priority = EventPriority.LOWEST)
    public void beimKlickAt(PlayerInteractAtEntityEvent e) {
        if (istHaendler(e.getRightClicked())) {
            e.setCancelled(true);
            if (e.getHand() == EquipmentSlot.HAND) {
                oeffnen(e.getPlayer());
            }
        }
    }

    @EventHandler(priority = EventPriority.LOWEST)
    public void beimKlick(PlayerInteractEntityEvent e) {
        if (istHaendler(e.getRightClicked())) {
            e.setCancelled(true);
            if (e.getHand() == EquipmentSlot.HAND) {
                oeffnen(e.getPlayer());
            }
        }
    }

    /** Linksklick auf die Klickfläche: still, ebenfalls öffnen */
    @EventHandler(priority = EventPriority.LOWEST)
    public void beimSchlag(EntityDamageByEntityEvent e) {
        if (e.getDamager() instanceof Player p && istHaendler(e.getEntity())) {
            e.setCancelled(true);
            oeffnen(p);
        }
    }

    private boolean dezember() {
        return LocalDate.now(zone).getMonthValue() == 12;
    }

    private void oeffnen(Player p) {
        long jetzt = System.currentTimeMillis();
        Long vorher = zuletzt.put(p.getUniqueId(), jetzt);
        if (vorher != null && jetzt - vorher < 300) {
            return;
        }
        boolean rabatt = dezember();
        Material geld = Material.matchMaterial(waehrung);
        List<MerchantRecipe> rezepte = new ArrayList<>();
        for (Ware w : ware) {
            int preis = rabatt ? Math.max(1, (int) Math.ceil(w.preis() * dezemberFaktor)) : w.preis();
            MerchantRecipe r = new MerchantRecipe(w.item().clone(), 0, Integer.MAX_VALUE, false, 0, 0f);
            r.addIngredient(new ItemStack(geld == null ? Material.EMERALD : geld, Math.min(preis, 64)));
            if (preis > 64) {
                r.addIngredient(new ItemStack(geld == null ? Material.EMERALD : geld, Math.min(preis - 64, 64)));
            }
            rezepte.add(r);
        }
        Merchant m = Bukkit.createMerchant(Component.text("Weihnachtsmann" + (rabatt ? " – Dezember: halber Preis!" : "")));
        m.setRecipes(rezepte);
        p.openMerchant(m, true);
    }

    // ---------- Jukebox ----------

    /** jede Sekunde: Spieler in der Nähe → Platten im Wechsel; sonst aus */
    private void jukeboxTakt() {
        if (!aktiv || jukebox == null || platten.isEmpty() || !jukebox.isChunkLoaded()) {
            return;
        }
        Block b = jukebox.getBlock();
        if (b.getType() != Material.JUKEBOX || !(b.getState() instanceof Jukebox jb)) {
            return; // steht erst ab Stufe 3
        }
        boolean jemand = jukebox.getWorld().getPlayers().stream()
                .anyMatch(p -> p.getLocation().distanceSquared(jukebox) <= jukeboxRadius * jukeboxRadius);
        if (!jemand) {
            if (jb.hasRecord()) {
                jb.stopPlaying();
                jb.setRecord(null);
                jb.update();
                endeMs = 0;
            }
            return;
        }
        if (System.currentTimeMillis() < endeMs && jb.isPlaying()) {
            return;
        }
        abspielen(jb);
    }

    private void abspielen(Jukebox jb) {
        String platte = platten.get(naechste % platten.size());
        naechste++;
        ItemStack disc = Bukkit.getItemFactory().createItemStack("minecraft:music_disc_13[minecraft:jukebox_playable=\"" + platte + "\"]");
        jb.setRecord(disc);
        jb.update();
        jb.startPlaying();
        endeMs = System.currentTimeMillis() + (laenge.getOrDefault(platte, 180) + 2) * 1000L;
    }

    /** /serverwahl jukebox weiter | neu | status */
    String befehl(String[] args) {
        if (!aktiv || jukebox == null) {
            return "Jukebox aus (inselhaendler.aktiv bzw. jukebox in weihnachtsmann.json)";
        }
        String was = args.length >= 2 ? args[1] : "status";
        if (was.equals("neu")) {
            naechste = 0;
            endeMs = 0;
        } else if (was.equals("weiter")) {
            endeMs = 0;
        }
        Block b = jukebox.getBlock();
        if (!was.equals("status") && b.getState() instanceof Jukebox jb) {
            jb.stopPlaying();
            abspielen(jb);
        }
        return "Jukebox " + jukebox.toVector() + ": " + platten.size() + " Platten, nächste " + platten.get(naechste % Math.max(1, platten.size()))
                + (b.getType() == Material.JUKEBOX ? "" : " (Block steht noch nicht)");
    }
}
