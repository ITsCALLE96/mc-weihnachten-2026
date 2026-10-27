# Kapazität für ~25 Spieler (Stand 2026-10-24)

Nur Planung, nichts davon ist gemessen. Die Werte werden beim Einrichten (Task 2) und im Testlauf am 21.11. geprüft und hier nachgetragen.
Grundlage: Dell Precision 7740 (Testlab-Host), i7-9850H 6 Kerne/12 Threads, 32 GB RAM. VM200 hat 10 vCPUs und 28 GB
(Stand 27.04., Vault: `61 Infrastruktur/Proxmox - Testlab/Changelog - Proxmox.md`).

## 1. RAM

**Rahmen (Pascal, 24.10.):** Während des Projekts sind alle anderen AMP-Instanzen aus, **schon ab dem Lasttest und dem Testlauf**. Minecraft darf die VM ausreizen.

| Teil | Planwert |
|---|---|
| Paper `MinecraftWeihnachten01`: Heap (`-Xms` = `-Xmx`) | **12 GB** (AMP-Einstellung „Memory“ 12288 MB), vorher 10 GB |
| Paper: Java-Overhead außerhalb des Heaps (Metaspace, Netzwerk-Puffer, Threads) | ~2 GB → die Instanz belegt real **~14 GB** |
| Paper `MinecraftHub01` (Hub, seit 24.10.): Heap 2 GB (AMP „Memory“ 2048 MB) | real **~2,7 GB** (Overhead ~0,7 GB). Kleine fertige Welt, Abenteuermodus, keine Mobs, Sichtweite 6 |
| Velocity `MinecraftProxy01` | 1 GB (512 MB reichen meist, 1 GB lässt Luft für 25 gleichzeitige Logins) |
| Debian, Docker, AMP-Controller, später Stats-Dienst | ~2–3 GB |
| **Summe Minecraft-Betrieb** | **~20–21 GB von 28 GB** |
| **Rest ~7 GB → Linux-Dateicache** | hält Region-Dateien der Welt im RAM, Chunks laden schneller von der Platte |

**Hub (Kurswechsel 24.10.):** Das SMP behält 12 GB, der Hub geht vom Dateicache ab (10 → ~7 GB). Die Hub-Welt ist klein und liegt nach dem ersten Besuch
ohnehin im Speicher, deshalb reichen 2 GB. Lokal im Testnetz liefen Hub und leeres SMP mit je 2 GB ohne Auffälligkeiten (24.10., ohne Spieler).
Wird der Cache im Lasttest zum Engpass (Chunk-Laden langsam, `iowait` hoch), zuerst den Hub auf 1,5 GB senken, dann das SMP auf 11 GB.

- **Warum nicht noch mehr Heap?** Meine erste Begründung („mehr Heap = längere Pausen“) war zu grob, das korrigiere ich hiermit. Bei G1 hängt die Pausenlänge vor allem davon ab,
  wie viel lebende Daten aufzuräumen sind, kaum von der Heap-Größe. Ein größerer Heap räumt sogar seltener auf. Was tatsächlich gegen sehr große Heaps spricht:
  - 25 Spieler mit Sichtweite 8 brauchen in Paper erfahrungsgemäß 6–9 GB lebende Daten. Was darüber liegt, bleibt ungenutzt.
  - RAM, den der Heap belegt, fehlt dem Dateicache. Der Cache bringt bei Chunk-Laden und Speichern (Autosave, Backups) spürbar mehr als ein leerer Heap.
  - Bei G1 wachsen mit dem Heap auch die Verwaltungsdaten (Remembered Sets) ein Stück mit.

  12 GB sind deshalb der Mittelweg: genug Reserve für Farmen und Spitzen, und ~7 GB bleiben für den Cache (mit Hub, vorher ~10 GB).
- **Mehr als 28 GB** kann VM200 nicht bekommen, der Host selbst braucht 3–4 GB.
- **JVM-Flags:** In AMP die „Aikar-Flags“ einschalten, und zwar die Variante **für Heaps ab 12 GB** (`G1NewSizePercent=40`, `G1MaxNewSizePercent=50`, `G1HeapRegionSize=16M`,
  `G1ReservePercent=15`, `InitiatingHeapOccupancyPercent=20`). Wie AMP die Variante auswählt, prüfe ich beim Anlegen, notfalls als eigene Java-Argumente.
- **Prüfen im Lasttest** (`lasttest.md`) und im Testlauf: `/spark health` → Heap nach der Speicherbereinigung dauerhaft unter ~70 %, Pausen unter ~50 ms.
  Liegt der Heap danach bei unter 40 %, kann er auf 10 GB zurück (mehr Cache). Liegt er über 70 %, auf 14 GB.

