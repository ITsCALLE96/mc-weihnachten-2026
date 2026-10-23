# Mods – was wofür, wie wichtig, erlaubt oder nicht

Das Pack ist **freiwillig**. Wer es nicht nutzt, spielt mit normalem Minecraft genauso mit. Auf dem Server sind nur Mods ohne Spielvorteil erlaubt.

Grundlage für die Bewertung ist die Community-Zusammenstellung **„CastCrafter CA14 Mische“ 1.1.0** (Modrinth `cc-ca14`, VincPlyz, Stand 19.10.2026, Minecraft 26.3, 94 Einträge). Sie enthält alle Mods, Shader und Resourcepacks, die CastCrafter in CraftAttack 14 nutzt. Jede Mod daraus ist hier einzeln bewertet, auch die, die wir nicht übernehmen. Dazu kommen die Mods aus demonjoeTVs Video „Top 30 Quality of Life Minecraft Mods“ (eigener Abschnitt unten).

Aktuelle Dateien und Versionen unseres Packs: `STAND.md` (wird von `node tools/modpack.mjs` geschrieben).

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
| [Reese's Sodium Options](https://modrinth.com/mod/reeses-sodium-options) | übersichtlicheres Grafik-Menü | ⚪ | | |
| [Remove Reloading Screen](https://modrinth.com/mod/rrls) | Resourcepacks laden im Hintergrund | ⚪ | | angenehm beim Server-Beitritt mit unserem Pack |
| [quick pack](https://modrinth.com/mod/quick-pack) | lädt Resourcepacks schneller | ⚪ | | |
| [Nvidium](https://modrinth.com/mod/nvidium) | schnellere Darstellung nur für Nvidia-Karten | ⚪ | | bei AMD/Intel wirkungslos, verträgt sich nicht mit jedem Shader |
| [Bobby](https://modrinth.com/mod/bobby) | merkt sich geladene Chunks, größere Sichtweite als der Server liefert | ⚪ | | kein Vorteil: zeigt nur, was man schon gesehen hat |
| [voxy](https://modrinth.com/mod/voxy) | Fernsicht mit vereinfachten Chunks (LOD) | ⚪ | | braucht viel Speicher, nur für starke Rechner |
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
| [Cool Rain](https://modrinth.com/mod/coolrain) | Regengeräusche auf Blöcken | ⚪ | | |
| [Make Bubbles Pop](https://modrinth.com/mod/make_bubbles_pop) | realistischere Luftblasen | ⚪ | | |
| [Simple Fog Control](https://modrinth.com/mod/simplefog) | Nebel abschalten | ⚪ | | Unterwasser-/Nether-Nebel ganz aus wäre ein kleiner Vorteil – nur Landnebel anpassen |
| [Time & Weather Changer](https://modrinth.com/mod/time-weather-changer) | eigene Tageszeit/Wetter, nur für sich selbst | ⚪ | | gut für Screenshots |
| [Boat Item View](https://modrinth.com/mod/boat-item-view) | Item in der Hand im Boot sichtbar | ⚪ | | |
| [Zoomify](https://modrinth.com/mod/zoomify) | Zoom-Taste | 🔵 | ✅ | entspricht einem Fernrohr |
| [Cinematic Zoom](https://modrinth.com/mod/cinematic-zoom-fabric) | weicher Zoom mit Kinobalken | ➖ | | doppelt zu Zoomify |
| [Ji AFK Cinematic](https://modrinth.com/mod/ji-afk-cinematic) | Kamerafahrt, wenn man AFK ist | ⚪ | | |

## Karte und Anzeigen

| Mod | Wofür | Stufe | v1 | Anmerkung |
|---|---|---|---|---|
| [Xaero's Minimap](https://modrinth.com/mod/xaeros-minimap) | Minikarte, Wegpunkte | 🟢 | ✅ | Höhlenansicht und Entity-Radar sperrt der Server (Plugin „Fair Play for Xaero's Maps“) |
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
| [Gamma Utils (Fullbright)](https://modrinth.com/mod/gamma-utils) | Helligkeit über 100 %, Höhlen ohne Fackeln hell | 🔴 | | klarer Vorteil |

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
| [Extreme Sound Muffler](https://modrinth.com/mod/extreme_sound_muffler) | einzelne Geräusche leiser stellen | ⚪ | | |
| [Do a Barrel Roll](https://modrinth.com/mod/do-a-barrel-roll) | Elytra-Flug wie im Flugsimulator | ⚪ | | kein Vorteil, eher schwieriger |

## Bauen und Aufnehmen

| Mod | Wofür | Stufe | v1 | Anmerkung |
|---|---|---|---|---|
| [Litematica](https://modrinth.com/mod/litematica) | Baupläne als Geisterbild in die Welt legen | 🔵 | | ohne „Printer“ kein Vorteil; für Bauprojekte sehr hilfreich |
| [Flashback](https://modrinth.com/mod/flashback) | Spiel aufnehmen und als Kamerafahrt abspielen | ⚪ | | schön für einen Weihnachts-Rückblick |
| [Freecam](https://modrinth.com/mod/freecam) | Kamera vom Körper lösen | 🔴 | | Blick in fremde Basen und Höhlen |
| [Axiom](https://modrinth.com/mod/axiom) | Welt-Editor | ➖ | | braucht Server-Plugin und Creative, nicht für Survival |
| [Armor Poser](https://modrinth.com/mod/armor-poser) | Rüstungsständer per Menü posieren | ➖ | | braucht die Mod auch auf dem Server, auf Paper nicht möglich |

## Braucht einen Server-Teil

| Mod | Wofür | Stufe | v1 | Anmerkung |
|---|---|---|---|---|
| [Simple Voice Chat](https://modrinth.com/plugin/simple-voice-chat) | Sprachchat mit Nähe-Effekt | 🟠 | | Server-Plugin + eigener UDP-Port (Standard 24454) nötig; mit Velocity eigene Einrichtung. Eher nicht nötig, wenn alle auf Discord sind |
| [Simple Voice Animations](https://modrinth.com/mod/simple-voice-animations) | Kopfbewegungen beim Sprechen | 🟠 | | nur mit Voice Chat |
| [Simple Voice Chat Group Player Names](https://modrinth.com/mod/voicechat-names) | Namen in Voice-Gruppen | 🟠 | | nur mit Voice Chat |
| [Wind Boost Enchantment](https://modrinth.com/datapack/wind_boost_enchant) | Verzauberung fürs Geschirr, Happy Ghasts schneller | 🟠 | | Datapack auf dem Server; wirkt dann für alle, auch ohne Pack |
| [Datapack Archive](https://modrinth.com/mod/v-datapack-archive) | Datapacks der Mische, u. a. herstellbare Lichtblöcke | 🟠 | | einzelne Datapacks nur nach Bedarf auf den Server |

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
| [Redstone Tweaks](https://modrinth.com/resourcepack/redstone-tweaks) | Redstone besser lesbar | ⚪ | |
| [Resourcepack Archive](https://modrinth.com/resourcepack/vinc-resource-packs) | CastCrafters eigene Packs | ➖ | wir haben unser eigenes Weihnachts-Pack |

## Bibliotheken (📚, kommen automatisch mit)

[Fabric API](https://modrinth.com/mod/fabric-api) (✅ v1) · [Fabric Language Kotlin](https://modrinth.com/mod/fabric-language-kotlin) (✅ v1) · [YetAnotherConfigLib](https://modrinth.com/mod/yacl) (✅ v1) · [Text Placeholder API](https://modrinth.com/mod/placeholder-api) (✅ v1) · [Cloth Config API](https://modrinth.com/mod/cloth-config) · [MaLiLib](https://modrinth.com/mod/malilib) · [MidnightLib](https://modrinth.com/mod/midnightlib) · [Balm](https://modrinth.com/mod/balm) · [CreativeCore](https://modrinth.com/mod/creativecore) · [CICADA](https://modrinth.com/mod/cicada) · [Eunomia](https://modrinth.com/mod/eunomia) · [Forge Config API Port](https://modrinth.com/mod/forge-config-api-port) · [LibJF](https://modrinth.com/mod/libjf) · [MRU](https://modrinth.com/mod/mru) · [OverlayLib](https://modrinth.com/mod/overlaylib) · [Searchables](https://modrinth.com/mod/searchables) · [ukulib](https://modrinth.com/mod/ukulib)

Welche davon wirklich gebraucht werden, ergibt sich aus den gewählten Mods; `tools/modpack.mjs` löst die Abhängigkeiten auf.

## Weitere Mods aus „Top 30 Quality of Life Minecraft Mods“ (demonjoeTV)

Quelle: YouTube-Video von demonjoeTV (15.08.2026) und seine Modrinth-Sammlung `mnqEfW3F`. 10 der 30 Mods stehen schon oben (Client Sort, Mouse Tweaks, Controlling, Boat Item View, Zoomify, Light Overlay, Axiom, Litematica, Freecam, LambDynamicLights). Hier die übrigen 20. „26.2“ heißt: noch keine Version für 26.3.

| Mod | Wofür | Stufe | Anmerkung |
|---|---|---|---|
| [Paginated Advancements](https://modrinth.com/mod/paginatedadvancements) | übersichtlicherer Fortschritte-Bildschirm | ⚪ | **26.2** – passt gut zu unserem Leitfaden, der aus Fortschritten besteht; aufnehmen, sobald es 26.3 gibt |
| [Status Effect Bars](https://modrinth.com/mod/status-effect-bars) | Restdauer von Tränken als Balken | ⚪ | |
| [BetterF3](https://modrinth.com/mod/betterf3) | aufgeräumter, farbiger F3-Bildschirm | ⚪ | zeigt nichts, was F3 nicht ohnehin zeigt |
| [Better Statistics Screen](https://modrinth.com/mod/better-stats) | bessere Statistik-Ansicht | ⚪ | |
| [Borderless Fullscreen](https://modrinth.com/mod/borderless-fullscreen) | randloses Vollbild, schnelles Alt-Tab | ⚪ | praktisch, wenn nebenbei Discord läuft |
| [Packed Packs](https://modrinth.com/mod/packed-packs) | Resourcepacks in Profilen verwalten | ⚪ | |
| [RP Renames](https://modrinth.com/mod/rp-renames) | zeigt im Amboss, welche Namen ein Resourcepack umgestaltet | ⚪ | **26.2**; nützlich, falls unser Pack Deko-Items über Namen umgestaltet |
| [Screenshot Viewer](https://modrinth.com/mod/screenshot-viewer) | Screenshots im Spiel ansehen | ⚪ | **26.2** |
| [Cut Through](https://modrinth.com/mod/cut-through) | durch hohes Gras hindurch Mobs schlagen | ⚪ | kein nennenswerter Vorteil, nur weniger Frust |
| [Reach Behind](https://modrinth.com/mod/reach-behind) | durch Deko hindurch Blöcke benutzen | ➖ | doppelt zu ClickThrough Plus (im Video „Reach Around“ genannt) |
| [Pickup Notifications](https://modrinth.com/mod/pickup-notifications) | Einblendung beim Aufsammeln von Items | ⚪ | laut Modrinth auch auf dem Server nötig – auf Paper vorher ausprobieren |
| [Speed Happy Ghast](https://modrinth.com/mod/speed-happy-ghast) | Happy Ghasts schneller | 🟠 | **26.2**; Datapack für den Server, Alternative zu Wind Boost |
| [RightClickHarvest](https://modrinth.com/mod/rightclickharvest) | Felder per Rechtsklick ernten und neu pflanzen | 🟠 | reine Server-Mod für Fabric; auf Paper ginge es nur mit einem entsprechenden Plugin, wirkt dann für alle |
| [Easy Shulker Boxes](https://modrinth.com/mod/easy-shulker-boxes) | Shulkerkisten direkt im Inventar benutzen | ➖ | braucht die Mod auf dem Server, auf Paper nicht möglich; Shulker Box Tooltip deckt das Anschauen ab |
| [Bookshelf Inspector](https://modrinth.com/mod/bookshelf-inspector) | Bücher im Bücherregal ansehen | ➖ | braucht die Mod auf dem Server |
| [Vehicle Upgrade](https://modrinth.com/mod/vehicle-upgrade) | verbesserte Reittiere und Boote | ➖ | Server-Mod, ändert das Spiel |
| [Crops Love Rain](https://modrinth.com/mod/crops-love-rain) | Pflanzen wachsen bei Regen schneller | ➖ | Server-Mod, ändert die Spielregeln |
| [Superflat World No Slimes](https://modrinth.com/mod/superflat-world-no-slimes) | keine Schleime in Flachwelten | ➖ | nur für Creative-Flachwelten |
| [Cherished Worlds](https://modrinth.com/mod/cherished-worlds) | Lieblingswelten oben anheften | ➖ | nur Einzelspieler-Weltenliste |
| [Delete Worlds To Trash](https://modrinth.com/mod/delete-worlds-to-trash) | gelöschte Welten landen im Papierkorb | ➖ | nur Einzelspieler |

## Server-Regeln, die daraus folgen

- **Nicht erlaubt:** Freecam, Fullbright (Gamma Utils), Röntgen-/X-Ray-Packs, Litematica-Printer, Minimap-Höhlenansicht und -Entity-Radar (technisch gesperrt)
- **Geduldet:** LambDynamicLights, Bobby, voxy, MiniHUD ohne Seed
- Alles andere aus den Tabellen ist erlaubt, auch wenn es nicht in unserem Pack steckt
