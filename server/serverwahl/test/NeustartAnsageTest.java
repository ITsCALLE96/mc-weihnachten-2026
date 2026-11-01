package de.grahl.serverwahl;

import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;

/**
 * Test für NeustartAnsage (Pascal 01.11.): nächster Termin heute/morgen, auch über die Zeitumstellung, Stufen genau einmal im richtigen Fenster.
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
        ZoneId z = ZoneId.of("Europe/Berlin");
        LocalTime vier = LocalTime.of(4, 0);
        pruefe("03:50 → heute 04:00", NeustartAnsage.naechster(ZonedDateTime.of(2026, 11, 2, 3, 50, 0, 0, z), vier)
                .equals(ZonedDateTime.of(2026, 11, 2, 4, 0, 0, 0, z)));
        pruefe("04:00 genau → morgen", NeustartAnsage.naechster(ZonedDateTime.of(2026, 11, 2, 4, 0, 0, 0, z), vier)
                .equals(ZonedDateTime.of(2026, 11, 3, 4, 0, 0, 0, z)));
        pruefe("04:01 → morgen", NeustartAnsage.naechster(ZonedDateTime.of(2026, 11, 2, 4, 1, 0, 0, z), vier)
                .equals(ZonedDateTime.of(2026, 11, 3, 4, 0, 0, 0, z)));
        // Zeitumstellung (letzter Sonntag im März 02:00 → 03:00): 04:00 gibt es, die Ansage folgt der Ortszeit wie der Cron
        pruefe("Zeitumstellung März", NeustartAnsage.naechster(ZonedDateTime.of(2027, 3, 28, 1, 0, 0, 0, z), vier)
                .equals(ZonedDateTime.of(2027, 3, 28, 4, 0, 0, 0, z)));
        pruefe("10 min: genau 10:00 vorher fällig", NeustartAnsage.stufeFaellig(600_000, 10));
        pruefe("10 min: 9:01 vorher noch fällig", NeustartAnsage.stufeFaellig(541_000, 10));
        pruefe("10 min: 9:00 vorher nicht mehr", !NeustartAnsage.stufeFaellig(540_000, 10));
        pruefe("10 min: 10:01 vorher noch nicht", !NeustartAnsage.stufeFaellig(601_000, 10));
        pruefe("1 min: 0:30 vorher fällig", NeustartAnsage.stufeFaellig(30_000, 1));
        pruefe("Server startet 03:57 → keine 10-min-Ansage", !NeustartAnsage.stufeFaellig(180_000, 10));
        pruefe("Text 1 Minute", NeustartAnsage.dauer(1).equals("1 Minute"));
        pruefe("Text 10 Minuten", NeustartAnsage.dauer(10).equals("10 Minuten"));
        System.out.println(fehler == 0 ? "NeustartAnsage: alles OK" : "NeustartAnsage: " + fehler + " Fehler");
        if (fehler > 0) {
            System.exit(1);
        }
    }
}