## 2. CPU

Minecraft rechnet die Welt im Wesentlichen auf **einem** Kern. Entscheidend ist der Einzelkern-Takt des Laptop-Prozessors (Boost 4,2 GHz,
unter Dauerlast thermisch begrenzt). Die übrigen Kerne nimmt Paper für Chunk-Erzeugung, Licht, Netzwerk und Kompression.

### Sichtweiten (`server.properties`)

| Wert | Empfehlung | Warum |
|---|---|---|
| `view-distance` | **8** | Chunks, die geschickt werden. Bobby und Distant Horizons im Pack zeigen auf dem Client weiter, ohne den Server zu belasten |
| `simulation-distance` | **6** | Chunks, in denen Mobs, Pflanzen und Redstone laufen. Kostet viel CPU, 6 reicht für normale Farmen |
| `max-players` | **30** | Paper-Standard ist 20, damit kämen nicht alle 25 hinein |
| `network-compression-threshold` | **-1** | Kompression macht Velocity für die Spieler. Zwischen Velocity und Paper auf derselben VM kostet sie nur CPU |

Stufenplan, falls die MSPT im Testlauf über ~40 ms steigen (Ziel: unter 50 ms, sonst sinkt der Server unter 20 TPS):
erst `simulation-distance` 5, dann `view-distance` 7, dann per spark-Profil ansehen, was die Last macht.

### Paper-Einstellungen (`config/paper-world-defaults.yml`, zusätzlich zu Anti-Xray)

Nah an Vanilla bleiben (CraftAttack-Gefühl). Nur Einstellungen, die Spieler praktisch nicht bemerken:

```yaml
chunks:
  entity-per-chunk-save-limit:     # verhindert Chunks mit tausenden Pfeilen/Erfahrungskugeln
    arrow: 16
    experience_orb: 16
    snowball: 8
    ender_pearl: 8
    egg: 8
    fireball: 8
    small_fireball: 8
    trident: 16
environment:
  optimize-explosions: true        # gleiches Ergebnis, schneller berechnet (TNT, Creeper)
entities:
  spawning:
    per-player-mob-spawns: true    # Standard; Mob-Limit pro Spieler statt global, fair bei 25 Leuten
misc:
  redstone-implementation: VANILLA # bewusst Vanilla: ALTERNATE_CURRENT ist schneller, kann aber Farmen mit Reihenfolge-Tricks brechen
```

Paper-Standards behalten: `tick-rates`, `max-entity-collisions`, Hopper-Einstellungen. Bei echten Engpässen erst messen (spark), dann gezielt ändern.
Die Schlüsselnamen prüfe ich gegen die `paper-world-defaults.yml`, die Paper 26.3 beim ersten Start anlegt.

**Keine Farm-Regeln** (Pascal, 24.10.): Jeder spielt, wie er will. `maxEntityCramming` bleibt beim Standard 24.

**Nur als Option, falls die Last später zum Problem wird** (erst spark-Profil, dann gezielt). Paper-seitige Grenzen nah an Vanilla, die nicht wie Regeln wirken:
- `entities.spawning.spawn-limits` bzw. `bukkit.yml` `spawn-limits` leicht senken (weniger natürlich spawnende Mobs, Farmen merken es kaum)
- `chunks.entity-per-chunk-save-limit` um weitere Typen ergänzen (z. B. `item`)
- Spigot `entity-activation-range` etwas kleiner (weit entfernte Tiere/Villager rechnen seltener)
- `hopper.cooldown-when-full`/`hopper.disable-move-event` (Paper-Standard prüfen) gegen Hopper-Ketten
- Erst als letzter Schritt `misc.redstone-implementation: ALTERNATE_CURRENT`

### Host

- **CPU-Governor** auf dem Testlab-Host auf `performance` (offener Backlog-Punkt „Beim nächsten Testlab-Start: CPU-Governor prüfen“). Mit `powersave`
  taktet der Laptop-Prozessor zu spät hoch, das kostet direkt MSPT. Prüfe ich in Task 2 Schritt 1, ändern nur nach Rückfrage.
- Laptop gut belüftet aufstellen (Deckel offen oder Ständer). Unter Dauerlast drosselt der 9850H sonst den Takt.

### Chunk-Vorgenerierung

