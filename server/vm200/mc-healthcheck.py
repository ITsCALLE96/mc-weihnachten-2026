#!/usr/bin/env python3
"""Ausfall-Alarm Minecraft-Netz (Leitung 30.10.): fragt Velocity (VM200 192.168.178.78:25577) per Minecraft-Statusabfrage ab, wie es die
Serverliste im Client tut. Zweimal hintereinander keine Antwort → Discord-Webhook „ausgefallen“, wieder da → „wieder erreichbar“.
Läuft auf dem Proxmox-Host per Cron alle 2 Minuten (/etc/cron.d/mc-healthcheck). Nur Python-Standardbibliothek.
Webhook-URL in /root/.mc-alarm-webhook (eine Zeile, Rechte 600, legt Pascal an; nie ins Repo). Fehlt die Datei, wird nur geloggt.
Zustand: /var/lib/mc-healthcheck/zustand.json (Alarmpause 03:58–04:10 entfernt 01.11., es gibt keinen täglichen Neustart mehr)
TPS-Alarm (Pascal 01.11.): liest per SSH die Status-Dateien, die das serverwahl-Plugin alle 20 s schreibt (TpsWaechter,
/srv/ampdata/mc-netzwerk-geteilt/status/tps-<server>.json). TPS (1 min) zweimal hintereinander unter 18 → „TPS niedrig“,
wieder ab 19 → „TPS wieder normal“. Status-Dateien älter als 5 min zählen nicht (Server aus → dafür ist der Ausfall-Alarm da).
Test: mc-healthcheck.py --test  (schickt eine Testnachricht an den Webhook)
"""
import json
import os
import socket
import struct
import subprocess
import sys
import time
import urllib.request

ZIEL = ("192.168.178.78", 25577)
WEBHOOK_DATEI = "/root/.mc-alarm-webhook"
ZUSTAND = "/var/lib/mc-healthcheck/zustand.json"
FEHLER_BIS_ALARM = 2
TPS_DATEIEN = "/srv/ampdata/mc-netzwerk-geteilt/status/tps-*.json"
TPS_GRENZE = 18.0
TPS_ENTWARNUNG = 19.0


def varint(n):
    out = b""
    while True:
        b = n & 0x7F
        n >>= 7
        out += bytes([b | (0x80 if n else 0)])
        if not n:
            return out


def varint_lesen(s):
    n = 0
    for i in range(5):
        b = s.recv(1)
        if not b:
            raise OSError("Verbindung zu")
        n |= (b[0] & 0x7F) << (7 * i)
        if not b[0] & 0x80:
            return n
    raise OSError("VarInt zu lang")


def status():
    """liefert (online, max) oder wirft OSError"""
    with socket.create_connection(ZIEL, timeout=8) as s:
        s.settimeout(8)
        host = ZIEL[0].encode()
        hs = varint(0) + varint(-1 & 0xFFFFFFFF) + varint(len(host)) + host + struct.pack(">H", ZIEL[1]) + varint(1)
        s.sendall(varint(len(hs)) + hs + varint(1) + varint(0))
        laenge = varint_lesen(s)
        daten = b""
        while len(daten) < laenge:
            teil = s.recv(laenge - len(daten))
            if not teil:
                raise OSError("Antwort unvollständig")
            daten += teil
    # Paket-ID, dann Länge des JSON-Strings überspringen
    i = 1
    while daten[i] & 0x80:
        i += 1
    j = json.loads(daten[i + 1:].decode("utf-8"))
    return j["players"]["online"], j["players"]["max"]


def senden(text):
    if not os.path.exists(WEBHOOK_DATEI):
        print("kein Webhook eingerichtet:", text)
        return
    url = open(WEBHOOK_DATEI, encoding="utf-8").read().strip()
    req = urllib.request.Request(url, data=json.dumps({"content": text}).encode(), headers={"Content-Type": "application/json", "User-Agent": "mc-healthcheck"})
    urllib.request.urlopen(req, timeout=10).read()


def tps_lesen():
    """liefert {server: daten} aus den Status-Dateien auf VM200, leer bei Fehler"""
    try:
        aus = subprocess.run(["ssh", "-o", "BatchMode=yes", "-o", "ConnectTimeout=5", "root@" + ZIEL[0],
                              f"for f in {TPS_DATEIEN}; do [ -f \"$f\" ] && cat \"$f\" && echo; done"],
                             capture_output=True, text=True, timeout=20).stdout
    except (OSError, subprocess.SubprocessError) as e:
        print(time.strftime("%F %T"), "TPS nicht lesbar:", e)
        return {}
    werte = {}
    for zeile in aus.splitlines():
        try:
            d = json.loads(zeile)
            werte[d["server"]] = d
        except (ValueError, KeyError):
            pass
    return werte


def tps_pruefen(z, jetzt):
    """TPS-Alarm je Server; z["tps"] = {server: {"niedrig": n, "alarm": bool}}"""
    zt = z.setdefault("tps", {})
    for server, d in tps_lesen().items():
        if time.time() * 1000 - d["zeit"] > 5 * 60_000:
            continue
        t = zt.setdefault(server, {"niedrig": 0, "alarm": False})
        tps, mspt, spieler = d["tps1m"], d["mspt"], d["spieler"]
        if tps < TPS_GRENZE:
            t["niedrig"] += 1
            if t["niedrig"] >= 2 and not t["alarm"]:
                senden(f"🟠 {server.upper()}: TPS niedrig – {tps:.1f} TPS, {mspt:.0f} ms pro Tick, {spieler} Spieler ({jetzt}, seit ca. {2 * t['niedrig']} min). "
                       f"Verlauf: plugins/Serverwahl/tps/")
                t["alarm"] = True
        else:
            t["niedrig"] = 0
            if t["alarm"] and tps >= TPS_ENTWARNUNG:
                senden(f"✅ {server.upper()}: TPS wieder normal ({tps:.1f}, {jetzt}).")
                t["alarm"] = False
        print(time.strftime("%F %T"), f"tps {server} {tps:.1f} mspt {mspt:.1f}")


def main():
    if "--test" in sys.argv:
        senden("🧪 Test: Ausfall-Alarm Minecraft-Netz ist eingerichtet.")
        print("Testnachricht gesendet")
        return
    os.makedirs(os.path.dirname(ZUSTAND), exist_ok=True)
    z = json.load(open(ZUSTAND)) if os.path.exists(ZUSTAND) else {"fehler": 0, "alarm": False}
    jetzt = time.strftime("%H:%M")
    try:
        online, maximal = status()
        if z["alarm"]:
            senden(f"✅ Minecraft-Netz wieder erreichbar ({jetzt}, {online}/{maximal} Spieler).")
        z.update(fehler=0, alarm=False)
        print(time.strftime("%F %T"), f"ok {online}/{maximal}")
    except (OSError, ValueError, KeyError) as e:
        z["fehler"] += 1
        print(time.strftime("%F %T"), "keine Antwort:", e)
        if z["fehler"] >= FEHLER_BIS_ALARM and not z["alarm"]:
            senden(f"🔴 Minecraft-Netz antwortet nicht (seit ca. {2 * z['fehler']} min, {jetzt}). Proxy 192.168.178.78:25577 prüfen.")
            z["alarm"] = True
    tps_pruefen(z, jetzt)
    json.dump(z, open(ZUSTAND, "w"))


if __name__ == "__main__":
    main()
