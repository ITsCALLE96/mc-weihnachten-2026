# Lokales Testnetz: Velocity + Hub + SMP (seit 24.10.)

Bildet den Aufbau von VM200 nach, nur mit anderen Ports. Läuft **neben** `../testserver/` (Port 25565) und fasst ihn nicht an.

| Teil | Ordner | Port | wie VM200 |
|---|---|---|---|
| Velocity 4.3.0-44 | `proxy/` | 25577 (Client verbindet hierhin) | `MinecraftProxy01`, 25565 |
| Hub (Paper 26.3-207, Leerwelt, Abenteuer) | `hub/` | 25567 | `MinecraftHub01`, 25567 |
| SMP (Paper 26.3-207, leere flache Welt) | `smp/` | 25568 | `MinecraftWeihnachten01`, 25566 |

Voice Chat wie auf VM200 über den Proxy, nur auf verschobenen Ports, damit nichts mit dem Testserver (24454) streitet: Proxy UDP 24474, SMP 24475, Hub 24476
(VM200: 24454 / 24455 / 24456). Ohne Whitelist. Das Secret wird bei jedem Einrichten neu erzeugt und liegt nur in den ignorierten Ordnern.
Die echte Hub-Welt (Fantasy Village, Ursprung −150/80/−158) setzt die Spawn-&-Welt-Session mit ihrem Aufbau-Skript in `hub/` (Server dafür gestoppt, Paper-Jar `paper-26.3-207.jar`).
Bis dahin ist der Hub eine leere Luftwelt. Für einen Test vorher die Kisten als Platzhalter setzen (Schritt 4).

## Einrichten

1. Jars nach `_downloads/`: `paper-26.3-207.jar`, `worldedit-bukkit-7.4.6.jar`, `worldguard-bukkit-7.0.20.jar`, `voicechat-bukkit-2.6.25.jar` (aus `../testserver/_downloads/`),
   `velocity-4.3.0-44.jar` (fill.papermc.io, SHA256 in `../server/plugins.md`) und `voicechat-velocity-2.6.26.jar` (Modrinth, SHA1 `ed73c2f1c006f78ce1616dd7cd6c01e0f4f1b9e1`)
2. Plugin bauen: `../server/serverwahl/README.md` → Bauen
3. `bash testnetz/einrichten.sh` (legt `proxy/`, `hub/`, `smp/` an, spielt die Konfigs mit `einspielen.sh … hub|smp vm200` ein und verschiebt die Voice-Ports).
   Gibt es die Ordner schon, bricht es ab. `NEU=1` löscht sie vorher, **auch die Hub-Welt der Spawn-&-Welt-Session**
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
   Das SMP ist bis zur Eröffnung gesperrt (Merker `testnetz/status/smp-offen` fehlt), Ops kommen trotzdem durch. Öffnen ohne Op:
   im Hub `scoreboard players set #offen insel_zustand 1` (Objective legt das Hub-Datapack an) oder in einer der Konsolen `serverwahl oeffnen`.
   Wieder zu: `serverwahl schliessen`.
5. Stoppen: Hub und SMP `stop`, Proxy `end`

## Prüfen (Client mit Modpack, Mehrspieler → `localhost:25577`)

1. Beitritt landet im Hub, Abenteuermodus, Pack wird angeboten
2. Linke Kiste (25/236/−9) → Menü „SMP-Server“ → Weihnachtsserver anklicken → landet im SMP, Pack wird **nicht** neu geladen
3. Im SMP `/hub` → zurück im Hub
4. `/server smp` und `/server hub` gehen ebenfalls
5. Andere Kisten: „Bald verfügbar“, Mitte (Ender-Kiste): „Alle Server“
6. Kiste öffnet sich nicht als Kiste, Gegenstände im Menü lassen sich nicht herausnehmen
7. SMP-Fenster mit `stop` beenden, während man drauf ist → landet im Hub (Failover)
8. **Voice Chat beim Wechsel** (Leitung 24.10.): Symbol im Hub verbunden, nach Wechsel aufs SMP und zurück wieder verbunden, ohne Neuverbinden von Hand.
   Mit zwei Clients (zweiter Account) gegenseitig hörbar auf beiden Servern
9. **Sperre** (ohne Op): SMP-Kiste zeigt „Der Weihnachtsserver öffnet am 05.12.“, `/server smp` wird mit derselben Meldung abgewiesen, man bleibt im Hub.
   Nach `#offen` = 1 gehen beide. Geprüft 25.10. ohne Client: Merker per Befehl und per Scoreboard angelegt/entfernt
