# Clans in Selbstverwaltung über Discord – API-Vertrag (Server-Seite, 01.11., von der Bot-Session abgenickt mit 4 Ergänzungen)

Sichtbare Texte (Meldungen im Spiel, Bot, Log) nennen es **„Clan/Team“** (Pascal 01.11.); API-Pfade (`/clans`) und LuckPerms-Gruppen (`clan-<name>`) bleiben.

Pascal 01.11. (über die Leitung): Jeder gründet seinen Clan selbst über Discord und ist damit Leiter. Beitritt nur auf Einladung des Leiters, der
Eingeladene bestätigt per Knopf. Der Leiter wirft raus und gibt die Leitung ab, jeder darf austreten, ein leerer Clan löst sich auf. Kürzel bis
10 Zeichen A–Z/0–9, eine feste Minecraft-Farbe, höchstens ein Clan pro Spieler, Wechsel jederzeit. Discord nur zur Verwaltung (keine Rollen,
keine Kanäle). Pascal bekommt bei jeder Gründung eine Info mit Lösch-Knopf (Bot). Gründung ab ca. Mitte November.

**Fertig**, wenn Pascal in der Generalprobe einen Clan gründet, ein Zweitkonto einlädt, das Kürzel bei beiden in Tab, Chat und über dem Kopf
erscheint und nach dem Austritt wieder verschwindet.

## Aufbau

- **Endpunkt:** derselbe kleine HTTP-Server wie die Discord-Whitelist (`server/discord-whitelist.md`): serverwahl im **Hub**, `192.168.178.78:8765`,
  nur LAN. **Gleicher Zugang:** Quell-IP aus `api.erlaubt` (LXC 202) **und** `Authorization: Bearer <schluessel>` (derselbe Schlüssel), gleiche
  Grenzen (10 Anfragen/s, Rumpf höchstens 64 KB), JSON in UTF-8. Kein neuer Port, keine neue Firewall-Regel.
- **Speicher = LuckPerms** (gemeinsamer YAML-Speicher von Hub und SMP, `watch-files`; das SMP übernimmt Änderungen nach wenigen Sekunden).
  Je Clan eine Gruppe `clan-<kürzel klein>` mit Präfix `&<farbcode>[KÜRZEL]` (Priorität 100) wie bisher; Name, Farbe, Leiter, Gründungszeit
  und offene Einladungen als Meta an der Gruppe. Mitglied = Spieler mit der Gruppe als Parent. Es gibt keine zweite Datei, die auseinanderlaufen kann.
- **Anzeige:** `Namen` (serverwahl) zeigt den Präfix in Tab, Chat und über dem Kopf. Ändert sich die Mitgliedschaft eines Spielers, der online ist,
  aktualisiert der Server die Anzeige sofort (Hub und SMP).
- **Wer ist wer:** Der Bot schickt immer **Discord-IDs**. Der Server ordnet sie über die Whitelist-Datei dem Minecraft-Konto zu (Discord-ID → UUID).
  Wer nicht über Discord auf der Whitelist steht, kann keinen Clan gründen, eingeladen werden oder beitreten (`404 konto`).
- **Rechte prüft der Server:** Wer handelt, steht im Feld `von` (Discord-ID). Nur der Leiter darf einladen, rauswerfen und die Leitung abgeben.
  Austreten darf jeder für sich. Der Bot muss `von` aus dem Discord-Ereignis nehmen (wer den Knopf gedrückt hat), nie aus einer Eingabe.
- **Eine Sperre für alles:** Alle Clan-Anfragen laufen im Plugin nacheinander (gemeinsame Sperre), damit sich Beitritt/Rauswurf, zwei Gründungen
  mit gleicher Grundform oder Leitung abgeben/Austritt nicht überschneiden.
- **Prüfungen liegen auf dem Server** (Format, doppelt, Sperrliste, Beleidigungen, Nachahmung) und gelten bei `POST /clans` und `GET /clans/pruefen` gleich.

## Regeln

