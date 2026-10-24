# FancyMenu-Test: Hauptmenü-Knopf und Fortschritte-Knopf im Inventar

Zweck: Pascal legt in seiner Testinstanz zwei Probe-Knöpfe an und speichert sie. Die Modpack-Session liest danach die gespeicherten Layout-Dateien aus (`config/fancymenu/customization/`) und baut daraus das Weihnachts-Hauptmenü und den Inventar-Knopf als Voreinstellung fürs Pack. Gestaltung ist egal, es geht nur um das Dateiformat und darum, ob das Inventar überhaupt anpassbar ist.

Die FancyMenu-Leiste ist im Pack ausgeblendet. **Strg + Alt + C** blendet sie ein und wieder aus.

## Test 1: Knopf im Hauptmenü

1. Spiel starten, im Hauptmenü **Strg + Alt + C** drücken. Oben erscheint die FancyMenu-Leiste.
2. In der Leiste **Customization → Enable customization for this screen** (falls nicht schon an), dann **Layouts → New layout**. Der Editor öffnet sich.
3. **Rechtsklick auf eine freie Stelle → New Element → Button**.
4. Rechtsklick auf den neuen Knopf → **Label**: `Weihnachtsserver` eintragen.
5. Rechtsklick auf den Knopf → **Manage Actions** (bzw. „Edit Action Script“) → **Add Action → Join Server**, Wert `mc.grahl.cloud`, bestätigen.
6. Oben im Editor **Save** (Strg + S). Als Name z. B. `test_hauptmenue`.
7. Editor schließen, Knopf einmal anklicken. Erwartung: Das Spiel verbindet sich mit dem Server (Fehlermeldung ist ok, falls er gerade aus ist).

## Test 2: Fortschritte-Knopf im Inventar

1. Eine Welt öffnen (Einzelspieler reicht), **E** fürs Inventar, dann **Strg + Alt + C**.
2. Prüfen: Lässt sich hier **Enable customization for this screen** einschalten?
   - **Nein / ausgegraut / keine Leiste:** Test vorbei, Ergebnis melden. Dann bauen wir eine kleine eigene Mod.
   - **Ja:** weiter mit 3.
3. **Layouts → New layout**, Rechtsklick → **New Element → Button**, Label `Fortschritte`.
4. Rechtsklick → **Manage Actions → Add Action → Open Screen** (heißt evtl. „Open GUI“), in der Liste den **Fortschritte-Bildschirm** („Advancements“) auswählen.
5. **Save**, Name `test_inventar`, Editor schließen.
6. Knopf anklicken. Erwartung: Das große Fortschrittsfenster (Better Advancements) geht auf.

## Danach

Der Modpack-Session Bescheid geben, auch wenn ein Schritt nicht ging (mit dem Wortlaut der Menüpunkte, die stattdessen da waren). Das Spiel vorher schließen, damit die Dateien fertig geschrieben sind.
