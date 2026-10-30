package de.grahl.serverwahl;

/**
 * Mission-Skalierung (Spezifikation Spawn & Welt, freigegeben Pascal 30.10.): Spieler fürs Ziel 8…30, Absenkung −20 % nach 7 Tagen ohne Spende,
 * höchstens 3×, nie unter dem Gespendeten. Aufruf über test/test.sh.
 */
public final class MissionSkalierungTest {

    private static int fehler;

    private static void pruefe(String fall, long ist, long soll) {
        boolean ok = ist == soll;
        if (!ok) {
            fehler++;
        }
        System.out.println((ok ? "OK     " : "FEHLER ") + fall + " → " + ist + (ok ? "" : " (erwartet " + soll + ")"));
    }

    public static void main(String[] args) {
        pruefe("Spieler 3 → min 8", Mission.spielerFuerZiel(3, 8, 30), 8);
        pruefe("Spieler 12 → 12", Mission.spielerFuerZiel(12, 8, 30), 12);
        pruefe("Spieler 50 → max 30", Mission.spielerFuerZiel(50, 8, 30), 30);

        // Kette 1000 → 800 → 640 → 512, die 4. Absenkung findet nicht statt
        int ziel = 1000;
        long tag = 86_400_000L;
        long letzte = 0;
        int bisher = 0;
        int[] erwartet = {800, 640, 512, 512};
        for (int i = 0; i < 4; i++) {
            long jetzt = letzte + 7 * tag;
            if (Mission.absenkenFaellig(letzte, jetzt, 7, bisher, 3)) {
                ziel = Mission.abgesenkt(ziel, 0, 0.20);
                bisher++;
                letzte = jetzt;
            }
            pruefe("Absenkung " + (i + 1), ziel, erwartet[i]);
        }
        pruefe("nie unter Gespendetem (1000, 900 gespendet)", Mission.abgesenkt(1000, 900, 0.20), 900);
        pruefe("abrunden (333 × 0,8 = 266,4)", Mission.abgesenkt(333, 0, 0.20), 266);
        pruefe("Spende vor 6 Tagen → keine Absenkung", Mission.absenkenFaellig(0, 6 * tag, 7, 0, 3) ? 1 : 0, 0);
        pruefe("7 Tage ohne Spende → Absenkung", Mission.absenkenFaellig(0, 7 * tag, 7, 0, 3) ? 1 : 0, 1);
        System.out.println(fehler == 0 ? "Skalierung: alle Fälle bestanden" : fehler + " Fälle fehlgeschlagen");
        System.exit(fehler == 0 ? 0 : 1);
    }
}
