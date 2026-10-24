# Lokales Testnetz: Velocity + Hub + SMP (seit 24.10.)

Bildet den Aufbau von VM200 nach, nur mit anderen Ports. Läuft **neben** `../testserver/` (Port 25565) und fasst ihn nicht an.

| Teil | Ordner | Port | wie VM200 |
|---|---|---|---|
| Velocity 4.3.0-44 | `proxy/` | 25577 (Client verbindet hierhin) | `MinecraftProxy01`, 25565 |
| Hub (Paper 26.3-207, flache Welt, Abenteuer) | `hub/` | 25567 | `MinecraftHub01`, 25567 |
| SMP (Paper 26.3-207, leere flache Welt) | `smp/` | 25568 | `MinecraftWeihnachten01`, 25566 |

Ohne Voice Chat (würde mit dem Testserver um UDP 24454 streiten) und ohne Whitelist. Secret wird bei jedem Einrichten neu erzeugt und liegt nur in den ignorierten Ordnern.
Die echte Hub-Welt (Fantasy Village) baut die Spawn-&-Welt-Session. Hier stehen die 5 Kisten nur als Platzhalter auf einer Steinfläche (Koordinaten aus der Hub-Config).

## Einrichten

1. Jars nach `_downloads/`: `paper-26.3-207.jar`, `worldedit-bukkit-7.4.6.jar`, `worldguard-bukkit-7.0.20.jar` (aus `../testserver/_downloads/`) und
   `velocity-4.3.0-44.jar` (fill.papermc.io, SHA256 in `../server/plugins.md`)
2. Plugin bauen: `../server/serverwahl/README.md` → Bauen
3. `bash testnetz/einrichten.sh` (löscht und baut `proxy/`, `hub/`, `smp/` neu, spielt die Konfigs mit `einspielen.sh … hub|smp lokal` ein)
4. `start.cmd` öffnet drei Fenster. Beim ersten Start in der Hub-Konsole die Platzhalter setzen:
   ```
   forceload add 16 -16 31 15
   fill 18 235 -12 30 235 12 minecraft:stone
   setblock 28 236 0 minecraft:ender_chest[facing=west]
   setblock 25 236 -9 minecraft:chest[facing=west]
   setblock 27 236 -5 minecraft:chest[facing=west]
   setblock 27 236 5 minecraft:chest[facing=west]
   setblock 25 236 9 minecraft:chest[facing=west]
   setworldspawn 20 236 0
   ```
   (Am 24.10. schon einmal gesetzt, bleibt bis zum nächsten `einrichten.sh`.)
5. Stoppen: Hub und SMP `stop`, Proxy `end`

## Prüfen (Client mit Modpack, Mehrspieler → `localhost:25577`)

1. Beitritt landet im Hub, Abenteuermodus, Pack wird angeboten
2. Linke Kiste (25/236/−9) → Menü „SMP-Server“ → Weihnachtsserver anklicken → landet im SMP, Pack wird **nicht** neu geladen
3. Im SMP `/hub` → zurück im Hub
4. `/server smp` und `/server hub` gehen ebenfalls
5. Andere Kisten: „Bald verfügbar“, Mitte (Ender-Kiste): „Alle Server“
6. Kiste öffnet sich nicht als Kiste, Gegenstände im Menü lassen sich nicht herausnehmen
7. SMP-Fenster mit `stop` beenden, während man drauf ist → landet im Hub (Failover)
