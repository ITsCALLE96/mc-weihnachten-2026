package de.grahl.serverwahl;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.format.NamedTextColor;
import net.kyori.adventure.text.minimessage.MiniMessage;
import net.kyori.adventure.text.minimessage.tag.resolver.Placeholder;
import net.kyori.adventure.title.Title;

import org.bukkit.Bukkit;
import org.bukkit.configuration.ConfigurationSection;
import org.bukkit.plugin.Plugin;

/**
 * Neustart bei Bedarf mit Ansage (Pascal 01.11.: kein täglicher Neustart mehr). „/serverwahl neustart in &lt;minuten&gt;“ legt den Zeitpunkt fest
 * und schreibt ihn als Merker &lt;ordner&gt;/&lt;instanz&gt; (Unix-Sekunden) in den geteilten Ordner. Bis dahin kündigt das Plugin an: Chat zu
 * „minuten“ vorher (60/30/10/5/1), Countdown als Titel in den letzten Sekunden, #mc-chat über DiscordSRV zu „discord-minuten“ (nur wo eingeschaltet).
 * Den Neustart selbst macht der Cron auf VM200 (server/vm200/mc-neustart-bedarf.sh, jede Minute): Merker fällig → Merker weg, AMP-Instanz
 * stoppen und starten. Der Zeitpunkt liegt deshalb immer auf einer vollen Minute. Der Merker übersteht /serverwahl reload.
 * /serverwahl neustart [in &lt;minuten&gt; | abbrechen | test &lt;sekunden&gt; [discord]]; test spielt nur die Ansage durch, ohne Merker und ohne Neustart.
 */
final class NeustartAnsage {

    private static final MiniMessage MM = MiniMessage.miniMessage();
    private static final DateTimeFormatter UHR = DateTimeFormatter.ofPattern("HH:mm").withZone(ZoneId.of("Europe/Berlin"));

    private final Plugin plugin;
    private boolean aktiv;
    /** null = kein Merker (dann nur Ansage, kein Neustart möglich) */
    private Path merker;
    private String name = "Server";
    private List<Integer> minuten = List.of();
    private List<Integer> discordMinuten = List.of();
    private int countdown;
    private String text = "";
    private String discordText = "";
    /** geplanter Neustart in Unix-Millisekunden, 0 = keiner */
    private long ziel;
    /** Test: nur Ansage, kein Merker */
    private boolean test;
    private boolean testDiscord;
    /** schon gezeigte Stufen je Ziel („&lt;ziel&gt;:m10“, „…:s9“, „…:d10“), damit nichts doppelt kommt */
    private final Set<String> gezeigt = new HashSet<>();

    NeustartAnsage(Plugin plugin) {
        this.plugin = plugin;
        Bukkit.getScheduler().runTaskTimer(plugin, this::ticken, 100L, 10L);
    }

    void laden(ConfigurationSection c) {
        aktiv = c != null && c.getBoolean("aktiv", false);
        if (!aktiv) {
            ziel = 0;
            return;
        }
        String o = c.getString("ordner", "");
        String instanz = c.getString("instanz", "");
        merker = o.isBlank() || instanz.isBlank() ? null : Path.of(o, instanz);
        name = c.getString("name", "Server");
        minuten = c.getIntegerList("minuten");
        discordMinuten = c.getIntegerList("discord-minuten");
        countdown = c.getInt("countdown", 10);
        text = c.getString("text", "Neustart");
        discordText = c.getString("discord-text", "");
        // laufenden Neustart aus dem Merker übernehmen (Reload)
        if (!test) {
            ziel = merkerLesen();
        }
        plugin.getLogger().info("Neustart bei Bedarf: " + (merker == null ? "ohne Merker (nur Test)" : "Merker " + merker) + ", Chat " + minuten
                + " min, Discord " + (discordAn() ? discordMinuten + " min" : "aus") + (ziel > 0 ? ", geplant " + UHR.format(Instant.ofEpochMilli(ziel)) : ""));
    }

    private boolean discordAn() {
        return !discordMinuten.isEmpty() && !discordText.isBlank();
    }

    private long merkerLesen() {
        try {
            if (merker != null && Files.exists(merker)) {
                return Long.parseLong(Files.readString(merker).trim()) * 1000L;
            }
        } catch (IOException | NumberFormatException e) {
            plugin.getLogger().warning("Neustart-Merker unlesbar: " + e.getMessage());
        }
        return 0;
    }

    /** Ziel „in m Minuten“, aufgerundet auf die nächste volle Minute (der Cron prüft minütlich), rein für den Test */
    static long zielIn(long jetztMillis, int m) {
        long roh = jetztMillis + m * 60_000L;
        return (roh + 59_999) / 60_000 * 60_000;
    }

    /** Stufe „m Minuten vorher“ ist dran: höchstens m Minuten, aber nicht schon in der nächstkleineren Minute */
    static boolean stufeFaellig(long restMillis, int m) {
        return restMillis <= m * 60_000L && restMillis > m * 60_000L - 60_000L;
    }

    static String dauer(long m) {
        return m >= 60 && m % 60 == 0 ? m / 60 + (m == 60 ? " Stunde" : " Stunden") : m + (m == 1 ? " Minute" : " Minuten");
    }

    private void chat(String zeit) {
        Bukkit.broadcast(MM.deserialize("<gold>[Neustart]</gold> " + text + " <gray>in <white><zeit></white>", Placeholder.unparsed("zeit", zeit)));
    }

