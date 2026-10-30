# Mods – was wofür, wie wichtig, erlaubt oder nicht

Das Pack ist **freiwillig**. Wer es nicht nutzt, spielt mit normalem Minecraft genauso mit. Auf dem Server sind nur Mods ohne Spielvorteil erlaubt.

Grundlage für die Bewertung ist die Community-Zusammenstellung **„CastCrafter CA14 Mische“ 1.1.0** (Modrinth `cc-ca14`, VincPlyz, Stand 19.10.2026, Minecraft 26.3, 94 Einträge). Sie enthält alle Mods, Shader und Resourcepacks, die CastCrafter in CraftAttack 14 nutzt. Jede Mod daraus ist hier einzeln bewertet, auch die, die wir nicht übernehmen. Dazu kommen die Mods aus demonjoeTVs Video „Top 30 Quality of Life Minecraft Mods“ (eigener Abschnitt unten) und die meistgeladenen Mods auf Modrinth, die noch fehlten.

Aktuelle Dateien und Versionen unseres Packs: `STAND.md` (wird von `node tools/modpack.mjs` geschrieben).

## Inhalt von `modpack-v3` (30.10.2026)

Gleiche Mod-Versionen wie `modpack-v2` (fest gebaut mit `node tools/modpack.mjs --fest <altes .mrpack>`), nur diese Änderungen (Entscheidung Pascal 30.10., gilt als Standard für alle):
- **Continuity wirkt jetzt:** `overrides/options.txt` schaltet die eingebauten Packs „continuity:default“ und „continuity:glass_pane_culling_fix“ ein (verbundenes Glas). Vorher lagen sie bei, waren aber aus.
- **Redstone Tweaks raus**: lag bei, war aber nie eingeschaltet – keine toten Inhalte.
- **Extreme Sound Muffler an** (von `optional` nach `mods`): einzelne Geräusche leiser stellen, für alle standardmäßig aktiv.
- **Bleiben aus:** AmbientSounds (+ CreativeCore), Sound Physics Remastered, Presence Footsteps, Cool Rain, uku's Armor HUD (+ ukulib), Flashback, Do a Barrel Roll (+ cicada-lib), Nvidium.
- **Shader:** Complementary Reimagined und Unbound samt Euphoria Patches bleiben im Pack, standardmäßig aus – jeder wählt selbst.

Geprüft auf weitere Inhalte, die erst ein eingebautes Pack oder eine Option brauchen: Außer Continuity bringt nur Client Sort ein eingebautes Pack mit („Dark Mode“ für seine Knöpfe) – Geschmackssache, bleibt aus. Shader sind absichtlich aus (Anleitung: Videoeinstellungen → Shader-Pakete), Gamma Utils wirkt über die Tasten H/G. Alle übrigen Mods sind ab Werk aktiv.

## Inhalt von `modpack-v2` (23.10.2026)

**Maßgeblich ist diese Liste und `mods.json`.** Die Stufen in den Tabellen weiter unten sind die ursprüngliche Bewertung. Was tatsächlich im Pack ist, hat Pascal am 23.10. Mod für Mod festgelegt. Stand des Baus (27.10.): 104 Dateien plus die eigenen Mods Block-Marker und Quest-Details – 13 Dateien deaktiviert (optionale Mods samt Bibliotheken, die nur sie brauchen) (`.jar.disabled`, im Launcher per Schalter einschaltbar), alle übrigen aktiv, dazu Shader Complementary Reimagined und Unbound und Resourcepack Redstone Tweaks (in v3 raus).

**Aktiv** (`mods` in `mods.json`):
- Leistung: Sodium, Sodium Extra, Lithium, Entity Culling, FerriteCore, ImmediatelyFast, Better Block Entities, SmoothTextureFix, More Culling, BadOptimizations, Dynamic FPS, quick pack, Language Reload, Debugify
- Optik: Iris, Iris & Oculus Search, Complementary Reimagined (+ Unbound), Euphoria Patches, Continuity, ETF, EMF, 3D Skin Layers, LambDynamicLights, Particle Rain, Make Bubbles Pop, Simple Fog Control, Boat Item View, Not Enough Animations, Falling Leaves, Visuality
- Kamera: Zoomify, Cinematic Zoom (beide standardmäßig auf C – Anleitung sagt, eine umlegen), Ji AFK Cinematic
- Sicht: Voxy + LOD Server Support (Fernsicht bis 320 Chunks, Landschaft und entfernte Spieler kommen vom Server, füllt die Xaero-Karte), Gamma Utils (Fullbright), Freecam
- Karte und Anzeigen: Xaero's Minimap, Xaero's World Map, AppleSkin, Shulker Box Tooltip, Light Overlay, Status Effect Bars, Locator Heads, Peek, Entity Selection Outlines, BetterF3, Better Statistics Screen, Better Advancements (großes Fortschrittsfenster, Taste L – Grundlage fürs Questbuch), Jade, Enchantment Descriptions, JEI
- Chat: Here 'n' There, Chat Heads, No Chat Reports, More Chat History
- Bedienung: Mod Menu, Mouse Tweaks, More Mouse Tweaks, Client Sort, ClickThrough Plus, Controlling, Multi Key Bindings, Bundles Beyond, Scribble, Armor Hider, Packed Packs, Borderless Fullscreen
- Bauen: Armor Poser (Server-Plugin nötig)
- Sprache: Simple Voice Chat mit Animationen und Gruppennamen (Server-Plugin + UDP 24454, Plan Task 4 Schritt 9)
- Menü: FancyMenu (Weihnachts-Hauptmenü folgt)
- Eigene Mods: **Block-Marker** und **Quest-Details** (Seitenleiste fürs Questbuch) (`lokal` in `mods.json`, liegen nicht auf Modrinth; die Jars kommen beim Bau aus den Nachbar-Repos `block-marker` und `quest-details` als `overrides/mods/` ins Pack)
- Nur im Einzelspieler wirksam (brauchen Mod auf dem Server, auf Paper ohne Wirkung): Easy Shulker Boxes, Bookshelf Inspector

