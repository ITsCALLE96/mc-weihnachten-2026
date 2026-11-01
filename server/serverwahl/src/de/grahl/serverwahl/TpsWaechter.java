package de.grahl.serverwahl;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.nio.file.StandardOpenOption;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Stream;

import net.kyori.adventure.bossbar.BossBar;
import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.format.NamedTextColor;

import org.bukkit.Bukkit;
import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.configuration.ConfigurationSection;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.player.PlayerQuitEvent;
import org.bukkit.plugin.java.JavaPlugin;

/**
 * TPS-Überwachung (Pascal 01.11., nach der Lag-Analyse). /tpsanzeige schaltet für den Spieler eine Bossbar mit TPS (1 min), MSPT und Spielerzahl
 * an oder aus (Permission serverwahl.tps, Standard OP; Zustand pro Spieler bis zum Ausloggen), Aktualisierung jede Sekunde.
 * Dazu alle „sekunden“ (Standard 20) eine Status-Datei &lt;status-ordner&gt;/tps-&lt;name&gt;.json für den Healthcheck-Alarm (mc-healthcheck.py)
 * und eine Zeile im Tagesverlauf plugins/Serverwahl/tps/JJJJ-MM-TT.csv (Berliner Zeit; Dateien älter als „verlauf-tage“ werden gelöscht).
 */
final class TpsWaechter implements CommandExecutor, Listener {

    private static final ZoneId BERLIN = ZoneId.of("Europe/Berlin");
    private static final DateTimeFormatter ZEIT = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");

    private final JavaPlugin plugin;
    private final Map<UUID, BossBar> anzeigen = new HashMap<>();
    private boolean aktiv;
    private String name = "server";
    /** null = keine Status-Datei */
    private Path statusDatei;
    private int sekunden = 20;
    private int verlaufTage = 30;
    private int zaehler;
    private LocalDate aufgeraeumt;

    TpsWaechter(JavaPlugin plugin) {
        this.plugin = plugin;
        Bukkit.getScheduler().runTaskTimer(plugin, this::ticken, 40L, 20L);
    }

    void laden(ConfigurationSection c) {
        aktiv = c != null && c.getBoolean("aktiv", false);
        if (!aktiv) {
            anzeigen.forEach((u, b) -> {
                Player p = Bukkit.getPlayer(u);
                if (p != null) {
                    p.hideBossBar(b);
                }
            });
            anzeigen.clear();
            return;
        }
        name = c.getString("name", "server");
        String o = c.getString("status-ordner", "");
        statusDatei = o.isBlank() ? null : Path.of(o, "tps-" + name + ".json");
        sekunden = Math.max(5, c.getInt("sekunden", 20));
        verlaufTage = Math.max(1, c.getInt("verlauf-tage", 30));
        plugin.getLogger().info("TPS-Wächter " + name + ": Status " + (statusDatei == null ? "aus" : statusDatei) + " alle " + sekunden
                + " s, Verlauf " + verlaufTage + " Tage");
    }

    /** Bossbar-Text und Farbe, rein für den Test */
    static String text(double tps, double mspt, int spieler) {
        return String.format(Locale.ROOT, "TPS %.1f  ·  MSPT %.1f  ·  %d Spieler", Math.min(tps, 20.0), mspt, spieler);
    }

    static BossBar.Color farbe(double tps) {
        return tps >= 19.5 ? BossBar.Color.GREEN : tps >= 18 ? BossBar.Color.YELLOW : BossBar.Color.RED;
    }

    static String json(String name, long zeit, double tps1, double tps5, double mspt, int spieler) {
        return String.format(Locale.ROOT, "{\"server\":\"%s\",\"zeit\":%d,\"tps1m\":%.2f,\"tps5m\":%.2f,\"mspt\":%.2f,\"spieler\":%d}",
                name, zeit, Math.min(tps1, 20.0), Math.min(tps5, 20.0), mspt, spieler);
    }

    static String csvZeile(ZonedDateTime t, double tps1, double mspt, int spieler) {
        return String.format(Locale.ROOT, "%s;%.2f;%.2f;%d%n", ZEIT.format(t), Math.min(tps1, 20.0), mspt, spieler);
    }

