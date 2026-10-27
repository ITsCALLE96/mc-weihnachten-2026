#!/usr/bin/env python3
"""Setzt einzelne Schlüssel in einer von einem Plugin erzeugten YAML-Datei, ohne Kommentare und Reihenfolge zu verlieren.
Aufruf: python -I konfig-setzen.py [--weich] <datei.yaml> <werte-datei>
--weich: fehlende Schlüssel nur melden statt abzubrechen (für Plugins, deren Schema wir nicht vorab kennen, z. B. Geyser)
Werte-Datei: je Zeile  pfad.zum.schluessel = wert   (Kommentare mit #). Teile in "…" dürfen Punkte enthalten,
z. B.  lod.distance.by_dimension."minecraft:overworld" = 256
Bricht ab, wenn ein Schlüssel nicht gefunden wird (dann hat sich das Plugin-Schema geändert)."""
import re
import sys
from pathlib import Path


def pfad_teile(pfad):
    return [t.strip('"') for t in re.findall(r'"[^"]*"|[^.]+', pfad)]


def setze(zeilen, teile, wert):
    stapel = []  # (einrückung, schlüssel)
    for i, zeile in enumerate(zeilen):
        m = re.match(r'^(\s*)("([^"]*)"|[A-Za-z0-9_.:-]+):(\s*)(.*)$', zeile)
        if not m or zeile.lstrip().startswith("#"):
            continue
        tiefe = len(m.group(1))
        schluessel = m.group(3) if m.group(3) is not None else m.group(2)
        while stapel and stapel[-1][0] >= tiefe:
            stapel.pop()
        stapel.append((tiefe, schluessel))
        if [s for _, s in stapel] == teile:
            rest = m.group(5)
            kommentar = ""
            k = re.search(r'\s+#.*$', rest)
            if k:
                kommentar = k.group(0)
            zeilen[i] = f"{m.group(1)}{m.group(2)}: {wert}{kommentar}"
            return True
    return False


def main():
    argumente = sys.argv[1:]
    weich = bool(argumente) and argumente[0] == "--weich"
    if weich:
        argumente = argumente[1:]
    if len(argumente) != 2:
        sys.exit(__doc__)
    datei = Path(argumente[0])
    zeilen = datei.read_text(encoding="utf-8").splitlines()
    fehler = []
    for roh in Path(argumente[1]).read_text(encoding="utf-8").splitlines():
        roh = "" if roh.lstrip().startswith("#") else roh.split(" #", 1)[0].strip()
        if not roh:
            continue
        pfad, wert = (x.strip() for x in roh.split("=", 1))
        if setze(zeilen, pfad_teile(pfad), wert):
            print(f"gesetzt: {pfad} = {wert}")
        else:
            fehler.append(pfad)
    datei.write_text("\n".join(zeilen) + "\n", encoding="utf-8")
    if fehler:
        meldung = "nicht gefunden: " + ", ".join(fehler)
        if weich:
            print("WARNUNG " + meldung + " (von Hand prüfen)")
        else:
            sys.exit(meldung)


if __name__ == "__main__":
    main()
