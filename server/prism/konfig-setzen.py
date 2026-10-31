#!/usr/bin/env python3
"""Prism 4.5: unsere Abweichungen in die vom Plugin erzeugte prism.conf (HOCON) schreiben, Kommentare bleiben.
Aufruf: python -I server/prism/konfig-setzen.py <plugins/prism/prism.conf>
Chat und Befehle mitschreiben (Pascal 28.10.), Purge täglich 04:30 alles älter als 90 Tage (Leitung 28.10., Uhrzeit 30.10.: nach dem Neustart 04:00), Meldungen auf Deutsch.
Speicher bleibt SQLite (Standard in storage.conf). Bricht ab, wenn ein Schlüssel fehlt (Schema geändert)."""
import re
import sys
from pathlib import Path

# (Suchmuster, Ersatz, schon-gesetzt-Muster) – zweiter Lauf ändert nichts
WERTE = [
    (r"(?m)^(\s*player-chat=)false", r"\g<1>true", r"(?m)^\s*player-chat=true"),
    (r"(?m)^(\s*player-command=)false", r"\g<1>true", r"(?m)^\s*player-command=true"),
    (r'(?m)^(\s*command="prism purge start before:)6w( --nodefaults")', r"\g<1>90d\g<2>", r"before:90d --nodefaults"),
    (r'(?m)^(\s*cron=")0 0 [05] \? \* \* \*(")', r"\g<1>0 30 4 ? * * *\g<2>", r'cron="0 30 4 \? \* \* \*"'),
    (r'(?m)^(\s*default-locale=")en_US(")', r"\g<1>de_DE\g<2>", r'default-locale="de_DE"'),
]

# Erz-Meldungen (Leitung/Pascal 31.10.): nur noch Antiker Schutt und Diamanterz. Kupfer/Eisen/Gold/Smaragd/Lapis fluteten den Chat,
# und die Lichtstufe in der Meldung ist wegen Fullbright im Modpack wertlos (Lichtgrenzen bleiben 0–100, also neutral)
ERZE_RAUS = ["copper", "emerald", "gold", "iron", "lapis", "redstone", "coal"]

datei = Path(sys.argv[1])
text = datei.read_text(encoding="utf-8")
for muster, ersatz, fertig in WERTE:
    text, n = re.subn(muster, ersatz, text, count=1)
    if n != 1 and not re.search(fertig, text):
        sys.exit(f"nicht gefunden: {muster}")
start = text.find("block-break-alerts {")
ende = text.find("block-place-alerts {", start)
if start < 0 or ende < 0:
    sys.exit("block-break-alerts nicht gefunden")
abschnitt = text[start:ende]
eintrag = re.compile(r"\n[ \t]*\{\n(?:(?!\n[ \t]*\}).)*?\"minecraft:(?:" + "|".join(ERZE_RAUS) + r")_ores\"(?:(?!\n[ \t]*\}).)*?\n[ \t]*\},?", re.S)
abschnitt, weg = eintrag.subn("", abschnitt)
abschnitt = re.sub(r"\},(\s*\n[ \t]*\])", r"}\1", abschnitt)  # kein Komma nach dem letzten Eintrag
text = text[:start] + abschnitt + text[ende:]
datei.write_text(text, encoding="utf-8")
print(f"prism.conf: Chat + Befehle an, Purge 04:30 / 90 Tage, de_DE, Erz-Meldungen nur Schutt + Diamant ({weg} Einträge entfernt)")
