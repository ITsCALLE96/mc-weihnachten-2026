package de.grahl.serverwahl;

/**
 * Test für NeustartAnsage (Pascal 01.11., Neustart bei Bedarf): Ziel auf voller Minute (Cron minütlich), Stufen genau einmal im richtigen Fenster.
 * Aufruf: test/test.sh <paper-ordner>   (nach build.sh)
 */
public final class NeustartAnsageTest {

    private static int fehler;

    private static void pruefe(String fall, boolean ok) {
        if (!ok) {
            fehler++;
        }
        System.out.println((ok ? "OK    " : "FEHLER") + " " + fall);
    }

    public static void main(String[] args) {
        long t0 = 1_793_520_000_000L; // volle Minute
        pruefe("in 10 auf voller Minute bleibt", NeustartAnsage.zielIn(t0, 10) == t0 + 600_000);
        pruefe("in 10 um :20 s → aufgerundet", NeustartAnsage.zielIn(t0 + 20_000, 10) == t0 + 660_000);
        pruefe("in 1 um :59,9 s → nächste Minute + 1", NeustartAnsage.zielIn(t0 + 59_900, 1) == t0 + 120_000);
        pruefe("Ziel immer volle Minute", NeustartAnsage.zielIn(t0 + 12_345, 60) % 60_000 == 0);
        pruefe("10 min: genau 10:00 vorher fällig", NeustartAnsage.stufeFaellig(600_000, 10));
        pruefe("10 min: 9:01 vorher noch fällig", NeustartAnsage.stufeFaellig(541_000, 10));
        pruefe("10 min: 9:00 vorher nicht mehr", !NeustartAnsage.stufeFaellig(540_000, 10));
        pruefe("10 min: 10:01 vorher noch nicht", !NeustartAnsage.stufeFaellig(601_000, 10));
        pruefe("1 min: 0:30 vorher fällig", NeustartAnsage.stufeFaellig(30_000, 1));
        pruefe("Neustart in 3 min → keine 10-min-Stufe", !NeustartAnsage.stufeFaellig(180_000, 10));
        pruefe("Text 1 Minute", NeustartAnsage.dauer(1).equals("1 Minute"));
        pruefe("Text 10 Minuten", NeustartAnsage.dauer(10).equals("10 Minuten"));
        pruefe("Text 1 Stunde", NeustartAnsage.dauer(60).equals("1 Stunde"));
        System.out.println(fehler == 0 ? "NeustartAnsage: alles OK" : "NeustartAnsage: " + fehler + " Fehler");
        if (fehler > 0) {
            System.exit(1);
        }
    }
}