**Pflicht vor dem Start** (Pascal, 24.10.). Ablauf, Dauer, Platz und Weltgrenze: `vorgenerierung.md`.
**Gemessen 27.10. (Testnetz):** 10.000 × 10.000 = 393.129 Chunks in 19:37 min, **Welt 3,8 GB** (Nether r = 1.250 ~0,3 GB, End r = 2.000 ~0,2 GB dazu, geschätzt), plus **LSS-LOD-Store `<welt>/lss-lod/`: 1,6 GB gemessen** (Momentaufnahme nach ~1 GB Auslieferung an einen Client; wächst mit den gelieferten Bereichen, für 10k × 10k vermutlich höchstens in dieser Größenordnung, Reserve ~2–3 GB). Overworld also ~5,5 GB, wächst im Spiel weiter.
Auf VM200 geschätzt **~40–60 min** Overworld + ~10 min Nether/End.

### Profiler

spark ist in Paper eingebaut. Befehle, Rechte und Web-Ansicht: `spark.md`.

## 3. Upload

Der Server schickt jedem Spieler Chunks, Bewegungen anderer Spieler und Entities sowie Sprachchat. Der **Upload** des Anschlusses
(DSL über die FritzBox) ist deshalb der kritische Wert, nicht der Download. Ein Hinweis darauf: Im Backlog steht, dass externe Palworld-Spieler über Tailscale laggen, während lokale
Spieler keine Probleme haben.

Schätzung (Velocity-Kompression an, Sichtweite 8, Simple Voice Chat mit Opus ~24 kbit/s plus UDP-Overhead ≈ 40 kbit/s pro Strom):

| Situation | pro Spieler | 25 Spieler |
|---|---|---|
| Beitritt/Teleport: 17 × 17 = 289 Chunks à ~10 KB | ~3 MB einmalig | 75 MB, wenn alle gleichzeitig kommen (Start 05.12.) |
| Stehen/Bauen (Blöcke, Entities in der Nähe) | 0,1–0,3 Mbit/s | 3–8 Mbit/s |
| Laufen/Sprinten (~6 neue Chunks/s) | ~0,5 Mbit/s | – |
| Elytra-Flug (~30 neue Chunks/s) | ~2,5 Mbit/s | 5 Flieger gleichzeitig ≈ 12 Mbit/s |
| Sprachchat: jeder Hörer bekommt jeden Sprecher in Reichweite | 40 kbit/s je Sprecher | verteilt: ~1–2 Mbit/s |

**Normalfall Abend** (verteilt, ein paar fliegen, ein paar reden): **~10–20 Mbit/s**.

**Ungünstigster Fall: alle 25 am Spawn.** Chunks fallen hier kaum an, weil alle dieselben Chunks schon haben. Dafür sieht jeder jeden:
- Bewegungen: 25 × 24 Paare × ~0,6 KB/s ≈ **3 Mbit/s**
- Sprachchat: 5 sprechen gleichzeitig, alle hören alle → 25 × 5 × 40 kbit/s ≈ **5 Mbit/s**, bei 10 Sprechern ≈ **10 Mbit/s**
- Dazu Beitritts-Spitzen: Kommen alle zum Start gleichzeitig, dauert das Laden der 75 MB bei 20 Mbit/s freiem Upload ~30 s
- **Summe Dauerlast: ~10–15 Mbit/s, Spitzen 25–30 Mbit/s**
- **Server-LOD (entschieden 27.10.: LSS + Voxy, `lod-server.md`):** zusätzlich LOD-Daten, vor allem beim ersten Beitritt und auf Reisen. Menge unbekannt,
  deshalb hart deckeln: global höchstens ~1/3 des gemessenen Uploads (LSS: 2 MiB/s unkomprimiert gesamt, 0.5 pro Spieler, bleibt bis zur Upload-Messung).
  **10k-Test 27.10.:** Ein Client bekam über 1 GB LOD-Daten. Bei 2 MiB/s für alle dauert die volle Fernsicht am Starttag für 25 Spieler zusammen ~3,5 h. DH Support kann nur Anfragen begrenzen,
  keine Bandbreite. Am Starttag treten alle gleichzeitig bei, das ist der Engpass. Im Lasttest mit LOD-Plugin messen
- **Bedrock (entschieden 27.10., `bedrock.md`):** Geyser läuft im Velocity-Prozess, Velocity deshalb mit **1,5 statt 1 GB** (RAM-Summe ~20,5–21,5 GB). Bedrock-Spieler brauchen ungefähr gleich viel Upload wie Java-Spieler

**Leitung: 40 Mbit/s Upload laut Vertrag** (Pascal, 24.10., **noch nicht gemessen**). Real kommen bei DSL nach Overhead meist ~90 % an, also ~36 Mbit/s.
Für Spiele sollte die Dauerlast höchstens ~70 % davon belegen, sonst steigen Ping und Paketverluste, sobald zu Hause jemand anderes hochlädt. **Budget ≈ 25 Mbit/s.**

