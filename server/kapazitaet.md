# Kapazität für ~25 Spieler (Stand 2026-10-24)

Nur Planung, nichts davon ist gemessen. Die Werte werden beim Einrichten (Task 2) und im Testlauf am 21.11. geprüft und hier nachgetragen.
Grundlage: Dell Precision 7740 (Testlab-Host), i7-9850H 6 Kerne/12 Threads, 32 GB RAM. VM200 hat 10 vCPUs und 28 GB
(Stand 27.04., Vault: `61 Infrastruktur/Proxmox - Testlab/Changelog - Proxmox.md`).

## 1. RAM

| Teil | Planwert |
|---|---|
**Rahmen (Pascal, 24.10.):** Während des Projekts sind alle anderen AMP-Instanzen aus, **schon ab dem Lasttest und dem Testlauf**. Minecraft darf die VM ausreizen.

| Teil | Planwert |
|---|---|
| Paper `MinecraftWeihnachten01`: Heap (`-Xms` = `-Xmx`) | **12 GB** (AMP-Einstellung „Memory“ 12288 MB), vorher 10 GB |
| Paper: Java-Overhead außerhalb des Heaps (Metaspace, Netzwerk-Puffer, Threads) | ~2 GB → die Instanz belegt real **~14 GB** |
| Velocity `MinecraftProxy01` | 1 GB (512 MB reichen meist, 1 GB lässt Luft für 25 gleichzeitige Logins) |
| Debian, Docker, AMP-Controller, später Stats-Dienst | ~2–3 GB |
| **Summe Minecraft-Betrieb** | **~17–18 GB von 28 GB** |
| **Rest ~10 GB → Linux-Dateicache** | hält Region-Dateien der Welt im RAM, Chunks laden schneller von der Platte |

- **Warum nicht noch mehr Heap?** Meine erste Begründung („mehr Heap = längere Pausen“) war zu grob, das korrigiere ich hiermit. Bei G1 hängt die Pausenlänge vor allem davon ab,
  wie viel lebende Daten aufzuräumen sind, kaum von der Heap-Größe. Ein größerer Heap räumt sogar seltener auf. Was tatsächlich gegen sehr große Heaps spricht:
  - 25 Spieler mit Sichtweite 8 brauchen in Paper erfahrungsgemäß 6–9 GB lebende Daten. Was darüber liegt, bleibt ungenutzt.
  - RAM, den der Heap belegt, fehlt dem Dateicache. Der Cache bringt bei Chunk-Laden und Speichern (Autosave, Backups) spürbar mehr als ein leerer Heap.
  - Bei G1 wachsen mit dem Heap auch die Verwaltungsdaten (Remembered Sets) ein Stück mit.

  12 GB sind deshalb der Mittelweg: genug Reserve für Farmen und Spitzen, und ~10 GB bleiben für den Cache.
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
erst `simulation-distance` 5, dann `view-distance` 7, dann Farmen per spark-Profil ansehen.

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

**Entity-Limits in der Welt** (Villager-Hallen, Hühnerfarmen) sind eine Spielregel, kein Konfigwert → **Für die Leitung**: Farm-Regeln
im Leitfaden/Regeln festhalten (Vorschlag: keine Massen-Tierfarmen über ~50 Tiere pro Ort, Villager-Hallen bis ~30 Villager).
`maxEntityCramming` bleibt beim Standard 24.

### Host

- **CPU-Governor** auf dem Testlab-Host auf `performance` (offener Backlog-Punkt „Beim nächsten Testlab-Start: CPU-Governor prüfen“). Mit `powersave`
  taktet der Laptop-Prozessor zu spät hoch, das kostet direkt MSPT. Prüfe ich in Task 2 Schritt 1, ändern nur nach Rückfrage.
- Laptop gut belüftet aufstellen (Deckel offen oder Ständer). Unter Dauerlast drosselt der 9850H sonst den Takt.

### Chunk-Vorgenerierung

