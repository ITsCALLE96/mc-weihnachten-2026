package de.grahl.serverwahl;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
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
 * Termine nach echter Uhr (Pascal 28.10.: Phasen ohne AMP-Aufgaben): Zum Zeitpunkt laufen Konsolenbefehle (z. B. „nether open“ + Phase),
 * vorher Ankündigungen im Chat (Minuten vorher) und ein Countdown als Titel (letzte Sekunden), wie bei der Eröffnung.
 * Jeder Termin läuft genau einmal: Merker plugins/Serverwahl/termine.txt (ein Name je Zeile). War der Server zum Zeitpunkt aus,
 * wird der Termin beim nächsten Start nachgeholt (nachholen: true, Standard), Ankündigungen und Countdown dann nicht.
 * /serverwahl termin liste | test <name> [sekunden] | zuruecksetzen <name> | event [stopp]. Ein Test führt die Befehle wirklich aus (nur im Testnetz)
 * und spielt das Event mit (bei weniger Sekunden als vorlauf entsprechend kürzer).
 */
final class Termine {

    private static final MiniMessage MM = MiniMessage.miniMessage();
    private static final DateTimeFormatter ANZEIGE = DateTimeFormatter.ofPattern("dd.MM. HH:mm");

    private record Termin(String name, ZonedDateTime zeit, List<Integer> ankuendigen, int countdown, String text, List<String> befehle, boolean nachholen,
            String event) {
    }

    private final Plugin plugin;
    /** Nether-/End-Event beim Öffnen (Feld „event“ am Termin, Einstellungen termin-event) */
    final DimensionsEvent event;
    private final List<Termin> termine = new ArrayList<>();
    /** schon gezeigte Ankündigungen/Countdown-Sekunden („name:minuten“ bzw. „name:s<sek>“), damit nichts doppelt kommt */
    private final Set<String> gezeigt = new HashSet<>();
    /** Test: Name → vorgezogener Zeitpunkt */
    private final Map<String, ZonedDateTime> test = new java.util.HashMap<>();

    Termine(Plugin plugin) {
        this.plugin = plugin;
        this.event = new DimensionsEvent(plugin);
        Bukkit.getScheduler().runTaskTimer(plugin, this::ticken, 60L, 5L);
    }

    void laden(ConfigurationSection c) {
        termine.clear();
        if (c == null) {
            return;
        }
        ZoneId zone = ZoneId.of(c.getString("zeitzone", "Europe/Berlin"));
        // Generalprobe November (Pascal 30.10.): aktive-liste wählt die Liste, Standard „liste“ (Dezember-Termine); Umschalten nur per Config
        String liste = c.getString("aktive-liste", "liste");
        if (!c.isList(liste)) {
            plugin.getLogger().warning("Termine: Liste „" + liste + "“ fehlt in der Config");
        }
        for (Map<?, ?> m : c.getMapList(liste)) {
            try {
                String name = String.valueOf(m.get("name"));
                ZonedDateTime zeit = LocalDateTime.parse(String.valueOf(m.get("zeitpunkt"))).atZone(zone);
                List<Integer> ank = new ArrayList<>();
                if (m.get("ankuendigen") instanceof List<?> l) {
                    l.forEach(x -> ank.add(Integer.parseInt(String.valueOf(x))));
                }
                int cd = m.get("countdown") == null ? 10 : Integer.parseInt(String.valueOf(m.get("countdown")));
                List<String> bef = new ArrayList<>();
                if (m.get("befehle") instanceof List<?> l) {
                    l.forEach(x -> bef.add(String.valueOf(x)));
                }
                boolean nach = m.get("nachholen") == null || Boolean.parseBoolean(String.valueOf(m.get("nachholen")));
                String ev = m.get("event") == null ? null : String.valueOf(m.get("event"));
                termine.add(new Termin(name, zeit, ank, cd, m.get("text") == null ? name : String.valueOf(m.get("text")), bef, nach, ev));
            } catch (RuntimeException e) {
                plugin.getLogger().warning("Termin übersprungen (" + m + "): " + e.getMessage());
            }
        }
        plugin.getLogger().info("Termine (" + liste + "): " + termine.size() + " geladen" + (termine.isEmpty() ? "" : ", nächster " + naechster()));
    }

    private String naechster() {
        Set<String> fertig = erledigt();
        return termine.stream().filter(t -> !fertig.contains(t.name())).min((a, b) -> a.zeit().compareTo(b.zeit()))
                .map(t -> t.name() + " " + ANZEIGE.format(t.zeit())).orElse("keiner");
    }

    private Path merker() {
        return plugin.getDataFolder().toPath().resolve("termine.txt");
    }

    private Set<String> erledigt() {
        try {
            return Files.exists(merker()) ? new HashSet<>(Files.readAllLines(merker())) : new HashSet<>();
        } catch (IOException e) {
            return new HashSet<>();
        }
    }

    private void merken(String name) {
        try {
            Files.writeString(merker(), name + System.lineSeparator(), java.nio.file.StandardOpenOption.CREATE, java.nio.file.StandardOpenOption.APPEND);
        } catch (IOException e) {
            plugin.getLogger().warning("Termin-Merker: " + e.getMessage());
        }
    }

