package de.grahl.serverwahl;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;

import org.bukkit.Bukkit;
import org.bukkit.Material;
import org.bukkit.Statistic;
import org.bukkit.advancement.Advancement;
import org.bukkit.configuration.ConfigurationSection;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.player.PlayerQuitEvent;
import org.bukkit.plugin.java.JavaPlugin;
import org.bukkit.scheduler.BukkitTask;

/**
 * Live-Werte für die Bestenlisten (Statistik 31.10., statistik/DATENFORMAT.md „Live-Werte“), nur SMP: alle ~20 s je Online-Spieler
 * plugins/Serverwahl/live/&lt;uuid&gt;.json mit den flachen Statistik-Schlüsseln (Spielzeit, Tode, Mob-Kills, Bewegung, abgebaute Blöcke,
 * Fortschritte). Werte auf dem Haupt-Thread einsammeln, asynchron atomar schreiben (.tmp + Umbenennen), beim Abmelden löschen.
 * Keine IP, keine Position, kein Inventar.
 */
final class LiveWerte implements Listener {

    private final JavaPlugin plugin;
    private Path ordner;
    private BukkitTask aufgabe;
    private List<Statistic> bewegung;
    private List<Material> bloecke;
    private List<Advancement> fortschritte;

    LiveWerte(JavaPlugin plugin) {
        this.plugin = plugin;
    }

    void laden(ConfigurationSection c, boolean istHub) {
        stoppen();
        if (istHub || c == null || !c.getBoolean("aktiv", false)) {
            return;
        }
        ordner = plugin.getDataFolder().toPath().resolve("live");
        try {
            Files.createDirectories(ordner);
            aufraeumen();
        } catch (IOException ex) {
            plugin.getLogger().warning("Live-Werte: " + ordner + " nicht anlegbar: " + ex.getMessage());
            ordner = null;
            return;
        }
        bewegung = new ArrayList<>();
        for (Statistic s : Statistic.values()) {
            if (s.getType() == Statistic.Type.UNTYPED && s.getKey().getKey().endsWith("_one_cm")) {
                bewegung.add(s);
            }
        }
        bloecke = new ArrayList<>();
        for (Material m : Material.values()) {
            if (m.isBlock() && !m.isLegacy() && !m.isAir()) {
                bloecke.add(m);
            }
        }
        fortschritte = null;
        int sek = Math.max(5, c.getInt("sekunden", 20));
        aufgabe = Bukkit.getScheduler().runTaskTimer(plugin, this::einsammeln, 100L, sek * 20L);
        plugin.getLogger().info("Live-Werte: alle " + sek + " s nach " + ordner);
    }

    /** Fortschritte mit Namensraum minecraft ohne recipes/, einmal nach dem Laden der Welt ermittelt */
    private List<Advancement> fortschritte() {
        if (fortschritte == null) {
            fortschritte = new ArrayList<>();
            for (Iterator<Advancement> it = Bukkit.advancementIterator(); it.hasNext();) {
                Advancement a = it.next();
                if (a.getKey().getNamespace().equals("minecraft") && !a.getKey().getKey().startsWith("recipes/")) {
                    fortschritte.add(a);
                }
            }
        }
        return fortschritte;
    }

