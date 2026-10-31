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

    /** Hub-Entscheidung, rein für den Test: null = kein Merker */
    static boolean zurueckschicken(Long alterMillis, long wechselMillis, boolean darf) {
        return alterMillis != null && alterMillis >= wechselMillis && darf;
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
                if (!Files.exists(m)) {
                    Files.createFile(m);
                }
                Files.setLastModifiedTime(m, FileTime.fromMillis(System.currentTimeMillis()));
                return;
            }
            if (!Files.exists(m)) {
                return;
            }
            long alter = System.currentTimeMillis() - Files.getLastModifiedTime(m).toMillis();
            if (alter < wechselMillis) {
                Files.deleteIfExists(m);
                return;
            }
            if (!zurueckschicken(alter, wechselMillis, darf.test(p))) {
                return;
            }
            plugin.getServer().getScheduler().runTaskLater(plugin, () -> {
                if (p.isOnline()) {
                    p.sendMessage(Component.text("Du warst zuletzt im SMP. /hub bringt dich jederzeit zurück.", NamedTextColor.GRAY));
                    verbinden.accept(p, server);
                }
            }, 20L);
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
