# Bedrock und PlayStation (Geyser + Floodgate) – entschieden 27.10., im Testnetz vorbereitet

> **Pascal 27.10. (Decision Log):** Bedrock kommt, wie unten beschrieben. **Kein Bot-Konto** (endgültig), MCXboxBroadcast fällt weg.
> PlayStation nur über BedrockConnect (DNS an der Konsole, siehe unten) – Entscheidung jedes PlayStation-Spielers selbst.
> Testnetz: `bash testnetz/neue-plugins.sh einrichten`. Die Jars liegen geprüft in `testnetz/_downloads/bedrock/`:
> Geyser-Velocity 2.12.1 Build 1273 (SHA256 `96b7fb07…`), Floodgate 2.2.5 Build 141 (Velocity `64983502…`, Spigot `21570aff…`).

Wunsch Pascal 27.10.: Freunde mit PlayStation/Bedrock sollen mitspielen. Stand: Recherche und Entwurf, **nichts installiert**, nicht im Testnetz geprüft.
Quellen: geysermc.org (Download, Wiki: setup, supported-versions, current-limitations, packs, floodgate/setup, faq, linking), github.com/rtm516/MCXboxBroadcast,
github.com/Pugmatt/BedrockConnect. Mit [?] markiert = nicht belegt, im Testnetz prüfen.

## Aufbau

| Teil | Wo | Version (27.10.) | Hinweis |
|---|---|---|---|
| Geyser (Velocity) | `MinecraftProxy01/plugins/` | 2.12.1, laut Download-Seite Java 26.3, Bedrock 26.30–26.52 | übersetzt Bedrock ↔ Java, `auth-type: floodgate` |
| Floodgate (Velocity) | Proxy | 2.2.5 | Pflicht: Bedrock-Spieler ohne Java-Konto, `send-floodgate-data: true` |
| Floodgate (Paper) | Hub und SMP | 2.2.5 | für Whitelist und Plugins, die den Spieler als Bedrock erkennen müssen (GrimAC, Serverwahl). [?] 26.3-Freigabe nicht ausdrücklich genannt |

- **`key.pem`** von Floodgate (Proxy) in den Floodgate-Ordner beider Backends kopieren. **Geheim wie das Velocity-Secret:** Wer sie hat, kann sich als beliebiger Bedrock-Spieler anmelden. Nie ins Repo
- Modern Forwarding bleibt unverändert, Geyser läuft im Proxy
- **Port:** UDP 19132 (laut Wiki auch TCP für die Suche) auf VM200 freigeben, FritzBox-Freigabe wie Velocity (Task 3 Schritt 3 ergänzen). Darf nicht mit Voice Chat (24454) kollidieren, tut es nicht

Konfig-Entwurf `plugins/Geyser-Velocity/config.yml` (nur geänderte Schlüssel):

```yaml
bedrock:
  port: 19132
  # MOTD in der Bedrock-Serverliste
  motd1: "Minecraft SMP"
  motd2: "Frohe Weihnachten!"
remote:
  auth-type: floodgate
# Geyser-Version 2.12 hat einen neuen Schlüssel transport (nethernet / both) – beim Einrichten nach den Kommentaren der erzeugten Datei setzen [?]
```

Werte im Repo (mit `server/konfig-setzen.py` in die erzeugten Dateien): `server/bedrock/floodgate-proxy-werte.txt` (`send-floodgate-data: true`, Statistik aus),
`floodgate-backend-werte.txt` (Statistik aus), `geyser-werte.txt` (Port 19132, MOTD, Floodgate-Anmeldung; Geyser erzeugt seine Konfig selbst,
deshalb mit `--weich`, fehlende Schlüssel werden gemeldet). `username-prefix: "."` bleibt Standard. Deutsche Texte: `plugin-konfig/proxy/plugins/Geyser-Velocity/locales/overrides/de_de.json`
(generiert von der Questbuch-Session, eingespielt mit `einspielen.sh <proxy> proxy`).