    private void einsammeln() {
        if (ordner == null) {
            return;
        }
        long jetzt = System.currentTimeMillis();
        List<String[]> dateien = new ArrayList<>();
        for (Player p : Bukkit.getOnlinePlayers()) {
            Map<String, Long> w = new TreeMap<>();
            w.put("custom:" + schluessel(Statistic.PLAY_ONE_MINUTE), (long) p.getStatistic(Statistic.PLAY_ONE_MINUTE));
            w.put("custom:" + schluessel(Statistic.DEATHS), (long) p.getStatistic(Statistic.DEATHS));
            w.put("custom:" + schluessel(Statistic.MOB_KILLS), (long) p.getStatistic(Statistic.MOB_KILLS));
            for (Statistic s : bewegung) {
                int v = p.getStatistic(s);
                if (v > 0) {
                    w.put("custom:" + schluessel(s), (long) v);
                }
            }
            for (Iterator<Material> it = bloecke.iterator(); it.hasNext();) {
                Material m = it.next();
                int v;
                try {
                    v = p.getStatistic(Statistic.MINE_BLOCK, m);
                } catch (RuntimeException ex) {
                    it.remove();   // Block ohne Abbau-Statistik: einmal aussortieren
                    continue;
                }
                if (v > 0) {
                    w.put("mined:" + m.getKey().getKey(), (long) v);
                }
            }
            long n = 0;
            for (Advancement a : fortschritte()) {
                if (p.getAdvancementProgress(a).isDone()) {
                    n++;
                }
            }
            w.put("server:fortschritte", n);
            dateien.add(new String[] {p.getUniqueId().toString(), json(p.getUniqueId(), p.getName(), jetzt, w)});
        }
        if (dateien.isEmpty()) {
            return;
        }
        Path o = ordner;
        Bukkit.getScheduler().runTaskAsynchronously(plugin, () -> {
            for (String[] d : dateien) {
                Path ziel = o.resolve(d[0] + ".json");
                Path tmp = o.resolve(d[0] + ".json.tmp");
                try {
                    Files.writeString(tmp, d[1], StandardCharsets.UTF_8);
                    Files.move(tmp, ziel, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
                } catch (IOException ex) {
                    plugin.getLogger().warning("Live-Werte: " + ziel + ": " + ex.getMessage());
                }
            }
        });
    }

    /** Vanilla-Name der Statistik wie in players/stats/*.json; Bukkit nennt die Spielzeit noch „play_one_minute“ */
    static String schluessel(Statistic s) {
        return s == Statistic.PLAY_ONE_MINUTE ? "play_time" : s.getKey().getKey();
    }

    /** JSON nach statistik/DATENFORMAT.md: {"uuid":…,"name":…,"zeit":…,"werte":{…}} */
    static String json(UUID uuid, String name, long zeit, Map<String, Long> werte) {
        StringBuilder b = new StringBuilder("{\"uuid\":\"").append(uuid).append("\",\"name\":\"").append(text(name))
                .append("\",\"zeit\":").append(zeit).append(",\"werte\":{");
        boolean erstes = true;
        for (Map.Entry<String, Long> e : werte.entrySet()) {
            if (e.getValue() == null || e.getValue() < 0) {
                continue;
            }
            b.append(erstes ? "" : ",").append('"').append(text(e.getKey())).append("\":").append(e.getValue());
            erstes = false;
        }
        return b.append("}}").toString();
    }

    private static String text(String s) {
        StringBuilder b = new StringBuilder();
        for (char c : s.toCharArray()) {
            if (c == '"' || c == '\\') {
                b.append('\\').append(c);
            } else if (c < 0x20) {
                b.append(String.format("\\u%04x", (int) c));
            } else {
                b.append(c);
            }
        }
        return b.toString();
    }

    @EventHandler
    public void beimVerlassen(PlayerQuitEvent e) {
        if (ordner == null) {
            return;
        }
        Path ziel = ordner.resolve(e.getPlayer().getUniqueId() + ".json");
        Bukkit.getScheduler().runTaskAsynchronously(plugin, () -> {
            try {
                Files.deleteIfExists(ziel);
            } catch (IOException ex) {
                plugin.getLogger().warning("Live-Werte: " + ziel + ": " + ex.getMessage());
            }
        });
    }

    private void aufraeumen() throws IOException {
        try (var s = Files.list(ordner)) {
            for (Path p : (Iterable<Path>) s::iterator) {
                Files.deleteIfExists(p);
            }
        }
    }

    void stoppen() {
        if (aufgabe != null) {
            aufgabe.cancel();
            aufgabe = null;
        }
        if (ordner != null) {
            try {
                aufraeumen();
            } catch (IOException ex) {
                plugin.getLogger().warning("Live-Werte: aufräumen: " + ex.getMessage());
            }
        }
        ordner = null;
    }
}
