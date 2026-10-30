# Lokales Testnetz: Velocity + Hub + SMP (seit 24.10.)

Bildet den Aufbau von VM200 nach, mit denselben Spiel-Ports (seit 30.10.), nur Voice Chat verschoben. Läuft **neben** `../testserver/` (Port 25565) und fasst ihn nicht an.

| Teil | Ordner | Port | wie VM200 |
|---|---|---|---|
| Velocity 4.3.0-44 | `proxy/` | 25577 (Client verbindet hierhin) | `MinecraftProxy01`, 25577 (extern 25565) |
| Hub (Paper 26.3-207, Leerwelt, Abenteuer) | `hub/` | 25567 | `MinecraftHub01`, 25567 |
| SMP (Paper 26.3-207, echte Welt, normal, Plugins und Datapacks wie VM200) | `smp/` | 25568 | `MinecraftSMP01`, 25568 |

Voice Chat wie auf VM200 über den Proxy, nur auf verschobenen Ports, damit nichts mit dem Testserver (24454) streitet: Proxy UDP 24474, SMP 24475, Hub 24476
(VM200: 24454 / 24455 / 24456). Ohne Whitelist. Das Secret wird bei jedem Einrichten neu erzeugt und liegt nur in den ignorierten Ordnern.
**RCON** (seit 25.10., Leitung): Hub 25585, SMP 25586, nur 127.0.0.1 (folgt `server-ip`), Passwort zufällig je Einrichten in `hub/server.properties` bzw.
`smp/server.properties` (`rcon.password`, git-ignoriert). Damit lassen sich Befehle ohne Konsolenfenster schicken, z. B. `serverwahl status`.
Die echte Hub-Welt (Fantasy Village, Ursprung −150/80/−158) setzt die Spawn-&-Welt-Session mit ihrem Aufbau-Skript in `hub/` (Server dafür gestoppt, Paper-Jar `paper-26.3-207.jar`).
Bis dahin ist der Hub eine leere Luftwelt. Für einen Test vorher die Kisten als Platzhalter setzen (Schritt 4).

## Einrichten

1. Jars nach `_downloads/`: `paper-26.3-207.jar`, `worldedit-bukkit-7.4.6.jar`, `worldguard-bukkit-7.0.20.jar`, `voicechat-bukkit-2.6.25.jar` (aus `../testserver/_downloads/`),
   `velocity-4.3.0-44.jar` (fill.papermc.io, SHA256 in `../server/plugins.md`) und `voicechat-velocity-2.6.26.jar` (Modrinth, SHA1 `ed73c2f1c006f78ce1616dd7cd6c01e0f4f1b9e1`)
2. Plugin bauen: `../server/serverwahl/README.md` → Bauen
3. `bash testnetz/einrichten.sh` (legt `proxy/`, `hub/`, `smp/` an, spielt die Konfigs mit `einspielen.sh … hub|smp vm200` ein und verschiebt die Voice-Ports).
   Das SMP bekommt alle SMP-Plugins (DimensionControl mit Nether und End zu, Fair Play, Armor Poser, Voice Chat, Serverwahl) und die Datapacks `leitfaden` und `wanderhaendler-rabatt`.
   Gibt es die Ordner schon, bricht es ab. `NEU=1` löscht alle vorher, **auch die Hub-Welt der Spawn-&-Welt-Session**.
   **`NUR=smp`** (oder `hub`/`proxy`) baut nur diesen Teil neu und übernimmt das Secret, z. B. für eine frische SMP-Welt ohne den Hub anzufassen.
   Nach dem ersten SMP-Start die Weltgrenze setzen: `python -I testnetz/rcon.py smp "worldborder set 10000"`
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
**Alte Karten nach einem Zurücksetzen:** Xaero speichert Karten und Todespunkte lokal nach Serveradresse, nicht nach Welt. Nach einer neuen SMP-Welt
(`NUR=smp`, `NEU=1`) zeigt der Client deshalb noch die alten Punkte. Von Hand löschen (wird bewusst nicht automatisch gemacht):
`%APPDATA%\ModrinthApp\profiles\<profil>\xaero\minimap\Multiplayer_localhost` und `…\xaero\world-map\Multiplayer_localhost` (Leitung 27.10., für `weihnachten-modpack` erledigt).
Neue Plugins vom 27.10. (LSS, GrimAC, Chunky, Geyser, Floodgate) kommen mit `bash testnetz/neue-plugins.sh einrichten` dazu, nach `NUR=smp` erneut ausführen.

5. Stoppen: Hub und SMP `stop`, Proxy `end`. Ohne Fenster: `python -I testnetz/rcon.py hub stop` bzw. `smp stop` (`rcon.py` liest Port und Passwort aus der jeweiligen `server.properties`)

## Prüfen (Client mit Modpack, Mehrspieler → `localhost:25577`)

1. Beitritt landet im Hub, Abenteuermodus, Pack wird angeboten
2. Linke Kiste (25/236/−9) → Menü „SMP-Server“ → SMP anklicken → landet im SMP, Pack wird **nicht** neu geladen
3. Im SMP `/hub` → zurück im Hub
4. `/server smp` und `/server hub` gehen ebenfalls
5. Andere Kisten: „Bald verfügbar“, Mitte (Ender-Kiste): „Alle Server“
6. Kiste öffnet sich nicht als Kiste, Gegenstände im Menü lassen sich nicht herausnehmen
7. SMP-Fenster mit `stop` beenden, während man drauf ist → landet im Hub (Failover)
8. **Voice Chat beim Wechsel** (Leitung 24.10.): Symbol im Hub verbunden, nach Wechsel aufs SMP und zurück wieder verbunden, ohne Neuverbinden von Hand.
   Mit zwei Clients (zweiter Account) gegenseitig hörbar auf beiden Servern
9. **Sperre** (ohne Op): SMP-Kiste zeigt „Der Server öffnet am 27.11.“, `/server smp` wird mit derselben Meldung abgewiesen, man bleibt im Hub.
   Nach `#offen` = 1 gehen beide. Geprüft 25.10. ohne Client: Merker per Befehl und per Scoreboard angelegt/entfernt
10. **Portale** (ohne Op, Nether/End zu): Netherportal lässt sich nicht anzünden, Enderauge geht nicht in den Rahmen, Meldung in der Aktionsleiste
11. **Eröffnung auf dem SMP:** nach `#offen` = 1 im Hub ist auf dem SMP Tag, klares Wetter, Phase 1 (Leitfaden-Ansage), nach SMP-Neustart nicht noch einmal
