package de.grahl.serverwahl;

import java.lang.reflect.Proxy;
import java.util.Set;
import java.util.UUID;

import com.destroystokyo.paper.event.profile.ProfileWhitelistVerifyEvent;
import com.destroystokyo.paper.profile.PlayerProfile;
import net.kyori.adventure.text.Component;

/**
 * Test für DiscordWhitelist.freigeben (Fehler VM200 30.10.: Discord-Eintrag geladen, trotzdem „not whitelisted“).
 * Baut das Paper-Ereignis so, wie PlayerList.isWhiteListedLogin es auf Paper 26.3 auslöst (Kick-Text aus spigot.yml, kein Übersetzungsschlüssel).
 * Aufruf: test/test.sh <paper-ordner>   (nach build.sh)
 */
public final class WhitelistFreigabeTest {

    private static int fehler;

    private static PlayerProfile profil(UUID id) {
        return (PlayerProfile) Proxy.newProxyInstance(PlayerProfile.class.getClassLoader(), new Class<?>[] {PlayerProfile.class},
                (p, m, a) -> m.getName().equals("getId") ? id : null);
    }

    private static void pruefe(String fall, boolean aktiv, Set<UUID> erlaubt, UUID id, boolean whitelistAn, boolean schon, boolean erwartet) {
        ProfileWhitelistVerifyEvent e = new ProfileWhitelistVerifyEvent(profil(id), whitelistAn, schon, false,
                Component.text("You are not whitelisted on this server!"));
        DiscordWhitelist.freigeben(e, aktiv, erlaubt);
        boolean ok = e.isWhitelisted() == erwartet;
        if (!ok) {
            fehler++;
        }
        System.out.println((ok ? "OK    " : "FEHLER") + " " + fall + " → whitelisted=" + e.isWhitelisted());
    }

    public static void main(String[] args) {
        UUID cruiser = UUID.fromString("4e808d21-2a8d-401f-955d-7532511a9b7a");
        UUID fremd = UUID.randomUUID();
        Set<UUID> datei = Set.of(cruiser);
        pruefe("Discord-Eintrag, nicht auf Vanilla-Whitelist", true, datei, cruiser, true, false, true);
        pruefe("nicht in der Discord-Datei", true, datei, fremd, true, false, false);
        pruefe("Discord-Whitelist aus", false, datei, cruiser, true, false, false);
        pruefe("Vanilla-Whitelist schon ok", true, datei, fremd, true, true, true);
        pruefe("Whitelist ausgeschaltet (nichts ändern)", true, datei, fremd, false, false, false);
        pruefe("Profil ohne UUID", true, datei, null, true, false, false);
        System.out.println(fehler == 0 ? "alle Fälle bestanden" : fehler + " Fälle fehlgeschlagen");
        System.exit(fehler == 0 ? 0 : 1);
    }
}
