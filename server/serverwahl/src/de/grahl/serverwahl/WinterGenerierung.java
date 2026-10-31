package de.grahl.serverwahl;

import java.util.Map;

import org.bukkit.Chunk;
import org.bukkit.HeightMap;
import org.bukkit.Material;
import org.bukkit.World;
import org.bukkit.block.Block;
import org.bukkit.block.data.BlockData;
import org.bukkit.block.data.Snowable;
import org.bukkit.configuration.ConfigurationSection;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.world.ChunkLoadEvent;

/**
 * Winter nur durch Schneefall (Pascal 31.10.): Das Winter-Datapack macht 45 Biome kalt (Temperatur 0). Dadurch legt der Generierungsschritt
 * freeze_top_layer in jedem neu erzeugten Chunk Schnee und Eis fest ein. Im Datapack lässt er sich nicht gezielt abschalten (Minecraft prüft
 * das Biom an der Chunk-Ecke, ohne den Schritt verlieren auch echte Kältebiome ihren Schnee, server/winter.md).
 * Deshalb räumt das Plugin bei jedem neu erzeugten Chunk je Spalte genau das weg, was freeze_top_layer gesetzt hat: Schneeschicht auf der
 * Oberfläche, verschneites Gras darunter und Eis auf dem obersten Wasser. Nur in Spalten, deren Biom eines der 45 Datapack-Biome ist und
 * dort in Vanilla nicht schneien würde (Vanilla-Temperatur, höhenabhängig wie im Spiel, ohne das Rauschen). Echte Kältebiome bleiben unberührt.
 * Wetter-Schnee in getickten Chunks entsteht weiter, weil die Temperatur 0 bleibt.
 */
final class WinterGenerierung implements Listener {

    /** Vanilla-Temperaturen der Biome, die das Winter-Datapack auf 0 setzt (Paper 26.3, verglichen mit data/minecraft/worldgen/biome) */
    static final Map<String, Double> VANILLA = Map.ofEntries(
            Map.entry("badlands", 2.0), Map.entry("bamboo_jungle", 0.95), Map.entry("beach", 0.8), Map.entry("birch_forest", 0.6),
            Map.entry("cherry_grove", 0.5), Map.entry("cold_ocean", 0.5), Map.entry("dappled_forest", 0.6), Map.entry("dark_forest", 0.7),
            Map.entry("deep_cold_ocean", 0.5), Map.entry("deep_dark", 0.8), Map.entry("deep_lukewarm_ocean", 0.5), Map.entry("deep_ocean", 0.5),
            Map.entry("desert", 2.0), Map.entry("dripstone_caves", 0.8), Map.entry("eroded_badlands", 2.0), Map.entry("flower_forest", 0.7),
            Map.entry("forest", 0.7), Map.entry("jungle", 0.95), Map.entry("lukewarm_ocean", 0.5), Map.entry("lush_caves", 0.5),
            Map.entry("mangrove_swamp", 0.8), Map.entry("meadow", 0.5), Map.entry("mushroom_fields", 0.9), Map.entry("ocean", 0.5),
            Map.entry("old_growth_birch_forest", 0.6), Map.entry("old_growth_pine_taiga", 0.3), Map.entry("old_growth_spruce_taiga", 0.25),
            Map.entry("pale_garden", 0.7), Map.entry("plains", 0.8), Map.entry("river", 0.5), Map.entry("savanna", 2.0),
            Map.entry("savanna_plateau", 2.0), Map.entry("sparse_jungle", 0.95), Map.entry("stony_peaks", 1.0), Map.entry("stony_shore", 0.2),
            Map.entry("sulfur_caves", 0.8), Map.entry("sunflower_plains", 0.8), Map.entry("swamp", 0.8), Map.entry("taiga", 0.25),
            Map.entry("warm_ocean", 0.5), Map.entry("windswept_forest", 0.2), Map.entry("windswept_gravelly_hills", 0.2),
            Map.entry("windswept_hills", 0.2), Map.entry("windswept_savanna", 2.0), Map.entry("wooded_badlands", 2.0));

    private boolean aktiv;
    private long chunks;
    private long spalten;
    private long nanos;

