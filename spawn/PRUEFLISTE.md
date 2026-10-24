# Prüfliste: frischer Join (lokaler Testserver, Vorlage für den Testlauf am 21.11.)

Reihenfolge wie bei einem neuen Spieler. Voraussetzung: Welt frisch aufgesetzt (`spawn/neu-aufsetzen.sh` bzw. `spawn/AUFBAU.md`), Spieler **ohne OP**,
Modpack-Instanz `weihnachten-modpack`. Befehle mit „Konsole“ gibt die Leitung per RCON bzw. AMP-Konsole ein. Auffälligkeiten mit Screenshot an die Leitung.

Testserver: Adresse `localhost`. Testlauf 21.11.: echte Adresse, Whitelist, Velocity (Server-Session).

## 1. Join und Spawn
- [ ] Server in der Serverliste: Weihnachts-MOTD, Server-Bild
- [ ] Beitreten klappt, **Resourcepack-Abfrage** erscheint (Text „Weihnachts-Texturen …“), annehmen → lädt ohne Fehler
- [ ] Du landest **mitten auf dem Platz vor der Kuppel** (64/179/29, unsichtbarer Boden), Blick zur Kuppel mit Drachenei, nicht oben auf dem Drachen
- [ ] Rundumblick: Drache, Schriftzug, Bäume, Schilder; nach Norden eine schlichte, gleichmäßige Grasebene mit Strand (keine Wege, Fundamente oder Kanten von früheren Bauten), darunter der Kanal, im Süden der Hügel
- [ ] Unter der Insel hängt die Kette mit „CRAFT ATTACK“ bis knapp übers Wasser, mit kleinem Drachen und zwei lila Anhängern, keine abgeschnittenen Reste
- [ ] Inventar leer, keine alten Fortschritte (Advancements leer, Statistiken null)

## 2. Spawnschutz und Insel
- [ ] Auf der Insel nichts abbauen oder setzen, Truhen und Fässer gehen nicht auf
- [ ] Die Geschenk-Kisten sehen weihnachtlich aus (Resourcepack)
- [ ] Sättigung: beim Betreten der Insel oben einmal kurz (Hungerleiste füllt sich einmal auf); sofort wieder runter und rauf bringt nichts (5 min Abklingzeit); am Boden unter der Insel keine Sättigung
- [ ] Kein PvP auf der Insel (zweiter Spieler, falls dabei)

## 3. Elytra und Rückweg
- [ ] Auf der Insel zweimal springen → Gleitflug startet, Hinweis zur Boost-Taste; **F** gibt einmal Schub; Landung ohne Fallschaden
- [ ] Abseits der Insel (z.B. auf der Ebene) startet der Doppelsprung keinen Flug
- [ ] Rückweg: runde Plattform genau unter der Inselmitte (leuchtende Mitte, Amethyst, lila Ring, vier Kristallsäulen, Laternen; Spawn senkrecht darüber) → draufstellen und **stehen bleiben**: Portal-Geräusch, Bildschirm wabert, lila Partikel, nach ~3,5 s Teleport auf den Spawn mit Ankunfts-Geräusch und kurzer Einblendung; erneut fliegen geht
- [ ] Vorher von der Plattform runtergehen → Übergang bricht ab (Wabern hört auf, kein Teleport)

## 4. Monster und Umgebung
- [ ] Nachts (Konsole `time set night`) erscheinen auf der Insel, unter ihr, auf der Plattform und auf der Ebene (Pilzland) keine Monster
- [ ] Außerhalb der Ebene (z.B. Hügel im Süden, Wald im Westen) erscheinen nachts ganz normal Monster
- [ ] Spawnschutz nur im Oval um die Insel (am Boden etwa der Insel-Umriss plus Rand): dort nichts bauen, daneben auf der Ebene und am Hügel normal bauen

## 5. Leitfaden-Datapack und Questbuch
- [ ] **Wird überarbeitet** (Leitfaden und Questbuch werden neu gemacht). Bis dahin nur prüfen: Phase 0, kein Leitfaden-Buch beim Join, keine Fehlermeldungen

## 6. Mods mit dem Server
- [ ] **Voice Chat:** Taste V → Verbindung grün, Mikrofon-Test hörbar (allein nur im Testmodus)
- [ ] **Block-Marker:** Block markieren, Markierung bleibt sichtbar (auch nach erneutem Join)
- [ ] **Xaero-Minimap und Weltkarte:** Höhlenansicht in der Overworld nicht möglich, kein Entity-Radar; keine Trial Chambers, Höhlen oder Erze sichtbar
- [ ] Jade/Infos; Armor Poser: Rüstungsständer außerhalb des Spawns mit **Strg + Rechtsklick** bearbeiten
- [ ] Feld anlegen (außerhalb des Spawns, auch im Überlebensmodus): Erde mit Hacke zu Ackerboden, Samen setzen, wachsen lassen, abbauen → Samen lassen sich setzen (Rechtsklick-Ernte ist entfernt)

## 7. Nether-Sperre, spark
- [ ] Netherportal bauen (außerhalb des Spawn-Ovals) und anzünden → Durchgang gesperrt; End ebenfalls zu
- [ ] Server neu starten (Leitung) → Sperre gilt weiterhin
- [ ] `/spark tps` geht ohne OP, `/spark profiler` ist gesperrt

## 8. Weihnachts-Inhalte
- [ ] Wanderhändler: Konsole `execute at <Spielername> run summon wandering_trader ~2 ~ ~` neben dir → anklicken, Hinweis „Handelsfenster einmal schließen und neu öffnen“ → neu öffnen → alle Smaragd-Angebote kosten 1 Smaragd, Ankäufe normal
- [ ] Weihnachts-Items (zurzeit reine Deko): Konsole `execute as <Spielername> run function leitfaden:items/lebkuchen`, ebenso `…/lichterkette` und `…/weihnachtsmuetze` → eigene Texturen, Mütze sitzt auf dem Kopf
- [ ] Gemälde: Gemälde aufhängen → Wintermotive (wenn in rp-v2 enthalten)

## 9. Abschluss
- [ ] Ausloggen und wieder einloggen → du stehst, wo du warst, Inventar und Markierungen sind noch da
- [ ] Auffälligkeiten an die Leitung; die Leitung trägt das Ergebnis ins Testprotokoll ein
