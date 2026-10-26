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

Die Sperre sitzt **auf dem SMP selbst**: Solange `/opt/mc-weihnachten/status/smp-offen` fehlt, lehnt es jeden Beitritt ab („Der Weihnachtsserver öffnet am 05.12.“),
egal ob über die Kiste oder `/server smp`. Velocity lässt den Spieler dann im Hub. Ops und `serverwahl.vorab` kommen durch (Tests, Testlauf 21.11.).
Beide Server laufen auf VM200, deshalb reicht eine Datei als Merker. Kein Plugin-Kanal, der einen Spieler auf dem Ziel bräuchte.

- **Auslösen:** Das Hub-Datapack setzt bei der Eröffnung `#offen` in `insel_zustand` auf 1, der Hub legt binnen einer Sekunde die Datei an. Von Hand: `serverwahl oeffnen` (Hub- oder SMP-Konsole)
- **Zurücknehmen** (Proben): `serverwahl schliessen`. Der Hub löscht die Datei nie selbst, eine zurückgesetzte Hub-Welt schließt das SMP also nicht wieder.
  Für eine weitere Probe deshalb Datapack zurücksetzen (`#offen` = 0) **und** `serverwahl schliessen`
- **Stand:** `serverwahl status`
- **VM200 vorbereiten** (Task 2 Schritt 6b): `mkdir -p /opt/mc-weihnachten/status && chown amp:amp /opt/mc-weihnachten/status`
- **`/server` ausblenden:** ohne Rechte-Plugin auf Velocity nicht möglich, wegen der SMP-Sperre aber auch nicht mehr nötig

Neuer Server später (z. B. zweites SMP): Zeile in `velocity.toml` `[servers]`, Eintrag unter der passenden Kategorie, `/serverwahl reload`. Kein neuer Build.

**Kisten-Belegung (Leitung und Spawn & Welt, 24.10.; gleich im Hub, Welt `world`, Hub-Spawn 0/235/16 Blick Norden):**

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
