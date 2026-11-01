package de.grahl.serverwahl;

import java.time.ZoneId;
import java.time.ZonedDateTime;

import net.kyori.adventure.bossbar.BossBar;

/**
 * Test für TpsWaechter (Pascal 01.11.): Bossbar-Text, Farbe nach TPS, Status-JSON für den Healthcheck, CSV-Zeile.
 * Aufruf: test/test.sh <paper-ordner>   (nach build.sh)
 */
public final class TpsWaechterTest {

    private static int fehler;

    private static void pruefe(String fall, boolean ok) {
        if (!ok) {
            fehler++;
        }
        System.out.println((ok ? "OK    " : "FEHLER") + " " + fall);
    }

    public static void main(String[] args) {
        String t = TpsWaechter.text(20.0000001, 3.456, 4);
        System.out.println("       " + t);
        pruefe("Text", t.equals("TPS 20.0  ·  MSPT 3.5  ·  4 Spieler"));
        pruefe("Farbe 20 grün", TpsWaechter.farbe(20) == BossBar.Color.GREEN);
        pruefe("Farbe 19.5 grün", TpsWaechter.farbe(19.5) == BossBar.Color.GREEN);
        pruefe("Farbe 18.5 gelb", TpsWaechter.farbe(18.5) == BossBar.Color.YELLOW);
        pruefe("Farbe 17.9 rot", TpsWaechter.farbe(17.9) == BossBar.Color.RED);
        String j = TpsWaechter.json("smp", 1793520000000L, 20.01, 19.876, 12.3456, 7);
        System.out.println("       " + j);
        pruefe("JSON", j.equals("{\"server\":\"smp\",\"zeit\":1793520000000,\"tps1m\":20.00,\"tps5m\":19.88,\"mspt\":12.35,\"spieler\":7}"));
        String z = TpsWaechter.csvZeile(ZonedDateTime.of(2026, 11, 1, 10, 5, 7, 0, ZoneId.of("Europe/Berlin")), 17.5, 60.0, 12);
        pruefe("CSV", z.equals("2026-11-01T10:05:07;17.50;60.00;12" + System.lineSeparator()));
        System.out.println(fehler == 0 ? "TpsWaechter: alles OK" : "TpsWaechter: " + fehler + " Fehler");
        if (fehler > 0) {
            System.exit(1);
        }
    }
}
