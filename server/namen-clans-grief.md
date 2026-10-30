# Nicknames, Clan-Tags, Grief-Tool (Auftrag Leitung/Pascal 28.10., im Testnetz bestanden)

Fertig im Testnetz vor dem Testlauf 21.11. Fertig-Kriterium: Pascal setzt einen Nickname, bekommt einen Test-Clan-Tag, räumt eine Kiste leer,
setzt ein Schild, findet beides mit dem Prüfwerkzeug und macht es per Rollback rückgängig.

## Plugins und Paper 26.3 (geprüft 28.10.)

| Plugin | Stand | Wo |
|---|---|---|
| **LuckPerms** 5.5.71 (Bukkit/Paper) | Modrinth listet 26.3, offizielle Datei, MIT | Hub + SMP |
| **Prism** 4.5 (Paper) | offizielles Release 24.10.2026 für 26.3, MIT (https://github.com/prism/prism) | nur SMP |
| **NBT-API** 2.16.1 | Pflicht-Abhängigkeit von Prism, für 26.3, MIT | nur SMP |
| Nicknames, Chat, Tab, Namensschild, Prüfwerkzeug | **eigener Code in serverwahl** (läuft schon auf Hub und SMP) | Hub + SMP |

**Entschieden (Pascal 28.10.): Prism 4.5 als Grief-Tool**, weil offiziell, kostenlos und MIT. Rollback per Befehl ist ok, Prüfen mit unserer
Holzspitzhacke ohne Befehl; Prisms eigener Stab (`/pr wand inspect`, Ausschalten mit demselben Befehl) nur als Reserve.

**Verworfen: CoreProtect.** Das letzte öffentliche Release 24.1 läuft nur bis 26.2. Ein Eigenbau aus `master` startet nur mit dem Branch
„development“, und CoreProtect warnt dann selbst vor Datenverlust. Eigenbau, Bauskript und Testnetz-Teile sind entfernt (28.10.).
Notiz: v25 mit 26.3 gibt es bisher nur über Patreon; käme nur in Frage, wenn Prism ausfällt.

## Gemeinsamer LuckPerms-Speicher

**Entschieden (Leitung 28.10.): ein gemeinsamer YAML-Ordner, kein neuer Dienst.** Je Spieler/Gruppe eine eigene Datei (`storage-method: yaml`, nicht combined).
`plugins/LuckPerms/yaml-storage` beider Server zeigt auf denselben Ordner (VM200: relative Verknüpfung nach `../../../geteilt/luckperms`, im Container
`/AMP/geteilt/luckperms`, wie der Eröffnungs-Merker; Testnetz: Verzeichnis-Verknüpfung `mklink /J`, ohne Admin-Rechte, keine Windows-Einstellung). `watch-files: true` lädt
Änderungen des anderen Servers nach (Sekunden).

Ehrlich: LuckPerms empfiehlt für Netzwerke eine Datenbank. Dateien vertragen keine gleichzeitigen Schreibzugriffe auf **dieselbe** Datei.
Bei uns schreiben nur `/nick` (der Spieler ist dabei nur auf einem Server) und Pascals `lp`-Befehle, also selten und praktisch nie gleichzeitig.
**Rückfall MariaDB** (nur `127.0.0.1` auf VM200, ~100 MB RAM, Backup per `mysqldump`), falls ein Test Verluste zeigt.

Gruppen: `default` (= spieler), `moderator` (`prism.lookup`, `serverwahl.nick.andere`), `admin` (`prism.modify`, `prism.purge`, `luckperms.*`,
`serverwahl.admin`; Pascal), je Clan `clan-<name>` mit Präfix (Priorität 100). Nur Pascal nimmt auf (`lp user <name> parent add clan-<name>`).
Ein Spieler gehört höchstens einem Clan an (serverwahl nimmt den Präfix mit der höchsten Priorität). Bedrock (Floodgate): gleiche UUID-Logik, gleiche Gruppen.
`testnetz/rcon.py` wartet, wenn LuckPerms „Ein anderer Befehl wird ausgeführt“ meldet, und schickt den Befehl erneut.

## Nicknames (serverwahl, Hub + SMP)

- `/nick <name>`, `/nick reset`, für alle (`serverwahl.nick`, Standard an). Gespeichert als LuckPerms-Meta `nick` → automatisch auf beiden Servern
- Regeln: 3–16 Zeichen, Buchstaben (auch Umlaute), Ziffern, `_`, `-`; keine Farb-/Formatcodes (`&`, `§`, `<…>` werden abgelehnt, nicht entfernt)
- Keine Nachahmung: verglichen wird eine Grundform (klein, ohne `_`/`-`, `0→o 1→i l→i 3→e 4→a 5→s 7→t`) gegen alle bekannten echten Namen
  (Spieler, die je auf dem Server waren) **und** alle vergebenen Nicks; dazu eine Sperrliste in der Config (admin, moderator, server, …).
  Der eigene echte Name ist erlaubt
- Anzeige (Pascal 28.10.: der Nick ersetzt den echten Namen): Chat `[Tag] Nickname: Text`, Tab-Liste `[Tag] Nickname`, echter Name nicht sichtbar.
  Moderatoren (`serverwahl.nick.andere`) sehen ihn per **Hover im Chat** und mit **`/nick info <nick oder name>`**.
  Über dem Kopf bleibt `[Tag] EchterName` (Scoreboard-Team mit Präfix): Den Namen dort ersetzt nur ein Paket-Plugin. Eine mitreitende
  Text-Anzeige (Text Display als Passagier) ginge per API, aber Paper lehnt Teleports von Spielern mit Passagier ab (in `CraftPlayer.teleport0`
  geprüft: Weltwechsel → `false`) → zu riskant. Ohne Clan kein Präfix, ohne Nick der echte Name
- Xaero, Voice Chat, LSS-Far-Players benutzen den Kontonamen (GameProfile), Nick/Präfix wirken dort nicht → echter Name, wie gewollt

## Verträglichkeit (geprüft im Code bzw. Doku)

- **Scoreboard-Teams:** kein Datapack im Repo benutzt Teams → keine Kollision. Teams bleiben `collisionRule`/Freundbeschuss Standard
- **GrimAC:** reagiert nur auf Bewegung/Kampf, kein Bezug
- **Geyser/Floodgate:** zeigt Team-Präfixe über dem Kopf und Tab-Namen; Bedrock-Namen mit Punkt-Präfix bleiben der echte Name
- **Simple Voice Chat:** Kontoname; Gruppen unverändert
- **LSS:** Kontoname bei Far Players
- **Chat-Signatur:** `enforce-secure-profile=false` auf beiden Servern; Paper-Chat-Renderer ändert nur die Darstellung
- **Prism + WorldEdit:** Prism protokolliert WorldEdit-Änderungen (`worldedit-break`/`-place`), Rollback auch dafür

## Prism (SMP)

SQLite in `plugins/prism/prism.db` (Standard in `storage.conf`; Größe bei 25 Spielern wird gemessen). Unsere Abweichungen setzt
`server/prism/konfig-setzen.py` in die von Prism erzeugte `prism.conf` (HOCON, Kommentare bleiben, zweiter Lauf ändert nichts):
- `player-chat` und `player-command` an (Pascal will Chat und Befehle sehen; Blöcke, Schilder, Container sind Standard)
- Purge-Plan `prism purge start before:90d --nodefaults` per cron **05:00** täglich (Leitung 28.10.: nachts, weil der Purge die Datenbank belastet)
- `default-locale` `de_DE` (Spieler bekommen Meldungen in ihrer Client-Sprache, sonst Deutsch)

Hub nicht: dort baut niemand (WorldGuard `__global__` sperrt).

## Prüfwerkzeug statt Befehlen (Pascal 28.10.)

Holzspitzhacke in der Haupthand = Prüfen per Klick, für alle mit `prism.lookup` (moderator, admin). serverwahl fragt dafür selbst über die
öffentliche Prism-API ab (`PrismPaperApi.lookup` über den Services-Manager) und zeigt bis zu 8 Einträge, neueste zuerst: wann, wer, was,
Gegenstand/Block (Hover = Prism-Aktion). Kein `/pr wand`, nichts umzuschalten, keine Chatmeldung beim Wechseln.
- **Linksklick auf einen Block:** was an dieser Stelle passiert ist (gesetzt, abgebaut, beschriftet …). Der Block geht dabei nicht kaputt
- **Rechtsklick auf eine Kiste/einen Container:** was hineingelegt und herausgenommen wurde
- **Rechtsklick an eine Blockseite:** was an der leeren Stelle davor passiert ist (z. B. abgebaute Blöcke)
- **Schleichen** = normale Spitzhacke → Moderatoren bauen ganz normal ab
- Config `pruefwerkzeug:` (`werkzeug`, `zeilen`). Ohne Prism (Hub) bleibt die Spitzhacke normal
- Zurücksetzen bleibt ein Befehl (nur admin), z. B. `/pr rb p:<spieler> r:20 since:10m` (im Test 28.10. bestätigt)

## Umsetzung

| Was | Wo |
|---|---|
| Nick, Chat, Tab, Namensschild | `serverwahl/src/…/Namen.java`, Config `namen:` (Hub + SMP) |
| Prüfwerkzeug | `serverwahl/src/…/Pruefwerkzeug.java`, Config `pruefwerkzeug:` (SMP) |
| Build | `LUCKPERMS_JAR=<LuckPerms-Bukkit-Jar> PRISM_JAR=<prism-paper-Jar> CP_TRENNER=';' bash serverwahl/build.sh …` (APIs nur zum Übersetzen) |
| LuckPerms-Konfig | `plugin-konfig/gemeinsam/plugins/LuckPerms/config.yml` (yaml, watch-files, server global) |
| Gruppen, Test-Clan | `luckperms/gruppen.txt`, `luckperms/clan-test.txt` (lp-Befehle, einmal auf einem Server) |
| Prism-Konfig | `prism/konfig-setzen.py` |
| Testnetz | `testnetz/namen-test.sh einrichten | gruppen | entfernen`, gemeinsamer Ordner `testnetz/luckperms-daten/` (git-ignoriert) |

## VM200 (Task 2 / Task 9)

- Gemeinsamer Ordner und Verknüpfung `plugins/LuckPerms/yaml-storage → ../../../geteilt/luckperms` in Hub und SMP: `server/vm200/geteilt-einrichten.sh`
  (Container sehen nur ihren Instanzordner, der Ordner `/srv/ampdata/mc-netzwerk-geteilt` ist per Bind-Mount als `<instanz>/geteilt` eingehängt), **vor** dem ersten Start
- Prism + NBT-API auf den SMP, einmal starten/stoppen, dann `python3 server/prism/konfig-setzen.py <instanz>/plugins/prism/prism.conf`
- **Backup (Task 9):** `/srv/ampdata/mc-netzwerk-geteilt/` (LuckPerms, Whitelist-Datei, Merker) liegt außerhalb der AMP-Instanzen → eigene Sicherung nötig (Nicks, Clans, Rechte);
  `plugins/prism/prism.db` liegt im SMP und kommt mit der Instanz mit (Rollback nach einer Rücksicherung braucht sie)

## Test (Testnetz)

1. Testnetz gestoppt: `bash testnetz/namen-test.sh einrichten` (bei neuem Testnetz: einmal starten/stoppen, damit Prism `prism.conf` anlegt, dann nochmal);
   Leitung startet; `bash testnetz/namen-test.sh gruppen`
2. Logs: Hub und SMP laden LuckPerms 5.5.71 (Storage YAML), SMP lädt Prism 4.5 und NBT-API, serverwahl ohne „Prism-API nicht gefunden“
3. `/nick Weihnachtself` im Hub → Rückmeldung „Dein Nick ist jetzt …“, Chat `[Test] Weihnachtself: …` (Hover zeigt den echten Namen), Tab `[Test] Weihnachtself`,
   über dem Kopf `[Test] ITsCALLE96` (zweiter Client/Bedrock). `[Test]` ist der Clan-Tag, nicht der Nick. `/nick info Weihnachtself` zeigt den echten Namen
4. **Gleich danach auf den SMP wechseln** (Leitung): Nick und Tag sind dort da; `testnetz/luckperms-daten/users/<uuid>.yml` ist gültiges YAML,
   keine `*.tmp`/leere Dateien, keine LuckPerms-Fehler in beiden Logs
5. Regeln: `/nick &cRot`, `/nick ab`, `/nick ITsCALLE96x` (bekannter Name eines anderen → erst mit zweitem Spieler prüfbar), `/nick Adm1n` → abgelehnt; `/nick reset`
6. Grief: Kiste füllen und leer räumen, Schild schreiben; **Holzspitzhacke**: Rechtsklick auf die Kiste, Linksklick auf das Schild zeigen die Einträge,
   Schild bleibt stehen; Rechtsklick an die Seite eines Blocks zeigt Abgebautes davor; mit Schleichen baut die Spitzhacke normal ab
7. `/pr rb p:ITsCALLE96 r:20 since:10m` → Kiste wieder voll, Schild weg; Chat/Befehle per `/pr l a:player-chat`
8. Moderator-Probe: zweites Konto in `moderator` → Holzspitzhacke geht, `/pr rb` wird abgelehnt
