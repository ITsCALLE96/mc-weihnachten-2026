package de.grahl.serverwahl;

import java.time.Duration;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
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
 * Ansage vor dem täglichen Neustart (Pascal 01.11.): Den Neustart selbst macht der Cron auf VM200 (mc-neustart.sh, 04:00); das Plugin kündigt
 * ihn nur an, damit niemand mitten im Bauen rausfliegt. Chat „minuten“ vorher (10/5/1), Countdown als Titel in den letzten Sekunden,
 * Meldung in #mc-chat über DiscordSRV („discord bcast“) zu „discord-minuten“, nur dort eingeschaltet, wo die Brücke die Meldung senden soll (SMP).
 * Ohne RCON und ohne AMP-Zeitplan. uhrzeit muss zum Cron passen. /serverwahl neustart [test <sekunden> [discord]]
 */
final class NeustartAnsage {

    private static final MiniMessage MM = MiniMessage.miniMessage();

    private final Plugin plugin;
    /** null = aus */
    private LocalTime um;
    private ZoneId zone = ZoneId.of("Europe/Berlin");
    private List<Integer> minuten = List.of();
    private List<Integer> discordMinuten = List.of();
    private int countdown;
    private String text = "";
    private String discordText = "";
    /** schon gezeigte Stufen je Termin („2026-11-02T04:00:m10“, „…:s9“, „…:d10“), damit nichts doppelt kommt */
    private final Set<String> gezeigt = new HashSet<>();
    /** Test: vorgezogener Zeitpunkt, null = keiner */
    private ZonedDateTime test;
    private boolean testDiscord;

    NeustartAnsage(Plugin plugin) {
        this.plugin = plugin;
        Bukkit.getScheduler().runTaskTimer(plugin, this::ticken, 100L, 10L);
    }

    void laden(ConfigurationSection c) {
        gezeigt.clear();
        if (c == null || !c.getBoolean("aktiv", false)) {
            um = null;
            return;
        }
        um = LocalTime.parse(c.getString("uhrzeit", "04:00"));
        zone = ZoneId.of(c.getString("zeitzone", "Europe/Berlin"));
        minuten = c.getIntegerList("minuten");
        discordMinuten = c.getIntegerList("discord-minuten");
        countdown = c.getInt("countdown", 10);
        text = c.getString("text", "Täglicher Neustart");
        discordText = c.getString("discord-text", "");
        plugin.getLogger().info("Neustart-Ansage " + um + " (" + zone + "), Chat " + minuten + " min, Countdown " + countdown + " s, Discord "
                + (discordMinuten.isEmpty() || discordText.isBlank() ? "aus" : discordMinuten + " min"));
    }

    /** nächster Neustart ab jetzt (heute oder morgen), rein für den Test */
    static ZonedDateTime naechster(ZonedDateTime jetzt, LocalTime um) {
        ZonedDateTime t = jetzt.toLocalDate().atTime(um).atZone(jetzt.getZone());
        return t.isAfter(jetzt) ? t : jetzt.toLocalDate().plusDays(1).atTime(um).atZone(jetzt.getZone());
    }

    /** Stufe „m Minuten vorher“ ist dran: höchstens m Minuten, aber nicht schon in der nächstkleineren Minute (verspäteter Start zeigt nichts Altes) */
    static boolean stufeFaellig(long restMillis, int m) {
        return restMillis <= m * 60_000L && restMillis > m * 60_000L - 60_000L;
    }

    static String dauer(int m) {
        return m >= 60 && m % 60 == 0 ? m / 60 + (m == 60 ? " Stunde" : " Stunden") : m + (m == 1 ? " Minute" : " Minuten");
    }

    private void ticken() {
        if (um == null) {
            return;
        }
        ZonedDateTime jetzt = ZonedDateTime.now(zone);
        boolean istTest = test != null;
        ZonedDateTime termin = istTest ? test : naechster(jetzt, um);
        long rest = Duration.between(jetzt, termin).toMillis();
        if (rest <= 0) {
            if (istTest) {
                test = null;
                plugin.getLogger().info("Neustart-Ansage: Test fertig (kein Neustart)");
            }
            return;
        }
        String id = termin.toLocalDateTime() + ":";
        for (int m : minuten) {
            if (stufeFaellig(rest, m) && gezeigt.add(id + "m" + m)) {
                Bukkit.broadcast(MM.deserialize("<gold>[Neustart]</gold> " + text + " <gray>in <white><zeit></white>", Placeholder.unparsed("zeit", dauer(m))));
            }
        }
        for (int m : discordMinuten) {
            if (!discordText.isBlank() && (!istTest || testDiscord) && stufeFaellig(rest, m) && gezeigt.add(id + "d" + m)) {
                String befehl = "discord bcast " + discordText.replace("%zeit%", dauer(m)).replace("%uhrzeit%", um.toString());
                if (!Bukkit.dispatchCommand(Serverwahl.still(), befehl)) {
                    plugin.getLogger().warning("Neustart-Ansage: Discord-Befehl fehlgeschlagen (DiscordSRV da?)");
                }
            }
        }
        int sek = (int) ((rest + 999) / 1000);
        if (sek <= countdown && gezeigt.add(id + "s" + sek)) {
            Title title = Title.title(Component.text(sek, NamedTextColor.GOLD), MM.deserialize(text),
                    Title.Times.times(Duration.ZERO, Duration.ofMillis(900), Duration.ofMillis(100)));
            Bukkit.getOnlinePlayers().forEach(p -> p.showTitle(title));
        }
        // alte Termine vergessen, damit die Menge nicht wächst
        if (gezeigt.size() > 200) {
            gezeigt.removeIf(s -> !s.startsWith(id));
        }
    }

    String befehl(String[] args) {
        if (um == null) {
            return "Neustart-Ansage ist aus (neustart-ansage.aktiv)";
        }
        if (args.length >= 2 && args[1].equals("test")) {
            int sek = 70;
            if (args.length >= 3) {
                try {
                    sek = Math.max(1, Integer.parseInt(args[2]));
                } catch (NumberFormatException e) {
                    return "Sekunden als Zahl";
                }
            }
            testDiscord = args.length >= 4 && args[3].equals("discord");
            test = ZonedDateTime.now(zone).plusSeconds(sek);
            return "Test: Ansage für einen Neustart in " + sek + " s (es startet nichts neu" + (testDiscord ? ", mit Discord" : ", ohne Discord") + ")";
        }
        List<String> stufen = new ArrayList<>();
        minuten.forEach(m -> stufen.add(dauer(m)));
        return "Neustart-Ansage: nächster Neustart " + naechster(ZonedDateTime.now(zone), um).toLocalDateTime().toString().replace('T', ' ')
                + ", Chat " + String.join(" / ", stufen) + ", Countdown " + countdown + " s, Discord "
                + (discordMinuten.isEmpty() || discordText.isBlank() ? "aus" : discordMinuten + " min");
    }
}