**Aktiv, sobald es eine Version für 26.3 gibt** (`aktivSobaldVerfuegbar`): RP Renames

**Deaktiviert dabei** (`optional`): Geräusch-Mods Cool Rain, Sound Physics Remastered, AmbientSounds, Presence Footsteps (Pascal, 26.10.: im Pack aus, wer will, schaltet sie ein; Extreme Sound Muffler seit v3 an), Nvidium (nur Nvidia), voxy (nicht zusammen mit Distant Horizons), uku's Armor HUD, Flashback, Do a Barrel Roll

**Raus (24.10., Absturz mit FancyMenu):** Remove Reloading Screen

**Raus (26.10., Pascal):** Litematica – ganz aus dem Pack, auf dem Server nicht erlaubt (Gruppenabstimmung damit erledigt)

**Raus (Pascal, 24.10.):** MiniHUD – sieht nicht gut aus und doppelt sich mit Xaero's Minimap und BetterF3; Pickup Notifications – braucht die Mod auf dem Server

**Raus (Pascal, 23.10.):** Time & Weather Changer, CalcMod, Big Sign Writer, Cut Through, Screenshot Viewer, VeinMiner, VeinMiner Hotkey, Reach Behind, Vehicle Upgrade, Crops Love Rain sowie alle ➖

Die Spalte „v1“ in den Tabellen zeigt den alten Stand `modpack-v1`.

## Stufen

| Zeichen | Stufe | Bedeutung |
|---|---|---|
| 🟢 | Kern | ohne sie ergibt das Pack keinen Sinn |
| 🔵 | Empfohlen | spürbarer Gewinn an Leistung oder Komfort, ohne Nachteil |
| ⚪ | Optional | Geschmackssache, meist Optik |
| 🟠 | Braucht Server-Teil | funktioniert nur, wenn auf dem Server ein Plugin oder Datapack läuft – eigene Entscheidung |
| 🔴 | Nicht erlaubt | verschafft einen Spielvorteil |
| ➖ | Unnötig | für unseren Server ohne Nutzen |
| 📚 | Bibliothek | Grundlage anderer Mods, wird automatisch mitinstalliert |

„v1“ = heute in unserem Pack `modpack-v1`.

## Leistung

