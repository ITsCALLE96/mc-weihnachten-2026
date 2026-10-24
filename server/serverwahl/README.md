# Serverwahl (eigenes Paper-Plugin, seit 24.10.)

Server-Wahl im Hub: Rechtsklick auf eine der 5 Crate-Kisten öffnet ein Kisten-Menü, Klick auf einen Server schickt den Spieler über Velocity dorthin.
Auf dem SMP stellt dasselbe Plugin `/hub` (Alias `/lobby`) bereit. `/server <name>` bringt Velocity selbst mit.

## Warum eigenes Plugin statt DeluxeMenus

- DeluxeMenus kann ein Menü nicht beim Klick auf einen Block öffnen. Dafür bräuchte es ein zweites Plugin (oder Befehlsblöcke mit Druckplatten), und die Kisten ließen sich trotzdem öffnen.
- DeluxeMenus ist für 26.3 nicht als kompatibel markiert und hängt für vieles an PlaceholderAPI.
- Der nötige Umfang ist klein (eine Java-Datei): Kistenposition → Kategorie → Menü → BungeeCord-Nachricht „Connect“. Weniger Teile, die bei einem Update brechen.
- Rückfallweg, falls das Plugin Ärger macht: DeluxeMenus + Befehl `/server smp` über ein Schild.

## Konfiguration

`plugins/Serverwahl/config.yml`, die Dateien dafür liegen in `../plugin-konfig/hub/` und `../plugin-konfig/smp/`. Nach Änderungen `/serverwahl reload` (Op).

| Schlüssel | Bedeutung |
|---|---|
| `ist-hub` | `true` nur auf dem Hub: Kisten-Klicks auswerten, `/hub` teleportiert zum Spawn |
| `hub-server` | Name des Hubs in `velocity.toml` `[servers]` (`hub`) |
| `kisten` | Liste `{welt, x, y, z, kategorie}`. Blockkoordinaten der Kisten |
| `kategorien.<name>` | `titel` (MiniMessage) und `server`: Liste `{name, anzeige, material, beschreibung, sperre}`. `name` = Server in `velocity.toml`. Leere Liste zeigt „Bald verfügbar“ |
| `sperre` (je Server, optional) | `{objective, eintrag, ab, text}`: gesperrt, solange der Punktestand von `eintrag` im Haupt-Scoreboard unter `ab` liegt. Dann Barriere mit `text` statt Beitritt |

**Sperre bis zur Eröffnung (abgestimmt mit Spawn & Welt, 24.10.):** Das SMP steht im Hub-Menü mit `sperre: {objective: insel_zustand, eintrag: "#offen", ab: 1}`.
Das Hub-Datapack setzt `#offen` bei der Eröffnung am 05.12. auf 1, ab dann ist die Kiste offen. Fehlt das Objective, gilt das als 0 (gesperrt).
Ops und Spieler mit `serverwahl.vorab` kommen trotzdem durch (Testlauf 21.11., Aufbau).

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

**Lücke:** `/server smp` von Velocity umgeht die Sperre. Ohne Rechte-Plugin auf dem Proxy lässt sich das nicht abschalten (Für die Leitung im Plan).

## Bauen

Braucht ein JDK 25 (`winget install EclipseAdoptium.Temurin.25.JDK`) und einen Paper-26.3-Ordner, der schon einmal gestartet ist (dort liegen paper-api und Adventure unter `libraries/`).
Kein Gradle nötig.

```bash
CP_TRENNER=';' bash server/serverwahl/build.sh testserver/server "/c/Program Files/Eclipse Adoptium/jdk-25.0.4.101-hotspot/bin/javac.exe"
```

Unter Linux `CP_TRENNER` weglassen. Ergebnis: `server/serverwahl/build/serverwahl-1.0.0.jar` (nicht im Repo, `build/` ist ignoriert). Für VM200 lokal bauen und hochladen.

## Getestet

- 24.10., Testnetz (`../../testnetz/`): lädt auf Hub („Hub, 5 Kisten“) und SMP („Backend, 0 Kisten“), Paper 26.3-207, keine Fehler.
- **Offen:** Klick-Test mit echtem Client (Kiste → Menü → Wechsel aufs SMP → `/hub` zurück). Dazu `testnetz/start.cmd`, Client auf `localhost:25577`.
