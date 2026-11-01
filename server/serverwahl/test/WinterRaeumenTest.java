package de.grahl.serverwahl;

import java.io.RandomAccessFile;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

/**
 * Test für WinterRaeumen (Pascal 01.11.): Chunks aus dem Region-Kopf, Spalten-Entscheidung je Modus. Den Lauf selbst prüft
 * server/vm200/winter-raeumen-test.sh auf VM200 an einer Kopie. Aufruf: test/test.sh <paper-ordner>   (nach build.sh)
 */
public final class WinterRaeumenTest {

    private static int fehler;

    private static void pruefe(String fall, boolean ok) {
        if (!ok) {
            fehler++;
        }
        System.out.println((ok ? "OK    " : "FEHLER") + " " + fall);
    }

    public static void main(String[] args) throws Exception {
        Path d = Files.createTempDirectory("region");
        Path r = d.resolve("r.-1.2.mca");
        try (RandomAccessFile f = new RandomAccessFile(r.toFile(), "rw")) {
            f.setLength(8192);
            f.seek(0);
            f.writeInt(0x00000201);          // Index 0 → Chunk (-32, 64)
            f.seek((33) * 4);
            f.writeInt(0x00000301);          // Index 33 → x 1, z 1 → Chunk (-31, 65)
        }
        List<long[]> c = WinterRaeumen.vorhandeneChunks(r);
        pruefe("2 Chunks im Kopf", c.size() == 2);
        pruefe("Koordinaten Index 0", c.get(0)[0] == -32 && c.get(0)[1] == 64);
        pruefe("Koordinaten Index 33", c.get(1)[0] == -31 && c.get(1)[1] == 65);
        pruefe("fremder Dateiname leer", WinterRaeumen.vorhandeneChunks(d.resolve("x.mca")).isEmpty());
        pruefe("schnee: auch in Kältebiomen weg", WinterRaeumen.schneeWeg(false, "snowy_plains", 70));
        pruefe("saisonende: plains (warm) weg", WinterRaeumen.schneeWeg(true, "plains", 70));
        pruefe("saisonende: snowy_plains bleibt", !WinterRaeumen.schneeWeg(true, "snowy_plains", 70));
        pruefe("saisonende: taiga hoch oben bleibt (Vanilla-Schnee)", !WinterRaeumen.schneeWeg(true, "taiga", 200));
        Files.delete(r);
        Files.delete(d);
        System.out.println(fehler == 0 ? "WinterRaeumen: alles OK" : "WinterRaeumen: " + fehler + " Fehler");
        if (fehler > 0) {
            System.exit(1);
        }
    }
}
