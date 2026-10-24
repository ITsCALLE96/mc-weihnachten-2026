# Tastenbelegung im Modpack

Stand 24.10.2026, Pack `modpack-v2`. Alle Vorschläge unten sind umgesetzt und von Pascal im Spiel geprüft (24.10.) und liegen als Voreinstellung im Pack (`modpack/overrides/options.txt`). MiniHUD ist seit 24.10. nicht mehr im Pack. Litematica ist im Pack standardmäßig aus – seine Konflikte (M, I) betreffen nur, wer es einschaltet. Ausgelesen aus den Mod-Dateien selbst (Bytecode der Tasten-Registrierung bzw. malilib-Hotkeys). Wo eine Mod ihre Taste über eine Hilfsfunktion setzt, stammt der Wert aus der Mod-Beschreibung (markiert mit ¹). Minecraft 26.x zählt Tasten nach USB-Tastaturcodes (A=4, G=10, H=11 …), nicht mehr nach dem alten GLFW-Schema.

## Konflikte und Vorschlag

| Taste | Wer will sie | Vorschlag |
|---|---|---|
| **C** | Zoomify (Zoom), Cinematic Zoom ¹, Vanilla „Hotbar laden“ | Zoomify bleibt **C**, Cinematic Zoom auf **X** (so hat es CastCrafter); die Vanilla-Hotbar-Tasten C/X **leeren** – gespeicherte Hotbars gibt es nur im Kreativmodus |
| **H** | Gamma Utils (Nachtsicht), MiniHUD (Anzeige an/aus), Simple Voice Chat (Symbole ausblenden) | Nachtsicht bleibt **H**; Voice-Chat-Symbole ausblenden **ohne Taste** (MiniHUD ist raus) |
| **M** | Xaero's World Map (Karte), Litematica (Hauptmenü + alle M-Kombinationen), Simple Voice Chat (Mikro stumm) | Karte bleibt **M**; Litematica-Hauptmenü auf **Ö** (die M-Kombinationen bleiben, sie brauchen gehaltenes M + zweite Taste); Mikro stumm auf **Ä** (B ist schon der Xaero-Wegpunkt) |
| **I** | Iris (Shader-Auswahl), Litematica (Info-Overlay), Do a Barrel Roll (an/aus, nur wenn eingeschaltet) | Iris bleibt **I**; Litematica-Info-Overlay **ohne Taste**; Do a Barrel Roll bleibt aus; wer es einschaltet, legt die Taste selbst fest (Standard I stößt mit Iris zusammen; nicht O = „Freunde“, nicht R) |
| **F9** | ClickThrough Plus (an/aus), Light Overlay (Lichtlevel an/aus) | Light Overlay bleibt **F9**; ClickThrough **ohne Taste** (ist sowieso immer an) |

## Alle Mod-Tasten (Standard)

| Mod | Aktion | Taste |
|---|---|---|
| Gamma Utils | Gamma an/aus · heller · dunkler | G · Pfeil hoch · Pfeil runter |
| Gamma Utils | Nachtsicht an/aus · stärker · schwächer | H · Pfeil rechts · Pfeil links |
| Freecam | Freecam an/aus ¹ | F4 |
| Zoomify | Zoom halten · zweiter Zoom | C · F6 |
| Cinematic Zoom | Zoom mit Kinobalken halten ¹ | C |
| Iris | Shader neu laden · an/aus · Auswahl | R · K · I |
| Xaero's World Map | Karte · Einstellungen | M · + |
| Xaero's Minimap | neuer Wegpunkt ¹ · Wegpunktliste · Minimap groß · Einstellungen · Schnell-Wegpunkt | B · U · Z · Y · Num + |
| Simple Voice Chat | Sprechen (halten) ¹ · Menü · Mikro stumm · Chat aus · Symbole aus | Feststelltaste (nur bei Push-to-Talk; Standard im Pack ist Sprachaktivierung) · V · Ä · N · ohne Taste |
| Simple Voice Animations | Einstellungen | J |
| Block-Marker (eigene Mod) | nächstes Profil bzw. aus · angeschauten Block markieren · Menü | Komma · Punkt · über Mod Menu |
| Light Overlay | Lichtlevel an/aus | F9 |
| ClickThrough Plus | an/aus | F9 |
| Client Sort | sortieren (im Inventar) | mittlere Maustaste |
| Language Reload | Sprachen neu laden | F3 + J |
| MiniHUD | Anzeige an/aus · Einstellungen · Inventar-Vorschau | H · H+C · Alt links |
| Litematica | Hauptmenü · Einstellungen · Material-Liste · Platzierungen · Auswahl | M · M+C · M+L · M+P · M+S |
| Litematica | Ebene hoch/runter · Info-Overlay · Overlay durch Blöcke | Bild auf/ab · I · Strg rechts |
| Litematica | Bereich speichern | Strg + Alt + S |
| Do a Barrel Roll (aus) | an/aus · Gieren · Schub | I · A/D · W |

