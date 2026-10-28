# Serverwahl (eigenes Paper-Plugin, seit 24.10.)

Server-Wahl im Hub: Rechtsklick auf eine der 5 Crate-Kisten öffnet ein Kisten-Menü, Klick auf einen Server schickt den Spieler über Velocity dorthin.
Auf dem SMP stellt dasselbe Plugin `/hub` (Alias `/lobby`) bereit. `/server <name>` bringt Velocity selbst mit.

## Warum eigenes Plugin statt DeluxeMenus

- DeluxeMenus kann ein Menü nicht beim Klick auf einen Block öffnen. Dafür bräuchte es ein zweites Plugin (oder Befehlsblöcke mit Druckplatten), und die Kisten ließen sich trotzdem öffnen.
- DeluxeMenus ist für 26.3 nicht als kompatibel markiert und hängt für vieles an PlaceholderAPI.
- Der nötige Umfang ist klein (eine Java-Datei): Kistenposition → Kategorie → Menü → BungeeCord-Nachricht „Connect“. Weniger Teile, die bei einem Update brechen.
- Rückfallweg, falls das Plugin Ärger macht: DeluxeMenus + Befehl `/server smp` über ein Schild.

## Weitere Aufgaben auf dem SMP (seit 26.10., Pascals Test)

- **Portale gesperrt, solange die Dimension zu ist** (`portale-sperren: true`): Ein Netherportal lässt sich nicht anzünden (`PortalCreateEvent`, Grund `FIRE`),
  in Endportalrahmen lassen sich keine Enderaugen einsetzen (kein halber Rahmen, kein verlorenes Auge). Meldung in der Aktionsleiste
  (`text-nether-zu`, `text-end-zu`). Der Zustand kommt aus `plugins/DimensionControl/data.yml` (`closed-dimensions`), `nether open`/`end open` bleiben der einzige Schalter.
  Ops (Recht `dimensioncontrol.bypass.nether`/`.end`) dürfen trotzdem
- **Eröffnungsbefehle** (`eroeffnung.befehle`): Sobald der Merker auftaucht, führt das SMP sie einmal in der Konsole aus (Phase 1 nur bei Phase 0, `time set 0`, `weather clear`),
  damit der Server nicht nachts öffnet. Erledigt-Merker `plugins/Serverwahl/eroeffnet.txt` verhindert eine Wiederholung nach einem Neustart.
  Verschwindet der Merker wieder (Probe, `serverwahl schliessen`), löscht das SMP `eroeffnet.txt`, die nächste Eröffnung läuft dann erneut

## Spark-Insel auf dem SMP (Pascal 27.10.)

**Ender-Kiste statt Portal:** Nach Pascals Insel-Test öffnet eine Ender-Kiste am Spawn das Menü wie im Hub (`kisten:` und Kategorie `spawn` in
`../plugin-konfig/smp/`). Menü: nur der Hub (Pascal 27.10.). Für andere Fälle gibt es `hier: true` (Eintrag angezeigt, nicht anklickbar). Die echte Ender-Kiste geht nicht auf.
Position −1/156/47 (Podestmitte, Spawn & Welt).

**Spawn-Elytra** (`SpawnElytra.java`, ersetzt das frühere Plugin „Spawn Elytra“): In der Zone `spawn-elytra` (Kreis Mitte −1/47, Radius 28, ab y 150 (Standfläche) =
WorldGuard-Oval) wird bereit, wer dort auf dem Boden stand; springt er von der Insel, startet im freien Fall automatisch ein Gleitflug ohne Item (ab `fall-ab: 2.5` Blöcken Fallhöhe, wenn `boden-frei: 4` Blöcke darunter Luft sind; Pascal 28.10., vorher Doppelsprung), `[F]` (Hand tauschen) gibt einmal Schub wie eine Feuerwerksrakete Stufe 3 (`schub-ticks: 45`, Pascal 27.10.). Nach der Landung oder im Wasser ist sie weg,
kein Fallschaden in dem Flug. Nur Überleben/Abenteuer. Pascals Test 27.10.: Gleitflug läuft, GrimAC meldet nichts.

**Portale** (`portale:`, begehbare Quader → Velocity, echte Portalblöcke darin teleportieren nicht) bleiben im Plugin, auf dem SMP derzeit leer.

