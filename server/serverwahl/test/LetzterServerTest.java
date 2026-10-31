package de.grahl.serverwahl;

/**
 * Test für LetzterServer.zurueckschicken (Pascal 31.10.): neuer Login nach SMP-Logout → SMP, Wechsel vom SMP herüber → Hub bleibt.
 * Aufruf: test/test.sh <paper-ordner>   (nach build.sh)
 */
public final class LetzterServerTest {

    private static int fehler;

    private static void pruefe(String fall, Long alter, boolean darf, boolean erwartet) {
        boolean ist = LetzterServer.zurueckschicken(alter, 10_000L, darf);
        if (ist != erwartet) {
            fehler++;
        }
        System.out.println((ist == erwartet ? "OK    " : "FEHLER") + " " + fall + " → ins SMP=" + ist);
    }

    public static void main(String[] args) {
        pruefe("neuer Spieler, kein Merker", null, true, false);
        pruefe("SMP-Logout vor einer Stunde, neuer Login", 3_600_000L, true, true);
        pruefe("gerade vom SMP herüber (/hub, Kick, Fallback)", 1_500L, true, false);
        pruefe("genau an der Grenze", 10_000L, true, true);
        pruefe("SMP noch geschlossen, ohne serverwahl.vorab", 3_600_000L, false, false);
        if (fehler > 0) {
            System.out.println(fehler + " Fehler");
            System.exit(1);
        }
        System.out.println("alle Fälle OK");
    }
}