    private void discord(String zeit) {
        String befehl = "discord bcast " + discordText.replace("%zeit%", zeit).replace("%name%", name).replace("%uhrzeit%", UHR.format(Instant.ofEpochMilli(ziel)));
        if (!Bukkit.dispatchCommand(Serverwahl.still(), befehl)) {
            plugin.getLogger().warning("Neustart-Ansage: Discord-Befehl fehlgeschlagen (DiscordSRV da?)");
        }
    }

    private void ticken() {
        if (!aktiv || ziel == 0) {
            return;
        }
        long rest = ziel - System.currentTimeMillis();
        if (rest <= 0) {
            if (test) {
                plugin.getLogger().info("Neustart-Ansage: Test fertig (kein Neustart)");
                test = false;
                ziel = 0;
            }
            // echter Neustart: der Cron holt die Instanz binnen einer Minute herunter
            return;
        }
        String id = ziel + ":";
        for (int m : minuten) {
            if (stufeFaellig(rest, m) && gezeigt.add(id + "m" + m)) {
                chat(dauer(m));
            }
        }
        if (discordAn() && (!test || testDiscord)) {
            for (int m : discordMinuten) {
                if (stufeFaellig(rest, m) && gezeigt.add(id + "d" + m)) {
                    discord(dauer(m));
                }
            }
        }
        int sek = (int) ((rest + 999) / 1000);
        if (sek <= countdown && gezeigt.add(id + "s" + sek)) {
            Title title = Title.title(Component.text(sek, NamedTextColor.GOLD), MM.deserialize(text),
                    Title.Times.times(Duration.ZERO, Duration.ofMillis(900), Duration.ofMillis(100)));
            Bukkit.getOnlinePlayers().forEach(p -> p.showTitle(title));
        }
        if (gezeigt.size() > 200) {
            gezeigt.removeIf(s -> !s.startsWith(id));
        }
    }

    String befehl(String[] args) {
        if (!aktiv) {
            return "Neustart bei Bedarf ist aus (neustart-ansage.aktiv)";
        }
        String unter = args.length >= 2 ? args[1] : "";
        switch (unter) {
            case "in" -> {
                if (merker == null) {
                    return "Kein Merker-Ordner konfiguriert (neustart-ansage.ordner/instanz), Neustart nicht möglich";
                }
                int m;
                try {
                    m = Integer.parseInt(args.length >= 3 ? args[2] : "");
                } catch (NumberFormatException e) {
                    return "/serverwahl neustart in <minuten>  (1–1440)";
                }
                if (m < 1 || m > 1440) {
                    return "Minuten 1–1440";
                }
                long neu = zielIn(System.currentTimeMillis(), m);
                try {
                    Files.createDirectories(merker.getParent());
                    Files.writeString(merker, Long.toString(neu / 1000) + "\n");
                } catch (IOException e) {
                    return "Merker nicht schreibbar: " + e.getMessage();
                }
                test = false;
                ziel = neu;
                long rest = (ziel - System.currentTimeMillis() + 59_999) / 60_000;
                // sofort einmal ansagen, die festen Stufen folgen
                chat(dauer(rest));
                if (discordAn()) {
                    gezeigt.add(ziel + ":d" + rest);
                    discord(dauer(rest));
                }
                gezeigt.add(ziel + ":m" + rest);
                plugin.getLogger().info("Neustart " + name + " geplant für " + UHR.format(Instant.ofEpochMilli(ziel)));
                return "Neustart " + name + " um " + UHR.format(Instant.ofEpochMilli(ziel)) + " (in " + dauer(rest) + "), Ansagen laufen";
            }
            case "abbrechen" -> {
                if (ziel == 0 || test) {
                    ziel = 0;
                    test = false;
                    return "Kein Neustart geplant";
                }
                try {
                    Files.deleteIfExists(merker);
                } catch (IOException e) {
                    return "Merker nicht löschbar: " + e.getMessage() + " – Neustart läuft weiter!";
                }
                ziel = 0;
                Bukkit.broadcast(MM.deserialize("<gold>[Neustart]</gold> <gray>abgesagt"));
                if (discordAn()) {
                    Bukkit.dispatchCommand(Serverwahl.still(), "discord bcast Neustart " + name + " abgesagt.");
                }
                plugin.getLogger().info("Neustart " + name + " abgesagt");
                return "Neustart abgesagt";
            }
            case "test" -> {
                if (ziel != 0 && !test) {
                    return "Es ist ein echter Neustart geplant, erst /serverwahl neustart abbrechen";
                }
                int sek = 70;
                if (args.length >= 3) {
                    try {
                        sek = Math.max(1, Integer.parseInt(args[2]));
                    } catch (NumberFormatException e) {
                        return "Sekunden als Zahl";
                    }
                }
                testDiscord = args.length >= 4 && args[3].equals("discord");
                test = true;
                ziel = System.currentTimeMillis() + sek * 1000L;
                return "Test: Ansage für einen Neustart in " + sek + " s (kein Merker, es startet nichts neu" + (testDiscord ? ", mit Discord" : ", ohne Discord") + ")";
            }
            default -> {
                long z = test ? 0 : (ziel != 0 ? ziel : merkerLesen());
                return "Neustart " + name + ": " + (z == 0 ? "keiner geplant" : "um " + UHR.format(Instant.ofEpochMilli(z))) + ". Chat " + minuten + " min, Discord "
                        + (discordAn() ? discordMinuten + " min" : "aus") + ". /serverwahl neustart in <minuten> | abbrechen | test <sek> [discord]";
            }
        }
    }
}