    private void ticken() {
        if (!aktiv) {
            return;
        }
        double[] tps = Bukkit.getTPS();
        double mspt = Bukkit.getAverageTickTime();
        int spieler = Bukkit.getOnlinePlayers().size();
        if (!anzeigen.isEmpty()) {
            Component t = Component.text(text(tps[0], mspt, spieler), NamedTextColor.WHITE);
            float anteil = (float) Math.max(0, Math.min(1, tps[0] / 20.0));
            BossBar.Color f = farbe(tps[0]);
            anzeigen.values().forEach(b -> {
                b.name(t);
                b.progress(anteil);
                b.color(f);
            });
        }
        if (++zaehler < sekunden) {
            return;
        }
        zaehler = 0;
        long jetzt = System.currentTimeMillis();
        ZonedDateTime berlin = ZonedDateTime.now(BERLIN);
        String j = json(name, jetzt, tps[0], tps[1], mspt, spieler);
        String zeile = csvZeile(berlin, tps[0], mspt, spieler);
        Bukkit.getScheduler().runTaskAsynchronously(plugin, () -> schreiben(j, zeile, berlin.toLocalDate()));
    }

    private void schreiben(String j, String zeile, LocalDate heute) {
        try {
            if (statusDatei != null) {
                Files.createDirectories(statusDatei.getParent());
                Path tmp = statusDatei.resolveSibling(statusDatei.getFileName() + ".tmp");
                Files.writeString(tmp, j, StandardCharsets.UTF_8);
                Files.move(tmp, statusDatei, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
            }
            Path ordner = plugin.getDataFolder().toPath().resolve("tps");
            Files.createDirectories(ordner);
            Path tag = ordner.resolve(heute + ".csv");
            if (!Files.exists(tag)) {
                Files.writeString(tag, "zeit;tps1m;mspt;spieler" + System.lineSeparator(), StandardCharsets.UTF_8);
            }
            Files.writeString(tag, zeile, StandardCharsets.UTF_8, StandardOpenOption.APPEND);
            if (!heute.equals(aufgeraeumt)) {
                aufgeraeumt = heute;
                LocalDate grenze = heute.minusDays(verlaufTage);
                try (Stream<Path> s = Files.list(ordner)) {
                    s.filter(p -> p.getFileName().toString().matches("\\d{4}-\\d{2}-\\d{2}\\.csv"))
                            .filter(p -> LocalDate.parse(p.getFileName().toString().substring(0, 10)).isBefore(grenze))
                            .forEach(p -> p.toFile().delete());
                }
            }
        } catch (IOException | RuntimeException e) {
            plugin.getLogger().warning("TPS-Wächter: " + e.getMessage());
        }
    }

    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        if (!(sender instanceof Player p)) {
            double[] tps = Bukkit.getTPS();
            sender.sendMessage(text(tps[0], Bukkit.getAverageTickTime(), Bukkit.getOnlinePlayers().size()));
            return true;
        }
        if (!aktiv) {
            p.sendMessage(Component.text("TPS-Anzeige ist aus (tps.aktiv)", NamedTextColor.RED));
            return true;
        }
        BossBar b = anzeigen.remove(p.getUniqueId());
        if (b != null) {
            p.hideBossBar(b);
            p.sendMessage(Component.text("TPS-Anzeige aus", NamedTextColor.GRAY));
        } else {
            b = BossBar.bossBar(Component.text("TPS …"), 1f, BossBar.Color.GREEN, BossBar.Overlay.PROGRESS);
            anzeigen.put(p.getUniqueId(), b);
            p.showBossBar(b);
            p.sendMessage(Component.text("TPS-Anzeige an (nochmal /tpsanzeige zum Ausschalten)", NamedTextColor.GRAY));
        }
        return true;
    }

    @EventHandler
    public void beimVerlassen(PlayerQuitEvent e) {
        anzeigen.remove(e.getPlayer().getUniqueId());
    }
}
