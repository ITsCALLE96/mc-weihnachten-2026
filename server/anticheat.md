# Anti-Cheat (GrimAC) – Vorbereitung, nicht eingerichtet

Wunsch Pascal 27.10.: „was die meisten nutzen“. Stand: Recherche (Modrinth-API, GitHub-Wiki von Grim, 27.10.) und Konfig-Entwurf, **nichts installiert**.
[?] = nicht belegt, im Testnetz/Testlauf prüfen.

## Auswahl

| Kandidat | Preis/Lizenz | Paper 26.3 | Bewertung |
|---|---|---|---|
| **GrimAC** | kostenlos, GPL-3.0 | **ja**, 2.3.75 (24.–26.10.), Modrinth `grimac`, Loader paper, 26.3 eingetragen | verbreitetste kostenlose Lösung für Survival/SMP, aktiv gepflegt, Bedrock-Spieler ausgenommen |
| Vulcan | ~45–50 USD, Closed Source | [?] | kostet, Quellcode nicht einsehbar |
| Matrix, Polar, Spartan, Themis | kostenpflichtig bzw. Cloud | [?] | für ein Freundes-Netz überdimensioniert |

**Empfehlung: GrimAC 2.3.75**, Datei `grimac-bukkit-2.3.75-d8b8ae4.jar`, SHA1 `07bd6024186d8d1d600837350c3359d9960a04d0` (liegt geprüft in `testnetz/_downloads/lod/grim.jar`).
**Nur auf dem SMP.** Im Hub (Abenteuermodus, WorldGuard, nichts zu gewinnen) bringt es nichts.

Ehrliche Einordnung: Bei ~25 Freunden mit Whitelist ist ein Anti-Cheat **optional**. Xray deckt schon Paper Anti-Xray ab, die Karte Xaero Fair Play.
Grim lohnt sich als Beobachter (Fly, Speed, Reach) und weil es Bewegungs-Cheats per Setback (Zurücksetzen) unwirksam macht, ohne jemanden zu kicken.

## Technik

- Läuft auf dem Backend (Paper), **nicht** auf Velocity. Java 17+ (wir haben 25). Kein separates PacketEvents laut Modrinth-Abhängigkeiten (vermutlich eingebettet [?])
- **Bedrock:** Grim nimmt Floodgate-Spieler komplett aus. Dafür muss **Floodgate auf dem SMP** liegen (`bedrock.md`), sonst würden Bedrock-Bewegungen als Cheats gelten
- Dateien: `plugins/GrimAC/config.yml`, `punishments.yml` (dazu messages, database, discord). Standard ist schon „nur melden“, keine Kicks oder Bans
- Bekanntes Problem in 26.3: Reach/Hitbox-Fehlalarm beim Füttern von Schleimen (GitHub-Issue #2947)

## Fehlalarme mit unseren Client-Mods

Keine der Pack-Mods Freecam, Fullbright, Xaero, Distant Horizons, Simple Voice Chat, Armor Poser steht auf Grims Liste bekannter Konflikte
(Wiki „Known incompatible client mods“). Das ist eine Annahme, kein Test.
**Abgleich mit dem Pack (Modpack-Session, 27.10.):** Von Grims Liste sind **Debugify** (behebt nur Fehler, vermutlich unkritisch) und **Mouse Tweaks**
(+ More Mouse Tweaks) im Pack. Ähnlich wirken **Client Sort**, **ClickThrough Plus** und **Freecam** (bewusst erlaubt). Nicht im Pack: Inventory Profiles Next,
Inventar-Bewegungs-Mods, Shoulder Surfing, Fast-XP-/No-Delay-Mods, Always Sprint.
Im Test gezielt ausprobieren: Mouse Tweaks (Shift-Ziehen, Scrollen), Client Sort, ClickThrough, Freecam. Bei Fehlalarmen Prüfung entschärfen oder Mod raus (entscheidet die Leitung).

## Konfig-Entwurf (mild, Freundes-Netz)

`punishments.yml`: überall nur `[alert]` (an Ops und Konsole), **keine** `kick`/`ban`-Zeilen. Schwellen gegenüber dem Standard verdoppeln, Kampf-Prüfungen weg (kaum PvP).

```yaml
Punishments:
  Simulation:
    remove-violations-after: 300
    checks: [Simulation, GroundSpoof, Timer, TimerLimit, NoFall]
    commands: ["200:100 [alert]"]
  Knockback:
    remove-violations-after: 300
    checks: [Knockback, Explosion]
    commands: ["10:10 [alert]"]
  Post:
    remove-violations-after: 300
    checks: [Post]
    commands: ["40:40 [alert]"]
  BadPackets:
    remove-violations-after: 300
    checks: [BadPackets]
    commands: ["40:40 [alert]"]
  Reach:
    remove-violations-after: 300
    checks: [Reach, Hitboxes]
    commands: ["5:5 [alert]"]
  Misc:
    remove-violations-after: 300
    checks: [Vehicle, NoSlow, Elytra, Place, Break]
    commands: ["20:10 [alert]"]
  # Combat/Aim und Autoclicker bewusst weggelassen
```

Der Schlüssel heißt im Wiki teils `remove-violations-after`, teils `remove-checks-after` – beim Einrichten nach der erzeugten Datei richten.

`config.yml`: `experimental-checks: false`, `alerts.print-to-console: true`, Setbacks lassen wie Standard (das ist der eigentliche Schutz, bei Fehlalarm ruckelt der Spieler nur kurz zurück).
Alerts bekommen Ops (Recht `grim.alerts`, mit `/grim alerts` an/aus [?]).

## Prüfen (vor dem Einschalten)

1. Lade-Test im Testnetz (`testnetz/lod-test.sh`, zusammen mit den LOD-Plugins): Grim lädt auf Paper 26.3-207 ohne Fehler
2. Pascal ohne Op: normal spielen, Elytra, Dreizack mit Sog, Windkugel, Streitkolben, Boot, Pferd, Freecam, Fullbright → keine Alerts (oder nur vereinzelte)
3. Bedrock-Spieler (falls Geyser kommt): keine Alerts
4. Im Testlauf 21.11. mit allen Testern beobachten, danach Schwellen anpassen oder Grim weglassen
