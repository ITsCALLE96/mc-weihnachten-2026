package de.grahl.serverwahl;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

import net.kyori.adventure.text.minimessage.MiniMessage;

import org.bukkit.GameMode;
import org.bukkit.Location;
import org.bukkit.configuration.ConfigurationSection;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.entity.EntityDamageEvent;
import org.bukkit.event.entity.EntityToggleGlideEvent;
import org.bukkit.event.player.PlayerMoveEvent;
import org.bukkit.event.player.PlayerQuitEvent;
import org.bukkit.event.player.PlayerSwapHandItemsEvent;
import org.bukkit.event.player.PlayerToggleFlightEvent;

/**
 * Einmal-Elytra am Spawn (Pascal 27.10., wie das frühere Plugin „Spawn Elytra“): In der Zone (Kreis um die Insel, ab einer Höhe)
 * startet ein Doppelsprung einen Gleitflug ohne Item, F (Hand tauschen) gibt einmal Schub. Nach der Landung ist sie weg,
 * Fallschaden gibt es in dem Flug keinen. Nur Überleben und Abenteuer; Ops im Kreativmodus fliegen normal.
 */
@SuppressWarnings("deprecation") // isOnGround kommt vom Client, reicht hier (nur Flugende, kein Schutz)
final class SpawnElytra implements Listener {

    private static final MiniMessage MM = MiniMessage.miniMessage();

    private boolean aktiv;
    private String welt;
    private double mitteX;
    private double mitteZ;
    private double radius;
    private int yAb;
    private double schub;
    private String textStart;
    private String textSchub;

    /** im Gleitflug der Spawn-Elytra */
    private final Set<UUID> fliegend = new HashSet<>();
    /** Schub in diesem Flug schon verbraucht */
    private final Set<UUID> geschoben = new HashSet<>();
    /** von uns gesetztes allowFlight (nur das nehmen wir wieder weg) */
    private final Set<UUID> erlaubt = new HashSet<>();
    /** Landezeitpunkt: Fallschaden kommt oft erst nach der Bewegung, die den Flug beendet */
    private final java.util.Map<UUID, Long> gelandet = new java.util.HashMap<>();

    void laden(ConfigurationSection c) {
        aktiv = c != null && c.getBoolean("aktiv", false);
        if (!aktiv) {
            return;
        }
        welt = c.getString("welt", "world");
        String[] m = c.getString("mitte", "0 0").trim().split("[\\s,]+");
        mitteX = Double.parseDouble(m[0]) + 0.5;
        mitteZ = Double.parseDouble(m[m.length - 1]) + 0.5;
        radius = c.getDouble("radius", 28);
        yAb = c.getInt("y-ab", 0);
        schub = c.getDouble("schub", 1.5);
        textStart = c.getString("text-start", "<gold>Gleiten! <gray>[F] für einen Schub");
        textSchub = c.getString("text-schub", "<gold>Schub!");
    }

    private boolean inZone(Location l) {
        if (l.getWorld() == null || !l.getWorld().getName().equals(welt) || l.getY() < yAb) {
            return false;
        }
        double dx = l.getX() - mitteX;
        double dz = l.getZ() - mitteZ;
        return dx * dx + dz * dz <= radius * radius;
    }

    private static boolean ueberleben(Player p) {
        return p.getGameMode() == GameMode.SURVIVAL || p.getGameMode() == GameMode.ADVENTURE;
    }

    @EventHandler(ignoreCancelled = true)
    public void beiBewegung(PlayerMoveEvent e) {
        if (!aktiv) {
            return;
        }
        Player p = e.getPlayer();
        UUID id = p.getUniqueId();
        if (fliegend.contains(id)) {
            // Landung (oder Wasser) beendet den Flug
            if (p.isOnGround() || p.isInWater()) {
                beenden(p);
            }
            return;
        }
        if (!ueberleben(p)) {
            return;
        }
        // Doppelsprung nur, wenn der Spieler in der Zone auf dem Boden stand
        boolean darf = inZone(e.getTo());
        if (darf && p.isOnGround() && !p.getAllowFlight()) {
            p.setAllowFlight(true);
            erlaubt.add(id);
        } else if (!darf && erlaubt.remove(id)) {
            p.setAllowFlight(false);
        }
    }

    @EventHandler(ignoreCancelled = true)
    public void beimDoppelsprung(PlayerToggleFlightEvent e) {
        Player p = e.getPlayer();
        if (!aktiv || !e.isFlying() || !erlaubt.contains(p.getUniqueId()) || !ueberleben(p)) {
            return;
        }
        e.setCancelled(true);
        erlaubt.remove(p.getUniqueId());
        p.setAllowFlight(false);
        p.setFlying(false);
        fliegend.add(p.getUniqueId());
        p.setVelocity(p.getVelocity().setY(0.6));
        p.setGliding(true);
        p.sendActionBar(MM.deserialize(textStart));
    }

    /** Ohne Elytra beendet der Server das Gleiten jeden Tick, das halten wir auf */
    @EventHandler(ignoreCancelled = true)
    public void beimGleitEnde(EntityToggleGlideEvent e) {
        if (!e.isGliding() && e.getEntity() instanceof Player p && fliegend.contains(p.getUniqueId()) && !p.isOnGround()) {
            e.setCancelled(true);
        }
    }

    @EventHandler(ignoreCancelled = true)
    public void beimSchub(PlayerSwapHandItemsEvent e) {
        Player p = e.getPlayer();
        UUID id = p.getUniqueId();
        if (!fliegend.contains(id) || geschoben.contains(id) || !p.isGliding()) {
            return;
        }
        e.setCancelled(true);
        geschoben.add(id);
        p.setVelocity(p.getLocation().getDirection().multiply(schub));
        p.sendActionBar(MM.deserialize(textSchub));
    }

    @EventHandler(ignoreCancelled = true)
    public void beimFallschaden(EntityDamageEvent e) {
        if (e.getCause() != EntityDamageEvent.DamageCause.FALL || !(e.getEntity() instanceof Player p)) {
            return;
        }
        Long zeit = gelandet.remove(p.getUniqueId());
        if (fliegend.contains(p.getUniqueId()) || (zeit != null && System.currentTimeMillis() - zeit < 1500)) {
            e.setCancelled(true);
            beenden(p);
        }
    }

    @EventHandler
    public void beimVerlassen(PlayerQuitEvent e) {
        UUID id = e.getPlayer().getUniqueId();
        if (erlaubt.remove(id)) {
            e.getPlayer().setAllowFlight(false);
        }
        fliegend.remove(id);
        geschoben.remove(id);
        gelandet.remove(id);
    }

    private void beenden(Player p) {
        if (fliegend.remove(p.getUniqueId())) {
            gelandet.put(p.getUniqueId(), System.currentTimeMillis());
        }
        geschoben.remove(p.getUniqueId());
        p.setGliding(false);
    }
}
