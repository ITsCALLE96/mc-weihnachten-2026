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
        // Leitung 01.11.: Sperrliste nur fürs Kürzel; Name nur Wortliste + Amt als ganzes Wort; Name normieren
        pruefe("Name „Team Nord“ erlaubt", Clans.nameGrund("Team Nord", beleid) == null);
        pruefe("Name „Die Crew“ erlaubt", Clans.nameGrund("Die Crew", beleid) == null);
        pruefe("Name „Admin Gruppe“ gesperrt", "sperrliste".equals(Clans.nameGrund("Admin Gruppe", beleid)));
        pruefe("Name „Die Console“ gesperrt (l→i)", "sperrliste".equals(Clans.nameGrund("Die Console", beleid)));
        pruefe("Name „Moderne Bauer“ erlaubt (Amt nur ganz)", Clans.nameGrund("Moderne Bauer", beleid) == null);
        pruefe("Name mit Beleidigung", "beleidigung".equals(Clans.nameGrund("Die Deppen", beleid)));
        pruefe("Kürzel TEAM gesperrt", "sperrliste".equals(Clans.sperrGrund("TEAM", List.of(Namen.grundform("TEAM")), beleid)));
        pruefe("Name normieren", "Team Nord".equals(Clans.nameNormieren("  Team   Nord  ")));
        pruefe("normierter Name gültig", Clans.formatFehler("NORD", Clans.nameNormieren(" Team  Nord "), "red") == null);
        // Namen 01.11.: „&c[ADMIN]“ färbte den Namen mit → Tag und Name als Geschwister, Name weiß
        net.kyori.adventure.text.Component v = Namen.voll(Namen.tagAus("&c[ADMIN]"), "ITsCALLE96");
        net.kyori.adventure.text.Component nameTeil = v.children().get(1);
        pruefe("Name ist eigenes Kind und weiß", nameTeil instanceof net.kyori.adventure.text.TextComponent t && t.content().equals("ITsCALLE96")
                && net.kyori.adventure.text.format.NamedTextColor.WHITE.equals(t.color()));
        pruefe("Tag-Teil enthält [ADMIN] rot", net.kyori.adventure.text.serializer.plain.PlainTextComponentSerializer.plainText().serialize(v.children().get(0)).equals("[ADMIN] ")
                && net.kyori.adventure.text.serializer.legacy.LegacyComponentSerializer.legacySection().serialize(v.children().get(0)).startsWith("§c[ADMIN]"));
        pruefe("ohne Präfix nur der Name", net.kyori.adventure.text.serializer.plain.PlainTextComponentSerializer.plainText().serialize(Namen.voll(Namen.tagAus(null), "Steve")).equals("Steve"));
        pruefe("Clan-Präfix &3[NORD]: Name trotzdem weiß", Namen.voll(Namen.tagAus(Clans.praefix("NORD", "dark_aqua")), "x").children().get(1).color() == net.kyori.adventure.text.format.NamedTextColor.WHITE);
        net.kyori.adventure.text.Component st = Namen.voll(Namen.tagAus("&c[ADMIN]&r&r &5[TEST]"), "ITsCALLE96");
        pruefe("gestapelter Präfix: [ADMIN] [TEST] Name", net.kyori.adventure.text.serializer.plain.PlainTextComponentSerializer.plainText().serialize(st).equals("[ADMIN] [TEST] ITsCALLE96"));
        pruefe("gestapelter Präfix: Name weiß", st.children().get(1).color() == net.kyori.adventure.text.format.NamedTextColor.WHITE);
        pruefe("gestapelter Präfix: TEST lila", net.kyori.adventure.text.serializer.legacy.LegacyComponentSerializer.legacySection().serialize(st.children().get(0)).contains("§5[TEST]"));
        pruefe("Gruppe", Clans.gruppe("NORD").equals("clan-nord"));
        pruefe("Präfix", Clans.praefix("NORD", "dark_aqua").equals("&3[NORD]"));
        System.out.println(fehler == 0 ? "Clans: alles OK" : "Clans: " + fehler + " Fehler");
        if (fehler > 0) {
            System.exit(1);
        }
    }
}
