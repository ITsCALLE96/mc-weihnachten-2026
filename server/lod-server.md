# Server-LOD (Fernsicht vom Server) – Vorbereitung, nicht eingerichtet

Wunsch Pascal 27.10.: wie bei CraftAttack die Welt (10.000 × 10.000 per Chunky) vorgenerieren und Spielern weit entfernte Landschaft **vom Server** liefern,
statt dass jeder Client sie selbst erst beim Hinlaufen sieht. Stand: Recherche (Modrinth-, Hangar-, GitLab-, GitHub-APIs, 27.10.) und Konfig-Entwurf,
**nichts installiert, nichts getestet** (der Lade-Test im Testnetz steht unten als Befehl für Pascal). [?] = nicht belegt.

> **Entschieden 27.10. (Leitung/Pascal, Vorbild CraftAttack 14): LSS 0.20.0 + Voxy.** Kein DH-Nightly-Test. Client: Voxy 0.2.20-beta + LSS-Client 0.20.0,
> DH und Bobby raus (Modpack-Session, Testprofil `weihnachten-voxy-test`). Die Client-Mod ist optional, wer will, schaltet sie ab.
> **Andere Spieler auf große Entfernung sehen** gehört schon zu LSS („Far Players“, `far_players.*`, Standard an, bis 2.048 Blöcke): Spieler jenseits der Sichtweite
> erscheinen als Modelle mit Namen und Ausrüstung in der LOD-Welt, Skins nur bis ~80 Blöcke. Clientseitig in LSS die Option „Extend Far Player Draw Range“ einschalten,
> sonst enden sie an der Fern-Ebene. Kein Zusatz-Plugin nötig (Alternative SeeU hat eine einschränkende Lizenz). Kosten: zwei Positionsupdates pro Sekunde je
> fernem Spieler, bei 25 Spielern vernachlässigbar [?].

## Optionen für Paper 26.3

| Lösung | Client-Mod | Stand 27.10. | Lizenz | Bewertung |
|---|---|---|---|---|
| **DH Support** (Jckf, offizielles Plugin des Distant-Horizons-Teams) | Distant Horizons (im Pack: 3.3.4, aktiv) | letztes Release **0.14.0 (09.07.)**, nur bis Paper 26.2 markiert. develop-Branch 0.15.0-SNAPSHOT sehr aktiv (u. a. „DH network protocol version 16“, 05.10.; Nightly vom 26.10.) | GPL-3.0 | passt zum Pack, aber **kein 26.3-Release**. Laut Modpack-Session meldet 0.14.0 bei DH 3.3.x „Server is outdated“. Ob der Nightly mit DH 3.3.4 spricht, klärt nur ein Test |
| **LOD Server Support (LSS)** / Voxy Server Side (gleiche Mod) | **Voxy** (im Pack 0.2.20-beta, deaktiviert) **+ LSS-Client-Mod** `lod-server-support-fabric-0.20.0+26.3` | **0.20.0 (24.10.) mit Paper-26.3-Build**, `lod-server-support-paper-0.20.0+26.3.jar`, SHA1 `e9f2f0e3027079e747363968c80b400d494cf789` | MIT | einzige fertige 26.3-Lösung. Inoffiziell (nicht vom Voxy-Autor), sehr aktiv, Release erst 3 Tage alt. **DH und Voxy dürfen im Client nicht gleichzeitig aktiv sein** |
| DH als Fabric-Server-Mod, VoxyServer (Fabric) | – | nur Fabric/NeoForge | – | nicht nutzbar, wir laufen auf Paper |

**CraftAttack 14:** Nicht belegbar, keine Quelle zur Server-LOD-Lösung gefunden (für CA13 nur ein Modpack mit DH, Voxy, Bobby). Dass CA14 LSS/Voxy nutzt, ist eine Vermutung.

## Empfehlung

1. **Zuerst den DH-Support-Nightly mit DH 3.3.4 prüfen** (Lade-Test unten, dann Pascal mit Client). Klappt es, bleibt das Pack wie es ist
   und wir wechseln beim 0.15.0-Release vom Nightly auf das Release. Vorteil: keine Pack-Änderung, offizielles Plugin
