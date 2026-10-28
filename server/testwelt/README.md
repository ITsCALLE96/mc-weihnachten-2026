# Testwelt = Pascals Bauarchiv (Pascal 28.10.)

Eigene Paper-Instanz „testwelt“ (Superflat, Kreativ, nur Admins über die zweite Hub-Kiste, `serverwahl.testwelt`). Dauerhaftes Archiv aller eigenen
und eingebauten Bauten, nach Themen in **Säle** geteilt, reproduzierbar per Skript. Zurzeit nur im Testnetz; ob sie auf VM200 läuft, entscheidet die
Leitung nach dem RAM-Check (`../kapazitaet.md` → Option Admin-Testwelt). Läuft sie dort, kommt ihr Welt-Ordner ins Backup (Task 9).

## Aufbau

```
bash testnetz/testwelt.sh einrichten      # einmal: Server, Plugins, Datapacks, Velocity-Eintrag (Testnetz gestoppt)
bash testnetz/testwelt.sh rechte          # SMP läuft: serverwahl.testwelt für admin
python -I testnetz/rcon.py testwelt "function archiv:aufbau"
bash testnetz/testwelt.sh archiv          # nach Änderungen an Sälen/Zoo: Datapacks und Menü neu, dann /reload
```

- **Platz am Spawn (0/−60/0):** Quarzfläche, **Ender-Kiste** (0/−60/3) öffnet das Menü „Bauarchiv“ (serverwahl, Einträge mit `ort:` teleportieren in der Welt)
- **Säle** in einer Reihe nach Osten, je 512 Blöcke: Ursprung = Saalmitte am Boden (y −60), Startpunkt mit Schild bei z +24, Blick nach Norden

| Saal (Tag-Name) | Ursprung | Inhalt | liefert |
|---|---|---|---|
| `spark` | 512 / −60 / 0 | Spark-Spawn-Insel mit Deko und Kalenderwand | Spawn & Welt (fremder Bau, nur aus `spawn/quellen`) |
| `weihnachtsinsel` | 1024 / −60 / 0 | Stufen 1–4 nebeneinander + fertige Insel mit Iglu und Weihnachtsmann | Spawn & Welt |
| `hub` | 1536 / −60 / 0 | Hub-Ausschnitt (Fantasy Village) | Spawn & Welt (fremder Bau) |
| `zoo` | 2048 / −60 / 0 | Mob-Zoo (Ecke 1984/−140) und Arena (1984/−200), `server/zoo/` | Server-Session |
| `deko` | 2560 / −60 / 0 | Deko-Item-Displays, alle Kalender-Items in Rahmen / auf Rüstungsständern | Spawn & Welt |

**Neuer Saal:** Eintrag in `SAELE` in `archiv.py` anhängen (Name, Titel, Text, Menü-Item), `testwelt.sh archiv`. Das Menü zeigt zurzeit bis zu 7 Säle
pro Seite (serverwahl-Menü); ab dem achten baue ich eine zweite Reihe.

## Schnittstelle für Inhalte (Funktions-Tags)

Jeder Saal ruft beim Aufbau `execute positioned <Ursprung> run function #archiv:saal/<name>` auf. Inhalte hängen sich mit einer eigenen Funktion in den
Tag, **aus ihrem eigenen Datapack**, z. B. `data/archiv/tags/function/saal/weihnachtsinsel.json` → `{"values": ["weihnachtsinsel:archiv"]}`.
Die Funktion baut relativ (`~ ~ ~` = Saalmitte am Boden, z. B. `place template weihnachtsinsel:stufe1 ~-80 ~ ~-60`), lädt große Flächen selbst
(`forceload add`) und muss beim zweiten Aufruf dasselbe Ergebnis liefern (idempotent, z. B. erst `fill … air`).

**Fremde Bauten** (Spark-Insel, Fantasy Village, CA12): Strukturen bzw. Funktionen dafür nur in ein eigenes Datapack der Testwelt, das ein Skript aus
`spawn/quellen` erzeugt und das **git-ignoriert** bleibt (`testnetz/testwelt/` ist ignoriert). Nichts davon ins Repo.

## Sicherung von spawn/quellen

`server/sicherung/quellen-sichern.ps1` (Vorschlag, noch nicht eingerichtet): robocopy nach `\\192.168.178.79\backup\pc-c96\mc-weihnachten-2026\spawn-quellen`,
ohne Löschen (`/E /XO`), Anmeldung über die gespeicherte Windows-Anmeldung, nichts im Skript. Details und Zeitplan-Varianten im Skriptkopf.
