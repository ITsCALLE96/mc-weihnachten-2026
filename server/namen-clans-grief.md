# Nicknames, Clan-Tags, Grief-Tool (Auftrag Leitung/Pascal 28.10., Plan)

Fertig im Testnetz vor dem Testlauf 21.11. Fertig-Kriterium: Pascal setzt einen Nickname, bekommt einen Test-Clan-Tag, räumt eine Kiste leer,
setzt ein Schild, findet beides per `/co i` bzw. `/co lookup` und macht es per Rollback rückgängig.

## Plugins und Paper 26.3 (geprüft 28.10.)

| Plugin | Stand | Wo |
|---|---|---|
| **LuckPerms** 5.5.71 (Bukkit/Paper) | Modrinth listet 26.3, offizielle Datei | Hub + SMP |
| **CoreProtect CE** | Letztes Release 24.1 nur bis 26.2, lehnt 26.3 ab („Minecraft 26.3 is not supported“, Issue #1034). v25.0 mit 26.3 gibt es bisher nur für Patreon-Unterstützer. Der öffentliche Quellcode (`master`, Stand 19.10., `LATEST_VERSION = "26.3"`, paper-api 26.3) kann 26.3 → **selbst bauen** (Maven, Artistic License 2.0). Inoffizielle Fremd-Builds (vladnow, Vamp1rexe) nehmen wir nicht | nur SMP |
| Nicknames, Chat, Tab, Namensschild | **eigener Code in serverwahl** (läuft schon auf Hub und SMP), kein weiteres Plugin | Hub + SMP |

Auto-Purge ist in der Community Edition gesperrt (nur Patreon-Version). Ersatz: serverwahl ruft einmal täglich `co purge t:90d` in der Konsole auf.

## Gemeinsamer LuckPerms-Speicher

**Empfehlung: ein gemeinsamer YAML-Ordner, kein neuer Dienst.** `plugins/LuckPerms/yaml-storage` beider Server zeigt auf denselben Ordner
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
- Anzeige: Chat `[Tag] Nickname: Text`; Tab-Liste `[Tag] Nickname` + echter Name klein/grau; über dem Kopf `[Tag] EchterName` per
  Scoreboard-Team `clan-<name>` mit Präfix (kein Paket-Plugin). Ohne Clan kein Präfix, ohne Nick der echte Name
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

## Ablauf

1. Maven holen (Apache, geprüft), CoreProtect `master` bei festem Commit bauen, SHA notieren (`testnetz/_downloads/coreprotect/`)
2. LuckPerms-Jar (Modrinth, SHA geprüft) für Hub + SMP, Konfig `server/plugin-konfig/{hub,smp}/plugins/LuckPerms/config.yml`, Gruppen per Skript
3. serverwahl: `Namen.java` (Nick, Chat, Tab, Teams, LuckPerms-API), täglicher Purge-Aufruf; Build gegen das LuckPerms-API im Jar
4. `testnetz/einrichten.sh` + Testliste; Start/Stop macht die Leitung
5. VM200: Symlink + Task 2 ergänzen
