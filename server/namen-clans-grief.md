# Nicknames, Clan-Tags, Grief-Tool (Auftrag Leitung/Pascal 28.10., gebaut, Test offen)

Fertig im Testnetz vor dem Testlauf 21.11. Fertig-Kriterium: Pascal setzt einen Nickname, bekommt einen Test-Clan-Tag, räumt eine Kiste leer,
setzt ein Schild, findet beides per `/co i` bzw. `/co lookup` und macht es per Rollback rückgängig.

## Plugins und Paper 26.3 (geprüft 28.10.)

| Plugin | Stand | Wo |
|---|---|---|
| **LuckPerms** 5.5.71 (Bukkit/Paper) | Modrinth listet 26.3, offizielle Datei | Hub + SMP |
| **CoreProtect CE** | Letztes Release 24.1 nur bis 26.2, lehnt 26.3 ab („Minecraft 26.3 is not supported“, Issue #1034). v25.0 mit 26.3 gibt es bisher nur für Patreon-Unterstützer. Der öffentliche Quellcode (`master`, Stand 19.10., `LATEST_VERSION = "26.3"`, paper-api 26.3) kann 26.3 → **selbst bauen** (Maven, Artistic License 2.0). Inoffizielle Fremd-Builds (vladnow, Vamp1rexe) nehmen wir nicht | nur SMP |
| Nicknames, Chat, Tab, Namensschild | **eigener Code in serverwahl** (läuft schon auf Hub und SMP), kein weiteres Plugin | Hub + SMP |

Auto-Purge ist in der Community Edition gesperrt (nur Patreon-Version). Ersatz: serverwahl ruft täglich um **05:00** `co purge t:90d` in der Konsole auf
(Leitung 28.10.: nachts, weil der Purge die Datenbank kurz sperren kann; Config `taeglich:`).

**Offen:** Sobald CoreProtect v25 öffentlich erscheint, auf das offizielle Release wechseln (Leitung 28.10.).

## Gemeinsamer LuckPerms-Speicher

**Entschieden (Leitung 28.10.): ein gemeinsamer YAML-Ordner, kein neuer Dienst.** Je Spieler/Gruppe eine eigene Datei (`storage-method: yaml`, nicht combined). `plugins/LuckPerms/yaml-storage` beider Server zeigt auf denselben Ordner
(VM200: Symlink nach `/opt/mc-weihnachten/luckperms/`, wie schon der Eröffnungs-Merker; Testnetz: Verzeichnis-Verknüpfung `mklink /J`,
ohne Admin-Rechte, keine Windows-Einstellung). `watch-files: true` lädt Änderungen des anderen Servers nach (Sekunden).

Ehrlich: LuckPerms empfiehlt für Netzwerke eine Datenbank. Dateien vertragen keine gleichzeitigen Schreibzugriffe auf **dieselbe** Datei.
Bei uns schreiben nur `/nick` (der Spieler ist dabei nur auf einem Server) und Pascals `lp`-Befehle, also selten und praktisch nie gleichzeitig.
**Rückfall MariaDB** (nur `127.0.0.1` auf VM200, ~100 MB RAM, Backup per `mysqldump`), falls der Test Verluste zeigt.
Im Testnetz bräuchte MariaDB eine Installation auf Pascals PC, deshalb dort nicht.

Gruppen: `default` (= spieler), `moderator` (leer; `coreprotect.inspect`, `coreprotect.lookup*`, `coreprotect.teleport`), `admin` (`*`, Pascal),
je Clan `clan-<name>` mit `prefix.100.<farbiger Tag>` und `meta.clan-farbe`. Nur Pascal nimmt auf (`lp user <name> parent add clan-<name>`).
Ein Spieler gehört höchstens einem Clan an (serverwahl nimmt den Präfix mit der höchsten Priorität).
Bedrock (Floodgate): gleiche UUID-Logik, gleiche Gruppen.

## Nicknames (serverwahl, Hub + SMP)

- `/nick <name>`, `/nick reset`, für alle (`serverwahl.nick`, Standard an). Gespeichert als LuckPerms-Meta `nick` → automatisch auf beiden Servern
- Regeln: 3–16 Zeichen, Buchstaben (auch Umlaute), Ziffern, `_`, `-`; keine Farb-/Formatcodes (`&`, `§`, `<…>` werden abgelehnt, nicht entfernt)
- Keine Nachahmung: verglichen wird eine Grundform (klein, ohne `_`/`-`, `0→o 1→i l→i 3→e 4→a 5→s 7→t`) gegen alle bekannten echten Namen
  (Spieler, die je auf dem Server waren) **und** alle vergebenen Nicks; dazu eine Sperrliste in der Config (admin, moderator, server, …).
  Der eigene echte Name ist erlaubt
- Anzeige (**geändert Pascal 28.10.:** der Nick ersetzt den echten Namen): Chat `[Tag] Nickname: Text`, Tab-Liste `[Tag] Nickname`, echter Name
  nicht sichtbar. Moderatoren (`serverwahl.nick.andere`) sehen ihn per **Hover im Chat** und mit **`/nick info <nick oder name>`**.
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
- **CoreProtect + WorldGuard/WorldEdit:** CoreProtect protokolliert WorldEdit-Änderungen mit (Rollback auch dafür)

## CoreProtect (SMP)

SQLite in `plugins/CoreProtect/database.db` (eigenes Volume nicht nötig; Größe bei 25 Spielern grob 1–3 GB in 90 Tagen, wird gemessen).
Standard bleibt: Blöcke, Schilder (`sign-text`), Container (`item-transactions`), Chat (`player-messages`), Befehle (`player-commands`).
Hub nicht: dort baut niemand (WorldGuard `__global__` sperrt). Backups: DB kommt mit in die AMP-Sicherung (Rollback nach Restore braucht sie).

## Umsetzung (28.10.)

| Was | Wo |
|---|---|
| Nick, Chat, Tab, Namensschild | `serverwahl/src/…/Namen.java`, Config-Abschnitt `namen:` (Hub + SMP); Build mit `LUCKPERMS_JAR=<LuckPerms-Bukkit-Jar>` (nur zum Übersetzen) |
| täglicher Purge | `Serverwahl.java`, Config `taeglich:` (nur SMP) |
| LuckPerms-Konfig | `plugin-konfig/gemeinsam/plugins/LuckPerms/config.yml` (yaml, watch-files, server global) |
| Gruppen, Test-Clan | `luckperms/gruppen.txt`, `luckperms/clan-test.txt` (lp-Befehle, einmal auf einem Server) |
| CoreProtect | `coreprotect/bauen.sh` (Pascal, fester Commit `dffa04fc`), Konfig `plugin-konfig/smp/plugins/CoreProtect/config.yml` |
| Testnetz | `testnetz/namen-test.sh einrichten | gruppen | entfernen`, gemeinsamer Ordner `testnetz/luckperms-daten/` (git-ignoriert) |

**Lizenz CoreProtect:** Artistic License 2.0, © Intelli / PlayPro (https://github.com/PlayPro/CoreProtect). Wir bauen den unveränderten Quellcode.

## VM200 (Task 2 / Task 9)

- `mkdir -p /opt/mc-weihnachten/luckperms` (Besitzer wie die AMP-Instanzen), in **beiden** Instanzen
  `ln -s /opt/mc-weihnachten/luckperms <instanz>/plugins/LuckPerms/yaml-storage` **vor** dem ersten Start mit LuckPerms
- **Backup (Task 9):** `/opt/mc-weihnachten/luckperms/` liegt außerhalb der AMP-Instanzen → eigene Sicherung nötig (Nicks, Clans, Rechte);
  `plugins/CoreProtect/database.db` liegt im SMP und kommt mit der Instanz mit

## Test (Testnetz)

1. Pascal: `bash server/coreprotect/bauen.sh` (SHA-256 an die Server-Session; gebaut 28.10.: `488fddf4ec5ec011b5d6433d4a43d41f7bbc878263f54c4a0b1362575a5a4533`)
2. Testnetz gestoppt: `bash testnetz/namen-test.sh einrichten`; Leitung startet; `bash testnetz/namen-test.sh gruppen`
3. Logs: Hub und SMP laden LuckPerms 5.5.71 (Storage YAML), SMP lädt CoreProtect ohne „not supported“, serverwahl ohne „LuckPerms nicht geladen“
4. `/nick Weihnachtself` im Hub → Rückmeldung „Dein Nick ist jetzt …“, Chat `[Test] Weihnachtself: …` (Hover zeigt den echten Namen), Tab `[Test] Weihnachtself`,
   über dem Kopf `[Test] ITsCALLE96` (zweiter Client/Bedrock). `[Test]` ist der Clan-Tag, nicht der Nick. `/nick info Weihnachtself` zeigt den echten Namen
5. **Gleich danach auf den SMP wechseln** (Leitung): Nick und Tag sind dort da; `testnetz/luckperms-daten/users/<uuid>.yml` ist gültiges YAML,
   keine `*.tmp`/leere Dateien, keine LuckPerms-Fehler in beiden Logs
6. Regeln: `/nick &cRot`, `/nick ab`, `/nick ITsCALLE96x` (bekannter Name eines anderen → erst mit zweitem Spieler prüfbar), `/nick Adm1n` → abgelehnt; `/nick reset`
7. Grief: Kiste füllen und leer räumen, Schild schreiben; **Holzspitzhacke** nehmen: Rechtsklick auf die Kiste, Linksklick auf das Schild zeigen die Einträge,
   Schild bleibt stehen; mit Schleichen baut die Spitzhacke normal ab
8. `/co rollback u:ITsCALLE96 t:10m r:20` → Kiste wieder voll, Schild weg; `/co restore …` geht nur als admin
9. Moderator-Probe: zweites Konto in `moderator` → `/co i` geht, `/co rollback` wird abgelehnt
10. Purge-Probe (optional): `taeglich.uhrzeit` auf die nächste Minute, `/serverwahl reload` → Log „Täglich: co purge t:90d“

## Prüfwerkzeug statt Befehlen (Pascal 28.10.)

Holzspitzhacke in der Haupthand = CoreProtect-Inspektor, für alle mit `coreprotect.inspect` (moderator, admin). serverwahl schaltet dafür
CoreProtects eigenen Inspektor still ein und aus (ohne `/co i`, ohne Chatmeldung), nur solange die Spitzhacke in der Hand ist.
- **Linksklick auf einen Block:** was an dieser Stelle passiert ist (gesetzt, abgebaut, von wem, wann). Der Block geht dabei nicht kaputt
- **Rechtsklick auf eine Kiste/einen Container:** wer was herausgenommen oder hineingelegt hat; auf andere Blöcke: Benutzung (Türen, Hebel …)
- **Rechtsklick an eine Blockseite:** was an der leeren Stelle davor abgebaut wurde (für „hier war mal etwas“)
- **Schleichen** schaltet das Werkzeug ab → Moderatoren bauen mit der Holzspitzhacke ganz normal ab
- Werkzeug in der Config `pruefwerkzeug.werkzeug` (Standard `WOODEN_PICKAXE`). Ein von Hand gesetztes `/co i` bleibt unberührt
- Zurücksetzen bleibt ein Befehl (nur admin), z. B. `/co rollback u:<spieler> t:2h r:30`

## CoreProtect für die echte Welt (Entscheidung Pascal offen)

Test 28.10.: Der Bau aus `master` startet ohne gesetzten Branch nicht („branch has not been set“). Fürs Testnetz bauen wir mit
`-Dproject.branch=development` (Leitung 28.10.). CoreProtect selbst warnt dabei: „Running development code may result in data corruption.“

| Option | Was | Für | Gegen |
|---|---|---|---|
| A | **CoreProtect v25** über Patreon (Pascal kauft) | offizieller Stand für 26.3, bekanntes Werkzeug, Auto-Purge eingebaut | kostet, Updates hängen am Patreon |
| B | development-Build aus `master` (wie im Testnetz) | kostenlos, sofort | vom Autor ausdrücklich nicht für echte Welten gedacht, keine Release-Prüfung |
| C | **Prism 4.5** (Paper/Purpur, 24.10.2026, offiziell für 26.3, MIT, https://github.com/prism/prism) | offizielles Release, quelloffen, Inspektor-/Rollback-Zauberstäbe, geplanter Purge eingebaut (`command-schedules`), Speicher SQLite/H2/MariaDB | Chat und Befehle müssen erst eingeschaltet werden (`player-chat`, `player-command`), andere Bedienung (`/pr …`), unser Prüfwerkzeug müsste neu angebunden werden |
| D | warten, bis v25 öffentlich ist | kostenlos, offiziell | Zeitpunkt unbekannt, evtl. nach dem 05.12. |

**Empfehlung Server-Session:** C (Prism 4.5) im Testnetz gegenprüfen, sonst A. B nicht für die Forever-World.

## Ablauf

1. Maven holen (Apache, geprüft), CoreProtect `master` bei festem Commit bauen, SHA notieren (`testnetz/_downloads/coreprotect/`)
2. LuckPerms-Jar (Modrinth, SHA geprüft) für Hub + SMP, Konfig `server/plugin-konfig/{hub,smp}/plugins/LuckPerms/config.yml`, Gruppen per Skript
3. serverwahl: `Namen.java` (Nick, Chat, Tab, Teams, LuckPerms-API), täglicher Purge-Aufruf; Build gegen das LuckPerms-API im Jar
4. `testnetz/einrichten.sh` + Testliste; Start/Stop macht die Leitung
5. VM200: Symlink + Task 2 ergänzen
