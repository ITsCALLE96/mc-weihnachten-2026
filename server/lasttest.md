# Lasttest mit Bots (vor dem Testlauf am 21.11., Plan Task 2 Schritt 7)

Ziel: Vor dem ersten Test mit Menschen sehen, ob der Server 25–30 gleichzeitige Spieler schafft (TPS/MSPT, RAM, CPU, Temperatur). Gemessen wird auch, wie viel
Netzverkehr er dabei erzeugt. Nur Planung, noch nicht durchgeführt.

> **Stand 31.10. (Leitung, Lückenanalyse):** Das Netz läuft seit 30.10. dauerhaft mit Portfreigabe und echten Spielern. Ein Bot-Lasttest mit `online-mode = false`
> ist damit **nur noch auf einer getrennten Kopie** erlaubt (eigene Instanz/Testnetz ohne Freigabe), **nie** auf den Live-Instanzen und nie, solange irgendeine
> Portfreigabe auf VM200 zeigt. Ersatz und Plan:
> - **Realer Lasttest am Testlauf 21.11.** mit den echten Testern: vorher `/spark profiler start --timeout 1800` auf dem SMP, `spark health` vorher/nachher,
>   `docker stats` und Proxmox-RRD mitschreiben; Ansturm beim Beitritt, gemeinsames Spawn-Treffen (10 min), danach Verteilen und Elytra. Links und Werte in
>   `kapazitaet.md` („Gemessen“) und die Administration
> - **Upload-Speedtest abends** (19–22 Uhr, Spielzeit) von VM200 aus, dreimal an verschiedenen Tagen, Ergebnis in `kapazitaet.md` → Upload (Pascal startet den Test)
> - Bot-Test nur, wenn der reale Test Zweifel lässt, dann mit Kopie der Welt auf einer getrennten Instanz ohne Portfreigabe (Abschnitte unten)

## Werkzeug

| | |
|---|---|
| Projekt | **minecraft-stress-test** von PureGero, <https://github.com/PureGero/minecraft-stress-test> |
| Lizenz | **MIT** |
| Stand | Commit `938312de558b2f4047b3c17ddb7327cb483d3112` vom 08.10.2026 („Fix getting kicked on 26.3 servers“), vorher Updates für 26.1/26.2 |
| Was es tut | meldet Offline-Bots an, die fliegen und in einem Radius die Welt erkunden; zur Laufzeit per Konsole steuerbar: `count <n>`, `speed <blöcke/tick>`, `radius <blöcke>` |
| Bauen | Java 17+ und Maven: `git clone …`, `git checkout 938312d`, `mvn` → `target/minecraft-stress-test-26.2-SNAPSHOT-jar-with-dependencies.jar` (Name trotz 26.3-Fix) |

Verworfen: **mineflayer** (MIT, verbreitet), weil seine Protokolldaten erst bis 26.1 reichen. **SoulFire** (AGPL-3.0) ist ein großes Bot-Framework mit Oberfläche,
für einen einmaligen Lasttest zu viel. Bleibt als Ersatz, falls stress-test mit 26.3 doch nicht verbindet.

**Wo die Bots laufen:** auf Pascals PC oder einem Rechner im LAN, **nicht auf VM200**, sonst verfälschen sie die CPU-Messung. 30 Bots brauchen wenig (~1–2 GB RAM).

## Vorbereitung (nur getrennte Kopie, nie live)

Die Bots melden sich **offline** an (ohne Mojang-Konto). Dafür muss die Sicherheit herunter. Das passiert **nur auf einer getrennten Kopie ohne Portfreigabe**
(eigene Instanz bzw. Testnetz, nicht die Live-Instanzen von VM200). Sonst könnte sich jeder von außen als beliebiger Name anmelden, auch als OP.

1. Welt: die Testwelt, **vorgeneriert** mit Chunky (siehe `kapazitaet.md`), Weltgrenze gesetzt
2. Velocity `velocity.toml`: `online-mode = false` (Modern Forwarding bleibt an)
3. Paper: `whitelist off` in der Konsole, `allow-flight=true` in `server.properties` (sonst kickt Paper die fliegenden Bots), Neustart
4. Gamemode der Bots: In `server.properties` vorübergehend `gamemode=creative` + `force-gamemode=true` (laut Werkzeug können die Bots nicht respawnen)
5. Messwerkzeuge auf VM200 bereitlegen: `vnstat` (bzw. `iftop`), `docker stats`. Auf dem Testlab-Host `sensors` (Temperatur) und Proxmox-RRD für CPU

## Ablauf (~75 Minuten)