| Fall | Schätzung | Anteil an ~36 Mbit/s | Bewertung |
|---|---|---|---|
| Normaler Abend | 10–20 Mbit/s | 30–55 % | passt |
| Alle am Spawn, Dauerlast | 10–15 Mbit/s | 30–40 % | passt |
| Spitze (Spawn + viele Sprecher, Ansturm, viele Flieger) | 25–30 Mbit/s | 70–85 % | kurz knapp, Chunks laden dann langsamer nach |

**Ergebnis: Sichtweite 8 bleibt vorläufig.** Die Spitzen sind kurz, und wenn es eng wird, verzögern sich zuerst die Chunks. Bewegung und Sprache haben kleine Pakete und leiden zuletzt.
Endgültig entscheidet die Messung von VM200 aus.
Hinweis: Externe Palworld-Spieler laggen laut Backlog, lokale nicht. Das kann auf einen knappen oder schwankenden Upload hindeuten (oder auf Tailscale-Relay) → die Messung klärt das.

**Grenzwerte für die Sichtweite** (Maßstab: niedrigster gemessener Upload zur Hauptspielzeit):

| gemessener Upload | Maßnahme |
|---|---|
| ≥ 30 Mbit/s | `view-distance` 8 |
| 20–30 Mbit/s | `view-distance` 7 (~22 % weniger Chunk-Daten: 15² statt 17² Chunks) |
| 12–20 Mbit/s | `view-distance` 6 und Chunk-Senderate pro Spieler begrenzen (`paper-global.yml` `chunk-loading-basic.player-max-chunk-send-rate`, z. B. 40) |
| < 12 Mbit/s | Problem für 25 Spieler → Leitung/Pascal (Leitung prüfen, Router-QoS, Spielerzahl) |

Zusätzlich gilt: Liegt im Lasttest die Senderate von VM200 in Phase 4/5 (plus ~5 Mbit/s Sprachchat-Schätzung) über 70 % des gemessenen Uploads, eine Stufe herunter.

### Live-Messung von VM200 aus (Plan Task 3 Schritt 6, nach dem Netzumbau)

Gemessen wird **direkt auf VM200**, nicht am PC, weil dazwischen der neue Router liegt und genau dieser Weg zählt.

- **Werkzeug:** `librespeed-cli` (LGPL-3.0, eine Datei, misst gegen öffentliche LibreSpeed-Server). Alternative: Debians Paket `speedtest-cli` (Apache-2.0).
  Ookla `speedtest` nur, wenn Pascal dessen Lizenz selbst annimmt
- **Wann:** an zwei verschiedenen Tagen je 3× tagsüber und 3× zur Hauptspielzeit (19–22 Uhr), dazu **einmal während des Bot-Lasttests** (Phase 4 oder 5, `lasttest.md`).
  Damit sieht man, ob Server-Last und Messung sich gegenseitig stören
- **Notieren:** Upload, Download, Ping, Jitter, Server und Uhrzeit, Tabelle hier unter „Gemessen“. Außerdem die synchronisierte Upload-Rate im FritzBox-Online-Monitor
- **Router:** prüfen, ob der neue Router bzw. die FritzBox Priorisierung (QoS) hat. Minecraft (TCP 25565) und Sprachchat (UDP 24454) vor Cloud-Backups/OneDrive priorisieren
- **Im Testlauf 21.11.:** `vnstat -l` oder `iftop` auf VM200 mitlaufen lassen (echte Senderate pro Spielerzahl), dazu `/spark tps`. Ergebnis hier und im Testprotokoll

## Gemessen

*(noch nichts. Hier kommen die Werte aus Speedtest, Lasttest, Vorgenerierung und Testlauf hin.)*

## 4. Velocity und Whitelist

- `show-max-players = 30` (`velocity/velocity.toml.auszug`), Backend `max-players=30`
- Whitelist ~25 Namen. Sie liegt weiter auf dem Backend (Paper `whitelist.json`), Velocity selbst hat keine Whitelist. Wie die Namen hineinkommen (von Hand oder über den
  Community-Bot), entscheidet die Leitung (Statistik-Session, Punkt 6)
- Login-Ansturm beim Start: Velocity prüft jeden Login bei Mojang. 25 Logins in einer Minute sind kein Problem, `login-ratelimit` im Standard (3 s pro IP) lassen.
  Mehrere Spieler hinter derselben IP (z. B. Geschwister) können sich deshalb nur im Abstand von 3 s verbinden, das ist kein Fehler
