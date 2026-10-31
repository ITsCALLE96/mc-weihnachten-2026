package de.grahl.serverwahl;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import net.kyori.adventure.text.serializer.plain.PlainTextComponentSerializer;

/**
 * Test für HubBestenliste.lesen/text (Pascal 31.10.): Hub-Datei der Statistik → 8 Plätze, Nummer 1 = Figur, leere Liste = „Noch frei“.
 * Aufruf: test/test.sh <paper-ordner> [bestenliste.json]   (nach build.sh)
 */
public final class BestenlisteTest {

    private static int fehler;

    private static void pruefe(String fall, boolean ok) {
        if (!ok) {
            fehler++;
        }
        System.out.println((ok ? "OK    " : "FEHLER") + " " + fall);
    }

    public static void main(String[] args) throws Exception {
        String json = """
                { "season": "testlauf", "seasonName": "Generalprobe", "stand": "2026-10-31T14:05:02+01:00",
                  "listen": [
                    { "id": "spielzeit", "titel": "Dauerzocker", "unter": "Spielzeit", "symbol": "x", "hub": true,
                      "plaetze": [ { "name": "ITsCALLE96", "wert": 271773, "text": "3 Std. 46 Min." }, { "name": "cruiserDE", "wert": 1, "text": "24 Min." } ] },
                    { "id": "nur-discord", "titel": "X", "unter": "Y", "hub": false, "plaetze": [ { "name": "a", "wert": 1, "text": "1" } ] },
                    { "id": "tode", "titel": "Pechvogel", "unter": "Tode", "hub": true, "plaetze": [] } ] }
                """;
        List<HubBestenliste.Liste> l = HubBestenliste.lesen(json);
        pruefe("nur hub: true, Reihenfolge der Datei", l.size() == 2 && l.get(0).id().equals("spielzeit") && l.get(1).id().equals("tode"));
        pruefe("Nummer 1 = ITsCALLE96", "ITsCALLE96".equals(l.get(0).erster()));
        pruefe("leere Liste ohne Figur", l.get(1).erster() == null);
        String t0 = PlainTextComponentSerializer.plainText().serialize(HubBestenliste.text(l.get(0)));
        pruefe("Text mit Titel, Untertitel, Platz 2: " + t0.replace("\n", " | "), t0.startsWith("Dauerzocker\nSpielzeit") && t0.contains("2. cruiserDE  24 Min."));
        String t1 = PlainTextComponentSerializer.plainText().serialize(HubBestenliste.text(l.get(1)));
        pruefe("leere Liste: Noch frei", t1.endsWith("Noch frei"));
        if (args.length > 0) {
            List<HubBestenliste.Liste> echt = HubBestenliste.lesen(Files.readString(Path.of(args[0])));
            pruefe("echte Datei: 8 Hub-Listen (" + echt.size() + ")", echt.size() == 8);
            echt.forEach(x -> System.out.println("       " + x.id() + " → " + x.erster() + " (" + x.plaetze().size() + " Plätze)"));
        }
        if (fehler > 0) {
            System.out.println(fehler + " Fehler");
            System.exit(1);
        }
        System.out.println("Bestenliste: alle Fälle OK");
    }
}