Bots starten mit `-Dbot.ip=192.168.178.78 -Dbot.port=25577 -Dbot.login.delay.ms=500` (Login über Velocity wie bei echten Spielern).

| Phase | Dauer | Einstellung | Bild |
|---|---|---|---|
| 0 Leerlauf | 5 min | keine Bots | Grundlast messen |
| 1 Ansturm | – | `count 25`, Login alle 0,5 s | Start 27.11.: alle kommen gleichzeitig |
| 2 Spawn | 10 min | `radius 30`, `speed 0.05` | alle 25 stehen am Spawn (ungünstigster Fall für Entity-Updates) |
| 3 Spawn voll | 5 min | `count 30` | Reserve über die geplante Zahl |
| 4 Verteilt | 15 min | `count 25`, `radius 3000`, `speed 0.2` (~4 Blöcke/s, Laufen) | normales Erkunden |
| 5 Elytra | 10 min | `speed 1.0` (~20 Blöcke/s) | viele fliegen gleichzeitig, maximale Chunk-Last |
| 6 Ohne Vorgenerierung (optional) | 5 min | Weltgrenze kurz auf 6.000 erweitern, `radius 6000` | wie schlimm ungenerierte Chunks wären; danach Grenze zurück |
| 7 Ende | 5 min | `count 0` | Server erholt sich? RAM fällt nach der Speicherbereinigung wieder? |

## Messen (je Phase notieren)

| Was | Wie | Zielwert |
|---|---|---|
| TPS / MSPT | `/spark tps` (alle 1–2 min), `/spark profiler start --timeout 600` während Phase 4 und 5, Link in die Doku | 20 TPS, MSPT im Mittel < 40 ms, 95 %-Wert < 50 ms |
| RAM | `/spark health`, `docker stats --no-stream` | Heap nach der Speicherbereinigung < 70 % |
| CPU | Proxmox-RRD VM200 + Host, `/spark health` (CPU-Last Prozess) | Host nicht dauerhaft bei 100 % |
| Temperatur | `sensors` auf dem Testlab-Host | unter ~90 °C, kein Drosseln |
| **Netzverkehr** | `vnstat -l -i <nic>` bzw. `iftop` auf VM200, Senderate (TX) | Der LAN-Verkehr ist das, was der Server in den Upload schicken **würde**. Wert mit dem gemessenen Upload der Leitung vergleichen |

**Was der Test nicht misst:**
- **Den verfügbaren Upload der Leitung:** Die Bots sitzen im LAN. Pascal misst ihn **separat** mit einem Speedtest von VM200 aus (siehe `kapazitaet.md` → „Was Pascal messen muss“). Den gehört in
  dieselbe Auswertung: Senderate aus Phase 2/4/5 + Sprachchat-Schätzung ≤ ~70 % des gemessenen Uploads?
- **Den Sprachchat:** Die Bots sprechen nicht. Er kommt als Schätzung dazu (`kapazitaet.md`: alle am Spawn ~5–10 Mbit/s).
- **Echtes Spielerverhalten** wie Farmen, Redstone oder Abbauen. Dafür ist der Testlauf am 21.11. da.

## Abbruchkriterien (sofort `count 0`)

- MSPT über 100 ms länger als 60 s am Stück oder Paper-Watchdog-Warnung („Can't keep up“ dauerhaft, Thread-Dump im Log)
- Heap nach der Speicherbereinigung über 90 % bzw. `OutOfMemoryError`
- Host-Temperatur über 95 °C oder sichtbares Drosseln
- freier Speicher auf VM200 unter 10 GB
- Absturz einer Instanz → Log sichern, nicht direkt neu starten

## Danach (Pflicht, in dieser Reihenfolge)

1. Bots trennen (`count 0`), Werkzeug beenden
2. Velocity `online-mode = true`, Paper `whitelist on`, `allow-flight` und `gamemode`/`force-gamemode` zurück auf die Sollwerte (`server.properties.md`), Neustart
3. **Prüfen:** fremder Account wird abgewiesen, Pascals Account kommt rein
4. **Bot-Spielerdaten löschen** (nur Testwelt): Bot-UUIDs in `players/`-Ordnern (Daten, `stats`, `advancements`) und in `usercache.json` entfernen.
   Sonst tauchen die Bots in der Season `testlauf` der Statistikseite auf. Einfacher: Testwelt nach dem Lasttest aus dem vorher gemachten Backup zurückspielen
5. Getrennte Kopie löschen (die Live-Instanzen waren nie betroffen)
6. Ergebnisse in `kapazitaet.md` (Abschnitt „Gemessen“) und Administration-Doku eintragen. Bei Bedarf Heap, Sichtweiten oder Weltgrenze anpassen
