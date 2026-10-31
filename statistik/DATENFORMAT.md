# Statistikseite – Datenformat und Dienst

Vertrag zwischen Dienst (`dienst.mjs`, `lib/`) und Seite (`web/`). Node 24, **keine npm-Abhängigkeiten**, Tests mit `node --test`.

## Eingaben (nur lesend)

| Option | Inhalt |
|---|---|
| `--instanz <ordner>` | Paper-Instanzordner: `server.properties`, `usercache.json`, `logs/latest.log`, `logs/*.log.gz` |
| `--archiv <ordner>` | optional, **Wurzel** des Archivs aus `server/statistik/schnappschuss.sh` (ab Commit `53ce1c1`): `<archiv>/SEASON` (aktuelle Season), je Season `<archiv>/<season>/schnappschuesse/JJJJ-MM-TT.tar.gz` und `<archiv>/<season>/logs/paper/*.log.gz`. Die laufende Season liest ihre älteren Logs aus `<archiv>/<season>/logs/paper`, abgeschlossene Seasons kommen aus ihrem letzten Schnappschuss + ihren Logs |
| `--season <kennung>` | optional, feste Season statt `<archiv>/SEASON` (Standard ohne beides: `weihnachten-2026`) |
| `--allzeit-ohne <a,b>` | Seasons, die nicht in „Allzeit“ zählen; Standard `testlauf` |
| `--sichtbarkeit <datei>` | JSON `{ "ausgeblendet": ["uuid", …] }`; später eine URL des Community-Bots, gleiche Form. Fehlt/unlesbar → letzter Stand, beim Start ohne Stand: niemand sichtbar |
| `--sprache <datei>` | `daten/sprache.json` (aus `sprache.mjs`) |
| `--name`, `--season-name` (sonst aus der Kennung, `weihnachten-2026` → „Weihnachten 2026“, oder `<archiv>/<season>/NAME`), `--port` (Standard 8080, nur `127.0.0.1`) | |

Weltordner = `<instanz>/<level-name>`; Spielerdateien in `players/stats/*.json` (ab 26.x) oder `stats/*.json` (älter) – beides suchen. Format: `{ "stats": { "minecraft:custom": { "minecraft:play_time": 1854, … }, "minecraft:mined": {…} }, "DataVersion": 5023 }` → flach als `"custom:play_time"`, `"mined:stone"`.

Zusätzlich zu den Vanilla-Werten: `server:fortschritte` (erledigte `minecraft:`-Fortschritte ohne `recipes/`, aus `players/advancements/*.json`) und `server:spenden` (Weihnachtsinsel, `plugins/Serverwahl/mission-stand.yml` → `gesamt-spender`). Kategorie `server` = „Server“. Paper 26.x schreibt Systemmeldungen im Log mit `System chat: ` davor, der Parser entfernt das.

## Datenschutz (harte Regel)

Ausgeblendete Spieler verlassen den Dienst **nie**: nicht in `spieler`, nicht in Summen, Bestenlisten, Fakten, Tagen, Sitzungen, `online`, Ereignissen, Kopfbildern. Ereignisse, deren Text den Namen eines ausgeblendeten Spielers enthält (z. B. als Mörder), werden verworfen. `usercache.json` wird nie ausgeliefert. Test: Prüfskript sucht Name und UUID jedes ausgeblendeten Spielers in allen Antworten.

## Seasons

Eine Season = eine Welt; Pascal startet und beendet sie von Hand (`testlauf` ab 21.11.2026, `weihnachten-2026` ab 05.12.2026). In der Oberfläche heißt es „Season“. Zwei Ansichten: **Diese Season** (Standard) und **Allzeit** = laufende Season + alle abgeschlossenen (außer `--allzeit-ohne`), Werte je Spieler summiert (jede Welt beginnt bei null). Der Umschalter erscheint erst, wenn es mehr als eine Season gibt.

## `GET /api/daten?ansicht=season|allzeit`

```json
{
  "server": { "name": "Weihnachtsserver", "season": "weihnachten-2026", "seasonName": "Weihnachten 2026",
              "seasons": [ { "id": "weihnachten-2026", "name": "Weihnachten 2026", "aktuell": true } ],
              "ansicht": "season", "stand": "2026-12-06T18:04:00+01:00", "online": ["uuid"] },
  "gesamt": { "spieler": 9, "spielzeit": 0, "tode": 0, "abgebaut": 0, "strecke": 0, "mobs": 0 },
  "spieler": [ { "uuid": "…", "name": "Steve", "online": true, "erstesMal": "ISO|null", "zuletzt": "ISO|null",
                 "werte": { "custom:play_time": 1854, "mined:stone": 12 } } ],
  "bestenlisten": [ { "id": "dauerzocker", "titel": "Dauerzocker", "unter": "Meiste Spielzeit", "einheit": "zeit",
                      "eintraege": [ { "uuid": "…", "wert": 123 } ] } ],
  "sprueche": { "<uuid>": [ { "liste": "dauerzocker", "text": "…", "rang": 1 } ] },
  "fakten": [ "…" ],
  "tage": [ { "datum": "2026-12-05", "min": { "<uuid>": 95 } } ],
  "sitzungen": [ { "uuid": "…", "start": "ISO", "ende": "ISO|null" } ],
  "ereignisse": [ { "zeit": "ISO", "typ": "join|quit|tod|fortschritt|start|stopp", "uuid": "…|null", "text": "Steve wurde von Zombie getötet" } ],
  "namen": { "custom:play_time": "Gespielte Zeit", "mined:stone": "Stein" },
  "kategorien": { "custom": "Allgemein", "mined": "Abgebaut", "used": "Benutzt", "crafted": "Hergestellt",
                  "broken": "Verbraucht", "picked_up": "Aufgesammelt", "dropped": "Fallen gelassen",
                  "killed": "Getötet", "killed_by": "Getötet von" },
  "einheiten": { "custom:play_time": "zeit", "custom:walk_one_cm": "strecke", "custom:damage_dealt": "schaden" }
}
```

