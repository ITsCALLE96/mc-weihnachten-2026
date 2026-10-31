#!/usr/bin/env python3
"""Generalprobe November zurückstellen (Leitung 30.10., Checkliste server/vor-dem-start.md → „Generalprobe zurückstellen“).
Ohne Schalter zeigt es nur die Änderungen (Diff je Datei, zu löschende Merker). Mit --ausfuehren schreibt es, sichert vorher alles nach
/root/mcw-staging/vor-zurueck-<Zeit>/ und setzt den Besitzer amp. Läuft als root auf VM200, Hub, SMP und Proxy GESTOPPT (sonst schreiben sie Merker neu).
Was es NICHT kann (Konsole bzw. andere Sessions, siehe vor-dem-start.md): weihnachtsinsel:zuruecksetzen/vorbereiten, nether/end close,
Leitfaden-Phase 0, Hub-Datapack-Text (Spawn & Welt), Statistik-Season, neue SMP-Welt.
Aufruf: python3 generalprobe-zurueck.py [--ausfuehren]
Reset-Probe (31.10.): Umgebung NUR_SMP=<Minecraft-Ordner> PORT=<port> → nur die SMP-Regeln und SMP-Merker in diesem Ordner,
Hub, Proxy, discord.json und der geteilte Ordner bleiben unberührt.
"""
import difflib
import json
import os
import re
import shutil
import sys
import time

I = "/home/amp/.ampdata/instances"
NUR_SMP = os.environ.get("NUR_SMP")
SMP = NUR_SMP or f"{I}/MinecraftSMP01/Minecraft"
HUB = f"{I}/MinecraftHub01/Minecraft"
PROXY = f"{I}/MinecraftProxy01/Minecraft"
GETEILT = "/srv/ampdata/mc-netzwerk-geteilt"
FINAL_GILDE = "899675876298469457"  # leonraws - cruiserDE; Testserver-C96 und testserver crleon fliegen raus
AUSFUEHREN = "--ausfuehren" in sys.argv
SICHERUNG = time.strftime("/root/mcw-staging/vor-zurueck-%m%d-%H%M")

# (Datei, [(Suchmuster, Ersatz)]) – jedes Muster muss genau einmal passen, sonst Abbruch (Datei weicht vom erwarteten Stand ab)
ERSETZEN = [
    (f"{SMP}/plugins/Serverwahl/config.yml", [
        (r'(?m)^(  text: )"<red>Der Server ist noch nicht geöffnet"$', r'\1"<red>Der Server öffnet am <white>27.11.</white>"'),
        (r'(?m)^(  erster-tag: )"2026-11-01"$', r'\1"12-01"'),
        (r'(?m)^(  aktive-liste: )liste-november$', r"\1liste"),
        (r'(?m)^  start: "2026-10-30"\n', ""),
    ]),
    (f"{HUB}/plugins/Serverwahl/config.yml", [
        (r'(?m)^(  text: )"<red>Der Server ist noch nicht geöffnet"$', r'\1"<red>Der Server öffnet am <white>27.11.</white>"'),
        (r'(?m)^(\s+- )"<gray>Generalprobe im November"$', r'\1"<gray>Start am <white>27.11.</white>"'),
        (r'(?m)^(  aktive-liste: )liste-november$', r"\1liste"),
        (r'(?m)^(    gilden: )\[.*\]$', rf'\1["{FINAL_GILDE}"]'),
    ]),
    (f"{PROXY}/velocity.toml", [
        (r'<gray>Generalprobe im November</gray>"', '<gray>Start am <white>27.11.</white></gray>"'),
    ]),
]
if NUR_SMP:
    ERSETZEN = ERSETZEN[:1]
LOESCHEN = [
    f"{SMP}/plugins/Serverwahl/eroeffnet.txt",
    f"{SMP}/plugins/Serverwahl/termine.txt",
    f"{SMP}/plugins/Serverwahl/mission-stand.yml",
    f"{HUB}/plugins/Serverwahl/termine.txt",
    f"{GETEILT}/status/smp-offen",
]
if NUR_SMP:
    LOESCHEN = [p for p in LOESCHEN if p.startswith(SMP)]


def zeigen(pfad, alt, neu):
    for z in difflib.unified_diff(alt.splitlines(), neu.splitlines(), pfad, pfad + " (neu)", lineterm="", n=0):
        print(z)


def sichern(pfad):
    ziel = SICHERUNG + pfad
    os.makedirs(os.path.dirname(ziel), exist_ok=True)
    shutil.copy2(pfad, ziel)


def schreiben(pfad, text):
    if AUSFUEHREN:
        sichern(pfad)
        open(pfad, "w", encoding="utf-8", newline="").write(text)
        shutil.chown(pfad, "amp", "amp")


for port in ((int(os.environ.get("PORT", "25569")),) if NUR_SMP else (25577, 25567, 25568)):
    import socket
    with socket.socket() as s:
        s.settimeout(1)
        if s.connect_ex(("127.0.0.1", port)) == 0 and AUSFUEHREN:
            sys.exit(f"Abbruch: Port {port} läuft noch – Proxy, Hub und SMP in AMP stoppen")

fehler = 0
geplant = []
for pfad, regeln in ERSETZEN:
    alt = open(pfad, encoding="utf-8", newline="").read()
    neu = alt
    for muster, ersatz in regeln:
        neu, n = re.subn(muster, ersatz, neu)
        if n != 1:
            print(f"FEHLER {pfad}: Muster {muster!r} passt {n}× (erwartet 1) – Datei von Hand prüfen")
            fehler += 1
    zeigen(pfad, alt, neu)
    if neu != alt:
        geplant.append((pfad, neu))
if fehler:
    sys.exit(f"{fehler} Muster passten nicht – nichts geschrieben")

for pfad, neu in geplant:
    schreiben(pfad, neu)

# discord.json: Test-Guilds aus den Einträgen, Einträge ohne Guild fallen weg (nicht bei NUR_SMP)
dj = f"{GETEILT}/whitelist/discord.json"
d = {"eintraege": []} if NUR_SMP else json.load(open(dj, encoding="utf-8"))
vorher = len(d["eintraege"])
for e in d["eintraege"]:
    e["gilden"] = [g for g in e.get("gilden", []) if g == FINAL_GILDE]
weg = [e["name"] for e in d["eintraege"] if not e["gilden"]]
d["eintraege"] = [e for e in d["eintraege"] if e["gilden"]]
print(f"discord.json: {vorher} → {len(d['eintraege'])} Einträge, fallen weg: {weg or '–'}")
if AUSFUEHREN and not NUR_SMP:
    sichern(dj)
    open(dj, "w", encoding="utf-8").write(json.dumps(d, indent=2, ensure_ascii=False))
    shutil.chown(dj, "amp", "amp")

for pfad in LOESCHEN:
    if os.path.exists(pfad):
        print("löschen:", pfad)
        if AUSFUEHREN:
            sichern(pfad)
            os.remove(pfad)
    else:
        print("schon weg:", pfad)

print("ausgeführt, Sicherung: " + SICHERUNG if AUSFUEHREN else "nur angezeigt – mit --ausfuehren schreiben")
