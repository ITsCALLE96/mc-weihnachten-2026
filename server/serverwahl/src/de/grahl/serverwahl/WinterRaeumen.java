package de.grahl.serverwahl;

import java.io.IOException;
import java.io.RandomAccessFile;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import org.bukkit.Bukkit;
import org.bukkit.Chunk;
import org.bukkit.HeightMap;
import org.bukkit.Material;
import org.bukkit.World;
import org.bukkit.block.Block;
import org.bukkit.block.data.BlockData;
import org.bukkit.block.data.Snowable;
import org.bukkit.configuration.ConfigurationSection;
import org.bukkit.plugin.Plugin;
import org.bukkit.scheduler.BukkitTask;

/**
 * Liegenden Schnee in allen schon erzeugten Chunks der Oberwelt räumen (Pascal 01.11.; zugleich das Aufräum-Kommando zum Saisonende,
 * server/winter.md). /serverwahl winter raeumen start schnee|saisonende [--eis] | status | stopp | zuruecksetzen.
 * Modus schnee: jede Schneeschicht an der Oberfläche weg (auch unter Laub, wie WinterGenerierung), verschneites Gras darunter wieder normal.
 * Modus saisonende: dasselbe nur in Spalten, deren Biom ohne Winter-Datapack warm ist (WinterGenerierung.raeumen). --eis: zusätzlich Eis an
 * der Wasseroberfläche in solchen Spalten wieder zu Wasser. Schneeblöcke, Pulverschnee, Packeis, Höhlen bleiben.
 * Welche Chunks es gibt, steht in den Kopfdaten der Region-Dateien; es wird nichts neu erzeugt (getChunkAtAsync ohne Generierung).
 * Gedrosselt (chunks-pro-sekunde), pausiert unter tps-mindestens, merkt erledigte Regionen in plugins/Serverwahl/winter-raeumen.txt
 * (ein neuer Start setzt dort fort). Direkte Blockänderungen: kein Prism-Eintrag (also kein Rollback über Prism – vorher sichern).
 */
final class WinterRaeumen {

    private static final Pattern REGION = Pattern.compile("r\\.(-?\\d+)\\.(-?\\d+)\\.mca");

    private final Plugin plugin;
    private int proSekunde = 100;
    private double tpsMindestens = 18.0;

    private BukkitTask task;
    private World welt;
    private boolean saisonende;
    private boolean eis;
    private final Deque<Path> regionen = new ArrayDeque<>();
    private final Deque<long[]> chunks = new ArrayDeque<>();
    private Path aktuelleRegion;
    private int unterwegs;
    private long erledigt;
    private long gesamt;
    private long spalten;
    private long start;
    private boolean pause;

    WinterRaeumen(Plugin plugin) {
        this.plugin = plugin;
    }

    void laden(ConfigurationSection c) {
        proSekunde = c == null ? 100 : Math.max(5, c.getInt("raeumen-chunks-pro-sekunde", 100));
        tpsMindestens = c == null ? 18.0 : c.getDouble("raeumen-tps-mindestens", 18.0);
    }

    /** Chunk-Koordinaten einer Region, die in der Datei vorhanden sind (Kopf: 1024 × 4 Byte Ort, 0 = fehlt); statisch für den Test */
    static List<long[]> vorhandeneChunks(Path region) throws IOException {
        List<long[]> l = new ArrayList<>();
        Matcher m = REGION.matcher(region.getFileName().toString());
        if (!m.matches()) {
            return l;
        }
        int rx = Integer.parseInt(m.group(1));
        int rz = Integer.parseInt(m.group(2));
        try (RandomAccessFile f = new RandomAccessFile(region.toFile(), "r")) {
            if (f.length() < 4096) {
                return l;
            }
            byte[] kopf = new byte[4096];
            f.readFully(kopf);
            for (int i = 0; i < 1024; i++) {
                int ort = ((kopf[i * 4] & 0xFF) << 24) | ((kopf[i * 4 + 1] & 0xFF) << 16) | ((kopf[i * 4 + 2] & 0xFF) << 8) | (kopf[i * 4 + 3] & 0xFF);
                if (ort != 0) {
                    l.add(new long[] {rx * 32L + (i & 31), rz * 32L + (i >> 5)});
                }
            }
        }
        return l;
    }

    private Path regionOrdner(World w) {
        Path basis = w.getWorldFolder().toPath();
        for (Path p : List.of(basis.resolve("dimensions/minecraft/overworld/region"), basis.resolve("region"))) {
            if (Files.isDirectory(p)) {
                return p;
            }
        }
        return basis.resolve("region");
    }

    private Path merker() {
        return plugin.getDataFolder().toPath().resolve("winter-raeumen.txt");
    }

