package de.grahl.serverwahl;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.event.ClickEvent;
import net.kyori.adventure.text.event.HoverEvent;
import net.kyori.adventure.text.format.NamedTextColor;
import net.kyori.adventure.text.format.TextDecoration;

import org.bukkit.command.Command;
import org.bukkit.command.CommandSender;
import org.bukkit.command.TabExecutor;
import org.bukkit.configuration.ConfigurationSection;
import org.bukkit.entity.Player;
import org.bukkit.plugin.Plugin;

/**
 * /bestenliste für alle (Pascal 01.11., Hub und SMP): liest die Bestenlisten-Datei der Statistik (geteilter Ordner, dieselbe wie die Hub-Figuren),
 * rechnet nichts selbst. Ohne Argument je Kategorie die Top 3 in einer Zeile (Hover: Untertitel und Werte, Klick: ganze Liste),
 * mit Kategorie (id oder deutscher Titel, Tab-Vervollständigung) die Top 10 und der eigene Platz, auch außerhalb der Top 10, sofern die Datei ihn
 * enthält. Dazu der Stand der Datei („vor X Min.“). Abklingzeit je Spieler gegen Spam (Ops ausgenommen).
 */
final class BestenlisteBefehl implements TabExecutor {

    record Platz(String name, String text) {
    }

    record Liste(String id, String titel, String unter, List<Platz> plaetze) {
    }

    record Stand(OffsetDateTime zeit, String seasonName, List<Liste> listen) {
    }

    private final Plugin plugin;
    private boolean aktiv;
    private Path datei;
    private long abklingMillis;
    private final Map<UUID, Long> zuletzt = new HashMap<>();
    private Stand cache;
    private long cacheZeit = -1;

    BestenlisteBefehl(Plugin plugin) {
        this.plugin = plugin;
    }

    void laden(ConfigurationSection c) {
        aktiv = c == null || c.getBoolean("aktiv", true);
        datei = Path.of(c == null ? "/AMP/geteilt/bestenliste/bestenliste.json" : c.getString("datei", "/AMP/geteilt/bestenliste/bestenliste.json"));
        abklingMillis = (c == null ? 3 : c.getLong("abklingzeit-sekunden", 3)) * 1000L;
        cacheZeit = -1;
    }

    /** ganze Datei lesen, alle Listen und Plätze (Reihenfolge der Datei); für den Test statisch */
    static Stand lesen(String json) {
        JsonObject w = JsonParser.parseString(json).getAsJsonObject();
        OffsetDateTime zeit = null;
        try {
            zeit = w.has("stand") ? OffsetDateTime.parse(w.get("stand").getAsString()) : null;
        } catch (RuntimeException ignoriert) {
            // ohne Stand
        }
        List<Liste> listen = new ArrayList<>();
        for (JsonElement e : w.getAsJsonArray("listen")) {
            JsonObject l = e.getAsJsonObject();
            List<Platz> p = new ArrayList<>();
            if (l.has("plaetze")) {
                for (JsonElement pe : l.getAsJsonArray("plaetze")) {
                    JsonObject po = pe.getAsJsonObject();
                    p.add(new Platz(po.get("name").getAsString(), po.has("text") ? po.get("text").getAsString() : String.valueOf(po.get("wert"))));
                }
            }
            listen.add(new Liste(l.get("id").getAsString(), l.get("titel").getAsString(), l.has("unter") ? l.get("unter").getAsString() : "", p));
        }
        return new Stand(zeit, w.has("seasonName") ? w.get("seasonName").getAsString() : "", listen);
    }

    /** Kategorie nach id oder Titel, ohne Groß/Klein; null = unbekannt */
    static Liste finden(Stand s, String wunsch) {
        String w = wunsch.toLowerCase(Locale.ROOT);
        for (Liste l : s.listen()) {
            if (l.id().equalsIgnoreCase(w) || l.titel().toLowerCase(Locale.ROOT).equals(w)) {
                return l;
            }
        }
        return null;
    }

    /** Platz (1-basiert) des Namens oder 0 */
    static int platzVon(Liste l, String name) {
        for (int i = 0; i < l.plaetze().size(); i++) {
            if (l.plaetze().get(i).name().equalsIgnoreCase(name)) {
                return i + 1;
            }
        }
        return 0;
    }

    static String alter(Duration d) {
        long s = Math.max(0, d.getSeconds());
        if (s < 60) {
            return "vor " + s + " s";
        }
        if (s < 3600) {
            return "vor " + (s / 60) + " Min.";
        }
        if (s < 86_400) {
            return "vor " + (s / 3600) + " Std.";
        }
        return "vor " + (s / 86_400) + (s / 86_400 == 1 ? " Tag" : " Tagen");
    }

    private Stand stand() throws IOException {
        long m = Files.getLastModifiedTime(datei).toMillis();
        if (cache == null || m != cacheZeit) {
            cache = lesen(Files.readString(datei, StandardCharsets.UTF_8));
            cacheZeit = m;
        }
        return cache;
    }