| Was | Regel | Fehler |
|---|---|---|
| Kürzel | `^[A-Z0-9]{2,10}$` (der Bot darf klein schicken, der Server macht groß) | `400 kuerzel` |
| Kürzel doppelt | gleiche Grundform wie ein bestehender Clan (siehe Grundform unten, z. B. `N0RD` = `NORD`, `L1L` = `III`) | `409 kuerzel-vergeben` |
| Name | 3–32 Zeichen, Buchstaben (auch ÄÖÜß), Ziffern, Leerzeichen, `-`, `_`, `'` | `400 name` |
| Farbe | genau einer dieser Werte: `dark_red`, `red`, `gold`, `yellow`, `dark_green`, `green`, `aqua`, `dark_aqua`, `dark_blue`, `blue`, `light_purple`, `dark_purple`, `white`, `gray` (schwarz und dunkelgrau sind schlecht lesbar) | `400 farbe` |
| Sperrliste | Kürzel oder Name trifft ein gesperrtes Wort aus `clans.sperrliste` (Grundform; Wörter unter 5 Zeichen nur als ganzes Wort, längere auch als Teil, wie bei `/nick`), z. B. ADMIN, MOD, MODS, SERVER, OWNER, STAFF, TEAM, SUPPORT, HELPER, CONSOLE, OP, DEV, GM, C96, CREW, plus die Sperrliste der Nicks | `422 gesperrt` mit `"grund": "sperrliste"` |
| Beleidigungen | Kürzel oder Name enthält einen Eintrag aus `clans.beleidigungen` (Grundform, eigene Datei `plugins/Serverwahl/clans-woerter.txt`, nicht im Repo) | `422 gesperrt`, `"grund": "beleidigung"` |
| Nachahmung | Kürzel hat dieselbe Grundform wie der Name oder Nick eines bekannten Spielers (wie bei `/nick`) | `422 gesperrt`, `"grund": "nachahmung"` |
| Ein Clan je Spieler | wer gründet, darf in keinem Clan sein (erst austreten) | `409 im-clan` mit `"clan": "<KÜRZEL>"` |
| Einladung | gilt 7 Tage, je Clan und Spieler eine; eine erneute Einladung ersetzt die alte ohne Fehler. Sich selbst einladen geht nicht | `400 selbst` |
| Beitritt | nur mit gültiger Einladung. Ist der Spieler in einem anderen Clan, wechselt er (verlässt den alten, siehe Austritt) | `403 keine-einladung` |
| Austritt des Leiters | Bleiben Mitglieder, übernimmt das am längsten dabei befindliche Mitglied die Leitung. Ist niemand mehr da, löst sich der Clan auf | – |
| Leerer Clan | wird sofort aufgelöst (Gruppe gelöscht) | – |

Grundform = wie bei der Nick-Prüfung (`Namen.grundform`): klein, `ä→a ö→o ü→u ß→ss`, Akzente weg, `0→o`, `1 l ! |→i`, `3→e`, `4 @→a`, `5 $→s`, `7→t`, sonst nur Buchstaben und Ziffern.

## Endpunkte

Alle Antworten JSON. Fehler immer `{"fehler": "<code>"}`, wo nötig mit `"grund"`/`"clan"`. Ein Clan sieht in Antworten so aus:

```json
{ "kuerzel": "NORD", "name": "Die Nordmänner", "farbe": "dark_aqua", "gegruendet": "2026-11-15T18:02:11Z",
  "leiter":     { "discord": "123456789012345678", "name": "ITsCALLE96", "uuid": "90e3cb68-…" },
  "mitglieder": [ { "discord": "123456789012345678", "name": "ITsCALLE96", "uuid": "90e3cb68-…", "seit": "2026-11-15T18:02:11Z" },
                  { "discord": null, "name": "Tester1", "uuid": "…", "seit": "…" } ],
  "einladungen": [ { "discord": "234567890123456789", "name": "cruiserDE", "bis": "2026-11-22T18:05:00Z" } ] }
```
`discord` ist `null` bei Mitgliedern ohne Discord-Eintrag (von Hand per LuckPerms zugeordnet). Mitglieder sind nach `seit` sortiert.