2. **Sonst LSS 0.20.0 + Voxy:** Die Modpack-Session schaltet Voxy und die LSS-Client-Mod ein und DH aus (erst nach OK der Leitung)
3. In beiden Fällen: **Generierung durch das Plugin aus**, LODs nur aus den per Chunky vorgenerierten Chunks. Sonst erzeugt der Server beim Fernsehen
   ständig neue Chunks, das ist laut LSS-Doku „mit Abstand das Teuerste“
4. **Nur auf dem SMP.** Der Hub ist klein, dort reicht die normale Sichtweite

Entscheidung DH-Nightly vs. LSS/Voxy: Leitung mit Pascal und Modpack-Session.

## Bandbreite und Last (Schätzung, nicht gemessen)

- Upload laut Vertrag 40 Mbit/s, Messung steht aus (`kapazitaet.md` → Upload). Das normale Spiel braucht ~10–15 Mbit/s Dauerlast, Spitzen 25–30 (`kapazitaet.md`)
- LOD-Daten kommen **zusätzlich**, vor allem beim ersten Beitritt (der Client lädt die ganze Fernsicht) und beim Reisen in neue Gegenden.
  Konkrete MB pro Spieler sind in keiner Doku angegeben [?]
- **Deshalb hart begrenzen und nach der Messung anpassen:** global höchstens ~1/3 des gemessenen Uploads für LOD, pro Spieler klein, damit 25 gleichzeitige Erstbeitritte (Starttag!) das Spiel nicht ausbremsen
- LSS kann das (`network.bandwidth`, zählt unkomprimiert, die echte Last ist kleiner). **DH Support hat keine echte Bandbreitenbremse** (`max_data_transfer_speed` laut Doku „currently unsupported“), nur die Zahl gleichzeitiger Anfragen pro Spieler und insgesamt
- **CPU/RAM:** Mit abgeschalteter Generierung liest das Plugin nur fertige Chunks und baut LODs. Für 25 Spieler keine belastbaren Zahlen [?]. DH Support empfiehlt 1–2 Threads je 4 GB RAM. Im Lasttest (`lasttest.md`) mit messen
- **Platte:** Der LOD-Speicher (DH: `data.sqlite`, LSS: `lod_store`) kann so groß wie die Welt werden. Bei 10.000 × 10.000 vorgeneriert mehrere zehn GB [?], in `vorgenerierung.md` → Platz einrechnen. Vor dem Backup pausieren (`/dhs pause`) bzw. LSS-Store mitsichern oder ausnehmen (er lässt sich neu aufbauen)

## Konfig-Entwurf

~~**DH Support**~~ (verworfen 27.10., nur zur Referenz; `plugins/DistantHorizonsSupport/config.yml`, Schlüssel laut develop-Wiki, beim Einrichten gegen die erzeugte Datei prüfen):

```yaml
distant_generation_enabled: true
generate_new_chunks: false          # nur vorgenerierte Chunks (Chunky), keine Generierung durchs Plugin
render_distance: 256                # Radius in Chunks (= 4.096 Blöcke), Welt ist ±5.000
client_lod_request_concurrency_limit: 4    # Standard 20, Bremse pro Spieler
server_lod_request_concurrency_limit: 40   # Standard 0 = unbegrenzt, Bremse gesamt
real_time_updates_enabled: true
real_time_update_radius: 64
scheduler_threads: 3                # 12 GB Heap → 1–2 je 4 GB
server_key: "weihnachten-smp"       # hinter Velocity: Client hält Hub/SMP-Caches getrennt
```

Vor dem Start einmal `/dhs pregen start world 0 0 5000` (baut die LODs nach Chunky vor, nicht am Starttag).