    private static final NamedTextColor[] FARBEN = {NamedTextColor.YELLOW, NamedTextColor.WHITE, NamedTextColor.GOLD};

    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        if (!aktiv) {
            sender.sendMessage(Component.text("Die Bestenliste ist gerade aus.", NamedTextColor.RED));
            return true;
        }
        if (sender instanceof Player p && !p.isOp()) {
            long jetzt = System.currentTimeMillis();
            Long vorher = zuletzt.get(p.getUniqueId());
            if (vorher != null && jetzt - vorher < abklingMillis) {
                p.sendMessage(Component.text("Bitte kurz warten, dann geht /bestenliste wieder.", NamedTextColor.GRAY));
                return true;
            }
            zuletzt.put(p.getUniqueId(), jetzt);
        }
        Stand s;
        try {
            s = stand();
        } catch (IOException | RuntimeException e) {
            sender.sendMessage(Component.text("Die Bestenliste ist gerade nicht verfügbar.", NamedTextColor.RED));
            plugin.getLogger().warning("/bestenliste: " + datei + ": " + e.getMessage());
            return true;
        }
        String standText = s.zeit() == null ? "" : " · Stand " + alter(Duration.between(s.zeit().toInstant(), java.time.Instant.now()));
        if (args.length == 0) {
            sender.sendMessage(Component.text("Bestenliste" + (s.seasonName().isBlank() ? "" : " – " + s.seasonName()), NamedTextColor.GOLD, TextDecoration.BOLD)
                    .append(Component.text(standText + " · /bestenliste <kategorie>", NamedTextColor.DARK_GRAY).decoration(TextDecoration.BOLD, false)));
            for (Liste l : s.listen()) {
                Component zeile = Component.text(l.titel() + ": ", NamedTextColor.GOLD);
                Component hover = Component.text(l.titel(), NamedTextColor.GOLD).append(Component.text(" – " + l.unter(), NamedTextColor.GRAY));
                if (l.plaetze().isEmpty()) {
                    zeile = zeile.append(Component.text("noch frei", NamedTextColor.DARK_GRAY));
                }
                for (int i = 0; i < Math.min(3, l.plaetze().size()); i++) {
                    Platz pl = l.plaetze().get(i);
                    zeile = zeile.append(Component.text((i == 0 ? "" : " · ") + (i + 1) + ". " + pl.name(), FARBEN[i]));
                    hover = hover.append(Component.newline()).append(Component.text((i + 1) + ". " + pl.name() + "  ", FARBEN[i]))
                            .append(Component.text(pl.text(), NamedTextColor.GRAY));
                }
                hover = hover.append(Component.newline()).append(Component.text("Klick: ganze Liste", NamedTextColor.DARK_GRAY));
                sender.sendMessage(zeile.hoverEvent(HoverEvent.showText(hover)).clickEvent(ClickEvent.runCommand("/bestenliste " + l.id())));
            }
            return true;
        }
        Liste l = finden(s, String.join(" ", args));
        if (l == null) {
            List<String> namen = new ArrayList<>();
            s.listen().forEach(x -> namen.add(x.id()));
            sender.sendMessage(Component.text("Unbekannte Kategorie. Es gibt: " + String.join(", ", namen), NamedTextColor.RED));
            return true;
        }
        sender.sendMessage(Component.text(l.titel(), NamedTextColor.GOLD, TextDecoration.BOLD)
                .append(Component.text(" – " + l.unter() + standText, NamedTextColor.GRAY).decoration(TextDecoration.BOLD, false)));
        String ich = sender instanceof Player p ? p.getName() : "";
        int eigen = platzVon(l, ich);
        if (l.plaetze().isEmpty()) {
            sender.sendMessage(Component.text("Noch niemand in dieser Liste.", NamedTextColor.DARK_GRAY));
        }
        for (int i = 0; i < Math.min(10, l.plaetze().size()); i++) {
            Platz pl = l.plaetze().get(i);
            boolean selbst = i + 1 == eigen;
            sender.sendMessage(Component.text(String.format("%2d. ", i + 1), selbst ? NamedTextColor.AQUA : i < 3 ? FARBEN[i] : NamedTextColor.GRAY)
                    .append(Component.text(pl.name(), selbst ? NamedTextColor.AQUA : NamedTextColor.WHITE))
                    .append(Component.text("  " + pl.text(), NamedTextColor.GRAY)));
        }
        if (sender instanceof Player) {
            if (eigen > 10) {
                Platz pl = l.plaetze().get(eigen - 1);
                sender.sendMessage(Component.text("Du: " + eigen + ". " + pl.name() + "  " + pl.text(), NamedTextColor.AQUA));
            } else if (eigen == 0) {
                sender.sendMessage(Component.text("Du stehst (noch) nicht in dieser Liste.", NamedTextColor.DARK_GRAY));
            }
        }
        return true;
    }

    @Override
    public List<String> onTabComplete(CommandSender sender, Command command, String label, String[] args) {
        List<String> aus = new ArrayList<>();
        if (args.length != 1) {
            return aus;
        }
        try {
            String a = args[0].toLowerCase(Locale.ROOT);
            for (Liste l : stand().listen()) {
                for (String k : List.of(l.id(), l.titel().toLowerCase(Locale.ROOT))) {
                    if (k.startsWith(a) && !aus.contains(k)) {
                        aus.add(k);
                    }
                }
            }
        } catch (IOException | RuntimeException ignoriert) {
            // ohne Datei keine Vorschläge
        }
        return aus;
    }
}