Neue Chunks zu erzeugen ist das Teuerste überhaupt. Mit 25 Spielern, die gleichzeitig mit Elytra in verschiedene Richtungen fliegen, würde das den Server
ausbremsen. Deshalb vorher erzeugen:

- Plugin **Chunky** 1.5.3 (Modrinth `chunky`, für 26.3, siehe `plugins.md`)
- Weltgrenze per `/worldborder` (Vanilla), Vorschlag **Overworld Radius 5.000** (10.000 × 10.000 Blöcke), Nether Radius 1.250 (entspricht der Overworld /8 plus etwas Reserve), End
  nicht vorgenerieren (Inseln, wenig Last)
- Aufwand grob geschätzt: ~390.000 Chunks Overworld → 1–3 h auf dem 9850H (über Nacht, ohne Spieler), Speicher ~3–5 GB. Wird mit dem freien
  Platz aus Task 2 Schritt 1 abgeglichen, ggf. Radius 4.000
- Wann: Testwelt vor dem 14.11. (dabei messen, wie lange es dauert), echte Welt in Task 10 Schritt 4 (Weltwechsel bis 28.11.)
- Befehle (Konsole): `chunky world <welt>` · `chunky radius 5000` · `chunky start`, danach dasselbe für den Nether

### Profiler

**spark ist in Paper eingebaut** (seit 1.21), es gibt keine eigene 26.3-Version auf Modrinth, und es braucht keine. Beim Einrichten mit `/spark` prüfen.
Im Testlauf: `/spark tps`, `/spark health`, bei Rucklern `/spark profiler start --timeout 300` und den Link in die Doku.

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

**Bewertung:** Ab **≥ 40 Mbit/s Upload** passt es mit Reserve. Mit 20 Mbit/s geht es, Elytra-Flüge laden dann aber nur zäh nach. Unter **~10 Mbit/s** wird es
eng → dann `view-distance` 6 und in `paper-global.yml` die Chunk-Senderate pro Spieler begrenzen (`chunk-loading-basic.player-max-chunk-send-rate`, z. B. 40).
Hält Velocity den Upload knapp, verzögern sich zuerst die Chunks. Bewegung und Sprache haben kleine Pakete und leiden zuletzt.

### Was Pascal messen muss, sobald das Netz steht

1. **FritzBox → Internet → Online-Monitor:** synchronisierte Upload-Rate (Leitungskapazität) notieren
2. **Echter Upload vom Server aus** (VM200, abends zur Spielzeit, zwei Läufe), z. B. mit `speedtest` von Ookla oder `iperf3` gegen einen Rechner außerhalb
   (ich bereite den Befehl vor, wenn VM200 erreichbar ist). Wichtig ist der Wert **von VM200 aus**, nicht vom PC, weil dazwischen der neue Router liegt
3. Ob die FritzBox bzw. der neue Router Priorisierung/QoS hat. Minecraft und Sprachchat vor Downloads im Heimnetz priorisieren, falls jemand zu Hause gleichzeitig hochlädt
   (Cloud-Backups, OneDrive)
4. **Im Testlauf 21.11.:** `vnstat -l` oder `iftop` auf VM200 mitlaufen lassen (tatsächlicher Upload pro Spielerzahl), `/spark tps`, MSPT. Ergebnis hier und im Testprotokoll nachtragen

## 4. Velocity und Whitelist

- `show-max-players = 30` (`velocity/velocity.toml.auszug`), Backend `max-players=30`
- Whitelist ~25 Namen. Sie liegt weiter auf dem Backend (Paper `whitelist.json`), Velocity selbst hat keine Whitelist. Wie die Namen hineinkommen (von Hand oder über den
  Community-Bot), entscheidet die Leitung (Statistik-Session, Punkt 6)
- Login-Ansturm beim Start: Velocity prüft jeden Login bei Mojang. 25 Logins in einer Minute sind kein Problem, `login-ratelimit` im Standard (3 s pro IP) lassen.
  Mehrere Spieler hinter derselben IP (z. B. Geschwister) können sich deshalb nur im Abstand von 3 s verbinden, das ist kein Fehler