**LSS** (gilt): `plugins/LodServerSupport/lss-server-config.yaml` (vom Plugin erzeugt, Schema `config_version: 1`). Unsere Abweichungen stehen in
`server/lod/lss-werte.txt` und kommen mit `python -I server/lod/konfig-setzen.py <konfig> server/lod/lss-werte.txt` in die erzeugte Datei
(Kommentare bleiben, bricht ab, falls sich ein Schlüssel ändert). Geprüft gegen die Standardkonfig im Jar 0.20.0:

| Schlüssel | Standard | wir | Warum |
|---|---|---|---|
| `privacy.request_no_map_ingestion` | false | **true** | sonst füllt der Client Xaeros Karten (auch Höhlen) aus LOD-Daten und hebelt Fair Play aus. Clients ab 0.19.0 halten sich daran (Bitte, keine Sperre). Ausnahme pro Spieler: Recht `lss.map_ingestion` |
| `generation.enabled` | true | **false** | nur die per Chunky vorgenerierte Welt, darüber hinaus nichts |
| `network.bandwidth.per_player_mib_per_second` | 25 | **0.5** | unkomprimiert gezählt, real weniger |
| `network.bandwidth.global_mib_per_second` | 75 | **2** | ≈ 16 Mbit/s unkomprimiert für alle zusammen; nach Upload-Messung und Test anpassen |
| `lod.distance.by_dimension` Overworld / Nether / End | 512 / 64 / 512 | **320 / 64 / 128** | Welt ±5.000 Blöcke ≈ 313 Chunks |
| `far_players.mode`, `far_players.distance.max_blocks` | on, 2048 | on, 2048 | Spieler auf Entfernung sehen |

Unverändert und gut so: `network.ping_backstop`, `send_pacing`, `yield_to_vanilla` (Spielverkehr hat Vorrang), `privacy.xray.mode: auto` (folgt Paper Anti-Xray, Erze tauchen in LODs nicht auf),
`storage.lod_store.enabled: true` (Größe unbegrenzt, Platz einplanen). Der LOD-Radius gilt um jeden Spieler; eine Grenze um den Spawn gibt es nicht, die Weltgrenze plus
abgeschaltete Generierung sorgen dafür, dass außerhalb nichts kommt.

## Test im Testnetz (Plan Leitung 27.10.)

Pascal führt `bash testnetz/lod-test.sh einrichten` aus (fremde Jars, in der Session blockiert): LSS, GrimAC und Chunky ins Testnetz-SMP, Konfig einspielen,
2.000 × 2.000 um 0/0 vorgenerieren, stoppen. Dann `testnetz/start.cmd`, Client mit Testprofil `weihnachten-voxy-test` auf `localhost:25577`, Hub → SMP. Prüfen:

1. Fernsicht: Landschaft bis zum Rand der 2.000 × 2.000 sichtbar, dahinter nichts
2. Höhlenkarte in Xaero (Overworld) weiter gesperrt, Fernbereich nicht in die Karte übernommen
3. Zweiter Spieler ≥ 500 Blöcke entfernt sichtbar (mit „Extend Far Player Draw Range“)
4. Bandbreite: `python -I testnetz/rcon.py smp "lsslod stats"` während des ersten Ladens, dazu Task-Manager → Netzwerk (Loopback zählt nicht immer, dann Werte aus `lsslod stats`)
5. Hub → SMP → Hub → SMP: LODs bleiben bzw. kommen wieder (Velocity)
6. GrimAC: keine Alerts bei Mouse Tweaks, Client Sort, Freecam, Elytra
7. Danach `bash testnetz/lod-test.sh entfernen` oder für 10.000 × 10.000 vormerken

Erst nach diesem Test: 10.000 × 10.000 auf VM200 (Chunky Radius 5.000, `vorgenerierung.md`).

## Velocity

Beide nutzen eigene Plugin-Kanäle, Velocity reicht die normalerweise durch. Ein eigenes Proxy-Plugin nennt keiner von beiden [?]. Testen: Hub → SMP → Hub, LODs danach noch da.

## Für Bedrock

Bedrock-Spieler (Geyser, `bedrock.md`) bekommen keine Server-LODs, nur die normale Sichtweite.