**Java 26.3 ausdrücklich geprüft (27.10.):** Die Geyser-Download-Seite nennt für 2.12.1 „Java 26.3, Bedrock 26.30–26.52“, also passt Geyser zu unseren Servern.
Für Floodgate 2.2.5 steht keine ausdrückliche 26.3-Freigabe dabei [?] (im Testnetz prüfen).
**Deutsch für Bedrock** (Hinweis Questbuch-Session): eigene Texte über Geyser `locales/overrides/de_de.json`.

## Whitelist

Bleibt auf beiden Backends (entschieden 24.10.). Bedrock-Spieler stehen dort mit Präfix: `.Name`.

1. Einfachster Weg: Der Spieler tritt einmal bei (wird abgewiesen), dann `fwhitelist add <BedrockName>` in beiden Backend-Konsolen
2. Ohne Beitritt: Floodgate-UUID (`00000000-0000-0000-<XUID hex>`, z. B. über mcprofile.io) in `whitelist.json`, dann `whitelist reload`
3. **Linking** (Global Linking, Standard in Floodgate): Wer Java **und** Bedrock besitzt, verknüpft beide (`/linkaccount` auf `link.geysermc.org`) und spielt dann unter dem Java-Konto, ohne eigenen Whitelist-Eintrag

## Resourcepack

Geyser schickt Bedrock-Spielern das Java-Pack **nicht** und wandelt es nicht um. Möglich ist ein eigenes Bedrock-Pack in `plugins/Geyser-Velocity/packs/`
(Konverter laut Wiki: Rainbow, Thunder). Wintertexturen ließen sich übertragen, das ist aber eigene Arbeit (Modpack/Resourcepack-Session).
Nicht übertragbar: Questbuch-Texte (gehören zur Fabric-Mod), Mod-Texturen. Packwechsel pro Server gehen bei Bedrock nicht, also ein Pack für Hub und SMP zusammen.
[?] Wie Geyser mit `require-resource-pack=true` des Backends umgeht (Durchlassen oder Kick), im Testnetz prüfen.

## Was Bedrock-Spieler nicht haben (ehrlich)

| Bereich | Bedrock |
|---|---|
| Modpack: Questbuch, Xaero-Karte, Distant Horizons, Freecam, Block-Marker | **fehlt** (Geyser: nur was ein Vanilla-Client kann) |
| Simple Voice Chat | **fehlt** (keine Bedrock-Variante bekannt [?]), Bedrock-Spieler hören und sprechen nicht |
| Leitfaden (tellraw/title/Bossbar), Phasen, Händler-Rabatt | sollte gehen, Geyser übersetzt Chat/Titel/Bossbar [?] |
| Hub-Kisten-Menü (`serverwahl`) | Kiste als Bedrock-Inventar. Geyser kennt kein Links/Rechts im Inventar, unser Menü reagiert auf jeden Klick, passt. Öffnen per Rechtsklick auf den Block [?] |
| Armor Poser | Posen nur eingeschränkt (Geyser-Integrated-Pack) |
| Fortschritte (Advancements) | Toast ohne zweite Zeile |
| Server-LOD (`lod-server.md`) | fehlt, Bedrock lädt nur die normale Sichtweite |

## PlayStation (ohne Bot-Konto: BedrockConnect)

PlayStation (auch Xbox, Switch) kann keine eigenen Server eintragen, nur die „Featured Server“ von Mojang. Ohne eigenes Microsoft-Konto für einen Bot
(MCXboxBroadcast, von Pascal abgelehnt) bleibt nur **BedrockConnect** (github.com/Pugmatt/BedrockConnect):
Die Konsole bekommt einen anderen DNS-Server. Der leitet die Featured-Server-Adressen auf eine Serverliste um, dort trägt der Spieler `mc.grahl.cloud`, Port 19132 ein.