Ohne Standardtaste (bei Bedarf selbst belegen): Mod Menu, Presence Footsteps, LambDynamicLights, Bundles Beyond, Client-Sort-Zusatzaktionen, Flashback-Marker, Gamma min/max, Iris-Wireframe, Light-Overlay-Einstellungen, uku's Armor HUD, Simple Voice Chat Flüstern.

Nicht ausgelesen (Taste wird über eine Hilfsfunktion gesetzt, meist ohne Standardtaste): Jade, JEI (Tasten nur in Menüs), Armor Hider, Entity Culling, Not Enough Animations, 3D Skin Layers, Dynamic FPS.

## Wie die Belegung ins Pack kommt

Die Voreinstellungen liegen in `modpack/overrides/` und landen beim Bau 1:1 unter `overrides/` in der `.mrpack`:

- `options.txt`: nur `version`, `lang:de_de`, alle Tastenzeilen (`key_…`) und die Lautstärken (`soundCategory_…`, von Pascal festgelegt: Gesamt 50 %, Musik/Wetter/freundliche Tiere 5 %, Feinde 10 %, Plattenspieler/Umgebung 15 %, Rest 50 %) und die Tastenzeilen aus Pascals Testinstanz – Grafik usw. bleiben beim Standard
- `config/freecam.json`: „Ignore All Collision“ aus, durch transparente und öffenbare Blöcke (Türen, Falltüren) darf man fliegen – wie von Pascal eingestellt
- `config/ji-afk-cinematic.json`: AFK-Kamerafahrt nach 30 Sekunden, ohne Musik (Pascal, 24.10.); alle Tasten der Mod leer (Strg + H schaltete auch die Nachtsicht), Einstellungen über Mod Menu
- `config/betterf3.json`: aufgeräumtes F3 nach Pascals Auswahl (24.10.)
- `config/armor-hider.json`: Helme bei allen ausgeblendet (Deckkraft 0 %)
- `config/xaero/minimap/profiles/default.cfg`: runde Minimap
- `options.txt` außerdem `maxFps:240` (Pascal, 24.10.; begrenzt statt unbegrenzt, im Spiel änderbar)
- `config/voicechat/voicechat-client.properties`: Sprachaktivierung statt Push-to-Talk, Einführung übersprungen, Gruppen-Symbole oben rechts unter den Effekt-Symbolen statt links unter der Minimap (Pascal, 24.10.); Mikrofon und Lautsprecher leer = Standardgerät. Push-to-Talk-Taste trotzdem auf Feststelltaste (stand vorher leer)
- `config/fancymenu/options.txt`: Bearbeitungsleiste aus, `modpack_mode` an (Spieler sehen keine FancyMenu-Leiste; einblenden mit Strg + Alt + C)

Litematica und Do a Barrel Roll sind ausgeschaltet, ihre Tasten stehen deshalb noch nicht in der Datei. Neu übernehmen: Tasten in einer Testinstanz einstellen, dann die `key_`-Zeilen aus deren `options.txt` kopieren.
