# Optionales Modpack installieren (6 Schritte)

Du brauchst das nicht zum Mitspielen – es macht Minecraft flüssiger und schöner und bringt Karte, Shader und viele Komfort-Funktionen.

1. **Modrinth App** herunterladen und installieren: https://modrinth.com/app
2. Die Datei **`weihnachten-modpack.mrpack`** herunterladen: https://github.com/ITsCALLE96/mc-weihnachten-2026/releases/download/modpack-v4/weihnachten-modpack.mrpack
3. In der Modrinth App oben links auf **„+“ → „Aus Datei importieren“** und die `.mrpack`-Datei auswählen. Die App lädt alles selbst herunter.
4. **Mods einzeln sichtbar machen:** Profil öffnen → **Zahnrad (Einstellungen) → Installation → „Unlink instance“**. Danach stehen alle Mods einzeln unter **Inhalt** und lassen sich ein- und ausschalten oder aktualisieren. Ein neues Pack von uns importierst du sowieso als neue Datei, du verlierst also nichts.
   **Arbeitsspeicher:** im selben Menü unter **Java und Speicher** **8 GB** einstellen. Mehr bringt nichts, eher im Gegenteil (längere Pausen beim Aufräumen des Speichers).
5. Mit deinem Microsoft-Konto anmelden und das Profil **„Weihnachtsprojekt 2026“** mit **Play** starten.
6. **Mehrspieler** → der Server **„Weihnachtsprojekt“** (`mc.grahl.cloud`) ist schon eingetragen → **Beitreten**. Das Weihnachts-Resourcepack wird automatisch angenommen.

**Bedrock (Handy, Konsole, Windows-Edition)?** Ohne Modpack: Server hinzufügen mit Adresse **`mc.grahl.cloud`**, Port **19132**.

## Zusätzliche Mods einschalten

Diese Mods liegen **ausgeschaltet** bei: Nvidium (nur Nvidia-Grafikkarten, wirkt nur ohne Shader), uku's Armor HUD, Flashback (Aufnahmen), Do a Barrel Roll (Elytra-Flugsteuerung) und die Geräusch-Mods Cool Rain, Sound Physics Remastered, AmbientSounds, Presence Footsteps. Extreme Sound Muffler (einzelne Geräusche leiser stellen) ist eingeschaltet. In der Modrinth App: Profil öffnen → **Inhalt** → beim gewünschten Mod den **Schalter** umlegen, dann Minecraft neu starten. Was welche Mod macht, steht in der Mod-Liste (`MODS.md`).

Nicht zusätzlich installieren: **Distant Horizons** (verträgt sich nicht mit voxy, das schon an ist).

## Nützliche Tasten und Schalter

| Was | Wie |
|---|---|
| Shader an/aus | **Optionen → Videoeinstellungen → Shader-Pakete** → „Complementary Reimagined“ |
| Hell sehen (Fullbright) | **H** = Nachtsicht, funktioniert auch mit Shadern · **G** = Helligkeit hoch, nur ohne Shader |
| Freecam (Kamera frei bewegen) | **F4** |
| Sprachchat (Einstellungen, Gruppen) | **V** · Mikro geht von selbst an, wenn du sprichst (Sprachaktivierung). Wer lieber Push-to-Talk will: **V** → Mikrofon-Aktivierung umstellen, dann **Caps Lock** halten |
| Zoom | **C** gedrückt halten · mit Kinobalken: **X** |
| Lichtlevel (wo Monster spawnen) | **F9** |
| Mikro stumm | **Ä** |
| Questbuch (Fortschritte) | **L** oder im Inventar (**E**) der Buch-Knopf oben rechts |
| Rezepte nachschlagen (JEI) | im Inventar rechts die Liste, Item anklicken |
| Weltkarte | **M** |
| Wegpunkt setzen | **B** |
| Inventar sortieren | **Mausrad-Klick** im Inventar |
| Blöcke einfärben (Block-Marker) | **Komma** = nächstes Profil bzw. aus · **Punkt** = angeschauten Block markieren · Einstellungen und Profile: **Mods → Block-Marker** (Mod Menu) |

Die Tasten lassen sich unter **Optionen → Steuerung** ändern (mit Suchfeld).

## Neue Pack-Version von uns

Eine bestehende Instanz übernimmt neue Mods und Voreinstellungen **nicht** von selbst (nach „Unlink instance“ gar nicht, sonst bleiben deine geänderten Einstellungen stehen). Am saubersten:

1. Die neue `.mrpack`-Datei wie beim ersten Mal als **neues Profil** importieren und Schritt 4 (Unlink) wiederholen.
2. Aus dem alten Profil-Ordner (Profil → **⋯ → Ordner öffnen**) mitnehmen, was du behalten willst: `servers.dat` (Serverliste), `XaeroWaypoints/` und `xaero/` (Wegpunkte, Karte), `screenshots/`.
3. Das alte Profil löschen, sobald im neuen alles passt.

**Voice Chat stumm oder unsichtbar?** **Ä** schaltet dein Mikro stumm und wieder an. Unter **V** gibt es den Knopf „Symbole ausblenden“; ist er an, siehst du keine Voice-Symbole.

## Block-Marker

Unsere eigene Mod. Sie färbt Blöcke ein, die du auswählst, und lässt sie auf Wunsch leuchten, zum Beispiel alle Truhen oder die Erze in deiner Mine. Mehrere Auswahlen speicherst du als **Profile**. **Komma** schaltet zum nächsten Profil, nach dem letzten ist alles aus. **Punkt** fügt den Block hinzu, den du gerade anschaust. Das Menü mit Suche öffnest du über **Mods → Block-Marker** im Hauptmenü oder Pausenmenü. Auf dem Server erlaubt, weil es kein X-Ray ist: Blöcke hinter Wänden bleiben unsichtbar.

## Wenn der Rechner laut wird

Das Pack begrenzt die Bildrate auf **240 FPS** (Optionen → Grafik → Max. Bildrate). Wer einen 60-Hz-Bildschirm hat, stellt dort 60 ein, das spart viel Strom und Lüfter. Beim ersten Join lädt voxy die ferne Landschaft vom Server, das kostet die ersten Minuten etwas Leistung und Netz und legt sich dann.

## Weite Sicht

- **voxy** zeigt Landschaft bis 320 Chunks weit in vereinfachter Form. Die Landschaft kommt fertig vom Server (Mod **LOD Server Support**), du musst nicht erst hinlaufen. Auch deine Xaero-Weltkarte füllt sich damit, und andere Spieler siehst du auf große Entfernung.
- Einstellungen: **Optionen → Video** → links **Voxy** bzw. **LOD Server Support**. Bei einem schwachen Rechner dort die Sichtweite senken oder in der Modrinth App unter **Inhalt** voxy ausschalten (dann normale Sichtweite).
- AMD- oder Intel-Grafikkarte mit Bildfehlern oder Ruckeln: voxy ausschalten.
