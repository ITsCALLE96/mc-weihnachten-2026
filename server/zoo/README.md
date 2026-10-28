# Mob-Zoo (NUR Testnetz, Pascal 28.10.)

Jeder lebende Mob der 26.3-Jar zum Ansehen, mit Varianten und Babys, plus Arena zum Live-Schalten. **Nie auf VM200** – das Datapack gehört nur in
`testnetz/smp/world/datapacks/`.

```
python -I server/zoo/zoo.py testnetz/smp/versions/26.3/paper-26.3.jar testnetz/smp/world/datapacks
```

Liest die Mob-Liste aus dem Jar (`loot_table/entities` ohne Spieler, Rüstungsständer, Mannequin → 90 Mobs) und die Varianten aus den Registries
(Katze, Wolf, Schwein, Kuh, Huhn, Frosch, Zombie-Nautilus); fest im Skript: Dorfbewohner/Zombie-Dorfbewohner (15 Berufe + 6 Biomtypen),
Pferd (7 Farben + 4 Abzeichen), Lama, Papagei, Kaninchen (inkl. Killer), Axolotl, Fuchs, Mooshroom, Panda-Gene, Schaf (16 Farben + jeb_),
Shulker (17 Farben), Lachsgrößen, Schleim-/Magmagrößen, geladener Creeper, Schneegolem ohne Kürbis, schreiende Ziege, 11 Tropenfisch-Muster,
Babys aller Tiere bzw. IsBaby bei Zombies & Co. Zusammen ~288 Podeste.

| Funktion | Was |
|---|---|
| `zoo:aufbau` | lädt die Fläche (forceload) und baut nach 5 s: Quarzplattform bei x 3000…3124, z −6…121, y 200; jeder Mob auf einem Podest (Wassermobs im Glaswürfel mit Wasser), still (NoAI, unverwundbar, bleibt), Namensschild darüber; Arena 60 × 60 bei 3000/−120 (Grundgestein, Barrieren) |
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
