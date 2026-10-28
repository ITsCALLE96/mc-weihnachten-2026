package de.grahl.serverwahl;

import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.format.NamedTextColor;

import org.bukkit.Bukkit;
import org.bukkit.Material;
import org.bukkit.configuration.ConfigurationSection;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import org.bukkit.event.block.BlockBreakEvent;
import org.bukkit.event.player.PlayerInteractEvent;
import org.bukkit.event.player.PlayerItemHeldEvent;
import org.bukkit.event.player.PlayerQuitEvent;
import org.bukkit.plugin.Plugin;

/**
 * Prüfwerkzeug wie bei Spark (Pascal 28.10.): Wer coreprotect.inspect hat und eine Holzspitzhacke in der Haupthand hält, hat den
 * CoreProtect-Inspektor an, ohne /co i. Linksklick auf einen Block = was dort passiert ist (auch abgebaute Blöcke an der Stelle),
 * Rechtsklick auf Block/Kiste = Platziertes bzw. Container-Inhalte, Rechtsklick auf eine Seite = was an der leeren Stelle davor abgebaut wurde.
 * Der Inspektor bricht das Abbauen ab, nichts geht kaputt. Schleichen = normale Spitzhacke (Moderatoren bauen ganz normal ab).
 * Schaltet nur den Inspektor ein, den es selbst eingeschaltet hat; ein von Hand gesetztes /co i bleibt unberührt.
 */
final class Pruefwerkzeug implements Listener {

    private final Plugin plugin;
    private boolean aktiv;
    private Material werkzeug = Material.WOODEN_PICKAXE;
    /** von uns eingeschaltet */
    private final Set<UUID> an = new HashSet<>();

    Pruefwerkzeug(Plugin plugin) {
        this.plugin = plugin;
    }

    void laden(ConfigurationSection c) {
        aktiv = c != null && c.getBoolean("aktiv", false) && Bukkit.getPluginManager().getPlugin("CoreProtect") != null;
        Material m = c == null ? null : Material.matchMaterial(c.getString("werkzeug", "WOODEN_PICKAXE"));
        werkzeug = m == null ? Material.WOODEN_PICKAXE : m;
    }

    /** Inspektor-Liste von CoreProtect (öffentliches Feld ConfigHandler.inspecting, Name → an/aus); null, wenn es sie nicht gibt */
    @SuppressWarnings("unchecked")
    private static Map<String, Boolean> inspektor() {
        try {
            return (Map<String, Boolean>) Class.forName("net.coreprotect.config.ConfigHandler", true,
                    Bukkit.getPluginManager().getPlugin("CoreProtect").getClass().getClassLoader()).getField("inspecting").get(null);
        } catch (ReflectiveOperationException | ClassCastException | NullPointerException e) {
            return null;
        }
    }

    private boolean soll(Player p, Material inHand) {
        return inHand == werkzeug && !p.isSneaking() && p.hasPermission("coreprotect.inspect");
    }

    /** Zustand vor CoreProtects eigenem Klick-Listener setzen (LOWEST, serverwahl lädt vor CoreProtect) */
    private void setzen(Player p, boolean ein) {
        Map<String, Boolean> m = inspektor();
        if (m == null) {
            return;
        }
        if (ein) {
            if (!Boolean.TRUE.equals(m.get(p.getName()))) {
                m.put(p.getName(), true);
                an.add(p.getUniqueId());
            }
        } else if (an.remove(p.getUniqueId())) {
            m.put(p.getName(), false);
        }
    }

    @EventHandler(priority = EventPriority.LOWEST)
    public void beimKlick(PlayerInteractEvent e) {
        if (aktiv) {
            setzen(e.getPlayer(), soll(e.getPlayer(), e.getPlayer().getInventory().getItemInMainHand().getType()));
        }
    }

    @EventHandler(priority = EventPriority.LOWEST)
    public void beimAbbauen(BlockBreakEvent e) {
        if (aktiv) {
            setzen(e.getPlayer(), soll(e.getPlayer(), e.getPlayer().getInventory().getItemInMainHand().getType()));
        }
    }

    @EventHandler
    public void beimWechsel(PlayerItemHeldEvent e) {
        if (!aktiv) {
            return;
        }
        Player p = e.getPlayer();
        var neu = p.getInventory().getItem(e.getNewSlot());
        boolean ein = soll(p, neu == null ? Material.AIR : neu.getType());
        setzen(p, ein);
        if (ein) {
            p.sendActionBar(Component.text("Prüfwerkzeug: Links = Block, Rechts = Kiste/Platziertes, Schleichen = normal abbauen", NamedTextColor.AQUA));
        }
    }

    @EventHandler
    public void beimVerlassen(PlayerQuitEvent e) {
        setzen(e.getPlayer(), false);
    }
}
