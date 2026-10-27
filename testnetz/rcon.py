#!/usr/bin/env python3
"""RCON fürs Testnetz: python -I testnetz/rcon.py hub|smp "<befehl>" ["<befehl>" …]
Port und Passwort kommen aus testnetz/<server>/server.properties (git-ignoriert)."""
import socket, struct, sys
from pathlib import Path

def werte(server):
    props = {}
    for zeile in (Path(__file__).resolve().parent / server / "server.properties").read_text(encoding="utf-8").splitlines():
        if "=" in zeile and not zeile.startswith("#"):
            k, v = zeile.split("=", 1)
            props[k] = v
    return int(props["rcon.port"]), props["rcon.password"]

def paket(sock, nr, typ, text):
    daten = struct.pack("<ii", nr, typ) + text.encode("utf-8") + b"\0\0"
    sock.sendall(struct.pack("<i", len(daten)) + daten)
    laenge = struct.unpack("<i", sock.recv(4))[0]
    rest = b""
    while len(rest) < laenge:
        rest += sock.recv(laenge - len(rest))
    nr_antwort, _ = struct.unpack("<ii", rest[:8])
    return nr_antwort, rest[8:-2].decode("utf-8", "replace")

def main():
    # Windows-Konsole (cp1252) kann Zeichen wie ℹ aus Plugin-Antworten nicht ausgeben
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    port, passwort = werte(sys.argv[1])
    with socket.create_connection(("127.0.0.1", port), timeout=10) as s:
        if paket(s, 1, 3, passwort)[0] == -1:
            sys.exit("RCON: Passwort abgelehnt")
        for befehl in sys.argv[2:]:
            print(f"> {befehl}\n{paket(s, 2, 2, befehl)[1]}")

if __name__ == "__main__":
    main()
