#!/usr/bin/env python3
"""GrimAC 2.3.75: Fehlalarme leise stellen (Leitung/Pascal 31.10.). „Post“ (player block placement) und „RotationPlace“ meldeten bei cruiserDE
x10–x80, sehr wahrscheinlich durch Client-Mods des Modpacks bzw. Latenz. An beiden hingen nur Meldungen, keine Kicks: Post in eigener Gruppe
(Alert ab 20, Webhook/Proxy ab 40), RotationPlace über „Place“ in der Gruppe Misc (Alert ab 10). Neu: Gruppe „Leise“ nur mit [log],
Post-Gruppe entfernt, RotationPlace aus Misc ausgenommen. Alle anderen Prüfungen und Meldungen für Moderatoren bleiben.
Achtung: Ob Grim die Platzierung bei RotationPlace selbst abbricht, steuert nicht diese Datei. Melden Spieler „Block lässt sich nicht setzen“,
ist das der nächste Schritt.
Aufruf: python3 strafen-setzen.py <plugins/GrimAC/punishments.yml>   (danach in der Konsole: grim reload). Zweiter Lauf ändert nichts.
"""
import re
import sys
from pathlib import Path

datei = Path(sys.argv[1])
text = datei.read_text(encoding="utf-8").replace("\r\n", "\n")
LEISE = """  # Leitung/Pascal 31.10.: Fehlalarme mit Modpack-Mods (cruiserDE), nur ins Grim-Log, keine Meldung im Spiel/Discord
  Leise:
    remove-violations-after: 300
    checks:
      - "Post"
      - "RotationPlace"
    commands:
      - "1:1 [log]"
"""
if "\n  Leise:\n" in text:
    print("punishments.yml: schon umgestellt")
    sys.exit(0)
# alte Post-Gruppe (Kopf „  Post:“ bis zur nächsten Gruppe) durch die leise Gruppe ersetzen
text, n = re.subn(r"(?m)^  Post:\n(?:    .*\n|      .*\n)+", LEISE, text, count=1)
if n != 1:
    sys.exit("Gruppe Post nicht gefunden")
# RotationPlace aus Misc ausnehmen („Place“ trifft sonst auch RotationPlace)
text, n = re.subn(r'(?m)^(  Misc:\n(?:    .*\n)*?    checks:\n(?:      - .*\n)*?      - "Place"\n)', r'\1      - "!RotationPlace"\n', text, count=1)
if n != 1:
    sys.exit("Misc/Place nicht gefunden")
datei.write_text(text, encoding="utf-8")
print("punishments.yml: Post und RotationPlace nur noch im Log")
