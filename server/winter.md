# Winter-Season: echter Schnee per Datapack (Vorbereitung 27.10., nicht auf VM200)

Pascal 27.10.: echter Winter auf dem SMP mit **Kinda Winter Mode**, nach der Season wieder aus. Nur SMP, Hub nicht.

## Datapack

| | |
|---|---|
| Quelle | Modrinth `kinda-winter-mode`, Version „26.3“ (Datapack, 18.09.2026), Datei `kinda winter mode 26.3.zip`, SHA1 `20b268bc4ad37def5bc7aa9b919cf5687fa745e1` |
| Autor, Lizenz | asapacey2, **CC-BY-4.0**: Namensnennung Pflicht (Autor, Link, Lizenz, Hinweis auf Änderung). Steht in `NAMENSNENNUNG.txt` im Pack; zusätzlich in der Ankündigung/Wiki nennen |
| Format | `pack_format` 121 = Datenformat von 26.3 (aus dem Server-Jar geprüft) |
| Inhalt (geprüft gegen Vanilla 26.3) | 45 Biom-Dateien. **Nur** `temperature` auf 0.0, bei 7 Trockenbiomen (Wüste, Savanne, Badlands) `has_precipitation` auf true. Spawns, Features, Farben sonst identisch mit Vanilla 26.3 → Mob-Spawns und Generierung unverändert |
| Unsere Fassung | `server/winter/pack-bauen.sh`: **alle 45 Biome**, auch Ozeane und Fluss (Pascal 28.10.: nirgends Regen; vorher ohne Meer → über dem Wasser Regen neben Schnee, Test 28.10.). Das Zufrieren von Ozeanen/Fluss und Küste (beach, stony_shore) verhindert serverwahl (`eis-sperre`; Stichprobe 28.10.: Eis nur noch an Seen in plains/forest und am Strand → Strand ergänzt). `OHNE_MEER=1` baut die alte Fassung (37 Biome) |

**Wirkungsweise:** Chunks speichern nur die Biom-ID, die Temperatur kommt aus der Registry. Server **und** Client rechnen mit dem kalten Wert
(Registry geht beim Login an den Client): Niederschlag ist überall Schnee, und der Server legt echte Schneeschichten und friert Wasser.
Weltgen-Registries lädt der Server nur beim Start → **An/Aus nur mit Neustart** (`world/datapacks/` + Neustart, nicht `/datapack enable` im Betrieb).

## Was passiert (ehrlich)

Schnee und Eis entstehen nur in **Chunks, die gerade getickt werden**, also in Simulationsreichweite von Spielern (Paper: `simulation-distance`), nicht in der ganzen vorgenerierten Welt.

| Was | Während der Season | Nach dem Deaktivieren |
|---|---|---|
| Schneeschicht (bis **4 Lagen = halber Block**, Gamerule `max_snow_accumulation_height` 4, Pascal 28.10., setzt serverwahl `spielregeln:` bei jedem Start; Vanilla 1) | bei Niederschlag auf allen Oberflächen mit Himmel, nicht auf Farmland, Glas, Treppen u. ä. | **bleibt liegen.** Schnee schmilzt in Vanilla nur durch Blocklicht > 11 (Fackel daneben), nicht durch Sonne oder warmes Biom |
| Eis auf Seen/Teichen (Wasserquelle an der Oberfläche, Himmel, Blocklicht < 10) | friert nach und nach zu, auch ohne Niederschlag | **bleibt.** Schmilzt ebenfalls nur durch Blocklicht |
| Ozeane und Fluss | Schnee statt Regen, **kein Zufrieren**: serverwahl bricht dort die natürliche Eisbildung ab (`BlockFormEvent`, Wasser → Eis, nur in den 8 Biomen). Seen in anderen Biomen frieren weiter zu. Kein Schnee auf dem Wasser (Schnee braucht festen Boden) | – |
| Felder | Farmland bekommt keinen Schnee; offene Bewässerungsrinnen ohne Licht **frieren zu → Farmland trocknet aus, Pflanzen fallen ab** | bleibt so, bis Eis weg |
| Wasser-Farmen, Kelp, Fischen, Mühlen/Rinnen unter freiem Himmel | Oberfläche friert, Strömung und Fischen dort gestoppt | bleibt |
| Boote | auf Eis sehr schnell (eher Spaß) | – |
| Kessel | füllen sich bei Schnee mit Pulverschnee statt Wasser | Pulverschnee bleibt im Kessel |
| Gras/Laub | Farbe nach der kalten Farbkarte (bläulich/türkis), sofort überall | sofort wieder normal |
| Schneegolems | überleben überall | schmelzen wieder in heißen Biomen |
| Mobs | unverändert (Spawns im Pack wie Vanilla) | – |
| Nether/End | unverändert | – |

