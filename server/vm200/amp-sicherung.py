#!/usr/bin/env python3
"""AMP-eigene Sicherung (LocalFileBackupPlugin + AMP-Zeitplan) für die drei Minecraft-Instanzen einschalten (Leitung/Pascal 30.10., Standardmittel wie bei
Minecraft101/ForeverWorld01: Interval Trigger + TakeBackup, ReplaceOldest). Nutzt den von AMP mitgelieferten Trigger „Hourly Backup“ und stellt nur
Stunden/Minuten/Name/Aktiv um. SMP alle 6 h (03:30, 09:30, 15:30, 21:30), Hub 03:20 und Proxy 03:25 täglich – vor der QNAP-Kopie 03:47.
Aufbewahrung (Platz /srv/ampdata 30.10.: 136 GB frei): SMP 16 Stände, max. 64 GB, Hub 7 ≤ 8 GB, Proxy 7 ≤ 4 GB, ältester zuerst.
SMP: world/lss-lod ausgenommen (backupExclusions.conf, LOD-Daten lassen sich neu erzeugen).
Als root auf VM200, betroffene AMP-Instanzen GESTOPPT (ampinstmgr -q), sonst überschreibt AMP die Dateien beim Beenden.
"""
import json
import os
import re
import shutil
import sys

I = "/home/amp/.ampdata/instances"
PLAN = {
    "MinecraftSMP01": dict(name="Sicherung alle 6 h", stunden=[3, 9, 15, 21], minute=30, anzahl=16, gesamt_mb=65536),
    "MinecraftHub01": dict(name="Sicherung täglich", stunden=[3], minute=20, anzahl=7, gesamt_mb=8192),
    "MinecraftProxy01": dict(name="Sicherung täglich", stunden=[3], minute=25, anzahl=7, gesamt_mb=4096),
}
AUSNAHMEN = {"MinecraftSMP01": ["world|lss-lod"]}


def kvp(pfad, werte):
    s = open(pfad, encoding="utf-8").read()
    for k, v in werte.items():
        s, n = re.subn(rf"^{re.escape(k)}=.*$", f"{k}={v}", s, count=1, flags=re.M)
        if n != 1:
            sys.exit(f"{k} fehlt in {pfad}")
    open(pfad, "w", encoding="utf-8").write(s)


for inst, p in PLAN.items():
    d = f"{I}/{inst}"
    kvp(f"{d}/LocalFileBackupPlugin.kvp", {"Limits.MaxBackupCount": p["anzahl"], "Limits.MaxTotalSizeMB": p["gesamt_mb"],
                                            "Limits.ReplacePolicy": "ReplaceOldest"})
    zp = f"{d}/scheduleTimes.json"
    shutil.copy2(zp, zp + ".vor-sicherung")
    z = json.load(open(zp, encoding="utf-8"))
    trig = [t for t in z.values() if any(a["TaskMethodName"] == "Event.LocalFileBackupPlugin.TakeBackup" for a in t["Tasks"].values())]
    if len(trig) != 1:
        sys.exit(f"{inst}: {len(trig)} Sicherungs-Trigger statt 1")
    t = trig[0]
    t.update(Name=p["name"], Description="Minecraft-Netz (30.10.): AMP-Sicherung, Kopie 03:47 auf die QNAP", MatchHours=p["stunden"],
             MatchMinutes=[p["minute"]], MatchDays=list(range(7)), MatchMonths=list(range(12)), EnabledState=1)
    for a in t["Tasks"].values():
        a["EnabledState"] = 1
        a["ParameterMapping"].update(Local="true", S3="false", DirtyOnly="false", BackupWhileRunning="true")
    json.dump(z, open(zp, "w", encoding="utf-8"))
    if inst in AUSNAHMEN:
        open(f"{d}/backupExclusions.conf", "w", encoding="utf-8").write("\n".join(AUSNAHMEN[inst]) + "\n")
    for f in ("LocalFileBackupPlugin.kvp", "scheduleTimes.json", "scheduleTimes.json.vor-sicherung", "backupExclusions.conf"):
        if os.path.exists(f"{d}/{f}"):
            shutil.chown(f"{d}/{f}", "amp", "amp")
    print(f"{inst}: {p['name']} {p['stunden']}:{p['minute']:02d}, {p['anzahl']} Stände, max. {p['gesamt_mb']} MB")