| Methode, Pfad | Rumpf | Antwort |
|---|---|---|
| `GET /clans` | – | `200 {"clans": [ <Clan>, … ]}` |
| `GET /clans/<KÜRZEL>` | – | `200 <Clan>` · `404 clan` |
| `GET /clans/von/<discordId>` | – | `200 {"clan": <Clan> \| null, "einladungen": [ {"kuerzel","name","farbe","bis"} ]}` – eigener Clan und offene Einladungen, für das persönliche Menü im Bot · `404 konto` |
| `GET /clans/pruefen?kuerzel=…&name=…&farbe=…` | – | `200 {"ok": true, "kuerzel": "NORD"}` oder dieselben Fehler wie `POST /clans` (ohne `im-clan`). Ändert nichts, für sofortige Rückmeldung im Formular |
| `POST /clans` | `{"von": "<discordId>", "kuerzel": "NORD", "name": "Die Nordmänner", "farbe": "dark_aqua"}` | `201 <Clan>` – Gründer ist Leiter und erstes Mitglied · `400 kuerzel\|name\|farbe` · `409 kuerzel-vergeben` · `409 im-clan` · `422 gesperrt` · `404 konto` |
| `POST /clans/<KÜRZEL>/einladungen` | `{"von": "<Leiter>", "an": "<discordId>"}` | `200 {"an": {"discord","name"}, "bis": "…", "kuerzel", "name", "farbe"}` (Clan-Daten für die Einladungsnachricht) · `400 selbst` · `403 kein-leiter` · `404 clan` · `404 konto` (der Eingeladene) · `409 schon-mitglied` |
| `DELETE /clans/<KÜRZEL>/einladungen/<discordId>?von=<id>` | – | `200 {}` – Einladung zurückziehen (Leiter) oder ablehnen (der Eingeladene selbst). Idempotent · `403 kein-recht` · `404 clan` |
| `POST /clans/<KÜRZEL>/mitglieder` | `{"von": "<discordId>"}` (der Eingeladene selbst) | `200 {"clan": <Clan>, "verlassen": "<altes KÜRZEL>" \| null, "aufgeloest": "<altes KÜRZEL>" \| null}` · `403 keine-einladung` (fehlt oder abgelaufen) · `404 clan` · `404 konto` |
| `DELETE /clans/<KÜRZEL>/mitglieder/<discordId>?von=<id>` | – | `von` = Ziel: **Austritt**; `von` = Leiter: **Rauswurf** (sich selbst rauswerfen = Austritt). `200 {"clan": <Clan> \| null, "neuer_leiter": "<discordId>" \| null, "aufgeloest": true/false}` · `403 kein-recht` · `404 clan` · `404 kein-mitglied` |
| `PUT /clans/<KÜRZEL>/leiter` | `{"von": "<Leiter>", "an": "<discordId eines Mitglieds>"}` | `200 <Clan>` · `403 kein-leiter` · `404 kein-mitglied` |
| `DELETE /clans/<KÜRZEL>?admin=1&von=<discordId>` | – | `200 {"aufgeloest": "<KÜRZEL>", "mitglieder": [Namen]}` – Pascals Lösch-Knopf (Moderation). Der Bot ruft das nur für Pascal auf und prüft das selbst; `von` steht nur im Server-Log („NORD gelöscht von …“), ohne Rechteprüfung. Löst den Clan sofort auf, alle verlieren den Tag · `404 clan` |

Zugangsfehler wie bei der Whitelist: `403 ip`, `401 schluessel`, `429 zu viele`, `404 pfad`, `400 json`. Fehlt `von` oder ist es keine Discord-ID → `400 von`.

## Für die Bot-Session (Ablauf, Vorschlag)

- Bedienung über Panels und Knöpfe, keine Slash-Befehle. Timeout nach `POST /clans` → `GET /clans/von/<id>` zeigt, ob die Gründung durch ist.
  Farbe als Auswahl der 14 Werte. Name/Farbe nachträglich ändern (`PATCH`) gibt es vorerst nicht.
- Einstieg ohne Slash-Befehle: eine feste Nachricht mit Knopf „Clan“. Der Bot fragt `GET /clans/von/<id>` und zeigt dem Spieler ephemer passend:
  „Clan gründen“ (Modal: Kürzel, Name, Farbe als Auswahl), offene Einladungen mit „Beitreten“/„Ablehnen“, im eigenen Clan „Austreten“, als Leiter
  „Einladen“ (Mitgliederauswahl in Discord), „Rauswerfen“, „Leitung abgeben“.
- **Einladung:** Der Bot schickt dem Eingeladenen eine DM (oder ephemer beim nächsten Klick) mit „Beitreten“ → `POST /clans/<K>/mitglieder` mit `von` =
  wer den Knopf drückt. Ohne gültige Einladung lehnt der Server ab, auch wenn jemand den Knopf weiterleitet.
- **Gründung:** nach `201` eine Info an Pascal (DM oder Mod-Kanal) mit Kürzel, Name, Farbe, Leiter und Knopf „Löschen“ → `DELETE /clans/<K>?admin=1`.
- Der Bot speichert nichts Eigenes über Clans; der Server ist die Quelle. Fehlercodes in verständliche Sätze übersetzen (`kuerzel-vergeben`
  → „Das Kürzel ist schon vergeben“, `gesperrt`/`beleidigung` → „Dieses Kürzel ist nicht erlaubt“ ohne Details, …).

## Betrieb

- Jede Änderung ins Server-Log des Hubs („Clan/Team: +NORD von ITsCALLE96“, „Clan/Team: cruiserDE → NORD“, …).
- Backup: LuckPerms liegt in `/srv/ampdata/mc-netzwerk-geteilt/luckperms/` (Task 9, wie Nicks).
- Bestehende Clans von Hand (`lp …`, z. B. `clan-test`) erscheinen in der Liste mit `leiter: null`; Pascal kann sie weiter von Hand pflegen.
- Fällt jemand von der Whitelist, bleibt er Mitglied (Bauten, Tag bleiben, er kommt nur nicht mehr herein). Pascal kann ihn per `lp` entfernen.
- Einspielen: mit dem nächsten angekündigten Neustart (serverwahl-Jar im Hub und SMP), zusammen mit dem Tode-Nachtrag beim Beitritt.
- Test: Testnetz mit `curl` gegen `127.0.0.1:8765` (alle Endpunkte und Fehlercodes), dann das Fertig-Kriterium in der Generalprobe.
