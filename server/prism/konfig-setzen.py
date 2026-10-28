#!/usr/bin/env python3
"""Prism 4.5: unsere Abweichungen in die vom Plugin erzeugte prism.conf (HOCON) schreiben, Kommentare bleiben.
Aufruf: python -I server/prism/konfig-setzen.py <plugins/prism/prism.conf>
Chat und Befehle mitschreiben (Pascal 28.10.), Purge täglich 05:00 alles älter als 90 Tage (Leitung 28.10.), Meldungen auf Deutsch.
Speicher bleibt SQLite (Standard in storage.conf). Bricht ab, wenn ein Schlüssel fehlt (Schema geändert)."""
import re
import sys
from pathlib import Path

# (Suchmuster, Ersatz, schon-gesetzt-Muster) – zweiter Lauf ändert nichts
WERTE = [
    (r"(?m)^(\s*player-chat=)false", r"\g<1>true", r"(?m)^\s*player-chat=true"),
    (r"(?m)^(\s*player-command=)false", r"\g<1>true", r"(?m)^\s*player-command=true"),
    (r'(?m)^(\s*command="prism purge start before:)6w( --nodefaults")', r"\g<1>90d\g<2>", r"before:90d --nodefaults"),
    (r'(?m)^(\s*cron=")0 0 0 \? \* \* \*(")', r"\g<1>0 0 5 ? * * *\g<2>", r'cron="0 0 5 \? \* \* \*"'),
    (r'(?m)^(\s*default-locale=")en_US(")', r"\g<1>de_DE\g<2>", r'default-locale="de_DE"'),
]

datei = Path(sys.argv[1])
text = datei.read_text(encoding="utf-8")
for muster, ersatz, fertig in WERTE:
    text, n = re.subn(muster, ersatz, text, count=1)
    if n != 1 and not re.search(fertig, text):
        sys.exit(f"nicht gefunden: {muster}")
datei.write_text(text, encoding="utf-8")
print("prism.conf: Chat + Befehle an, Purge 05:00 / 90 Tage, de_DE")
