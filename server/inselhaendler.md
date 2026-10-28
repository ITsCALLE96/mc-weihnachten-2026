# Inselhändler „Weihnachtsmann“ und Jukebox (28.10., gebaut in serverwahl, Test offen)

Entschieden (Leitung 28.10.): sichtbar als `minecraft:mannequin` mit eigenem Skin aus dem Basis-Pack (Modpack-Session), Handel über serverwahl
(eigenes Händlerfenster per Merchant-API, Waren aus der Liste von Spawn & Welt). Preise: **jeden Dezember halber Preis, ab 01.01. Normalpreis**
(Pascal 28.10., echte Uhr, ohne Neustart). Freigeschaltet nach der Feier der Weihnachtsinsel.

## Paper 26.3: Mannequin und Skin-Pfad (im Server-Jar nachgesehen)

- `net/minecraft/world/entity/decoration/Mannequin` gibt es; Felder: `profile`, `hidden_layers`, `main_hand`, `pose`, `immovable`, `description`, `hide_description`
- `profile` ist ein `ResolvableProfile` mit Skin-Patch (`PlayerSkin$Patch`): `texture`, `cape`, `elytra`, `model`. `texture` ist ein Asset-Pfad aus dem
  Resourcepack: `weihnachten:entity/weihnachtsmann` → im Pack `assets/weihnachten/textures/entity/weihnachtsmann.png` (64 × 64, Spieler-Skin-Layout),
  `model` `wide` oder `slim`. Kein `name`/`id` angeben, sonst sucht der Server bei Mojang nach einem Konto
- Die Mannequin ist selbst anklickbar (Rechtsklick kommt als `PlayerInteractAtEntityEvent`, wie bei den Kalendertürchen) → **keine extra Interaction nötig**;
  serverwahl erkennt sie am Tag (z. B. `wi_haendler`) und öffnet das Händlerfenster

## Testbefehl (Testnetz, als Op, Pack mit dem Skin geladen)

```
/summon minecraft:mannequin ~ ~ ~2 {profile:{texture:"weihnachten:entity/weihnachtsmann",model:"wide"},immovable:1b,Invulnerable:1b,PersistenceRequired:1b,description:"Weihnachtsmann",Tags:["wi_haendler"]}
```

Prüfen: Skin sichtbar (ohne Pack: Fehltextur bzw. Standardskin – zeigt, dass der Pfad wirkt), steht still, nimmt keinen Schaden, Rechtsklick tut ohne serverwahl nichts.
Wegräumen: `/kill @e[type=minecraft:mannequin,tag=wi_haendler,distance=..5]`

## Bedrock (Geyser) – Einschätzung, ungeprüft

- Geyser kennt die Java-Pack-Textur nicht (Bedrock bekommt unser Java-Resourcepack nicht). Erwartet: Mannequin als Spielerfigur mit **Standard-Skin**
  (Steve/Alex) oder, falls Geyser 2.12 die Mannequin noch nicht übersetzt, **unsichtbar**. Im Bedrock-Test (Handy) einmal ansehen
- Handeln geht trotzdem, sobald die Figur anklickbar ist: Das Händlerfenster kommt vom Server, Geyser übersetzt Händlerfenster für Bedrock.
  Falls die Figur unsichtbar bleibt: zusätzlich ein Schild/Text-Display „Weihnachtsmann – Rechtsklick“ und eine Interaction davor (für Bedrock klickbar)

## Umsetzung (28.10., `Inselhaendler.java`, Config `inselhaendler:` nur SMP)

- Daten aus `spawn/weihnachtsmann.json` (Spawn & Welt, kopiert von `plugin-konfig/einspielen.sh`): Mannequin und Klickfläche (Interaction, Tag
  `wi_weihnachtsmann_klick`, erscheinen mit `stufe_4_teil_10`), 34 Angebote als Item-Text mit Komponenten (`ItemFactory.createItemStack`), Preise in Smaragden
- Rechts- oder Linksklick auf die Klickfläche öffnet ein eigenes Händlerfenster (Merchant-API), Angebote unbegrenzt, keine Erfahrung.
  **Jeden Dezember** (Europe/Berlin) Preis × `dezemberFaktor` (0,5, aufgerundet, mindestens 1), ab 01.01. Normalpreis – bei jedem Öffnen neu, kein Neustart
- **Jukebox** (2/155/−45, steht ab `stufe_3_teil_8`): legt die Platten `weihnachten:platte_*` nacheinander ein (Länge aus `jukebox_song/*.json` der Welt-Datapacks),
  nur solange ein Spieler im `jukebox-radius` (48) ist, sonst wird sie geleert. `/serverwahl jukebox weiter | neu | status`