    private void ticken() {
        if (termine.isEmpty()) {
            return;
        }
        Set<String> fertig = erledigt();
        for (Termin t : termine) {
            boolean istTest = test.containsKey(t.name());
            if (!istTest && fertig.contains(t.name())) {
                continue;
            }
            ZonedDateTime zeit = istTest ? test.get(t.name()) : t.zeit();
            long ms = Duration.between(ZonedDateTime.now(zeit.getZone()), zeit).toMillis();
            if (ms > 0) {
                ankuendigen(t, ms);
                // Event: vorlauf Sekunden vorher starten (beim Test mit kürzerer Frist sofort, entsprechend kürzer)
                if (t.event() != null && ms <= event.vorlauf() * 1000L && !event.laeuft(t.event()) && gezeigt.add(t.name() + ":event")) {
                    event.starten(t.event(), System.currentTimeMillis() + ms);
                }
                continue;
            }
            // fällig: einmal ausführen; verpasste Termine (Server war aus) nur mit nachholen
            if (!istTest && !t.nachholen() && ms < -60_000) {
                merken(t.name());
                plugin.getLogger().info("Termin " + t.name() + " verpasst, nicht nachgeholt");
                continue;
            }
            ausfuehren(t, istTest);
        }
    }

    private void ankuendigen(Termin t, long ms) {
        long minuten = (ms + 59_999) / 60_000;
        for (int m : t.ankuendigen()) {
            if (minuten == m && gezeigt.add(t.name() + ":" + m)) {
                Component text = MM.deserialize("<gold>[Termin]</gold> " + t.text() + " <gray>in <white><zeit></white>",
                        Placeholder.unparsed("zeit", m >= 60 && m % 60 == 0 ? m / 60 + (m == 60 ? " Stunde" : " Stunden") : m + (m == 1 ? " Minute" : " Minuten")));
                Bukkit.broadcast(text);
            }
        }
        int sek = (int) ((ms + 999) / 1000);
        if (sek <= t.countdown() && gezeigt.add(t.name() + ":s" + sek)) {
            Title title = Title.title(Component.text(sek, NamedTextColor.GOLD), MM.deserialize(t.text()),
                    Title.Times.times(Duration.ZERO, Duration.ofMillis(900), Duration.ofMillis(100)));
            Bukkit.getOnlinePlayers().forEach(p -> p.showTitle(title));
        }
    }

    private void ausfuehren(Termin t, boolean istTest) {
        test.remove(t.name());
        if (!istTest) {
            merken(t.name());
        }
        gezeigt.removeIf(s -> s.startsWith(t.name() + ":"));
        plugin.getLogger().info("Termin " + t.name() + (istTest ? " (Test)" : "") + ": " + t.befehle());
        if (t.event() != null) {
            event.oeffnen(t.event());
        }
        for (String befehl : t.befehle()) {
            if (!Bukkit.dispatchCommand(Bukkit.getConsoleSender(), befehl)) {
                plugin.getLogger().warning("Termin " + t.name() + ": Befehl fehlgeschlagen: " + befehl);
            }
        }
    }

    String befehl(String[] args) {
        if (args.length >= 2 && args[1].equals("event")) {
            return args.length >= 3 && args[2].equals("stopp") ? event.stopp() : event.status();
        }
        if (args.length < 2 || args[1].equals("liste")) {
            Set<String> fertig = erledigt();
            StringBuilder b = new StringBuilder("Termine (" + termine.size() + "):");
            for (Termin t : termine) {
                b.append("\n- ").append(t.name()).append(" ").append(ANZEIGE.format(t.zeit())).append(fertig.contains(t.name()) ? " ✔ erledigt" : "")
                        .append(" → ").append(String.join(" ; ", t.befehle())).append(t.event() != null ? " · Event " + t.event() : "");
            }
            return b.toString();
        }
        Termin t = args.length >= 3 ? termine.stream().filter(x -> x.name().equals(args[2])).findFirst().orElse(null) : null;
        if (t == null) {
            return "Termin nicht gefunden. /serverwahl termin liste | test <name> [sekunden] | zuruecksetzen <name> | event [stopp]";
        }
        switch (args[1]) {
            case "test" -> {
                int sek = 15;
                if (args.length >= 4) {
                    try {
                        sek = Math.max(1, Integer.parseInt(args[3]));
                    } catch (NumberFormatException e) {
                        return "Sekunden als Zahl";
                    }
                }
                test.put(t.name(), ZonedDateTime.now(t.zeit().getZone()).plusSeconds(sek));
                return "Test: " + t.name() + " in " + sek + " s (Befehle werden wirklich ausgeführt, kein Merker)";
            }
            case "zuruecksetzen" -> {
                try {
                    List<String> rest = new ArrayList<>(erledigt());
                    rest.remove(t.name());
                    Files.write(merker(), rest);
                } catch (IOException e) {
                    return "Merker nicht schreibbar: " + e.getMessage();
                }
                return t.name() + " wieder offen (läuft zum Zeitpunkt bzw. sofort, wenn schon vorbei und nachholen an)";
            }
            default -> {
                return "/serverwahl termin liste | test <name> [sekunden] | zuruecksetzen <name>";
            }
        }
    }
}
