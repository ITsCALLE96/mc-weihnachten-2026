package de.grahl.serverwahl;

import java.time.Duration;

/**
 * Test für /bestenliste (Pascal 01.11.): Datei der Statistik lesen (alle Listen, alle Plätze), Kategorie nach id oder Titel, eigener Platz, Stand-Text.
 * Aufruf: test/test.sh <paper-ordner>   (nach build.sh)
 */
public final class BestenlisteBefehlTest {

    private static int fehler;

    private static void pruefe(String fall, boolean ok) {
        if (!ok) {
            fehler++;
        }
        System.out.println((ok ? "OK    " : "FEHLER") + " " + fall);
    }

    public static void main(String[] args) {
        StringBuilder p = new StringBuilder();
        for (int i = 1; i <= 12; i++) {
            p.append(i > 1 ? "," : "").append("{\"name\":\"Spieler").append(i).append("\",\"wert\":").append(100 - i).append(",\"text\":\"").append(100 - i).append(" Std.\"}");
        }
        String json = "{\"season\":\"testlauf\",\"seasonName\":\"Generalprobe\",\"stand\":\"2026-11-01T15:06:06+01:00\",\"listen\":["
                + "{\"id\":\"spielzeit\",\"titel\":\"Dauerzocker\",\"unter\":\"Spielzeit\",\"hub\":true,\"plaetze\":[" + p + "]},"
                + "{\"id\":\"spenden\",\"titel\":\"Weihnachtself\",\"unter\":\"Spenden\",\"hub\":false,\"plaetze\":[]}]}";
        BestenlisteBefehl.Stand s = BestenlisteBefehl.lesen(json);
        pruefe("zwei Listen, auch hub:false", s.listen().size() == 2);
        pruefe("alle 12 Plätze gelesen", s.listen().get(0).plaetze().size() == 12);
        pruefe("Season-Name", s.seasonName().equals("Generalprobe"));
        pruefe("Stand gelesen", s.zeit() != null && s.zeit().getHour() == 15);
        pruefe("finden per id", BestenlisteBefehl.finden(s, "SPIELZEIT").titel().equals("Dauerzocker"));
        pruefe("finden per Titel", BestenlisteBefehl.finden(s, "dauerzocker").id().equals("spielzeit"));
        pruefe("unbekannt", BestenlisteBefehl.finden(s, "quatsch") == null);
        pruefe("eigener Platz 12 (außerhalb Top 10)", BestenlisteBefehl.platzVon(s.listen().get(0), "spieler12") == 12);
        pruefe("nicht in der Liste", BestenlisteBefehl.platzVon(s.listen().get(0), "Niemand") == 0);
        pruefe("leere Liste", s.listen().get(1).plaetze().isEmpty());
        pruefe("alter 45 s", BestenlisteBefehl.alter(Duration.ofSeconds(45)).equals("vor 45 s"));
        pruefe("alter 5 Min.", BestenlisteBefehl.alter(Duration.ofMinutes(5)).equals("vor 5 Min."));
        pruefe("alter 1 Tag", BestenlisteBefehl.alter(Duration.ofHours(30)).equals("vor 1 Tag"));
        System.out.println(fehler == 0 ? "BestenlisteBefehl: alles OK" : "BestenlisteBefehl: " + fehler + " Fehler");
        if (fehler > 0) {
            System.exit(1);
        }
    }
}
