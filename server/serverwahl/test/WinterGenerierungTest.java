package de.grahl.serverwahl;

/**
 * Test für WinterGenerierung.raeumen (Pascal 31.10.): Datapack-Biome räumen, Vanilla-Schneehöhen und echte Kältebiome nicht.
 * Aufruf: test/test.sh <paper-ordner>   (nach build.sh)
 */
public final class WinterGenerierungTest {

    private static int fehler;

    private static void pruefe(String fall, boolean ist, boolean erwartet) {
        if (ist != erwartet) {
            fehler++;
        }
        System.out.println((ist == erwartet ? "OK    " : "FEHLER") + " " + fall + " → " + ist);
    }

    public static void main(String[] args) {
        pruefe("plains y 70 räumen", WinterGenerierung.raeumen("plains", 70), true);
        pruefe("ocean y 63 räumen (Eis)", WinterGenerierung.raeumen("ocean", 63), true);
        pruefe("desert räumen", WinterGenerierung.raeumen("desert", 70), true);
        pruefe("snowy_plains nie (nicht im Datapack)", WinterGenerierung.raeumen("snowy_plains", 70), false);
        pruefe("frozen_river nie", WinterGenerierung.raeumen("frozen_river", 63), false);
        pruefe("windswept_hills y 100 räumen", WinterGenerierung.raeumen("windswept_hills", 100), true);
        pruefe("windswept_hills y 130 bleibt (Vanilla schneit über ~y 120)", WinterGenerierung.raeumen("windswept_hills", 130), false);
        pruefe("taiga y 150 räumen, y 170 bleibt", WinterGenerierung.raeumen("taiga", 150) && !WinterGenerierung.raeumen("taiga", 170), true);
        pruefe("stony_peaks y 250 räumen (1.0 schneit erst über y 750)", WinterGenerierung.raeumen("stony_peaks", 250), true);
        pruefe("45 Biome in der Tabelle", WinterGenerierung.VANILLA.size() == 45, true);
        if (fehler > 0) {
            System.out.println(fehler + " Fehler");
            System.exit(1);
        }
        System.out.println("Winter-Generierung: alle Fälle OK");
    }
}
