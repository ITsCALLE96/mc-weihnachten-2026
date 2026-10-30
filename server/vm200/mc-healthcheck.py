#!/usr/bin/env python3
"""Ausfall-Alarm Minecraft-Netz (Leitung 31.10.): fragt Velocity (VM200 192.168.178.78:25577) per Minecraft-Statusabfrage ab, wie es die
Serverliste im Client tut. Zweimal hintereinander keine Antwort → Discord-Webhook „ausgefallen“, wieder da → „wieder erreichbar“.
Läuft auf dem Proxmox-Host per Cron alle 2 Minuten (/etc/cron.d/mc-healthcheck). Nur Python-Standardbibliothek.
Webhook-URL in /root/.mc-alarm-webhook (eine Zeile, Rechte 600, legt Pascal an; nie ins Repo). Fehlt die Datei, wird nur geloggt.
Zwischen 03:58 und 04:10 kein Alarm (täglicher Neustart 04:00). Zustand: /var/lib/mc-healthcheck/zustand.json
Test: mc-healthcheck.py --test  (schickt eine Testnachricht an den Webhook)
"""
import json
import os
import socket
import struct
import sys
import time
import urllib.request

ZIEL = ("192.168.178.78", 25577)
WEBHOOK_DATEI = "/root/.mc-alarm-webhook"
ZUSTAND = "/var/lib/mc-healthcheck/zustand.json"
FEHLER_BIS_ALARM = 2


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
        z = {"fehler": 0, "alarm": False}
        print(time.strftime("%F %T"), f"ok {online}/{maximal}")
    except (OSError, ValueError, KeyError) as e:
        z["fehler"] += 1
        print(time.strftime("%F %T"), "keine Antwort:", e)
        neustart = "03:58" <= jetzt <= "04:10"
        if z["fehler"] >= FEHLER_BIS_ALARM and not z["alarm"] and not neustart:
            senden(f"🔴 Minecraft-Netz antwortet nicht (seit ca. {2 * z['fehler']} min, {jetzt}). Proxy 192.168.178.78:25577 prüfen.")
            z["alarm"] = True
    json.dump(z, open(ZUSTAND, "w"))


if __name__ == "__main__":
    main()
