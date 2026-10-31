#!/usr/bin/env python3
"""Spieler-Spuren auf VM200 entfernen, damit der erste Beitritt wie bei einem neuen Spieler abläuft (Pascal 30.10., wiederverwendbar vor 21.11./27.11.).

Entfernt (Hub und SMP, beide GESTOPPT):
  - Spielerdaten: world/players/{data,advancements,stats}/* (Inventar, Ender-Kiste, Position, Tags, Advancements, Statistik); alt: world/playerdata …
  - spielerbezogene Scoreboard-Einträge in world/data/minecraft/scoreboard.dat (Spielernamen; „#…“-Einträge und Entity-UUIDs = Weltzustand bleiben,
    außer den Testnetz-Resten #tag/#zuletzt insel_kalender, die kalender/load neu anlegt),
    Spielernamen in Team-Listen
  - SMP: plugins/Serverwahl/{mission-stand.yml, eroeffnet.txt, taeglich.txt, neujahr.txt} und der Eröffnungs-Merker geteilt/status/smp-offen
    (danach ist das SMP wieder „zu“; geöffnet wird wie am 27.11. über den Hub bzw. „serverwahl oeffnen“)
Bleibt: Welt, Bauten, Datapacks samt Weltzustand, Regionen (WorldGuard), LuckPerms, Whitelist, Ops, Termine, Prism-Protokoll.
Vorher Sicherung aller betroffenen Dateien nach /srv/ampdata/mc-netzwerk-sicherung/spieler-reset-<zeit>.tgz.

Andere Instanz (Reset-Probe, 31.10.): Umgebung INSTANZ=MinecraftTestwelt01 PORT=25569 → nur diese Instanz wie das SMP, Hub und geteilter Merker
bleiben unberührt.
Aufruf als root auf VM200 (Skript und nbt.py im selben Ordner):
  python3 spieler-reset.py            → zeigt nur, was passieren würde
  python3 spieler-reset.py --ausfuehren
"""
import datetime
import os
import re
import socket
import subprocess
import sys
import tarfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import nbt  # noqa: E402

INST = "/home/amp/.ampdata/instances"
ZIEL = os.environ.get("INSTANZ", "MinecraftSMP01")
SERVER = {"MinecraftHub01": 25567, "MinecraftSMP01": 25568} if ZIEL == "MinecraftSMP01" else {ZIEL: int(os.environ.get("PORT", "25569"))}
SICHERUNG = "/srv/ampdata/mc-netzwerk-sicherung"
GETEILT = "/srv/ampdata/mc-netzwerk-geteilt"
SMP_MERKER = ["mission-stand.yml", "eroeffnet.txt", "taeglich.txt", "neujahr.txt"]
# Java-Namen 3–16 Zeichen, Bedrock mit Floodgate-Präfix „.“; „#…“ (Datapack-Werte) und UUIDs (Entities) passen nicht
SPIELERNAME = re.compile(r"^\.?[A-Za-z0-9_]{1,16}$")
# Testnetz-Reste im Weltzustand (Spawn & Welt 30.10.): Kalender-Tag und „zuletzt gemeldet“; kalender/load legt beide neu an (#tag 0, #zuletzt = #tag).
# Bliebe #zuletzt auf 24, käme die Meldung „neues Türchen“ im Dezember erst ab Tag 25
WELT_RESTE = {("#tag", "insel_kalender"), ("#zuletzt", "insel_kalender")}
# Mission muss im Startzustand sein: #stufe 0, keine #t*_*, #gefeiert, #laeuft, #feuer (sonst nur Warnung, nichts ändern)
MISSION_LAEUFT = re.compile(r"^#(t\d+_\d+|gefeiert|laeuft|feuer)$")

ausfuehren = "--ausfuehren" in sys.argv


def laeuft(port):
    with socket.socket() as s:
        s.settimeout(1)
        return s.connect_ex(("127.0.0.1", port)) == 0


