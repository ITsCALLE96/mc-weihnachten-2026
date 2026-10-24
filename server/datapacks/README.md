# Datapacks der Server-Session

## Weihnachts-Wanderhändler: alles für 1 Smaragd (`wanderhaendler-rabatt/`)

Idee Pascal: Über die Feiertage verkauft der Wanderhändler alles für ~1 Smaragd. Das Aussehen (Weihnachtsmann, Lamas mit Mützen) kommt aus dem Resourcepack
(Modpack-Session). Dieses Datapack macht nur die Preise.

**Warum ein Datapack und kein Plugin:** Paper 26.3 kann Händlerangebote mit Vanilla-Befehlen ändern (`data modify entity`). Ein Plugin dafür gibt es nicht passend
für 26.3, und es wäre ein Teil mehr, der gepflegt werden muss. Paper selbst hat dafür keine Einstellung.

**So arbeitet es:**
- Alle 5 Sekunden sucht es Wanderhändler ohne die Markierung `wh_rabatt`, deren Angebote schon erzeugt sind
- Bei jedem Angebot, für das der Spieler mit Smaragden zahlt, wird der Preis auf **1 Smaragd** gesetzt, ein zweiter Preisgegenstand entfällt.
  Ankäufe (der Händler zahlt Smaragde, z. B. für Wasserflaschen) bleiben unverändert, sonst ließe sich Smaragd vermehren
- Der Preis steigt danach weder durch Nachfrage noch durch Rabatt-Effekte. Die Anzahl der Käufe pro Angebot (`maxUses`) bleibt Vanilla
- Jeder Händler wird nur einmal bearbeitet

**Zeitraum (Vorschlag, Leitung entscheidet):** 24.12. bis 26.12. Pascal schaltet es per Hand:
```text
/datapack enable "file/wanderhaendler-rabatt"
/function wh_rabatt:ende
/datapack disable "file/wanderhaendler-rabatt"
```
(`ende` vor dem Ausschalten stoppt die Prüfschleife. Händler, die schon rabattiert sind, behalten ihre Preise, bis sie nach höchstens ~40–60 min verschwinden.)

**Optional:** `/function wh_rabatt:weihnachtsmann` setzt als OP an der eigenen Position einen Händler „Weihnachtsmann“ für 40 min, z. B. am 24.12. am Spawn.
Natürliche Wanderhändler sind selten, damit ist sicher, dass einer kommt. Lamas kommen dabei nicht mit, die bringt nur das natürliche Erscheinen.

**Noch zu prüfen (Testwelt, nicht getestet):**
- Lädt das Pack ohne Fehler (`/datapack list`, Serverlog)? Das Format `121.0` gilt für 26.3 (`VERSION.md`)
- Kommen die Angebote eines frisch erschienenen Händlers schon ins NBT, oder erst beim ersten Öffnen? Im zweiten Fall sieht der erste Spieler kurz die normalen
  Preise, nach spätestens 5 s und erneutem Öffnen gilt der Rabatt. Prüfen mit `/summon wandering_trader` und `/data get entity @e[type=wandering_trader,limit=1,sort=nearest] Offers`
- Hat 26.3 die Schlüssel `buy`/`buyB`/`priceMultiplier`/`demand`/`specialPrice` umbenannt? Dann die Pfade in `anwenden.mcfunction` anpassen
- Läuft es zusammen mit dem Leitfaden-Datapack (eigener Namensraum `wh_rabatt`, keine Überschneidung)?