## Xaero-Welt-ID (27.10.)

Hinter Velocity haben Hub und SMP für Xaero dieselbe Adresse und dieselbe Dimension, Xaero hielt sie für eine Welt (im Hub die SMP-Karte).
`xaero-welt-id` schickt beim Anmelden der Xaero-Kanäle (`xaeroworldmap:main`, `xaerominimap:main`, auch nach jedem Wechsel) Paket 0 mit dieser Zahl
(Format aus Xaero's World Map 1.47.1 / Minimap 26.6.1 gelesen: `LevelMapProperties`, ein `int`). Xaero legt dann pro ID eigene Karten an.
Hub 26120101, SMP 26120501. **Nie ändern:** Eine neue ID heißt für jeden Bestandsspieler eine leere Karte, und LSS schickt schon gelieferte LOD-Daten nicht erneut, die Karte füllt sich dann nur durch Herumlaufen (Pascal 27.10.). Nach einem Wechsel bräuchte jeder Spieler einen Reset seines LSS-Client-Caches. Bereits vermischte Karten liegen im Client unter `xaero/*/Multiplayer_localhost`
(bzw. der echten Adresse) und können einmal gelöscht werden. **Offen:** Client-Test.

## Winterkalender (27.10.)

`kalender:` setzt jede Minute `#tag insel_kalender` auf den Dezembertag (Zeitzone Europe/Berlin): vor dem 1.12. 0, dann 1–24, ab 24.12. bis Silvester 24, im Januar 0.
Die Türchen-Logik liegt im Datapack `insel` (Spawn & Welt). Aus dem Datum statt `naechster_tag`-Zähler, deshalb kein AMP-Zeitplan und keine verpassten Tage.
`fester-tag: <n>` zum Testen. `kalender.klick`: Rechtsklicks auf die Türchen (Interaction-Entities) fängt serverwahl vor WorldGuard ab und ruft `insel:kalender/tuer_<n>` als der Spieler auf (WorldGuard sperrte sie in der Spawn-Region mit Meldung, Pascals Test 27.10.). Ein Zielobjektiv, das (noch) nicht existiert, wird übersprungen. Das Log schreibt „Winterkalender: #tag insel_kalender = N“ nur, wenn sich der Wert ändert; das Scoreboard bleibt in der Welt gespeichert, nach einem Neustart mit gleichem Tag fehlt die Zeile also (kein Fehler).

## Nicknames und Clan-Tags (28.10.)

Nur mit LuckPerms (`softdepend`). `/nick <name>`, `/nick reset`, für Moderation `/nick reset <spieler>` (`serverwahl.nick.andere`). Gespeichert als LuckPerms-Meta `nick`,
damit Hub und SMP denselben Stand haben (gemeinsamer LuckPerms-Ordner). Regeln: 3–16 Zeichen, Buchstaben/Ziffern/`_`/`-`, keine Codes, Sperrliste,
nicht ähnlich zum Namen eines anderen bekannten Spielers oder zum Nick eines anderen (Grundform: klein, `0→o 1/l→i 3→e 4→a 5→s 7→t`).
Clan-Tag = LuckPerms-Präfix (Gruppe `clan-<name>`, `&`-Codes oder MiniMessage). Chat `[Tag] Nick: …`, Tab `[Tag] Nick EchterName`,
über dem Kopf `[Tag] EchterName` per Scoreboard-Team `sw_<hash>` (fremde Teams bleiben unberührt). Plan und Test: `../namen-clans-grief.md`.
Bauen mit LuckPerms: `LUCKPERMS_JAR=<pfad zum LuckPerms-Bukkit-Jar> CP_TRENNER=';' bash build.sh …` (ohne die Variable fehlt die API und der Bau bricht ab).

## Prüfwerkzeug (28.10.)

Nur mit Prism (`softdepend`). Holzspitzhacke in der Haupthand + `prism.lookup`: Linksklick = Verlauf des Blocks, Rechtsklick = Kiste bzw. Stelle davor,
Schleichen = normal abbauen. Abfrage über `PrismPaperApi.lookup` (Services-Manager), Ausgabe auf Deutsch, der Klick wird abgebrochen. Config `pruefwerkzeug:`.
Bauen mit `PRISM_JAR=<pfad zum prism-paper-Jar>` (nur zum Übersetzen).

## Täglich (28.10.)

`taeglich:` führt einmal am Tag ab `uhrzeit` (Fenster 1 h) Konsolenbefehle aus (zurzeit keine; den Purge macht Prism selbst). Merker `plugins/Serverwahl/taeglich.txt`.

## Neujahrsfeuerwerk (28.10.)

`neujahr:` (Hub + SMP): zum `zeitpunkt` (echte Uhr, Standard 01.01.2027 00:00 Europe/Berlin) Countdown 10…1 als Titel, dann Titel „Frohes neues Jahr 2027!“
und `dauer-sekunden` lang Feuerwerk um alle online Spieler (nicht im Nether). `nacht-vorher-sekunden` vorher Nacht (`time 18000`) und klares Wetter,
danach normaler Tageszyklus. Gegen Lag teilen sich Spieler innerhalb `gruppen-radius` die Raketen: je `runde-ticks` je Gruppe `raketen-je-runde`
(Standard 2 je 1,5 s ≈ 160 Raketen je Gruppe in 2 min), Abstand `abstand-min`…`abstand-max` Blöcke, bunt und zufällig. Raketen machen keinen Schaden.
Am Himmel steht „Frohes neues Jahr 2027!“ bzw. „Happy New Year 2027!“ (Client-Sprache): je Spieler ein großes, leuchtendes Text-Display
`himmel-abstand` Blöcke vor ihm und `himmel-hoehe` über ihm, nur für ihn sichtbar, nicht gespeichert (Neustart räumt es weg). Die Nacht kommt als
Zeitraffer über `nacht-uebergang-sekunden` (Test 28.10.: der harte Sprung brachte Dorfbewohner kurz durcheinander). Merker `plugins/Serverwahl/neujahr.txt`: nach einem Neustart im Fenster läuft nur der Rest. Test: `/serverwahl feuerwerk test [sekunden]`, `… stopp`, `… status`.

## Termine (28.10.)

`termine:` ersetzt die AMP-Aufgaben für Phasen: je Termin `name`, `zeitpunkt` (echte Uhr, `zeitzone`), `ankuendigen` (Minuten vorher, Chat),
`countdown` (letzte Sekunden als Titel), `text` (MiniMessage), `befehle` (Konsole), `nachholen` (Standard an: war der Server zum Zeitpunkt aus,
läuft der Termin beim nächsten Start). Jeder Termin läuft einmal, Merker `plugins/Serverwahl/termine.txt`. SMP: Nether 11.12., Phase 3 15.12.
(Vorschlag), End 18.12.; Hub: Start-Ankündigung 27.11. und Rückfall-Eröffnung 10 min später. `/serverwahl termin liste | test <name> [sek] |
zuruecksetzen <name>` (Test führt die Befehle wirklich aus).

## Dorf-Rabatt (28.10.)

`dorf-rabatt:` an den `tage`n (Standard 24.–26.12.) kosten alle Angebote von Dorfbewohnern `prozent` weniger, zusätzlich zu Vanilla-Rabatten.
Über den Sonderpreis beim Öffnen des Handelsfensters (Vanilla setzt ihn beim Schließen zurück) → nichts bleibt gespeichert, kein Neustart nötig.
`/serverwahl rabatt an | aus | auto`.

## Discord-Whitelist (28.10.)

`discord-whitelist:` Einträge aus der gemeinsamen Datei dürfen trotz Vanilla-Whitelist herein, Entfernte werden gekickt. Nur der Hub hat den Endpunkt
für den Community-Bot (`api:`, nur LAN, IP-Sperre + Schlüssel). Spezifikation und Schnittstelle: `../discord-whitelist.md`. `/serverwahl whitelist`.

## Weihnachtsinsel-Mission (28.10.)

`mission:` (nur SMP) liest `plugins/Serverwahl/mission.json` (= `spawn/mission.json` von Spawn & Welt, kopiert von `plugin-konfig/einspielen.sh`):
Kiste, Tafel-Tag, Stufen mit Wünschen (Material-ID oder Item-Tag `#…`), Bau-Funktion und Trank. Ab dem Starttag läuft Stufe 1; Ziel je Wunsch =
Grundmenge × Spieler, die in den letzten `aktive-tage` Tagen da waren, beim Stufenstart festgezurrt. Rechtsklick auf die Kiste (vor WorldGuard) öffnet
ein Spendenfenster; beim Schließen nimmt serverwahl nur Gewünschtes bis zum Ziel an, der Rest geht zurück (sonst vor die Füße). Stufe voll → Bau-Funktion,
sofort nächste Stufe (Pascal: keine Datumsbindung), nach der letzten nach 20 s die Feier. Jeder Spieler bekommt je geschaffter Stufe `traenke-je-stufe`
Tränke (auch Spätere; beim Login, bei vollem Inventar per Kiste oder `/mission abholen`). Tafel: text_display mit dem Tag, Text jede Minute (Stufe,
Fortschritt je Wunsch, Top 3 der Stufe, Top 5 gesamt, Nicks). Stand `plugins/Serverwahl/mission-stand.yml`, nach jeder Spende gespeichert.
Admin: `/serverwahl mission status | stufe <n> | ziel <wunsch> <menge> | weiter | neu-laden | vorbereiten`.

**Test (Testnetz):** `function weihnachtsinsel:vorbereiten` bzw. `/serverwahl mission vorbereiten` → `/serverwahl mission stufe 1` → Kiste anklicken, passende und unpassende
Sachen hineinlegen, schließen (Rest zurück, Tafel zählt) → `ziel minecraft:dirt 1` o. ä. zum schnellen Füllen → Bau läuft, Stufe 2 startet, 3 Tränke im Inventar;
volles Inventar → Hinweis, Kiste anklicken liefert nach; zweites Konto loggt später ein → bekommt alle Tränke.

## Konfiguration

`plugins/Serverwahl/config.yml`, die Dateien dafür liegen in `../plugin-konfig/hub/` und `../plugin-konfig/smp/`. Nach Änderungen `/serverwahl reload` (Op).

| Schlüssel | Bedeutung |
|---|---|
| `ist-hub` | `true` nur auf dem Hub: Kisten-Klicks auswerten, `/hub` teleportiert zum Spawn |
| `hub-server` | Name des Hubs in `velocity.toml` `[servers]` (`hub`) |
| `kisten` | Liste `{welt, x, y, z, kategorie}`. Blockkoordinaten der Kisten |
| `kategorien.<name>` | `titel` (MiniMessage) und `server`: Liste `{name, anzeige, material, beschreibung, sperre}`. `name` = Server in `velocity.toml`. Leere Liste zeigt „Bald verfügbar“ |
| `sperre: eroeffnung` (je Server im Menü, optional) | bis zur Eröffnung Barriere mit `eroeffnung.text` statt Beitritt |
| `eroeffnung.datei` | gemeinsamer Merker „SMP eröffnet“, auf VM200 `/opt/mc-weihnachten/status/smp-offen`. Leer = keine Sperre |
| `eroeffnung.ausloeser` (nur Hub) | `{objective, eintrag, ab}`: erreicht der Punktestand `ab`, legt der Hub die Datei an (einmal pro Sekunde geprüft, nie gelöscht) |
| `eroeffnung.beitritt-sperren` (nur SMP) | `true`: ohne Datei wird jeder Beitritt mit `eroeffnung.text` abgewiesen |

## Eröffnungssperre (Leitung 24.10., Weg mit Spawn & Welt abgestimmt)

Die Sperre sitzt **auf dem SMP selbst**: Solange `/opt/mc-weihnachten/status/smp-offen` fehlt, lehnt es jeden Beitritt ab („Der Weihnachtsserver öffnet am 27.11.“),
egal ob über die Kiste oder `/server smp`. Velocity lässt den Spieler dann im Hub. Ops und `serverwahl.vorab` kommen durch (Tests, Testlauf 21.11.).
Beide Server laufen auf VM200, deshalb reicht eine Datei als Merker. Kein Plugin-Kanal, der einen Spieler auf dem Ziel bräuchte.

- **Auslösen:** Das Hub-Datapack setzt bei der Eröffnung `#offen` in `insel_zustand` auf 1, der Hub legt binnen einer Sekunde die Datei an. Von Hand: `serverwahl oeffnen` (Hub- oder SMP-Konsole)
- **Zurücknehmen** (Proben): `serverwahl schliessen`. Der Hub löscht die Datei nie selbst, eine zurückgesetzte Hub-Welt schließt das SMP also nicht wieder.
  Für eine weitere Probe deshalb Datapack zurücksetzen (`#offen` = 0) **und** `serverwahl schliessen`
- **Stand:** `serverwahl status`
- **VM200 vorbereiten** (Task 2 Schritt 6b): `mkdir -p /opt/mc-weihnachten/status && chown amp:amp /opt/mc-weihnachten/status`
- **`/server` ausblenden:** ohne Rechte-Plugin auf Velocity nicht möglich, wegen der SMP-Sperre aber auch nicht mehr nötig

Neuer Server später (z. B. zweites SMP): Zeile in `velocity.toml` `[servers]`, Eintrag unter der passenden Kategorie, `/serverwahl reload`. Kein neuer Build.

**Kisten-Belegung (Leitung und Spawn & Welt, 24.10.; gleich im Hub, Welt `world`, Hub-Spawn 0/237/0 auf dem Brunnen, Blick Norden (seit 26.10.)):**

| Kiste | Position | Kategorie |
|---|---|---|
| links (vom Platz nach Osten gesehen, bestätigt Spawn & Welt) | 25/236/−9 | `smp`: Weihnachtsserver |
| | 27/236/−5 | `testwelt` (bald) |
| Mitte, Ender-Kiste | 28/236/0 | `alle`: alle Server |
| | 27/236/5 | `minigames` (bald) |
| rechts | 25/236/9 | `bald` |

Die Kisten öffnen sich nicht als Kiste (Klick wird abgefangen). WorldGuard sperrt im Hub `chest-access`, das Menü kommt trotzdem, weil das Plugin auch gesperrte Klicks auswertet.

Befehle: `/hub`, `/lobby` (alle), `/serverwahl reload`, `/serverwahl menue <kategorie>` (Op, zum Testen ohne Kiste).
Rechte: `serverwahl.hub` (alle), `serverwahl.admin` und `serverwahl.vorab` (Ops).

Weitere Befehle (Op/Konsole): `/serverwahl oeffnen`, `/serverwahl schliessen`, `/serverwahl status`.

## Bauen

Braucht ein JDK 25 (`winget install EclipseAdoptium.Temurin.25.JDK`) und einen Paper-26.3-Ordner, der schon einmal gestartet ist (dort liegen paper-api und Adventure unter `libraries/`).
Kein Gradle nötig.

```bash
CP_TRENNER=';' bash server/serverwahl/build.sh testserver/server "/c/Program Files/Eclipse Adoptium/jdk-25.0.4.101-hotspot/bin/javac.exe"
```

Unter Linux `CP_TRENNER` weglassen. Ergebnis: `server/serverwahl/build/serverwahl-1.0.0.jar` (nicht im Repo, `build/` ist ignoriert). Für VM200 lokal bauen und hochladen.

## Getestet

- 24.10., Testnetz (`../../testnetz/`): lädt auf Hub („Hub, 5 Kisten“) und SMP („Backend, 0 Kisten“), Paper 26.3-207, keine Fehler.
- 25.10., Testnetz-SMP ohne Client: `serverwahl status/oeffnen/schliessen` legen den Merker an und löschen ihn, Auslöser über `scoreboard players set #offen insel_zustand 1` legt ihn binnen einer Sekunde an
- 25.10., Testnetz-Hub mit der echten Hub-Welt (Spawn & Welt): Eröffnung aus dem Hub-Datapack legt den Merker an, `serverwahl schliessen` in der Hub-Konsole nimmt ihn zurück
- 26.10., Testnetz: Netherportal per Konsole gezündet bleibt bei geschlossenem Nether aus, nach `nether open` entsteht es (Gegenprobe).
  Eröffnungsbefehle liefen einmal (Phase 0 → 1, Tag, klares Wetter), nach Zurücksetzen erneut, nach SMP-Neustart nicht noch einmal
- Pascal 26.10.: Kiste → SMP, `/hub`, Eröffnung mit Countdown, Nether-Sperre
- **Offen:** Enderauge im Rahmen (braucht Client), Beitritts-Abweisung ohne Op mit Client (Kiste → Menü → Wechsel aufs SMP → `/hub` zurück). Dazu `testnetz/start.cmd`, Client auf `localhost:25577`.
