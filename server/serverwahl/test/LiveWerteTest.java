package de.grahl.serverwahl;

import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;

import org.bukkit.Statistic;

/**
 * Test für LiveWerte (Statistik 31.10.): JSON-Form wie statistik/DATENFORMAT.md „Live-Werte“, Schlüssel wie die Statistikdateien.
 * Aufruf: test/test.sh <paper-ordner>   (nach build.sh)
 */
public final class LiveWerteTest {

    private static int fehler;

    private static void pruefe(String fall, boolean ok) {
        if (!ok) {
            fehler++;
        }
        System.out.println((ok ? "OK    " : "FEHLER") + " " + fall);
    }

    public static void main(String[] args) {
        Map<String, Long> w = new TreeMap<>();
        w.put("custom:play_time", 240099L);
        w.put("mined:stone", 812L);
        w.put("server:fortschritte", 14L);
        w.put("kaputt", -1L);
        String j = LiveWerte.json(UUID.fromString("90e3cb68-f696-4418-a56f-d6482902c9e3"), "IT\"s", 1793440800000L, w);
        System.out.println("       " + j);
        pruefe("Form", j.equals("{\"uuid\":\"90e3cb68-f696-4418-a56f-d6482902c9e3\",\"name\":\"IT\\\"s\",\"zeit\":1793440800000,"
                + "\"werte\":{\"custom:play_time\":240099,\"mined:stone\":812,\"server:fortschritte\":14}}"));
        pruefe("Schlüssel Spielzeit = play_time (Bukkit: " + Statistic.PLAY_ONE_MINUTE.getKey().getKey() + ")", LiveWerte.schluessel(Statistic.PLAY_ONE_MINUTE).equals("play_time"));
        pruefe("Schlüssel Tode = deaths", LiveWerte.schluessel(Statistic.DEATHS).equals("deaths"));
        pruefe("Schlüssel Mob-Kills = mob_kills", LiveWerte.schluessel(Statistic.MOB_KILLS).equals("mob_kills"));
        // Vanilla-Namen aus einer echten Statistikdatei (Testnetz 31.10.) plus die übrigen Fortbewegungsarten von 26.3
        java.util.Set<String> vanilla = java.util.Set.of("aviate_one_cm", "crouch_one_cm", "fall_one_cm", "fly_one_cm", "sprint_one_cm", "swim_one_cm",
                "walk_on_water_one_cm", "walk_one_cm", "walk_under_water_one_cm", "climb_one_cm", "minecart_one_cm", "boat_one_cm", "pig_one_cm",
                "horse_one_cm", "strider_one_cm", "happy_ghast_one_cm", "nautilus_one_cm");
        StringBuilder alle = new StringBuilder();
        boolean bewegungOk = true;
        for (Statistic st : Statistic.values()) {
            if (st.getType() == Statistic.Type.UNTYPED && LiveWerte.schluessel(st).endsWith("_one_cm")) {
                alle.append(LiveWerte.schluessel(st)).append(' ');
                bewegungOk &= vanilla.contains(LiveWerte.schluessel(st));
            }
        }
        pruefe("Bewegung = Vanilla-Namen: " + alle.toString().trim(), bewegungOk);
        if (fehler > 0) {
            System.out.println(fehler + " Fehler");
            System.exit(1);
        }
        System.out.println("Live-Werte: alle Fälle OK");
    }
}
