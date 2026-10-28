# Mob-Zoo (NUR Testnetz, Pascal 28.10.)

Jeder lebende Mob der 26.3-Jar zum Ansehen, mit Varianten und Babys, plus Arena zum Live-Schalten. **Nie auf VM200** – das Datapack gehört nur in
die **eigene Testwelt** des Testnetzes (Pascal 28.10.: nicht in den SMP), erreichbar über die zweite Hub-Kiste „Testwelt“ (nur mit `serverwahl.testwelt`).

Testwelt einrichten (Testnetz gestoppt, legt Server + Zoo-Datapack an, Velocity bekommt `testwelt`): `bash testnetz/testwelt.sh einrichten`;
nach dem Start (Leitung, `start.cmd` startet sie mit): `bash testnetz/testwelt.sh rechte`, dann `python -I testnetz/rcon.py testwelt "function zoo:aufbau"`.
Nur das Datapack neu erzeugen:

```
python -I server/zoo/zoo.py testnetz/smp/versions/26.3/paper-26.3.jar testnetz/testwelt/world/datapacks
```

Liest die Mob-Liste aus dem Jar (`loot_table/entities` ohne Spieler, Rüstungsständer, Mannequin → 90 Mobs) und die Varianten aus den Registries
(Katze, Wolf, Schwein, Kuh, Huhn, Frosch, Zombie-Nautilus); fest im Skript: Dorfbewohner/Zombie-Dorfbewohner (15 Berufe + 6 Biomtypen),
Pferd (7 Farben + 4 Abzeichen), Lama, Papagei, Kaninchen (inkl. Killer), Axolotl, Fuchs, Mooshroom, Panda-Gene, Schaf (16 Farben + jeb_),
Shulker (17 Farben), Lachsgrößen, Schleim-/Magmagrößen, geladener Creeper, Schneegolem ohne Kürbis, schreiende Ziege, 11 Tropenfisch-Muster,
Babys aller Tiere bzw. IsBaby bei Zombies & Co. Zusammen ~288 Podeste.

| Funktion | Was |
|---|---|
| `zoo:aufbau` | lädt die Fläche (forceload) und baut nach 5 s: Quarzplattform auf dem Superflat-Boden bei x 12…140, z 10…137 (stehen auf y −60); jeder Mob auf einem Podest (Wassermobs im Glaswürfel mit Wasser), still (NoAI, unverwundbar, bleibt), Namensschild darüber; Arena 60 × 60 bei 16/−44 (Grundgestein, Barrieren) |
| `zoo:hin` | Teleport zum Zoo, Kreativ |
| `zoo:nacht` / `zoo:tag` | Nacht und Zeit anhalten (Leuchteffekte; Untote brennen nachts nicht) / normaler Tag |
| `zoo:menue` | Klickliste im Chat: Mob live in der Arena beschwören (mit KI); setzt dich in die Arena, Überleben mit Resistenz V usw., damit Mobs angreifen |
| `zoo:live/<mob>` | einzeln, z. B. `zoo:live/wither`, `zoo:live/ghast`, `zoo:live/warden`; `mob_griefing` aus, solange die Arena läuft |
| `zoo:live/ender_dragon` | Drache im End (fliegt nur um 0/0 seiner Dimension): beschwört ihn dort, falls keiner da ist, und setzt dich an den Rand der Hauptinsel |
| `zoo:arena_leeren` | alle Live-Mobs weg, `mob_griefing` wieder an |
| `zoo:schutz` / `zoo:schutz_aus` | Schutz an (Überleben + Effekte) / aus (Kreativ) |
| `zoo:neu` | alles abbauen und neu aufbauen |
| `zoo:abbau` | alles weg, forceload aufgehoben |

Per RCON für einen Spieler: `execute as ITsCALLE96 at @s run function zoo:hin`. Nach dem Einspielen: Neustart oder `/reload`, dann `/function zoo:aufbau`.
Ungeprüft beim Schreiben (erster Lauf zeigt es): einzelne NBT-Schlüssel alter Zahl-Varianten (Pferd, Lama, Papagei …) in 26.3 – passt einer nicht,
steht der Mob in der Grundform da.

## Stand 28.10. nachmittags (nach Pascals Test)