    private Set<String> erledigteRegionen(String kennung) {
        Set<String> s = new HashSet<>();
        try {
            if (Files.exists(merker())) {
                List<String> z = Files.readAllLines(merker(), StandardCharsets.UTF_8);
                if (!z.isEmpty() && z.get(0).equals(kennung)) {
                    s.addAll(z.subList(1, z.size()));
                }
            }
        } catch (IOException e) {
            plugin.getLogger().warning("Winter räumen: Merker unlesbar: " + e.getMessage());
        }
        return s;
    }

    private void regionMerken(String kennung, Path region) {
        try {
            if (!Files.exists(merker()) || !Files.readAllLines(merker(), StandardCharsets.UTF_8).stream().findFirst().orElse("").equals(kennung)) {
                Files.writeString(merker(), kennung + System.lineSeparator(), StandardCharsets.UTF_8);
            }
            Files.writeString(merker(), region.getFileName() + System.lineSeparator(), StandardCharsets.UTF_8, java.nio.file.StandardOpenOption.APPEND);
        } catch (IOException e) {
            plugin.getLogger().warning("Winter räumen: Merker nicht schreibbar: " + e.getMessage());
        }
    }

    private String kennung() {
        return (saisonende ? "saisonende" : "schnee") + (eis ? " eis" : "");
    }

    String befehl(String[] args) {
        // args: winter raeumen <unter> …
        String unter = args.length >= 3 ? args[2] : "status";
        switch (unter) {
            case "start" -> {
                if (task != null) {
                    return "Läuft schon. " + status();
                }
                String modus = args.length >= 4 ? args[3] : "";
                if (!modus.equals("schnee") && !modus.equals("saisonende")) {
                    return "/serverwahl winter raeumen start schnee|saisonende [--eis]";
                }
                saisonende = modus.equals("saisonende");
                eis = args.length >= 5 && args[4].equals("--eis");
                welt = Bukkit.getWorlds().stream().filter(w -> w.getEnvironment() == World.Environment.NORMAL).findFirst().orElse(null);
                if (welt == null) {
                    return "Keine Oberwelt gefunden";
                }
                Set<String> fertig = erledigteRegionen(kennung());
                regionen.clear();
                chunks.clear();
                gesamt = 0;
                try (Stream<Path> s = Files.list(regionOrdner(welt))) {
                    s.filter(p -> REGION.matcher(p.getFileName().toString()).matches()).sorted().forEach(p -> {
                        if (!fertig.contains(p.getFileName().toString())) {
                            regionen.add(p);
                        }
                    });
                } catch (IOException e) {
                    return "Region-Ordner nicht lesbar: " + e.getMessage();
                }
                for (Path p : regionen) {
                    try {
                        gesamt += vorhandeneChunks(p).size();
                    } catch (IOException ignoriert) {
                        // beim Durchlauf noch einmal
                    }
                }
                erledigt = 0;
                spalten = 0;
                unterwegs = 0;
                aktuelleRegion = null;
                start = System.currentTimeMillis();
                int jeTick = Math.max(1, proSekunde / 20);
                task = Bukkit.getScheduler().runTaskTimer(plugin, () -> ticken(jeTick), 1L, 1L);
                plugin.getLogger().info("Winter räumen: Start " + kennung() + ", " + regionen.size() + " Regionen (" + fertig.size() + " schon erledigt), "
                        + gesamt + " Chunks, " + proSekunde + "/s");
                return "Gestartet: " + kennung() + ", " + regionen.size() + " Regionen, " + gesamt + " Chunks"
                        + (fertig.isEmpty() ? "" : " (setzt fort, " + fertig.size() + " Regionen schon erledigt)");
            }
            case "stopp" -> {
                if (task == null) {
                    return "Läuft nicht.";
                }
                task.cancel();
                task = null;
                plugin.getLogger().info("Winter räumen: gestoppt bei " + erledigt + "/" + gesamt);
                return "Gestoppt. Erledigte Regionen sind gemerkt, ein neuer Start setzt fort. " + status();
            }
            case "zuruecksetzen" -> {
                if (task != null) {
                    return "Erst stoppen.";
                }
                try {
                    Files.deleteIfExists(merker());
                } catch (IOException e) {
                    return "Merker nicht löschbar: " + e.getMessage();
                }
                return "Fortschritt gelöscht, der nächste Start beginnt von vorn.";
            }
            default -> {
                return status();
            }
        }
    }

