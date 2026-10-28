package de.grahl.serverwahl;

import org.bukkit.Bukkit;
import org.bukkit.World;
import org.bukkit.entity.Enderman;
import org.bukkit.entity.Entity;
import org.bukkit.entity.Ghast;
import org.bukkit.entity.Mob;
import org.bukkit.entity.Pose;
import org.bukkit.entity.Warden;
import org.bukkit.plugin.Plugin;

/**
 * Mob-Zoo der Testwelt (Pascal 28.10.): Mobs mit dem Tag „zoo_angriff“ in Angriffspose einfrieren. Die Posen hängen an Zuständen, die Minecraft
 * nicht speichert (sonst setzt sie die KI), deshalb hier alle 5 s neu: angriffslustig (Skelette mit gespanntem Bogen, Zombies mit gehobenen Armen,
 * Diener mit erhobener Axt, Plünderer mit geladener Armbrust …), Ghast mit offenem Feuermaul, Enderman mit aufgerissenem Maul, Warden brüllt
 * (Pose wird kurz gewechselt, damit die Animation neu startet). Nur aktiv mit zoo-posen: true (Testwelt).
 */
final class ZooPosen {

    private static final String TAG = "zoo_angriff";
    private boolean aktiv;
    private int runde;

    ZooPosen(Plugin plugin) {
        Bukkit.getScheduler().runTaskTimer(plugin, this::takt, 100L, 100L);
    }

    void laden(boolean aktiv) {
        this.aktiv = aktiv;
    }

    private void takt() {
        if (!aktiv) {
            return;
        }
        runde++;
        for (World w : Bukkit.getWorlds()) {
            for (Entity e : w.getEntities()) {
                if (!e.getScoreboardTags().contains(TAG)) {
                    continue;
                }
                if (e instanceof Warden wd) {
                    // Brüll-Animation: Pose wechseln startet sie neu (alle 10 s)
                    wd.setPose(runde % 2 == 0 ? Pose.ROARING : Pose.STANDING, true);
                } else if (e instanceof Ghast g) {
                    g.setCharging(true);
                } else if (e instanceof Enderman en) {
                    en.setScreaming(true);
                }
                if (e instanceof Mob m && !m.isAggressive()) {
                    m.setAggressive(true);
                }
            }
        }
    }
}