**Gegenmittel für Spieler:** Licht über Wasser (Fackel/Laterne in ≤ 2–3 Blöcken) oder ein Dach verhindert Eis; bei Farmen ohnehin üblich. Vor der Season ankündigen.

## Neu erzeugtes Gelände: Winter nur durch Schneefall (Pascal 31.10.)

Forever-World ohne Weltgrenze: Was Spieler neu erkunden, soll aussehen wie ohne Datapack. Schnee und Eis nur über das Wetter in getickten Chunks.

**Ursache:** Der Generierungsschritt `minecraft:freeze_top_layer` (letzter Schritt `top_layer_modification`) legt je Spalte Schnee auf die Oberfläche und friert
das oberste Wasser, wenn das Biom dort kalt ist. Mit Temperatur 0 trifft das jede Spalte der 45 Datapack-Biome. Alle anderen Generierungsschritte
(Pulverschnee, Packeis, Eisberge, Schneeblöcke) hängen am Biom selbst, nicht an der Temperatur, und kommen nur in echten Kältebiomen vor.

**Verworfen: Schritt im Datapack streichen.** Minecraft setzt einen Schritt nur, wenn das Biom an der Chunk-Ecke (x0, y 0, z0) ihn enthält
(`placeWithBiomeCheck`). Dort liegt oft ein Höhlenbiom oder ein warmer Nachbar. Gemessen 31.10. (Wegwerfwelt, gleicher Seed, 48 × 48 Blöcke je Biom):
warme Biome sauber, aber echte Kältebiome verlieren ihren Schnee (snowy_plains 1.619 → 0 Schneeschichten, grove 1.922 → 0, snowy_slopes 1.272 → 0).

**Gewählt: serverwahl `winter-generierung`** (`WinterGenerierung.java`, nur SMP). Bei jedem neu erzeugten Chunk (`ChunkLoadEvent.isNewChunk`) je Spalte:
Schneeschicht über dem obersten Block (mit und ohne Laub, dazu die Lagen dazwischen) → Luft, verschneites Gras darunter → normal, Eis an der
Oberfläche → Wasser. Nur wo das Biom eines der 45 Datapack-Biome ist und in Vanilla an dieser Höhe nicht schneit (Vanilla-Temperatur im Plugin,
höhenabhängig wie im Spiel, ohne das Rauschen: windswept/taiga/stony_shore behalten ihren Gipfelschnee ab y 120–200). Echte Kältebiome bleiben unberührt.

| Messung 31.10. (Spalten 2.304 je Biom) | Vanilla | Datapack wie live | Datapack + Plugin |
|---|---|---|---|
| Ebene, Wald, Wüste, Fluss, Ozean, Sumpf, Taiga, Dschungel | 0 Schnee, 0 Eis | Ebene 1.232 Schnee + 922 Eis, Wüste 2.303 Eis, Ozean 2.304 Eis | 0 bis wenige Reste (siehe unten) |
| windswept_hills (Gipfel) | 53 | 2.172 | 71 |
| snowy_plains, snowy_taiga, grove, frozen_river | Vanilla | mehr Schnee | wie Vanilla (± 1 %) |

Kosten: 0,5–0,6 ms je neuem Chunk auf dem Haupt-Thread (Pascals PC). Ein Elytra-Flug erzeugt grob 20–40 Chunks/s → 10–25 ms je Sekunde, also 1–2 % Tick-Zeit
je fliegendem Spieler. Status: `/serverwahl winter`. Wetter-Schnee bleibt unberührt (das Plugin greift nur beim ersten Laden eines neuen Chunks).
Grenzen: Chunks, die vor dem Plugin entstehen (Spawn beim allerersten Weltstart), räumt es nicht. Das betrifft uns nicht, weil die Welt ohne Datapack erzeugt
und vorgeneriert wird. Grasfarbe bleibt winterlich (Registry, gewollt).

## Fernsicht, Karte, Bedrock

