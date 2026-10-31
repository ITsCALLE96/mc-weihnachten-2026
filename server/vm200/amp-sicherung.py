#!/usr/bin/env python3
"""AMP-eigene Sicherung (LocalFileBackupPlugin + AMP-Zeitplan) für die drei Minecraft-Instanzen einschalten (Leitung/Pascal 30.10., Standardmittel wie bei
Minecraft101/ForeverWorld01: Interval Trigger + TakeBackup, ReplaceOldest). Nutzt den von AMP mitgelieferten Trigger „Hourly Backup“ und stellt nur
Stunden/Minuten/Name/Aktiv um. **AMP-Zeitplan rechnet in UTC** (gemessen 30.10.: Stunde 21 lief um 22:30 MEZ), Stunden unten also UTC.
Pascal 30.10.: SMP jede Stunde zur Minute 40 (live, ~2 min, ~3,3 GB), 24 Stände = letzte 24 h; Hub 03:20 und Proxy 03:25 MEZ (02:xx UTC) täglich.
Reihenfolge nachts (MEZ): SMP 03:40 → QNAP-Kopie 03:47 → Neustart 04:00 (mc-neustart.sh) → Prism-Purge 04:30. Sommerzeit: AMP-Zeiten eine Stunde früher.
Aufbewahrung, ältester zuerst: Hub 7 ≤ 8 GB, Proxy 7 ≤ 4 GB. SMP seit 31.10. (Pascal, Forever-World ohne Weltgrenze): 12 Stände (halber Tag), max. 100 GB,
je Sicherung bis 30 GB (AMP-Standard 10140 MB hätte eine wachsende Welt irgendwann still verworfen). Ab ~10 GB je Stand 2-stündlich prüfen.
SMP: world/lss-lod ausgenommen (backupExclusions.conf, LOD-Daten lassen sich neu erzeugen).
Als root auf VM200, betroffene AMP-Instanzen GESTOPPT (ampinstmgr -q), sonst überschreibt AMP die Dateien beim Beenden.
Aufruf: amp-sicherung.py [Instanz …]   (ohne Angabe alle drei)
"""
import json
import os
import re
import shutil
import sys

I = "/home/amp/.ampdata/instances"
PLAN = {
    "MinecraftSMP01": dict(name="Sicherung stündlich", stunden=list(range(24)), minute=40, anzahl=12, gesamt_mb=102400, einzel_mb=30720),
    "MinecraftHub01": dict(name="Sicherung täglich", stunden=[2], minute=20, anzahl=7, gesamt_mb=8192),
    "MinecraftProxy01": dict(name="Sicherung täglich", stunden=[2], minute=25, anzahl=7, gesamt_mb=4096),
}
AUSNAHMEN = {"MinecraftSMP01": ["world|lss-lod"]}


def kvp(pfad, werte):
    s = open(pfad, encoding="utf-8").read()
    for k, v in werte.items():
        s, n = re.subn(rf"^{re.escape(k)}=.*$", f"{k}={v}", s, count=1, flags=re.M)
        if n != 1:
            sys.exit(f"{k} fehlt in {pfad}")
    open(pfad, "w", encoding="utf-8").write(s)


auswahl = sys.argv[1:] or list(PLAN)
for inst in auswahl:
    if inst not in PLAN:
        sys.exit(f"unbekannte Instanz {inst}")
for inst in auswahl:
    p = PLAN[inst]
    d = f"{I}/{inst}"
    grenzen = {"Limits.MaxBackupCount": p["anzahl"], "Limits.MaxTotalSizeMB": p["gesamt_mb"], "Limits.ReplacePolicy": "ReplaceOldest"}
    if "einzel_mb" in p:
        grenzen["Limits.MaxIndividualSizeMB"] = p["einzel_mb"]
    kvp(f"{d}/LocalFileBackupPlugin.kvp", grenzen)
    zp = f"{d}/scheduleTimes.json"
    shutil.copy2(zp, zp + ".vor-sicherung")
    z = json.load(open(zp, encoding="utf-8"))
    trig = [t for t in z.values() if any(a["TaskMethodName"] == "Event.LocalFileBackupPlugin.TakeBackup" for a in t["Tasks"].values())]
    if len(trig) != 1:
        sys.exit(f"{inst}: {len(trig)} Sicherungs-Trigger statt 1")
    t = trig[0]
    t.update(Name=p["name"], Description="Minecraft-Netz (30.10.): AMP-Sicherung (Zeiten UTC), Kopie 03:47 MEZ auf die QNAP", MatchHours=p["stunden"],
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
    print(f"{inst}: {p['name']} UTC {p['stunden']}:{p['minute']:02d}, {p['anzahl']} Stände, max. {p['gesamt_mb']} MB"
          + (f", je Sicherung bis {p['einzel_mb']} MB" if "einzel_mb" in p else ""))
