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

/**
 * Einmal-Elytra am Spawn (Pascal 27.10.): Wer in der Zone (Kreis um die Insel, ab einer Höhe) stand und von der Insel springt, gleitet
 * im freien Fall automatisch ohne Item (Pascal 28.10., vorher Doppelsprung), F (Hand tauschen) gibt einmal Schub wie eine Feuerwerksrakete (Stufe 3, Pascal 27.10.). Nach der Landung ist sie weg,
 * Fallschaden gibt es in dem Flug keinen. Nur Überleben und Abenteuer; Ops im Kreativmodus fliegen normal.
 */
@SuppressWarnings("deprecation") // isOnGround kommt vom Client, reicht hier (nur Flugende, kein Schutz)
final class SpawnElytra implements Listener {

    private final org.bukkit.plugin.Plugin plugin;

    SpawnElytra(org.bukkit.plugin.Plugin plugin) {
        this.plugin = plugin;
    }

    private static final MiniMessage MM = MiniMessage.miniMessage();

    private boolean aktiv;
    private String welt;
    private double mitteX;
    private double mitteZ;
    private double radius;
    private int yAb;
    /** Dauer des Schubs in Ticks: Rakete Stufe 1/2/3 brennt ~20/30/40–51 Ticks */
    private int schubTicks;
    private String textStart;
    private String textSchub;
    /** Zustandswechsel ins Server-Log (Fehlersuche) */
    private boolean debug;

    /** im Gleitflug der Spawn-Elytra */
    private final Set<UUID> fliegend = new HashSet<>();
    /** Schub in diesem Flug schon verbraucht */
    private final Set<UUID> geschoben = new HashSet<>();
    /** stand in der Zone auf dem Boden: der nächste freie Fall startet den Gleitflug */
    private final Set<UUID> bereit = new HashSet<>();
    /** Fallhöhe in Blöcken, ab der der Gleitflug startet */
    private double fallAb;
    /** so viele Blöcke unter dem Spieler müssen frei sein */
    private int bodenFrei;
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
        schubTicks = c.getInt("schub-ticks", 45);
        fallAb = c.getDouble("fall-ab", 2.5);
        bodenFrei = c.getInt("boden-frei", 4);
        textStart = c.getString("text-start", "<gold>Gleiten! <gray>[F] für einen Schub");
        textSchub = c.getString("text-schub", "<gold>Schub!");
        debug = c.getBoolean("debug", false);
    }

    private void log(Player p, String was) {
        if (debug) {
            Location l = p.getLocation();
            plugin.getLogger().info("[Elytra] " + p.getName() + " " + was + String.format(" bei %.1f/%.1f/%.1f, Modus %s, Boden %s, allowFlight %s",
                    l.getX(), l.getY(), l.getZ(), p.getGameMode(), p.isOnGround(), p.getAllowFlight()));
        }
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
            bereit.remove(id);
            return;
        }
        // Wer in der Zone auf dem Boden stand, ist bereit; Landung außerhalb der Zone nimmt das wieder weg
        if (p.isOnGround()) {
            if (inZone(e.getTo())) {
                if (bereit.add(id)) {
                    log(p, "bereit (Zone)");
                }
            } else if (bereit.remove(id)) {
                log(p, "nicht mehr bereit (außerhalb gelandet)");
            }
            return;
        }
        // Automatisch gleiten (Pascal 28.10.): im freien Fall von der Insel, ohne Tastendruck. Kleine Stufen und Sprünge auf der
        // Insel lösen nicht aus: erst ab fall-ab Blöcken Fallhöhe und nur ohne Boden in den nächsten boden-frei Blöcken darunter
        if (bereit.contains(id) && e.getTo().getY() < e.getFrom().getY() && p.getFallDistance() >= fallAb && !p.isInWater()
                && keinBodenDarunter(e.getTo())) {
            starten(p);
        }
    }

    private boolean keinBodenDarunter(Location l) {
        org.bukkit.block.Block b = l.getBlock();
        for (int i = 1; i <= bodenFrei; i++) {
            if (!b.getRelative(0, -i, 0).isPassable()) {
                return false;
            }
        }
        return true;
    }

    private void starten(Player p) {
        UUID id = p.getUniqueId();
        bereit.remove(id);
        fliegend.add(id);
        p.setGliding(true);
        p.sendActionBar(MM.deserialize(textStart));
        log(p, "Gleitflug gestartet (gliding " + p.isGliding() + ")");
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
        p.sendActionBar(MM.deserialize(textSchub));
        // wie FireworkRocketEntity beim Gleiten: jeden Tick v += d·0,1 + (d·1,5 − v)·0,5, solange die Rakete brennt
        new org.bukkit.scheduler.BukkitRunnable() {
            private int rest = schubTicks;

            @Override
            public void run() {
                if (rest-- <= 0 || !p.isOnline() || !p.isGliding() || !fliegend.contains(id)) {
                    cancel();
                    return;
                }
                org.bukkit.util.Vector d = p.getLocation().getDirection();
                org.bukkit.util.Vector v = p.getVelocity();
                p.setVelocity(v.add(d.clone().multiply(0.1).add(d.multiply(1.5).subtract(v).multiply(0.5))));
            }
        }.runTaskTimer(plugin, 0L, 1L);
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
        bereit.remove(id);
        fliegend.remove(id);
        geschoben.remove(id);
        gelandet.remove(id);
    }

    /** Survival-Spieler darf nie fliegen: allowFlight aus der früheren Doppelsprung-Version (Spielerdaten) beim Betreten aufräumen */
    @EventHandler
    public void beimBeitritt(org.bukkit.event.player.PlayerJoinEvent e) {
        Player p = e.getPlayer();
        if (aktiv && ueberleben(p) && p.getAllowFlight()) {
            p.setAllowFlight(false);
            log(p, "allowFlight aus den Spielerdaten entfernt");
        } else if (aktiv) {
            log(p, "beigetreten");
        }
    }

    private void beenden(Player p) {
        log(p, "Flug beendet");
        if (fliegend.remove(p.getUniqueId())) {
            gelandet.put(p.getUniqueId(), System.currentTimeMillis());
        }
        geschoben.remove(p.getUniqueId());
        p.setGliding(false);
    }
}
