package de.grahl.serverwahl;

import java.util.HashSet;
import java.util.Set;

import org.bukkit.Material;
import org.bukkit.configuration.ConfigurationSection;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.block.BlockFormEvent;

/**
 * Winter-Season (Pascal 28.10.): Schnee auch über Ozeanen und Flüssen (Datapack macht sie kalt, sonst regnet es dort), aber kein Zufrieren
 * in diesen Biomen. Bricht nur die natürliche Eisbildung (Wasser → Eis) in den eingestellten Biomen ab; Eis von Spielern, Frostläufer und
 * die von Natur aus gefrorenen Biome bleiben, wie sie sind
 */
final class EisSperre implements Listener {

    private boolean aktiv;
    private final Set<String> biome = new HashSet<>();

    void laden(ConfigurationSection c) {
        aktiv = c != null && c.getBoolean("aktiv", false);
        biome.clear();
        if (c != null) {
            c.getStringList("biome").forEach(b -> biome.add(b.contains(":") ? b : "minecraft:" + b));
        }
    }

    @EventHandler(ignoreCancelled = true)
    public void beimFormen(BlockFormEvent e) {
        if (aktiv && !(e instanceof org.bukkit.event.block.EntityBlockFormEvent) && e.getNewState().getType() == Material.ICE && e.getBlock().getType() == Material.WATER
                && biome.contains(e.getBlock().getBiome().getKey().toString())) {
            e.setCancelled(true);
        }
    }
}
