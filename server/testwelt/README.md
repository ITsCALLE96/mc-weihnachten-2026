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

**Prinzip (Pascal 28.10.):** keine leeren Säle, sondern eine Welt, in der alles schon gebaut steht und man es zu Fuß bzw. im Flug abgeht – wie im SMP:
unten die Flachwelt, darüber an den SMP-Koordinaten die schwebende Spark-Insel, daneben die Weihnachtsinsel, ringsum Hub-Ausschnitt, Deko, Mob-Zoo.
Die Ender-Kiste am Spawn (0/−60/−3) ist nur eine Abkürzung (Teleport je Bereich).

| Bereich (Tag-Name) | Ursprung | Inhalt | liefert |
|---|---|---|---|
| `spark` | 0 / 150 / 48 (wie SMP) | Spark-Spawn-Insel mit Deko und Kalenderwand | Spawn & Welt (fremder Bau, nur aus `spawn/quellen`) |
| `weihnachtsinsel` | −1 / 150 / −34 (wie SMP, Nordweg) | fertige Insel mit Iglu und Weihnachtsmann, daneben Stufen 1–4 | Spawn & Welt |
| `hub` | −250 / −60 / 150 | Hub-Ausschnitt (Fantasy Village) | Spawn & Welt (fremder Bau) |
| `zoo` | 120 / −60 / −100 (östlich) | Mob-Zoo in drei Bereichen **Friedlich · Feindlich · Bosse** mit Wegweisern, Arena bei 120/−160, `server/zoo/` | Server-Session |
| `deko` | 0 / −60 / 150 | Deko-Item-Displays, alle Kalender-Items in Rahmen / auf Rüstungsständern | Spawn & Welt |

**Menü-Kisten generell mit der Vorderseite nach Süden** (Pascal 28.10.): wer sie öffnet, schaut nach Norden. Gilt für Testwelt, SMP-Spawn, Hub und künftige.
**Neuer Bereich:** Eintrag in `SAELE` in `archiv.py` (Ursprung, Startpunkt), `testwelt.sh archiv`. Das Menü zeigt bis zu 7 Bereiche; ab dem achten eine zweite Reihe.
**Umbau 28.10.:** In einer Testwelt mit dem alten Layout (Säle auf x 512…2560) einmal `function archiv:umzug_aufraeumen`, dann `function archiv:aufbau`.

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

## Bekannte, harmlose Log-Meldungen

- **„Block-attached entity at invalid position“** (28× beim Aufbau, y −57, z 145, x −26…+2): kommt von den Leuchtrahmen der Deko-Galerie. Paper 26.3
  schreibt die Zeile bei **jedem** `summon glow_item_frame`, weil es das Entity aus dem NBT liest, bevor die Position gesetzt ist. Die Wand steht
  (z 144), alle 28 Rahmen hängen mit Item (Spawn & Welt geprüft 28.10.). Nicht erneut untersuchen; bleibt so (Leitung 28.10.)
