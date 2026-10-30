package de.grahl.serverwahl;

import java.nio.file.Files;
import java.nio.file.Path;

import com.google.gson.JsonElement;
import com.google.gson.JsonParser;

/**
 * Testrunde 30.10.: Jeder Wunsch aus spawn/mission.json hat einen deutschen Namen für Tafel und Spendenfenster,
 * und der Fenstertitel „Spenden · Stufe n/m“ bleibt unter 28 Zeichen.
 * Aufruf über test/test.sh (Pfad zu mission.json als Argument).
 */
public final class MissionNamenTest {

    public static void main(String[] args) throws Exception {
        var j = JsonParser.parseString(Files.readString(Path.of(args[0]))).getAsJsonObject();
        int fehler = 0;
        int stufen = j.getAsJsonArray("stufen").size();
        for (JsonElement e : j.getAsJsonArray("stufen")) {
            for (String w : e.getAsJsonObject().getAsJsonObject("wuensche").keySet()) {
                if (!Mission.DEUTSCH.containsKey(w)) {
                    System.out.println("FEHLER kein deutscher Name: " + w);
                    fehler++;
                }
            }
        }
        String titel = "Spenden · Stufe " + stufen + "/" + stufen;
        if (titel.length() > 28) {
            System.out.println("FEHLER Titel zu lang: " + titel);
            fehler++;
        }
        System.out.println(fehler == 0 ? "Namen: alle Wünsche deutsch, Titel „" + titel + "“ ok" : fehler + " Fehler");
        System.exit(fehler == 0 ? 0 : 1);
    }
}