| Mod | Wofür | Stufe | v1 | Anmerkung |
|---|---|---|---|---|
| [Sodium](https://modrinth.com/mod/sodium) | ersetzt die Grafik-Engine, deutlich mehr FPS | 🟢 | ✅ | Grundlage für Iris und viele Addons |
| [Lithium](https://modrinth.com/mod/lithium) | schnellere Spiellogik | 🔵 | ✅ | ändert keine Regeln |
| [Entity Culling](https://modrinth.com/mod/entityculling) | zeichnet verdeckte Objekte nicht | 🔵 | ✅ | |
| [FerriteCore](https://modrinth.com/mod/ferrite-core) | weniger Arbeitsspeicher | 🔵 | | |
| [ImmediatelyFast](https://modrinth.com/mod/immediatelyfast) | schnelleres Zeichnen von HUD, Text, Schildern | 🔵 | | |
| [Better Block Entities](https://modrinth.com/mod/better-block-entities) | schnellere Truhen, Schilder, Betten | 🔵 | | |
| [SmoothTextureFix](https://modrinth.com/mod/smoothtexturefix) | behebt unscharfe Texturen seit 1.21.11 | 🔵 | | |
| [Sodium Extra](https://modrinth.com/mod/sodium-extra) | zusätzliche Grafik-Schalter (Partikel, Animationen, FPS-Anzeige) | ⚪ | | |
| [Reese's Sodium Options](https://modrinth.com/mod/reeses-sodium-options) | übersichtlicheres Grafik-Menü | ⚪ | | **raus (27.10.)**: versteckt die Einstellungsseiten von Voxy und LSS im Sodium-Menü |
| [Remove Reloading Screen](https://modrinth.com/mod/rrls) | Resourcepacks laden im Hintergrund | ⚪ | | angenehm beim Server-Beitritt mit unserem Pack; **raus (24.10.)**: Hauptmenü zeichnet dann vor dem Laden von FancyMenus Shadern → Absturz beim Start |
| [quick pack](https://modrinth.com/mod/quick-pack) | lädt Resourcepacks schneller | ⚪ | | |
| [Nvidium](https://modrinth.com/mod/nvidium) | schnellere Darstellung nur für Nvidia-Karten | ⚪ | | bei AMD/Intel wirkungslos, verträgt sich nicht mit jedem Shader |
| [Bobby](https://modrinth.com/mod/bobby) | merkt sich geladene Chunks, größere Sichtweite als der Server liefert | 🔵 | | **raus (27.10.)**: überflüssig, seit LOD Server Support die Landschaft liefert |
| [voxy](https://modrinth.com/mod/voxy) | Fernsicht mit vereinfachten Chunks (LOD) | 🟢 | | **aktiv seit 27.10. (Pascal)** mit [LOD Server Support](https://modrinth.com/mod/lod-server-support) – Server liefert 10.000×10.000 vorgeneriert, wie CraftAttack 14. Braucht OpenGL 4.6; bei Grafikfehlern (AMD) oder schwacher Leistung (Intel Arc) im Launcher abschalten. Test Pascal: ~500 FPS ohne, ~200 mit Shader |
| [Concurrent Chunk Management Engine](https://modrinth.com/mod/c2me-fabric) | schnellere Chunk-Erzeugung | ➖ | | wirkt nur im Einzelspieler/auf Fabric-Servern |

## Optik und Shader

| Mod | Wofür | Stufe | v1 | Anmerkung |
|---|---|---|---|---|
| [Iris Shaders](https://modrinth.com/mod/iris) | lädt Shader | 🔵 | ✅ | |
| [Complementary Reimagined](https://modrinth.com/shader/complementary-reimagined) | Shader, nah an Vanilla | 🔵 | | unsere Empfehlung für Schnee und Weihnachtslichter |
| [Complementary Unbound](https://modrinth.com/shader/complementary-unbound) | Shader, kräftiger und fantasievoller | ⚪ | | Alternative zu Reimagined |
| [Euphoria Patches](https://modrinth.com/mod/euphoria-patches) | Zusatzeinstellungen für Complementary | ⚪ | | |
| [Iris & Oculus Search](https://modrinth.com/mod/irissearch) | Suchfeld in den Shader-Einstellungen | ⚪ | | |
| [Continuity](https://modrinth.com/mod/continuity) | verbundene Texturen (z. B. Glas ohne Rahmen) | 🔵 | | viele Resourcepacks brauchen sie |
| [Entity Texture Features](https://modrinth.com/mod/entitytexturefeatures) | eigene und leuchtende Mob-Texturen aus Resourcepacks | 🔵 | | |
| [Entity Model Features](https://modrinth.com/mod/entity-model-features) | eigene Mob-Modelle aus Resourcepacks | 🔵 | | gehört zu ETF |
| [3D Skin Layers](https://modrinth.com/mod/3dskinlayers) | äußere Skin-Ebene wird dreidimensional | 🔵 | | |
| [LambDynamicLights](https://modrinth.com/mod/lambdynamiclights) | Fackel in der Hand leuchtet | ⚪ | | kleiner Vorteil in Höhlen, auf CraftAttack üblich – geduldet |
| [Particle Rain](https://modrinth.com/mod/particle-rain) | schönerer Regen und Schnee | ⚪ | | passt zum Winter |
| [Cool Rain](https://modrinth.com/mod/coolrain) | Regengeräusche auf Blöcken | ⚪ | | im Pack aus (26.10.) |
| [Make Bubbles Pop](https://modrinth.com/mod/make_bubbles_pop) | realistischere Luftblasen | ⚪ | | |
| [Simple Fog Control](https://modrinth.com/mod/simplefog) | Nebel abschalten | ⚪ | | Unterwasser-/Nether-Nebel ganz aus wäre ein kleiner Vorteil – nur Landnebel anpassen |
| [Time & Weather Changer](https://modrinth.com/mod/time-weather-changer) | eigene Tageszeit/Wetter, nur für sich selbst | ⚪ | | gut für Screenshots |
| [Boat Item View](https://modrinth.com/mod/boat-item-view) | Item in der Hand im Boot sichtbar | ⚪ | | |
| [Zoomify](https://modrinth.com/mod/zoomify) | Zoom-Taste | 🔵 | ✅ | entspricht einem Fernrohr |
| [Cinematic Zoom](https://modrinth.com/mod/cinematic-zoom-fabric) | weicher Zoom mit Kinobalken | ⚪ | | Alternative bzw. Ergänzung zu Zoomify, gut für Aufnahmen; bei beiden Mods auf verschiedene Tasten legen |
| [Ji AFK Cinematic](https://modrinth.com/mod/ji-afk-cinematic) | Kamerafahrt, wenn man AFK ist | ⚪ | | |

## Karte und Anzeigen

| Mod | Wofür | Stufe | v1 | Anmerkung |
|---|---|---|---|---|
| [Xaero's Minimap](https://modrinth.com/mod/xaeros-minimap) | Minikarte, Wegpunkte | 🟢 | ✅ | Entity-Radar und Höhlenansicht (außer im Nether) sperrt der Server (Plugin „Fair Play for Xaero's Maps“) |
| [Xaero's World Map](https://modrinth.com/mod/xaeros-world-map) | Vollbild-Karte der erkundeten Welt | 🔵 | | gleiche Sperre greift |
| [AppleSkin](https://modrinth.com/mod/appleskin) | zeigt Sättigung beim Essen | 🔵 | | |
| [Shulker Box Tooltip](https://modrinth.com/mod/shulkerboxtooltip) | Inhalt von Shulkerkisten im Inventar sehen | 🔵 | | |
| [Light Overlay](https://modrinth.com/mod/lightoverlay) | zeigt, wo Monster spawnen können | 🔵 | | fürs Absichern von Basen |
| [uku's Armor HUD](https://modrinth.com/mod/ukus-armor-hud) | Rüstung und Haltbarkeit am Bildschirmrand | ⚪ | | |
| [Locator Heads](https://modrinth.com/mod/locator-heads) | Spielerköpfe in der Locator-Leiste | ⚪ | | zeigt nur, was Vanilla ohnehin zeigt |
| [Peek](https://modrinth.com/mod/peek) | mehr Infos zu Items und Blöcken | ⚪ | | |
| [MiniHUD](https://modrinth.com/mod/minihud) | kleines F3 mit Overlays (Licht, Chunks) | ⚪ | | Schleimchunk-Anzeige braucht den Seed, den wir nicht herausgeben |
| [Entity Selection Outlines](https://modrinth.com/mod/entity-outlines) | Umriss um anvisierte Rahmen, Bilder, Rüstungsständer | ⚪ | | |
| [Here 'n' There](https://modrinth.com/mod/herenthere) | Koordinaten per Kürzel in den Chat | ⚪ | | |
| [CalcMod](https://modrinth.com/mod/calcmod) | Taschenrechner im Chat | ⚪ | | |
| [Block-Marker](https://github.com/ITsCALLE96/block-marker) | färbt gewählte Blöcke ein und lässt sie leuchten, mit Profilen | 🟢 | | **eigene Mod (24.10.), erlaubt**: kein X-Ray, nur sichtbare Blöcke ändern ihr Aussehen; Komma = nächstes Profil/aus, Punkt = angeschauten Block markieren |
| [Gamma Utils (Fullbright)](https://modrinth.com/mod/gamma-utils) | Helligkeit über 100 %, Höhlen ohne Fackeln hell | 🟢 | | **erlaubt (Pascal, 23.10.)**; Taste H = Nachtsicht, wirkt auch mit Shadern, G = Gamma nur ohne Shader |

## Inventar und Bedienung

| Mod | Wofür | Stufe | v1 | Anmerkung |
|---|---|---|---|---|
| [Mod Menu](https://modrinth.com/mod/modmenu) | Mod-Einstellungen im Menü | 🟢 | ✅ | |
| [Mouse Tweaks](https://modrinth.com/mod/mouse-tweaks) | Items mit der Maus schneller verschieben | 🔵 | | |
| [More Mouse Tweaks](https://modrinth.com/mod/moremousetweaks) | weitere Maus-Funktionen | ⚪ | | |
| [Client Sort](https://modrinth.com/mod/clientsort) | Inventar und Truhen sortieren | 🔵 | | sortiert nur, was man ohnehin per Hand könnte |
| [ClickThrough Plus](https://modrinth.com/mod/clickthrough-plus) | durch Schilder/Rahmen hindurch die Truhe öffnen | 🔵 | | |
| [Controlling](https://modrinth.com/mod/controlling) | Suchfeld in der Tastenbelegung | 🔵 | | |
| [Multi Key Bindings](https://modrinth.com/mod/multi-key-bindings) | mehrere Aktionen auf eine Taste | ⚪ | | |
| [Bundles Beyond](https://modrinth.com/mod/bundles-beyond) | bequemer an Bündel-Inhalte kommen | ⚪ | | |
| [Scribble](https://modrinth.com/mod/scribble) | Bücher bequem formatieren | ⚪ | | |
| [Big Sign Writer](https://modrinth.com/mod/bigsignwriter) | große Buchstaben über mehrere Schilder | ⚪ | | |
| [Armor Hider](https://modrinth.com/mod/zannaghs-armor-hider) | Rüstung ausblenden, damit der Skin sichtbar ist | ⚪ | | |
| [Extreme Sound Muffler](https://modrinth.com/mod/extreme_sound_muffler) | einzelne Geräusche leiser stellen | ⚪ | | **an seit v3 (Pascal, 30.10.)** |
| [Do a Barrel Roll](https://modrinth.com/mod/do-a-barrel-roll) | Elytra-Flug wie im Flugsimulator | ⚪ | | kein Vorteil, eher schwieriger |

## Bauen und Aufnehmen

| Mod | Wofür | Stufe | v1 | Anmerkung |
|---|---|---|---|---|
| [Litematica](https://modrinth.com/mod/litematica) | Baupläne als Geisterbild in die Welt legen | ❌ | | **raus aus dem Pack (Pascal, 26.10.)**, auf dem Server nicht erlaubt. Ohne „Printer“ kein Vorteil; für Bauprojekte und im Einzelspieler sehr hilfreich (auf CraftAttack verboten) |
| [Flashback](https://modrinth.com/mod/flashback) | Spiel aufnehmen und als Kamerafahrt abspielen | ⚪ | | schön für einen Weihnachts-Rückblick |
| [Freecam](https://modrinth.com/mod/freecam) | Kamera vom Körper lösen | 🟢 | | **erlaubt und in v2 (Pascal, 23.10.)**; Vorteil: Blick in fremde Basen und Höhlen – alle bekommen ihn gleich. Vom Server nicht einschränkbar (anders als Xaero); fair hält es Papers Anti-Xray: verdeckte Erze schickt der Server gar nicht erst |
| [Axiom](https://modrinth.com/mod/axiom) | Welt-Editor | ➖ | | braucht Server-Plugin und Creative, nicht für Survival |
| [Armor Poser](https://modrinth.com/mod/armor-poser) | Rüstungsständer per Menü posieren | 🟠 | | **in v2**; auf Paper mit dem offiziellen [Armor Poser Plugin](https://modrinth.com/plugin/armor-poser-plugin) (Paper/Folia/Purpur, 26.3, MIT). Ohne Mod geht es mit [EasyArmorStands](https://modrinth.com/plugin/easyarmorstands) oder [ArmorStandEditor-Reborn](https://modrinth.com/plugin/armorstandeditor-reborn), beide reine Paper-Plugins für alle |

## Braucht einen Server-Teil

| Mod | Wofür | Stufe | v1 | Anmerkung |
|---|---|---|---|---|
| [Simple Voice Chat](https://modrinth.com/plugin/simple-voice-chat) | Sprachchat mit Nähe-Effekt | 🟠 | | Server-Plugin + eigener UDP-Port (Standard 24454) nötig; mit Velocity eigene Einrichtung. Eher nicht nötig, wenn alle auf Discord sind |
| [Simple Voice Animations](https://modrinth.com/mod/simple-voice-animations) | Kopfbewegungen beim Sprechen | 🟠 | | nur mit Voice Chat |
| [Simple Voice Chat Group Player Names](https://modrinth.com/mod/voicechat-names) | Namen in Voice-Gruppen | 🟠 | | nur mit Voice Chat |
| [Wind Boost Enchantment](https://modrinth.com/datapack/wind_boost_enchant) | Verzauberung fürs Geschirr, Happy Ghasts schneller | 🟠 | | **ja (Pascal, 23.10.)**; Datapack `Wind Boost Enchantment.zip` v2.3 (26.3, MIT) auf den Server; wirkt für alle, auch ohne Pack. Nach dem Einspielen Neustart nötig, `/reload` reicht nicht |
| [Datapack Archive](https://modrinth.com/mod/v-datapack-archive) | Datapacks der Mische, u. a. herstellbare Lichtblöcke | 🟠 | | **Lichtblöcke ja (Pascal, 23.10.)**: Datapack `Craftable Light Blocks v1.zip` (26.3) auf den Server – Lichtquelle mit Glasscheiben umgeben → Lichtblock, Stufe in der Steinsäge wählen. Alle Rechte vorbehalten: nur herunterladen, nicht ins öffentliche Repo legen |

## Unnötig für unseren Server

| Mod | Wofür | Stufe | Anmerkung |
|---|---|---|---|
| [e4mc](https://modrinth.com/mod/e4mc) | Einzelspielerwelt ins Internet freigeben | ➖ | wir haben einen Server |
| [ViaFabricPlus](https://modrinth.com/mod/viafabricplus) | auf Server mit anderen Versionen gehen | ➖ | gleiche Version wie der Server |
| [Config Manager](https://modrinth.com/mod/configmanager) | liefert Einstellungen des Packs aus | ➖ | wir liefern Einstellungen direkt im Pack mit |
| [spark](https://modrinth.com/mod/spark) | Leistungsmessung | ➖ | nur zur Fehlersuche |
| [Respackopts](https://modrinth.com/mod/respackopts) | Einstellmenüs für Resourcepacks | ➖ | unser Resourcepack braucht keine |

## Resourcepacks der Mische

| Pack | Wofür | Stufe | Anmerkung |
|---|---|---|---|
| [Redstone Tweaks](https://modrinth.com/resourcepack/redstone-tweaks) | Redstone besser lesbar | ⚪ | | **raus (30.10.)**: lag bei, war aber nie eingeschaltet |
| [Resourcepack Archive](https://modrinth.com/resourcepack/vinc-resource-packs) | zwei kleine Packs des Mischen-Autors: „No Player Helmets“ (Helme anderer Spieler ausblenden) und „Minimal Armor“ (schlankere Rüstung) | ➖ | nur für 1.21.10 gebaut, und Armor Hider (⚪ im Pack) kann beides einstellbar |

## Bibliotheken (📚, kommen automatisch mit)

[Fabric API](https://modrinth.com/mod/fabric-api) (✅ v1) · [Fabric Language Kotlin](https://modrinth.com/mod/fabric-language-kotlin) (✅ v1) · [YetAnotherConfigLib](https://modrinth.com/mod/yacl) (✅ v1) · [Text Placeholder API](https://modrinth.com/mod/placeholder-api) (✅ v1) · [Cloth Config API](https://modrinth.com/mod/cloth-config) · [MaLiLib](https://modrinth.com/mod/malilib) · [MidnightLib](https://modrinth.com/mod/midnightlib) · [Balm](https://modrinth.com/mod/balm) · [CreativeCore](https://modrinth.com/mod/creativecore) · [CICADA](https://modrinth.com/mod/cicada) · [Eunomia](https://modrinth.com/mod/eunomia) · [Forge Config API Port](https://modrinth.com/mod/forge-config-api-port) · [LibJF](https://modrinth.com/mod/libjf) · [MRU](https://modrinth.com/mod/mru) · [OverlayLib](https://modrinth.com/mod/overlaylib) · [Searchables](https://modrinth.com/mod/searchables) · [ukulib](https://modrinth.com/mod/ukulib)

Welche davon wirklich gebraucht werden, ergibt sich aus den gewählten Mods; `tools/modpack.mjs` löst die Abhängigkeiten auf.

## Weitere Mods aus „Top 30 Quality of Life Minecraft Mods“ (demonjoeTV)

Quelle: YouTube-Video von demonjoeTV (15.08.2026) und seine Modrinth-Sammlung `mnqEfW3F`. 10 der 30 Mods stehen schon oben (Client Sort, Mouse Tweaks, Controlling, Boat Item View, Zoomify, Light Overlay, Axiom, Litematica, Freecam, LambDynamicLights). Hier die übrigen 20. „26.2“ heißt: noch keine Version für 26.3.

| Mod | Wofür | Stufe | Anmerkung |
|---|---|---|---|
| [Paginated Advancements](https://modrinth.com/mod/paginatedadvancements) | übersichtlicherer Fortschritte-Bildschirm | ❌ | ersetzt durch Better Advancements (24.10., gibt es für 26.3) |
| [Status Effect Bars](https://modrinth.com/mod/status-effect-bars) | Restdauer von Tränken als Balken | ⚪ | |
| [BetterF3](https://modrinth.com/mod/betterf3) | aufgeräumter, farbiger F3-Bildschirm | ⚪ | zeigt nichts, was F3 nicht ohnehin zeigt |
| [Better Statistics Screen](https://modrinth.com/mod/better-stats) | bessere Statistik-Ansicht | ⚪ | |
| [Borderless Fullscreen](https://modrinth.com/mod/borderless-fullscreen) | randloses Vollbild, schnelles Alt-Tab | ⚪ | praktisch, wenn nebenbei Discord läuft |
| [Packed Packs](https://modrinth.com/mod/packed-packs) | Resourcepacks in Profilen verwalten | ⚪ | |
| [RP Renames](https://modrinth.com/mod/rp-renames) | zeigt im Amboss, welche Namen ein Resourcepack umgestaltet | ⚪ | **26.2**; nützlich, falls unser Pack Deko-Items über Namen umgestaltet |
| [Screenshot Viewer](https://modrinth.com/mod/screenshot-viewer) | Screenshots im Spiel ansehen | ⚪ | **26.2** |
| [Cut Through](https://modrinth.com/mod/cut-through) | durch hohes Gras hindurch Mobs schlagen | ⚪ | kein nennenswerter Vorteil, nur weniger Frust |
| [Reach Behind](https://modrinth.com/mod/reach-behind) | durch Deko hindurch Blöcke benutzen | ➖ | **nein (Pascal, 23.10.)**; doppelt zu ClickThrough Plus (im Video „Reach Around“ genannt) |
| [Pickup Notifications](https://modrinth.com/mod/pickup-notifications) | Einblendung beim Aufsammeln von Items | ⚪ | braucht die Mod auf dem Server (Meldungen kommen vom Server), auf Paper wirkungslos – **raus (24.10.)**, im Test auch im Einzelspieler nicht sichtbar |
| [Speed Happy Ghast](https://modrinth.com/mod/speed-happy-ghast) | Happy Ghasts schneller | 🟠 | **26.2**; Datapack für den Server, Alternative zu Wind Boost |
| [RightClickHarvest](https://modrinth.com/mod/rightclickharvest) | Felder per Rechtsklick ernten und neu pflanzen | 🟠 | **ja (Pascal, 23.10.)**; reine Fabric-Server-Mod, auf Paper stattdessen ein Plugin: [HarvestMaster](https://modrinth.com/plugin/harvestmaster) (26.3, meistgeladen) oder [Right click harvester](https://modrinth.com/plugin/right-click-harvester) (26.3, quelloffen); wirkt für alle, auch ohne Pack |
| [Easy Shulker Boxes](https://modrinth.com/mod/easy-shulker-boxes) | Shulkerkisten direkt im Inventar benutzen | ⚪ | **optional (Pascal, 23.10.)**; braucht die Mod auch auf dem Server – auf unserem Paper-Server ohne Wirkung, nur im Einzelspieler. Anschauen deckt Shulker Box Tooltip ab |
| [Bookshelf Inspector](https://modrinth.com/mod/bookshelf-inspector) | Bücher im Bücherregal ansehen | ⚪ | **optional (Pascal, 23.10.)**; braucht die Mod auch auf dem Server – auf unserem Paper-Server ohne Wirkung, nur im Einzelspieler |
| [Vehicle Upgrade](https://modrinth.com/mod/vehicle-upgrade) | verbesserte Reittiere und Boote | ➖ | **nein (Pascal, 23.10.)**; Server-Mod, ändert das Spiel |
| [Crops Love Rain](https://modrinth.com/mod/crops-love-rain) | Pflanzen wachsen bei Regen schneller | ➖ | **nein (Pascal, 23.10.)**; Server-Mod, ändert die Spielregeln |
| [Superflat World No Slimes](https://modrinth.com/mod/superflat-world-no-slimes) | keine Schleime in Flachwelten | ➖ | nur für Creative-Flachwelten |
| [Cherished Worlds](https://modrinth.com/mod/cherished-worlds) | Lieblingswelten oben anheften | ➖ | nur Einzelspieler-Weltenliste |
| [Delete Worlds To Trash](https://modrinth.com/mod/delete-worlds-to-trash) | gelöschte Welten landen im Papierkorb | ➖ | nur Einzelspieler |

## Weitere Mods aus den meistgeladenen auf Modrinth

Quelle: Modrinth-Suche nach Downloads, Abruf 23.10.2026. Von den Top 50 standen 28 schon oben. Hier die übrigen 22 und danach eine Auswahl aus Platz 51–100. Die Zahl vor dem Namen ist der Platz in der Rangliste.

| Platz | Mod | Wofür | Stufe | Anmerkung |
|---|---|---|---|---|
| 31 | [More Culling](https://modrinth.com/mod/moreculling) | zeichnet noch mehr verdeckte Flächen nicht | 🔵 | mehr FPS, ergänzt Sodium |
| 33 | [Dynamic FPS](https://modrinth.com/mod/dynamic-fps) | senkt die FPS, wenn Minecraft im Hintergrund läuft | 🔵 | weniger Last und Lüfter, wenn man nebenbei in Discord ist |
| 36 | [FancyMenu](https://modrinth.com/mod/fancymenu) | Hauptmenü frei gestalten | 🔵 | **für uns spannend:** Weihnachts-Hauptmenü mit Knopf „Weihnachtsserver beitreten“, ganz ohne eigene Mod |
| 47 | [Chat Heads](https://modrinth.com/mod/chat-heads) | Kopf des Spielers neben der Chatnachricht | ⚪ | |
| 22 | [Just Enough Items (JEI)](https://modrinth.com/mod/jei) | alle Rezepte nachschlagen | ⚪ | hilfreich für Einsteiger, ersetzt das Wiki; Cheat-Modus nur mit OP. **Offen (24.10.):** Pascal fragt die Gruppe, JEI oder nur das Vanilla-Rezeptbuch; Pascal ist für JEI |
| 29 | [Jade](https://modrinth.com/mod/jade) | zeigt, worauf man schaut (Block, Mob, Leben) | ⚪ | ohne Server-Teil nur Infos, die der Client ohnehin kennt |
| 20 | [Not Enough Animations](https://modrinth.com/mod/not-enough-animations) | schönere Animationen in der Third-Person-Ansicht | ⚪ | |
| 43 | [Sound Physics Remastered](https://modrinth.com/mod/sound-physics-remastered) | Hall und Echo in Höhlen und Räumen | ⚪ | kostet Rechenleistung; im Pack aus (26.10.) |
| 42 | [No Chat Reports](https://modrinth.com/mod/no-chat-reports) | Chatnachrichten nicht signieren | ⚪ | auf unserem Server egal; serverseitig regelt das `enforce-secure-profile` |
| 18 | [VeinMiner](https://modrinth.com/plugin/veinminer) | ganze Erzader auf einmal abbauen | 🔴 | **nein (Pascal, 23.10.)**; gäbe es als Paper-Plugin, ändert aber die Spielbalance |
| 30 | [VeinMiner Hotkey](https://modrinth.com/mod/veinminer-client) | Taste und Vorschau für VeinMiner | 🔴 | **nein**, nur mit VeinMiner |
| 50 | [Essential](https://modrinth.com/mod/essential) | Freunde-System, Welten hosten, Kosmetik-Shop | ➖ | eigenes Konto- und Shop-System, verträgt sich schlecht mit anderen Mods |
| 24 | [ModernFix](https://modrinth.com/mod/modernfix) | Leistung und Speicher, behebt Fehler | ➖ | noch keine Version für 26.3 |
| 14 | [Architectury API](https://modrinth.com/mod/architectury-api) | Bibliothek | 📚 | |
| 26 | [Geckolib](https://modrinth.com/mod/geckolib) | Bibliothek für Animationen in Inhalts-Mods | 📚 | |
| 35 | [Collective](https://modrinth.com/mod/collective) | Bibliothek | 📚 | |
| 37 | [Puzzles Lib](https://modrinth.com/mod/puzzles-lib) | Bibliothek | 📚 | |
| 38 | [Konkrete](https://modrinth.com/mod/konkrete) | Bibliothek (für FancyMenu) | 📚 | |
| 45 | [Kotlin for Forge](https://modrinth.com/mod/kotlin-for-forge) | Bibliothek, nur Forge/NeoForge | ➖ | wir nutzen Fabric |
| 46 | [Melody](https://modrinth.com/mod/melody) | Bibliothek (für FancyMenu) | 📚 | |
| 48 | [owo-lib](https://modrinth.com/mod/owo-lib) | Bibliothek | 📚 | |
| 49 | [Bookshelf](https://modrinth.com/mod/bookshelf-lib) | Bibliothek | 📚 | |

**Auswahl aus Platz 51–100** (nur Client-Mods mit 26.3-Version):

| Platz | Mod | Wofür | Stufe | Anmerkung |
|---|---|---|---|---|
| 51 | [BadOptimizations](https://modrinth.com/mod/badoptimizations) | Leistung abseits der Grafik | 🔵 | |
| 64 | [AmbientSounds](https://modrinth.com/mod/ambientsounds) | Umgebungsgeräusche je nach Biom | ⚪ | Wind und Stille in den Schneebergen, passt zum Winter; im Pack aus (26.10.) |
| 98 | [Falling Leaves](https://modrinth.com/mod/fallingleaves) | Blätter fallen von Bäumen | ⚪ | |
| 89 | [Visuality](https://modrinth.com/mod/visuality) | zusätzliche kleine Partikel | ⚪ | |
| 63 | [Presence Footsteps](https://modrinth.com/mod/presence-footsteps) | realistische Schrittgeräusche | ⚪ | im Pack aus (26.10.) |
| 66 | [Enchantment Descriptions](https://modrinth.com/mod/enchantment-descriptions) | erklärt Verzauberungen im Tooltip | ⚪ | gut für Einsteiger |
| 92 | [More Chat History](https://modrinth.com/mod/morechathistory) | längerer Chatverlauf | ⚪ | |
| 55 | [Language Reload](https://modrinth.com/mod/language-reload) | schnelleres Laden, Sprach-Rückfall | ⚪ | |
| 69 | [Debugify](https://modrinth.com/mod/debugify) | behebt bekannte Minecraft-Fehler | ⚪ | |
| 72 | [Distant Horizons](https://modrinth.com/mod/distanthorizons) | riesige Sichtweite mit vereinfachten Chunks | 🔵 | **raus (27.10.)**: ersetzt durch voxy + LOD Server Support (für Paper 26.3 gibt es kein fertiges DH-Server-Plugin) |
| 60 | [Inventory Profiles Next](https://modrinth.com/mod/inventory-profiles-next) | Inventar sortieren, Slots sperren | ➖ | doppelt zu Client Sort und Mouse Tweaks |

Nicht einzeln aufgeführt: Inhalts- und Weltgenerierungs-Mods (Create, Cobblemon, Supplementaries, Biomes O' Plenty, TaCZ), weil sie eine Mod auf dem Server brauchen und auf Paper nicht laufen; reine Forge/NeoForge-Mods (Embeddium, Oculus); Mods ohne aktuelle Version (Indium, Memory Leak Fix, Model Gap Fix); reine Server-Mods (Krypton, Clumps, Packet Fixer) und weitere Bibliotheken.

## Server-Regeln, die daraus folgen

- **Nicht erlaubt:** Litematica (seit 26.10. nicht mehr im Pack), Röntgen-/X-Ray-Packs, Minimap-Entity-Radar und Minimap-Höhlenansicht außerhalb des Nethers (technisch gesperrt)
- **Erlaubt:** Minimap-Höhlenansicht im Nether (seit 23.10.); Block-Marker – kein X-Ray, verdeckte Blöcke bleiben unsichtbar
- **Erlaubt, obwohl ein Vorteil:** Fullbright (Gamma Utils) und Freecam – bewusst freigegeben und im Pack, damit alle die gleiche Möglichkeit haben
- **Server-Absicherung:** Xaero's Minimap und World Map ohne Entity-Radar und ohne Höhlenansicht außer im Nether (Plugin „Fair Play for Xaero's Maps“); Papers Anti-Xray (`engine-mode: 2`) versteckt Erze, die man nicht direkt sieht, und nimmt Freecam und Fullbright damit den Erz-Vorteil
- **Geduldet:** LambDynamicLights, Bobby, voxy, Distant Horizons, MiniHUD ohne Seed
- **LOD vom Server (LOD Server Support):** Xaero-Karte wird mit Fernlandschaft gefüllt (`request_no_map_ingestion: false`), Höhlenansicht bleibt per Fair Play gesperrt, Erze maskiert der Server (Anti-Xray). Entfernte Spieler sichtbar (bis 2.048 Blöcke)
- Alles andere aus den Tabellen ist erlaubt, auch wenn es nicht in unserem Pack steckt