| Weg | Was der PlayStation-Spieler tut | Für uns | Risiko |
|---|---|---|---|
| **Öffentlicher BedrockConnect-DNS** | PS4/PS5 → Einstellungen → Netzwerk → Verbindung einrichten → DNS manuell: primär **45.55.68.52**, sekundär 8.8.8.8 (Stand README 27.10.). Dann Minecraft → Server → beliebiger Featured Server → Liste → Server hinzufügen | nichts außer Geyser und Port 19132 | Der DNS-Server eines Dritten (USA, ehrenamtlich betrieben) sieht **alle** Namensauflösungen der Konsole, solange die Einstellung aktiv ist (welche Dienste und Spiele sie nutzt). Fällt er aus, geht auf der Konsole nichts mehr, bis man DNS zurückstellt. Für Kinderkonsolen nicht empfehlenswert |
| Selbst gehostetes BedrockConnect | dieselbe DNS-Umstellung auf **unsere** IP | BedrockConnect + eigener DNS-Server im Internet erreichbar (UDP 53 in der FritzBox) | **nicht machbar:** Der DNS-Server müsste für die Konsolen auch alle anderen Adressen beantworten, also ein offener rekursiver Resolver im Internet sein – wird für DDoS-Verstärkung missbraucht. Nur sinnvoll für Konsolen im eigenen Heimnetz |
| Im selben WLAN (LAN) | Konsole bei Pascal im Netz: Tab „Welten“ zeigt LAN-Spiele | BedrockConnect lokal | nur für Besuch bei Pascal, nicht für die Freunde zu Hause |

**Ehrliche Einschätzung:** Ein Weg für PlayStation ohne Konto existiert nur mit dem öffentlichen DNS eines Dritten. Technisch funktioniert er (BedrockConnect ist
verbreitet und gepflegt), der Preis ist der Datenschutz auf der Konsole. Das entscheidet jeder PlayStation-Spieler (bzw. dessen Eltern) selbst; wir stellen nur
eine Anleitung bereit und raten zur Rückstellung des DNS nach dem Projekt. Wenn niemand das will: Bedrock nur für PC und Handy, keine PlayStation.

## Test im Testnetz

Nach `neue-plugins.sh einrichten` und `start.cmd`. **Bedrock-Client auf einem Handy oder Tablet im WLAN** (Windows wird nicht umgestellt; der Windows-Bedrock-Client
kann ohne Systemeinstellung nicht auf denselben PC verbinden). Server hinzufügen: LAN-IP von Pascals PC, Port 19132. Falls die Windows-Firewall UDP 19132 blockt,
meldet sich Windows beim ersten Start von Velocity mit einer Freigabe-Abfrage (Pascal entscheidet).

1. Beitritt landet im Hub, Name mit Präfix `.`, kein Kick wegen Resourcepack
2. Kisten-Menü per langem Tippen auf die Kiste, SMP-Eintrag antippen → SMP. `/hub` zurück
3. Leitfaden-Texte (tellraw/title) lesbar, deutsch wo `de_de.json` greift
4. Java- und Bedrock-Spieler sehen sich, Chat in beide Richtungen
5. GrimAC meldet den Bedrock-Spieler nicht
6. PlayStation (optional, nur wenn ein Tester das will): DNS auf 45.55.68.52, Server über die BedrockConnect-Liste mit der öffentlichen Adresse – geht erst mit Portfreigabe (Task 3), nicht im Testnetz

## Empfehlung

Machbar mit überschaubarem Aufwand (Technik ~2 h, dazu Portfreigabe). PlayStation nur über BedrockConnect mit öffentlichem DNS (siehe oben). Bedrock-Spieler bekommen aber ein deutlich kleineres Spiel (kein Questbuch, keine Karte, kein Voice Chat, keine Wintertexturen ohne eigenes Pack).
Vor dem Einschalten im Testnetz mit einem Handy/Tablet-Bedrock-Client prüfen: Beitritt, Whitelist, Kisten-Menü, Leitfaden-Texte, Pack-Pflicht, GrimAC-Ausnahme.
Entscheidung bei der Leitung/Pascal.