    void laden(ConfigurationSection c) {
        aktiv = c != null && c.getBoolean("aktiv", false);
    }

    /**
     * Schneit es hier in Vanilla? Wie Biome.getHeightAdjustedTemperature (über y 80 je Block 0,05/40 kälter) ohne das Temperatur-Rauschen,
     * Schnee unter 0,15. Betrifft nur die Biome mit 0,2–0,3 (windswept, taiga, stony_shore) oberhalb von y 120–200.
     */
    static boolean vanillaSchnee(double temperatur, int y) {
        double t = y > 80 ? temperatur - (y - 80) * 0.05 / 40.0 : temperatur;
        return t < 0.15;
    }

    /** Biom-Schlüssel ohne „minecraft:“ → räumen? (nur Datapack-Biome, die in Vanilla an dieser Höhe nicht schneien) */
    static boolean raeumen(String biom, int y) {
        Double t = VANILLA.get(biom);
        return t != null && !vanillaSchnee(t, y);
    }

    @EventHandler
    public void beimLaden(ChunkLoadEvent e) {
        if (!aktiv || !e.isNewChunk() || e.getWorld().getEnvironment() != World.Environment.NORMAL) {
            return;
        }
        long start = System.nanoTime();
        Chunk ch = e.getChunk();
        World w = e.getWorld();
        int bx = ch.getX() << 4;
        int bz = ch.getZ() << 4;
        int n = 0;
        for (int dx = 0; dx < 16; dx++) {
            for (int dz = 0; dz < 16; dz++) {
                int x = bx + dx;
                int z = bz + dz;
                // wie freeze_top_layer: erste Luft über dem obersten bewegungshemmenden Block, Eis eine darunter. Dazu die Höhe ohne Laub:
                // Kronen aus Nachbar-Chunks wachsen oft erst nach dem Schnee über die Spalte, der Schnee liegt dann darunter
                int y1 = w.getHighestBlockYAt(x, z, HeightMap.MOTION_BLOCKING);
                int y2 = w.getHighestBlockYAt(x, z, HeightMap.MOTION_BLOCKING_NO_LEAVES);
                boolean geaendert = raeumeAb(w.getBlockAt(x, y1, z));
                // zwischen Kronendach und Boden: Schnee auf tieferen Laub- und Astlagen
                for (int y = y1 - 1; y >= y2; y--) {
                    Block b = w.getBlockAt(x, y, z);
                    if (b.getRelative(0, 1, 0).getType() == Material.SNOW) {
                        geaendert |= raeumeAb(b);
                    }
                }
                if (geaendert) {
                    n++;
                }
            }
        }
        chunks++;
        spalten += n;
        nanos += System.nanoTime() - start;
    }

    /** Schnee über und Eis an diesem obersten Block wegnehmen, wenn das Biom dort in Vanilla warm ist */
    private static boolean raeumeAb(Block unten) {
        Block oben = unten.getRelative(0, 1, 0);
        boolean geaendert = false;
        if (oben.getType() == Material.SNOW && raeumen(oben.getBiome().getKey().getKey(), oben.getY())) {
            oben.setType(Material.AIR, false);
            BlockData d = unten.getBlockData();
            if (d instanceof Snowable s && s.isSnowy()) {
                s.setSnowy(false);
                unten.setBlockData(s, false);
            }
            geaendert = true;
        }
        // Eis an der Oberfläche eines warmen Bioms setzt nur freeze_top_layer (ersetzt das oberste Wasser, auch bei flachem Wasser)
        if (unten.getType() == Material.ICE && raeumen(unten.getBiome().getKey().getKey(), unten.getY())) {
            unten.setType(Material.WATER, false);
            geaendert = true;
        }
        return geaendert;
    }

    String status() {
        return "Winter-Generierung: " + (aktiv ? "an" : "aus") + ", " + chunks + " neue Chunks, " + spalten + " Spalten geräumt"
                + (chunks == 0 ? "" : String.format(java.util.Locale.ROOT, ", Ø %.3f ms je Chunk", nanos / 1e6 / chunks));
    }
}