def spielerdateien(welt):
    dateien = []
    for teil in ("players/data", "players/advancements", "players/stats", "playerdata", "advancements", "stats"):
        d = os.path.join(welt, teil)
        if os.path.isdir(d):
            dateien += [os.path.join(d, f) for f in sorted(os.listdir(d)) if os.path.isfile(os.path.join(d, f))]
    return dateien


def scoreboard_bereinigen(pfad, schreiben):
    name, w = nbt.lesen(pfad)
    data = w["data"]
    weg = []
    if "PlayerScores" in data:
        bleiben = nbt.NbtList(data["PlayerScores"].typ)
        for e in data["PlayerScores"]:
            if SPIELERNAME.match(e["Name"]) and not e["Name"].startswith("#") or (e["Name"], e["Objective"]) in WELT_RESTE:
                weg.append(f"{e['Name']} {e['Objective']}")
            else:
                bleiben.append(e)
                wert = e.get("Score", (3, 0))[1]
                if e["Objective"] == "wi_mission" and (e["Name"] == "#stufe" and wert != 0 or MISSION_LAEUFT.match(e["Name"])):
                    print(f"WARNUNG: Mission nicht im Startzustand ({e['Name']} = {wert}) – Spawn & Welt fragen")
        data["PlayerScores"] = bleiben
    for t in data.get("Teams", []):
        spieler = t.get("Players")
        if spieler:
            rest = nbt.NbtList(spieler.typ, [p for p in spieler if not SPIELERNAME.match(p)])
            weg += [f"{p} (Team {t.get('Name')})" for p in spieler if SPIELERNAME.match(p)]
            t["Players"] = rest
    if weg and schreiben:
        nbt.schreiben(pfad, name, w)
    return weg


def main():
    laufend = [n for n, p in SERVER.items() if laeuft(p)]
    if laufend:
        sys.exit(f"Abbruch: {', '.join(laufend)} läuft noch – erst in AMP stoppen")

    betroffen, plan = [], []
    for inst in SERVER:
        mc = f"{INST}/{inst}/Minecraft"
        welt = f"{mc}/world"
        for f in spielerdateien(welt):
            betroffen.append(f)
            plan.append(("loeschen", f))
        sb = f"{welt}/data/minecraft/scoreboard.dat"
        if os.path.exists(sb):
            eintraege = scoreboard_bereinigen(sb, False)
            if eintraege:
                betroffen.append(sb)
                plan.append(("scoreboard", sb, eintraege))
        if inst == ZIEL:
            for m in SMP_MERKER:
                f = f"{mc}/plugins/Serverwahl/{m}"
                if os.path.exists(f):
                    betroffen.append(f)
                    plan.append(("loeschen", f))
    offen = f"{GETEILT}/status/smp-offen" if ZIEL == "MinecraftSMP01" else "/nicht-vorhanden"
    if os.path.exists(offen):
        betroffen.append(offen)
        plan.append(("loeschen", offen))

    if not plan:
        print("Nichts zu tun – keine Spieler-Spuren gefunden")
        return
    for p in plan:
        if p[0] == "scoreboard":
            print(f"Scoreboard {p[1]}: entferne {', '.join(p[2])}")
        else:
            print(f"lösche {p[1]}")
    if not ausfuehren:
        print(f"\n{len(plan)} Schritte. Probelauf – nichts geändert. Ausführen mit --ausfuehren")
        return

    os.makedirs(SICHERUNG, exist_ok=True)
    zeit = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
    tgz = f"{SICHERUNG}/spieler-reset-{zeit}.tgz"
    with tarfile.open(tgz, "w:gz") as t:
        for f in betroffen:
            t.add(f, arcname=f.lstrip("/"))
    print(f"Sicherung: {tgz} ({len(betroffen)} Dateien)")

    for p in plan:
        if p[0] == "scoreboard":
            scoreboard_bereinigen(p[1], True)
        else:
            os.remove(p[1])
    for inst in SERVER:
        subprocess.run(["chown", "-R", "amp:amp", f"{INST}/{inst}/Minecraft/world/data"], check=False)
    print("fertig – Spieler-Spuren entfernt. Danach Hub und SMP in AMP starten.")


if __name__ == "__main__":
    main()
