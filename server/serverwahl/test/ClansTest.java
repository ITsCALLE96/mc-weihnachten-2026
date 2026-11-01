package de.grahl.serverwahl;

import java.util.List;

/**
 * Test für Clans (Pascal 01.11., server/clans-api.md): Format von Kürzel, Name und Farbe, Sperrliste und Wortliste, Präfix und Gruppenname.
 * Die LuckPerms-Teile prüft der Testnetz-Durchlauf mit curl. Aufruf: test/test.sh <paper-ordner>   (nach build.sh)
 */
public final class ClansTest {

    private static int fehler;

    private static void pruefe(String fall, boolean ok) {
        if (!ok) {
            fehler++;
        }
        System.out.println((ok ? "OK    " : "FEHLER") + " " + fall);
    }

    public static void main(String[] args) {
        pruefe("gültig", Clans.formatFehler("NORD", "Die Nordmänner", "dark_aqua") == null);
        pruefe("Kürzel 10 Zeichen", Clans.formatFehler("ABCDEFGH12", "Name", "red") == null);
        pruefe("Kürzel 11 Zeichen", "kuerzel".equals(Clans.formatFehler("ABCDEFGH123", "Name", "red")));
        pruefe("Kürzel 1 Zeichen", "kuerzel".equals(Clans.formatFehler("A", "Name", "red")));
        pruefe("Kürzel klein (vorher groß machen)", "kuerzel".equals(Clans.formatFehler("nord", "Name", "red")));
        pruefe("Kürzel Sonderzeichen", "kuerzel".equals(Clans.formatFehler("NO-RD", "Name", "red")));
        pruefe("Kürzel Umlaut", "kuerzel".equals(Clans.formatFehler("NÖRD", "Name", "red")));
        pruefe("Name zu kurz", "name".equals(Clans.formatFehler("NORD", "ab", "red")));
        pruefe("Name mit Formatcode", "name".equals(Clans.formatFehler("NORD", "&cRot", "red")));
        pruefe("Name mit MiniMessage", "name".equals(Clans.formatFehler("NORD", "<red>Rot", "red")));
        pruefe("Name doppelte Leerzeichen", "name".equals(Clans.formatFehler("NORD", "Die  Nord", "red")));
        pruefe("Farbe schwarz", "farbe".equals(Clans.formatFehler("NORD", "Name", "black")));
        pruefe("Farbe unbekannt", "farbe".equals(Clans.formatFehler("NORD", "Name", "pink")));
        pruefe("14 Farben", Clans.FARBEN.size() == 14);
        List<String> sperr = List.of(Namen.grundform("ADMIN"), Namen.grundform("MOD"), Namen.grundform("SERVER"), Namen.grundform("OP"));
        List<String> beleid = List.of(Namen.grundform("depp"));
        pruefe("ADMIN gesperrt", "sperrliste".equals(Clans.sperrGrund("ADMIN", sperr, beleid)));
        pruefe("XADMINX gesperrt (lang, Teil)", "sperrliste".equals(Clans.sperrGrund("XADMINX", sperr, beleid)));
        pruefe("4DM1N gesperrt (Ersatzzeichen)", "sperrliste".equals(Clans.sperrGrund("4DM1N", sperr, beleid)));
        pruefe("MOD gesperrt", "sperrliste".equals(Clans.sperrGrund("MOD", sperr, beleid)));
        pruefe("MODERN erlaubt (kurzes Wort nur ganz)", Clans.sperrGrund("MODERN", sperr, beleid) == null);
        pruefe("Name „Die Mod Crew“ gesperrt (Wort)", "sperrliste".equals(Clans.sperrGrund("Die Mod Crew", sperr, beleid)));
        pruefe("TOPGANG erlaubt (OP nur als Wort)", Clans.sperrGrund("TOPGANG", sperr, beleid) == null);
        pruefe("Beleidigung als Teil", "beleidigung".equals(Clans.sperrGrund("D3PPEN", sperr, beleid)));
        pruefe("normal erlaubt", Clans.sperrGrund("NORD", sperr, beleid) == null);
        pruefe("Gruppe", Clans.gruppe("NORD").equals("clan-nord"));
        pruefe("Präfix", Clans.praefix("NORD", "dark_aqua").equals("&3[NORD]"));
        System.out.println(fehler == 0 ? "Clans: alles OK" : "Clans: " + fehler + " Fehler");
        if (fehler > 0) {
            System.exit(1);
        }
    }
}