    String status() {
        if (task == null && gesamt == 0) {
            return "Winter räumen: läuft nicht";
        }
        long sek = Math.max(1, (System.currentTimeMillis() - start) / 1000);
        double rate = erledigt / (double) sek;
        long rest = rate > 0 ? (long) ((gesamt - erledigt) / rate) : -1;
        return String.format(Locale.ROOT, "Winter räumen (%s): %s %d/%d Chunks (%.1f %%), %d Spalten geändert, %.0f Chunks/s%s%s",
                kennung(), task == null ? "fertig/gestoppt," : pause ? "PAUSE (TPS)," : "läuft,", erledigt, gesamt,
                gesamt == 0 ? 100.0 : erledigt * 100.0 / gesamt, spalten, rate,
                rest >= 0 && task != null ? ", noch ~" + (rest / 60) + " min" : "", "");
    }

    private void ticken(int jeTick) {
        pause = Bukkit.getTPS()[0] < tpsMindestens;
        if (pause) {
            return;
        }
        int frei = jeTick * 4 - unterwegs;   // höchstens ~4 Ticks im Voraus angefordert
        for (int i = 0; i < Math.min(jeTick, frei); i++) {
            if (chunks.isEmpty()) {
                if (aktuelleRegion != null && unterwegs == 0) {
                    regionMerken(kennung(), aktuelleRegion);
                    aktuelleRegion = null;
                }
                if (aktuelleRegion != null) {
                    return; // auf die letzten Chunks der Region warten
                }
                Path r = regionen.poll();
                if (r == null) {
                    if (unterwegs == 0) {
                        fertig();
                    }
                    return;
                }
                aktuelleRegion = r;
                try {
                    chunks.addAll(vorhandeneChunks(r));
                } catch (IOException e) {
                    plugin.getLogger().warning("Winter räumen: " + r.getFileName() + " unlesbar: " + e.getMessage());
                }
                continue;
            }
            long[] c = chunks.poll();
            unterwegs++;
            welt.getChunkAtAsync((int) c[0], (int) c[1], false).whenComplete((ch, fehler) -> {
                unterwegs--;
                erledigt++;
                if (ch != null) {
                    spalten += raeumen(ch, saisonende, eis);
                }
            });
        }
    }

    private void fertig() {
        task.cancel();
        task = null;
        String s = status();
        plugin.getLogger().info("Winter räumen: fertig. " + s);
        Bukkit.getOnlinePlayers().stream().filter(p -> p.hasPermission("serverwahl.admin"))
                .forEach(p -> p.sendMessage(net.kyori.adventure.text.Component.text("Winter räumen fertig. " + s, net.kyori.adventure.text.format.NamedTextColor.GOLD)));
    }

    /** einen Chunk räumen, Anzahl geänderter Spalten */
    static int raeumen(Chunk ch, boolean nurWarm, boolean eis) {
        World w = ch.getWorld();
        int bx = ch.getX() << 4;
        int bz = ch.getZ() << 4;
        int n = 0;
        for (int dx = 0; dx < 16; dx++) {
            for (int dz = 0; dz < 16; dz++) {
                int x = bx + dx;
                int z = bz + dz;
                int y1 = w.getHighestBlockYAt(x, z, HeightMap.MOTION_BLOCKING);
                int y2 = w.getHighestBlockYAt(x, z, HeightMap.MOTION_BLOCKING_NO_LEAVES);
                boolean geaendert = raeumeAb(w.getBlockAt(x, y1, z), nurWarm, eis);
                for (int y = y1 - 1; y >= y2; y--) {
                    Block b = w.getBlockAt(x, y, z);
                    if (b.getRelative(0, 1, 0).getType() == Material.SNOW) {
                        geaendert |= raeumeAb(b, nurWarm, eis);
                    }
                }
                if (geaendert) {
                    n++;
                }
            }
        }
        return n;
    }

    /** Spalten-Entscheidung für den Test: Schneeschicht räumen? */
    static boolean schneeWeg(boolean nurWarm, String biom, int y) {
        return !nurWarm || WinterGenerierung.raeumen(biom, y);
    }

    private static boolean raeumeAb(Block unten, boolean nurWarm, boolean eis) {
        Block oben = unten.getRelative(0, 1, 0);
        boolean geaendert = false;
        if (oben.getType() == Material.SNOW && schneeWeg(nurWarm, oben.getBiome().getKey().getKey(), oben.getY())) {
            oben.setType(Material.AIR, false);
            BlockData d = unten.getBlockData();
            if (d instanceof Snowable s && s.isSnowy()) {
                s.setSnowy(false);
                unten.setBlockData(s, false);
            }
            geaendert = true;
        }
        if (eis && unten.getType() == Material.ICE && WinterGenerierung.raeumen(unten.getBiome().getKey().getKey(), unten.getY())) {
            unten.setType(Material.WATER, false);
            geaendert = true;
        }
        return geaendert;
    }
}