- **Voxy/LSS:** Schnee und Eis sind echte Blöcke. LSS merkt Änderungen pro Chunk und schickt sie nach, ein Invalidieren ist dafür nicht nötig. Grasfarbe färbt Voxy beim Zeichnen mit den Biomdaten des Clients (Modpack-Session, ungeprüft). **Nach dem Aufräumen am Season-Ende** einmal `lsslod store invalidate all`, damit alle Clients den sauberen Stand bekommen (Store neu aufbauen ~1,6 GB, über Nacht)
- **Xaero:** Farben werden beim Erfassen in die Kartendateien geschrieben. Während der Season entsteht ein Flickenmuster (alte Kacheln grün, neue bläulich/weiß), nach der Season umgekehrt, bis neu erfasst. Kosmetisch
- **Geyser/Bedrock:** Bedrock rechnet mit eigenen Biomdaten: dort **regnet** es weiter, das Gras bleibt grün. Schnee und Eis sehen sie trotzdem, weil es Blöcke sind
- **Client-Mod „winterzeit“ der Modpack-Session** (nur Darstellung) wird damit überflüssig oder ergänzt nur Bedrock nicht. Abstimmen, damit nicht beides läuft

## Wetter-Rhythmus (in serverwahl, `wetter-rhythmus`)

Vanilla: Regen 0,5–1 Spieltag, dazwischen 0,5–7,5 Tage klar. Unser Vorschlag: **alle 40–60 min für 5–8 min Schnee**. serverwahl setzt bei jedem
Wetterwechsel die Dauer (der Vanilla-Zyklus läuft weiter, `advance_weather` bleibt an), Gewitter bleibt Vanilla. `aktiv: false` = wieder Vanilla.
Bei 25 Spielern und 5–8 min alle ~50 min ist jeder Spielabend 2–3 Mal verschneit. Mehr Schnee heißt auch mehr Schneedecke zum Aufräumen.

## Aufräumen am Season-Ende (Leitung 27.10.: eigenes Kommando bauen, nach dem Go-Live 27.11., fertig vor Season-Ende Anfang Januar)

Reihenfolge: Datapack raus + Neustart (Temperaturen wieder normal), dann aufräumen, dann LSS-Store invalidieren.

| Weg | Wie | Aufwand | Haken |
|---|---|---|---|
| **Eigenes Aufräum-Kommando (Empfehlung)** in serverwahl | geht alle vorhandenen Chunks durch (wie Chunky), schaut je Spalte nur auf die **oberste** Schicht: Schneeschicht → Luft, Eis über Wasser → Wasser, Pulverschnee im Kessel → leer, **nur wo das Biom jetzt warm ist** (`world.getTemperature` > 0,15). Kalte Biome und Höhlen bleiben unberührt | Bauen ~½ Tag + Test im Testnetz. Laufzeit geschätzt 1–2 h auf VM200 für 10k × 10k (wie die Vorgenerierung, nur lesend bis auf Treffer), ohne Spieler | von Spielern gesetzte Schneeschichten und normales Eis in warmen Biomen gehen mit (Eisbahnen meist aus Packeis/Blaueis, die bleiben). Vorher ankündigen |
| WorldEdit `//replace` | Bereiche um Basen markieren, `snow` → `air`, `ice` → `water` mit Biom-Maske | pro Basis Minuten, aber 25 Basen von Hand | ganze Welt mit WorldEdit nicht machbar (zu groß), Fehleranfällig |
| Nichts tun | Schnee bleibt, schmilzt nur an Licht | 0 | dauerhafte Schneeflecken und Eis in warmen Biomen, Farmen bleiben gefroren |

## Test im Testnetz (wenn das SMP frei ist, mit der Spawn-Session abstimmen)

1. SMP gestoppt → `bash server/winter/pack-bauen.sh testnetz/_downloads/winter/kinda-winter-mode-26.3.zip testnetz/smp/world/datapacks`, neues serverwahl-Jar + Config einspielen
2. Start (Pascal), `datapack list` zeigt `file/winter-weihnachten`, `weather rain 600`
3. Prüfen: Schnee in Ebene/Wüste/Savanne, Ozean regnet, Gras bläulich, Wasser friert in Teich ohne Licht, nicht mit Fackel; Felder; Bedrock (Handy) sieht Regen
4. Voxy/LSS: Fernsicht ok, Xaero-Farben ansehen
5. Datapack wieder raus, Neustart → Gras normal, Schnee bleibt (erwartet)
6. Testnetz sauber stoppen
