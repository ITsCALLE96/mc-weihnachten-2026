# Tastenbelegung im Modpack

Stand 23.10.2026, Pack `modpack-v2`. Ausgelesen aus den Mod-Dateien selbst (Bytecode der Tasten-Registrierung bzw. malilib-Hotkeys). Wo eine Mod ihre Taste über eine Hilfsfunktion setzt, stammt der Wert aus der Mod-Beschreibung (markiert mit ¹). Minecraft 26.x zählt Tasten nach USB-Tastaturcodes (A=4, G=10, H=11 …), nicht mehr nach dem alten GLFW-Schema.

## Konflikte und Vorschlag

| Taste | Wer will sie | Vorschlag |
|---|---|---|
| **C** | Zoomify (Zoom), Cinematic Zoom ¹, Vanilla „Hotbar laden“ | Zoomify bleibt **C**, Cinematic Zoom auf **X** (so hat es CastCrafter); die Vanilla-Hotbar-Tasten C/X **leeren** – gespeicherte Hotbars gibt es nur im Kreativmodus |
| **H** | Gamma Utils (Nachtsicht), MiniHUD (Anzeige an/aus), Simple Voice Chat (Symbole ausblenden) | Nachtsicht bleibt **H**; MiniHUD auf **F8**; Voice-Chat-Symbole ausblenden **ohne Taste** |
| **M** | Xaero's World Map (Karte), Litematica (Hauptmenü + alle M-Kombinationen), Simple Voice Chat (Mikro stumm) | Karte bleibt **M**; Litematica-Hauptmenü auf **Ö** (die M-Kombinationen bleiben, sie brauchen gehaltenes M + zweite Taste); Mikro stumm auf **Ä** (B ist schon der Xaero-Wegpunkt) |
| **I** | Iris (Shader-Auswahl), Litematica (Info-Overlay), Do a Barrel Roll (an/aus, nur wenn eingeschaltet) | Iris bleibt **I**; Litematica-Info-Overlay **ohne Taste**; Do a Barrel Roll auf **O** |
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
| Simple Voice Chat | Sprechen (halten) ¹ · Menü · Mikro stumm · Chat aus · Symbole aus | Feststelltaste · V · M · N · H |
| Simple Voice Animations | Einstellungen | J |
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

Vanilla-Tasten stehen in `options.txt`, malilib-Mods (Litematica, MiniHUD) und Freecam haben eigene Dateien unter `config/`. Damit das Format sicher stimmt, wird nichts erraten: Pascal stellt im Test-Profil die Belegung oben ein (dazu Freecam „Ignore All Collision“ **aus**, wie auf CraftAttack), danach übernehme ich `options.txt` (nur Tasten- und Sprachzeilen) und die betroffenen `config/`-Dateien als Voreinstellung (`overrides/`) ins Pack.
