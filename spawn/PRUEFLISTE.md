# Prüfliste: frischer Join (lokaler Testserver, Vorlage für den Testlauf am 21.11.)

Reihenfolge wie bei einem neuen Spieler. Voraussetzung: Welt frisch aufgesetzt (`spawn/neu-aufsetzen.sh` bzw. `spawn/AUFBAU.md`), Spieler **ohne OP**,
Modpack-Instanz `weihnachten-modpack`. Befehle mit „Konsole“ gibt die Leitung per RCON bzw. AMP-Konsole ein. Auffälligkeiten mit Screenshot an die Leitung.

Testserver: Adresse `localhost`. Testlauf 21.11.: echte Adresse, Whitelist, Velocity (Server-Session).

## 1. Join und Spawn
- [ ] Server in der Serverliste: Weihnachts-MOTD, Server-Bild
- [ ] Beitreten klappt, **Resourcepack-Abfrage** erscheint (Text „Weihnachts-Texturen …“), annehmen → lädt ohne Fehler
- [ ] Du landest **mitten auf dem Platz vor der Kuppel** (64/179/29, unsichtbarer Boden), Blick zur Kuppel mit Drachenei, nicht oben auf dem Drachen
- [ ] Rundumblick: Drache, Schriftzug, Bäume, Schilder; nach Norden die große flache Ebene (CA12-Aufschüttung), darunter der Kanal, im Süden der Hügel
- [ ] Unter der Insel hängt die Kette mit „CRAFT ATTACK“ bis knapp übers Wasser, mit kleinem Drachen und zwei lila Anhängern, keine abgeschnittenen Reste
- [ ] Inventar leer, keine alten Fortschritte (Advancements leer, Statistiken null)

## 2. Spawnschutz und Insel
- [ ] Auf der Insel nichts abbauen oder setzen, Truhen und Fässer gehen nicht auf
- [ ] Die Geschenk-Kisten sehen weihnachtlich aus (Resourcepack)
- [ ] Hungerleiste bleibt auf der Insel voll (sprinten, springen → sofort wieder voll)
- [ ] Kein PvP auf der Insel (zweiter Spieler, falls dabei)

## 3. Elytra und Rückweg
- [ ] Auf der Insel zweimal springen → Gleitflug startet, Hinweis zur Boost-Taste; **F** gibt einmal Schub; Landung ohne Fallschaden
- [ ] Abseits der Insel (z.B. auf der Ebene) startet der Doppelsprung keinen Flug
- [ ] Rückweg: runde Plattform genau unter der Inselmitte (leuchtende Mitte, Amethyst, lila Ring, vier Kristallsäulen, Laternen; Spawn senkrecht darüber) → draufstellen → zurück auf dem Spawn, Hinweis in der Aktionsleiste, erneut fliegen geht

## 4. Monster und Umgebung
- [ ] Nachts (Konsole `time set night`) erscheinen auf der Insel, unter ihr, auf der Plattform und auf der Ebene (Pilzland) keine Monster
- [ ] Außerhalb der Ebene (z.B. Hügel im Süden, Wald im Westen) erscheinen nachts ganz normal Monster
- [ ] Im 150er-Umkreis um den Spawn lässt sich nichts bauen, außerhalb normal

## 5. Leitfaden-Datapack
- [ ] Phase 0: noch kein Leitfaden-Buch (richtig so)
- [ ] Konsole `function leitfaden:phase/setzen_1` → Buch kommt ins Inventar, Meldung zum Kapitel „Ankommen“, Fortschritte (Taste L) zeigen die Ziele mit Erklärung beim Drüberfahren
- [ ] Ein Ziel erfüllen (z.B. Werkbank bauen) → Häkchen im Leitfaden
- [ ] Danach Konsole `scoreboard players set #phase lf_phase 0`, falls die Welt weiter als Phase 0 getestet werden soll

## 6. Mods mit dem Server
- [ ] **Voice Chat:** Taste V → Verbindung grün, Mikrofon-Test hörbar (allein nur im Testmodus)
- [ ] **Block-Marker:** Block markieren, Markierung bleibt sichtbar (auch nach erneutem Join)
- [ ] **Xaero-Minimap und Weltkarte:** Höhlenansicht in der Overworld nicht möglich, kein Entity-Radar; keine Trial Chambers, Höhlen oder Erze sichtbar
- [ ] Jade/Infos, Armor Poser (Rüstungsständer bearbeiten außerhalb des Spawns), Rechtsklick-Ernte (reifes Feld rechtsklicken → erntet und pflanzt neu)

## 7. Nether-Sperre, spark
- [ ] Netherportal bauen (außerhalb des Bauverbots) und anzünden → Durchgang gesperrt; End ebenfalls zu
- [ ] Server neu starten (Leitung) → Sperre gilt weiterhin
- [ ] `/spark tps` geht ohne OP, `/spark profiler` ist gesperrt

## 8. Weihnachts-Inhalte
- [ ] Wanderhändler: Konsole `execute at <Spielername> run summon wandering_trader ~2 ~ ~` neben dir → anklicken, Hinweis „Handelsfenster einmal schließen und neu öffnen“ → neu öffnen → alle Smaragd-Angebote kosten 1 Smaragd, Ankäufe normal
- [ ] Weihnachts-Items: Konsole `execute as <Spielername> run function leitfaden:items/lebkuchen`, ebenso `…/lichterkette` und `…/weihnachtsmuetze` → eigene Texturen, Mütze sitzt auf dem Kopf
- [ ] Gemälde: Gemälde aufhängen → Wintermotive (wenn im Resourcepack des Modpacks enthalten)
- [ ] Musik: Hintergrundmusik bzw. Schallplatten mit Weihnachtsstücken (wenn im Resourcepack des Modpacks enthalten)

## 9. Abschluss
- [ ] Ausloggen und wieder einloggen → du stehst, wo du warst, Inventar und Markierungen sind noch da
- [ ] Auffälligkeiten an die Leitung; die Leitung trägt das Ergebnis ins Testprotokoll ein
