package de.grahl.serverwahl;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.FileTime;
import java.util.function.BiConsumer;
import java.util.function.Predicate;

import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.format.NamedTextColor;
import org.bukkit.configuration.ConfigurationSection;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.player.PlayerJoinEvent;
import org.bukkit.event.player.PlayerQuitEvent;
import org.bukkit.plugin.java.JavaPlugin;

/**
 * Letzten Server merken (Pascal 31.10.): wer zuletzt im SMP war, kommt beim nächsten Login direkt dorthin statt in den Hub.
 * Ein Merker je Spieler als leere Datei &lt;ordner&gt;/&lt;uuid&gt; im geteilten Ordner (Hub und SMP auf derselben VM).
 * SMP: legt den Merker beim Beitritt an und frischt beim Verlassen seine Zeit auf.
 * Hub: Merker da und älter als „wechsel-sekunden“ → der Spieler war offline (neuer Login) → nach ~1 s ins SMP, sofern er darf.
 * Merker jünger → er kommt gerade vom SMP herüber (/hub, /server hub, Kick, Absturz-Fallback) → Merker löschen, er bleibt im Hub;
 * loggt er dort aus, landet er beim nächsten Mal wieder im Hub.
 * 01.11.: Schnelles Trennen und Neu-Verbinden (5 s) sah aus wie ein Wechsel. Deshalb schreibt das SMP bei eigenen Wechseln in den Hub
 * (/hub, Portale, Menü) „wechsel“ in den Merker; nur dann bleibt der Spieler sicher im Hub. Die Zeitgrenze (wechsel-sekunden, live 3)
 * bleibt für Wechsel ohne das Plugin (/server hub, Kick, Absturz). Weiterleitung jetzt nach 5 Ticks statt 20.
 */
final class LetzterServer implements Listener {

    private final JavaPlugin plugin;
    private boolean istHub;
    private final Predicate<Player> darf;
    private final BiConsumer<Player, String> verbinden;
    /** null = aus */
    private Path ordner;
    private String server;
    private long wechselMillis;

    LetzterServer(JavaPlugin plugin, Predicate<Player> darf, BiConsumer<Player, String> verbinden) {
        this.plugin = plugin;
        this.darf = darf;
        this.verbinden = verbinden;
    }

    void laden(ConfigurationSection c, boolean istHub) {
        this.istHub = istHub;
        String o = c == null ? "" : c.getString("ordner", "");
        ordner = o.isBlank() ? null : Path.of(o);
        server = c == null ? "smp" : c.getString("server", "smp");
        wechselMillis = (c == null ? 10 : c.getLong("wechsel-sekunden", 10)) * 1000L;
    }

    static final String WECHSEL = "wechsel";

    /** Hub-Entscheidung, rein für den Test: null = kein Merker; inhalt „wechsel“ = vom SMP per Plugin herübergewechselt */
    static boolean zurueckschicken(String inhalt, Long alterMillis, long wechselMillis, boolean darf) {
        return alterMillis != null && !WECHSEL.equals(inhalt) && alterMillis >= wechselMillis && darf;
    }

    /** SMP: Wechsel in den Hub über das Plugin (/hub, Portal, Menü) vormerken, damit der Hub ihn nicht zurückschickt */
    void wechselMerken(Player p) {
        if (ordner == null || istHub) {
            return;
        }
        try {
            Files.createDirectories(ordner);
            Files.writeString(merker(p), WECHSEL);
        } catch (IOException ex) {
            plugin.getLogger().warning("Letzter Server: " + merker(p) + ": " + ex.getMessage());
        }
    }

    private Path merker(Player p) {
        return ordner.resolve(p.getUniqueId().toString());
    }

    @EventHandler
    public void beimBeitritt(PlayerJoinEvent e) {
        if (ordner == null) {
            return;
        }
        Player p = e.getPlayer();
        Path m = merker(p);
        try {
            if (!istHub) {
                Files.createDirectories(ordner);
                // leer = „war zuletzt im SMP“; ein alter „wechsel“-Eintrag gilt damit nicht mehr
                Files.writeString(m, "");
                Files.setLastModifiedTime(m, FileTime.fromMillis(System.currentTimeMillis()));
                return;
            }
            if (!Files.exists(m)) {
                return;
            }
            long alter = System.currentTimeMillis() - Files.getLastModifiedTime(m).toMillis();
            String inhalt = Files.readString(m).strip();
            if (WECHSEL.equals(inhalt) || alter < wechselMillis) {
                Files.deleteIfExists(m);
                return;
            }
            if (!zurueckschicken(inhalt, alter, wechselMillis, darf.test(p))) {
                return;
            }
            plugin.getServer().getScheduler().runTaskLater(plugin, () -> {
                if (p.isOnline()) {
                    p.sendMessage(Component.text("Du warst zuletzt im SMP. /hub bringt dich jederzeit zurück.", NamedTextColor.GRAY));
                    verbinden.accept(p, server);
                }
            }, 5L);
        } catch (IOException ex) {
            plugin.getLogger().warning("Letzter Server: " + m + ": " + ex.getMessage());
        }
    }

    @EventHandler
    public void beimVerlassen(PlayerQuitEvent e) {
        if (ordner == null || istHub) {
            return;
        }
        Path m = merker(e.getPlayer());
        try {
            if (Files.exists(m)) {
                Files.setLastModifiedTime(m, FileTime.fromMillis(System.currentTimeMillis()));
            }
        } catch (IOException ex) {
            plugin.getLogger().warning("Letzter Server: " + m + ": " + ex.getMessage());
        }
    }
}