- **Versatz behoben:** Koordinaten wurden als Text „{x}.5“ gebaut – bei negativen Werten (Friedlich liegt bei z −100) landete der Mob einen Block
  daneben, Wassermobs außerhalb des Würfels, Schilder versetzt. Jetzt wird die Blockmitte gerechnet (`mitte(v) = v + 0.5`). Nachmessen im Spiel:
  `function zoo:pruefen` zählt Mobs, die weder auf einem Podest noch im Wasser stehen (Soll 0) und lässt jeden Ausreißer „Nicht auf dem Podest“ sagen
- **Ausstellungshallen:** je Bereich ein Flügel (Fichtenholz, Fensterband, rotes Band, Schneedach, Seelaternen im Dach), Eingang im Westen mit Wegweiser
  innen und außen; Untote brennen nicht mehr. Höhe Friedlich 7, Feindlich 8, Bosse 16
- **Arena:** Schneeboden, Packeis-Rand, Schild „Kampf-Arena – /function zoo:menue“, Barrieren darüber bleiben unsichtbar
- **Geschoss-Galerie** (südlich der Bosse): 17 Schützen als Statuen, gegenüber Zielscheibe auf Heuballen + Rüstungsständer. `function zoo:galerie`
  (Klickliste), `zoo:galerie_hin`, `zoo:galerie_dauer` (alle 4 s alle Stationen, nochmal = aus). Geschosse werden per summon erzeugt – Pfeile
  (auch Langsamkeit/Gift), Feuerwerk, Dreizack, Feuerkugeln, Ghast-Feuerball, Wither-Schädel (schwarz/blau), Drachenatem, Windladung,
  Shulker-Lenkgeschoss (auf den Rüstungsständer), Fangzähne, Wurftrank, Lama-Spucke, Schneeball, Warden-Schallschlag (Partikel + Klang).
  Wächterstrahl gibt es nur live in der Arena. `mob_griefing` ist in der Testwelt aus (Explosionen zerstören nichts)

## Stand 28.10. später (zweiter Rundgang Pascal)

- **Kompakt und offen:** Zoo jetzt bei 40/−55 (östlich der Inseln, x 34…143, z −58…111), keine Hallen mehr, kein Seitenbereich
- **Kein Brennen:** Das Datapack ersetzt den Entity-Tag `minecraft:burn_in_daylight` durch eine leere Liste – in der Testwelt brennt kein Untoter
  mehr, auch ohne Dach (26.3 steuert das Brennen über diesen Tag). Gilt nur, wo das Zoo-Datapack liegt (Testwelt), nie auf dem SMP
- **Angriffspose:** Feindliche Mobs, Bosse und wehrhafte Tiere tragen den Tag `zoo_angriff`; serverwahl (`zoo-posen: true`, `ZooPosen.java`) hält sie
  alle 5 s angriffslustig (Skelette mit Bogen im Anschlag, Zombies mit gehobenen Armen, Diener mit erhobener Axt), Ghast mit offenem Feuermaul,
  Enderman schreiend, Warden brüllt (Animation alle 10 s neu). Plünderer und Piglin halten eine geladene Armbrust. Swell des Creepers ginge nur mit
  Explosion – stattdessen gibt es den geladenen Creeper als Variante
- **Kampf-Ecke** statt Arena und Geschoss-Galerie: 24 × 24 bei 52/−75, Schneeboden, Packeis-Rand, Schild, `function zoo:menue`
- **Alten Zoo wegräumen** (einmalig): `function zoo:alt_weg` (Ecke 1984/−140 samt Arena und Ecke 120/−100 samt Hallen, Galerie, Arena 120/−160). Läuft in drei Schritten: Chunks laden → nach 5 s Mobs in den Void und `kill`, Flächen leeren → nach weiteren 5 s entladen. Erst nach ~15 s (Meldung „Alte Zoo-Lagen geräumt“) `function archiv:aufbau`, sonst nimmt `alt_weg3` dem Neuaufbau die Forceloads weg. Die großen `fill`s lösen einmal den Watchdog-Hinweis „not responded for 10 seconds“ aus – harmlos
- Warum so: Ein Teleport im selben Tick wie `forceload add` erreicht nichts (Chunks noch nicht geladen), und Mobs mit viel Leben (Drache, Warden, Wither) überleben den Void einige Sekunden und bleiben beim Entladen bei y −500 gespeichert. `zoo:aufbau2` räumt deshalb zuerst alle geladenen `zoo`-Mobs ab