- Werte immer **roh** (Ticks, cm, Zehntel-Schaden); die Seite formatiert. Einheiten: `zeit` = Ticks (20/s), `strecke` = cm, `schaden` = Zehntelpunkte (÷10 = halbe Herzen, ÷20 = Herzen), sonst Anzahl
- `gesamt`: Summen über sichtbare Spieler, Feldnamen = Namen aus `WERT` in `lib/titel.mjs`
- `bestenlisten`: Definitionen aus `lib/titel.mjs`, Top 10, nur Werte > 0, Listen ohne Einträge weglassen
- `sprueche`: je Spieler höchste erreichte Schwelle aus `SPRUECHE`, plus `PLATZ_EINS` für jeden ersten Platz; sortiert: Platz 1 zuerst, dann nach Rang; höchstens 8
- `fakten`: alle `FAKTEN`, die nicht `null` liefern
- `tage`: Spielminuten pro Tag (Europe/Berlin) aus den Sitzungen, alle Tage der Season (bei `allzeit` aller Seasons)
- `sitzungen`: aus den Logs (Join/Quit; Server-Stopp oder Logende ohne Quit beendet offene Sitzungen), letzte 30 Tage
- `ereignisse`: neueste zuerst, höchstens 50; Tode und Fortschritte deutsch über `sprache.json` (englische Logzeile → `death.*`/`advancements.*.title` aus `en_us` → `de_de`)
- `namen`: deutsche Namen nur für Schlüssel, die vorkommen (Item/Block/Entity/Stat aus `sprache.json`)

## `GET /api/live` (Server-Sent Events)

`event: ereignis` (Form wie in `ereignisse`), `event: online` (`{ "online": ["uuid"] }`), `event: daten` (leer – Seite lädt `/api/daten` neu; gesendet, wenn sich Statistikdateien ändern, höchstens alle 30 s). Quelle: `logs/latest.log` mitlesen (Abfrage jede Sekunde, Rotation erkennen).

## `GET /api/kopf/<uuid>.png`

Kopf 8×8 aus dem Skin, hochskaliert. Skins einmal pro Tag von Mojang holen und zwischenspeichern; Besucher laden nie etwas von Dritten. Im Testmodus (`--testmodus`) ein erzeugtes Pixelgesicht aus der UUID (kein Netzzugriff).

## Sonstiges

`GET /` und alle anderen Pfade: Dateien aus `web/` (kein Verzeichnislisting, kein `..`). `GET /api/gesund` → `ok`.

## Hub-Datei (`bestenliste.mjs --ausgabe`)

```json
{ "season": "testlauf", "seasonName": "Generalprobe", "stand": "2026-10-31T13:00:00+01:00",
  "listen": [ { "id": "spielzeit", "titel": "Dauerzocker", "unter": "Spielzeit", "symbol": "⏱️", "hub": true,
                "plaetze": [ { "name": "ITsCALLE96", "wert": 240099, "text": "3 Std. 20 Min." } ] } ] }
```

`listen` hat immer alle Einträge aus `lib/anzeige.mjs` in fester Reihenfolge; `hub: true` = die 8 Hub-Plätze in Platz-Reihenfolge. `plaetze` höchstens 5, leer = noch niemand. `text` ist fertig formatiert (deutsch), `wert` roh. Ausgeblendete Spieler stehen nie drin. Die Datei wird atomar ersetzt (`.tmp` + Umbenennen) und nur neu geschrieben, wenn sich Listen oder Season ändern (`stand` = Zeit dieser Änderung).

## Live-Werte (`plugins/Serverwahl/live/<uuid>.json`, schreibt serverwahl auf dem SMP)

Je Online-Spieler eine Datei, alle ~20 s atomar ersetzt (`.tmp` + Umbenennen), beim Abmelden gelöscht:

```json
{ "uuid": "90e3cb68-f696-4418-a56f-d6482902c9e3", "name": "ITsCALLE96", "zeit": 1793440800000,
  "werte": { "custom:play_time": 240099, "custom:deaths": 3, "custom:mob_kills": 41, "custom:walk_one_cm": 512340,
             "mined:stone": 812, "mined:diamond_ore": 2, "server:fortschritte": 14 } }
```

- `zeit` = Millisekunden seit 1970 beim Schreiben. Älter als 90 s → ignoriert (Spieler weg, Server aus).
- `werte` mit denselben Schlüsseln wie die flachen Statistiken (`<kategorie>:<sache>` ohne `minecraft:`), nur Zahlen ≥ 0. Nötig für die Bestenlisten: `custom:play_time`, `custom:deaths`, `custom:mob_kills`, alle `custom:*_one_cm` (Bewegung; `fall_one_cm` darf mit, zählt nicht), alle `mined:<block>` mit Wert > 0, `server:fortschritte` (abgeschlossene Advancements mit Namensraum `minecraft:`, ohne `minecraft:recipes/`). Weitere Statistiken dürfen mit, werden aber nicht gebraucht.
- Sonst nichts: keine IP, keine Position, kein Inventar. Spenden kommen weiter aus `mission-stand.yml` (wird sofort gespeichert).
- Die Auswertung nimmt je Wert das Maximum aus Statistikdatei und Live-Datei. Dateiname und `uuid` müssen übereinstimmen. Ausgeblendete werden wie immer erst in der Auswertung entfernt.
