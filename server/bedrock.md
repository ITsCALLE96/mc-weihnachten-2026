# Bedrock und PlayStation (Geyser + Floodgate) – entschieden 27.10., im Testnetz vorbereitet

> **Pascal 27.10. (Decision Log):** Bedrock und PlayStation kommen, wie unten beschrieben. PlayStation über MCXboxBroadcast mit eigenem Bot-Microsoft-Konto.
> Testnetz: `bash testnetz/neue-plugins.sh einrichten` (mit `MCXBOX=1` auch MCXboxBroadcast). Die Jars liegen geprüft in `testnetz/_downloads/bedrock/`:
> Geyser-Velocity 2.12.1 Build 1273 (SHA256 `96b7fb07…`), Floodgate 2.2.5 Build 141 (Velocity `64983502…`, Spigot `21570aff…`), MCXboxBroadcastExtension Release 159 vom 03.10. (`5220fca2…`).

Wunsch Pascal 27.10.: Freunde mit PlayStation/Bedrock sollen mitspielen. Stand: Recherche und Entwurf, **nichts installiert**, nicht im Testnetz geprüft.
Quellen: geysermc.org (Download, Wiki: setup, supported-versions, current-limitations, packs, floodgate/setup, faq, linking), github.com/rtm516/MCXboxBroadcast,
github.com/Pugmatt/BedrockConnect. Mit [?] markiert = nicht belegt, im Testnetz prüfen.

## Aufbau

| Teil | Wo | Version (27.10.) | Hinweis |
|---|---|---|---|
| Geyser (Velocity) | `MinecraftProxy01/plugins/` | 2.12.1, laut Download-Seite Java 26.3, Bedrock 26.30–26.52 | übersetzt Bedrock ↔ Java, `auth-type: floodgate` |
| Floodgate (Velocity) | Proxy | 2.2.5 | Pflicht: Bedrock-Spieler ohne Java-Konto, `send-floodgate-data: true` |
| Floodgate (Paper) | Hub und SMP | 2.2.5 | für Whitelist und Plugins, die den Spieler als Bedrock erkennen müssen (GrimAC, Serverwahl). [?] 26.3-Freigabe nicht ausdrücklich genannt |
| MCXboxBroadcast | Geyser-Erweiterung (`plugins/Geyser-Velocity/extensions/`) | ohne Versionsangabe im README | nur für PlayStation/Xbox/Switch, siehe unten |

- **`key.pem`** von Floodgate (Proxy) in den Floodgate-Ordner beider Backends kopieren. **Geheim wie das Velocity-Secret:** Wer sie hat, kann sich als beliebiger Bedrock-Spieler anmelden. Nie ins Repo
- Modern Forwarding bleibt unverändert, Geyser läuft im Proxy
- **Port:** UDP 19132 (laut Wiki auch TCP für die Suche) auf VM200 freigeben, FritzBox-Freigabe wie Velocity (Task 3 Schritt 3 ergänzen). Darf nicht mit Voice Chat (24454) kollidieren, tut es nicht

Konfig-Entwurf `plugins/Geyser-Velocity/config.yml` (nur geänderte Schlüssel):

```yaml
bedrock:
  port: 19132
  # MOTD in der Bedrock-Serverliste
  motd1: "Weihnachtsserver"
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

## PlayStation

PlayStation (auch Xbox, Switch) kann keine eigenen Server eintragen. Zwei Wege:

| Weg | Wie | Aufwand | Risiko |
|---|---|---|---|
| **MCXboxBroadcast** (Empfehlung) | Geyser-Erweiterung meldet einen Bot-Account (eigenes Microsoft-Konto) bei Xbox Live an. Spieler fügen den Bot als Freund hinzu, der Server erscheint im Freunde-Tab und lässt sich beitreten | ~30 min, ein eigenes Microsoft-Konto (nicht Pascals Hauptkonto) | laut README „auf eigene Gefahr“, Bot-Konto kann gesperrt werden. Hauptkonten der Spieler nicht betroffen |
| BedrockConnect | Konsole bekommt einen fremden DNS-Server, der die „Featured Server“ auf eine Serverliste umleitet | öffentlich: DNS umstellen pro Konsole; selbst gehostet: eigener DNS-Dienst, hilft externen Freunden nicht | öffentlicher DNS eines Dritten sieht den DNS-Verkehr der Konsole – nicht empfehlenswert |

Die Anmeldung des Bot-Kontos (Gerätecode) macht Pascal selbst, Zugangsdaten nie in Repo oder Vault.

## Bot-Konto für PlayStation einrichten (Pascal)

Einmalig, ~15 Minuten. Zugangsdaten und das Anmelde-Token bleiben nur auf dem Server (MCXboxBroadcast speichert sie in seinem Ordner unter `Geyser-Velocity/extensions/`),
nie in Repo, Vault oder Chat.

1. Neues Microsoft-Konto anlegen (outlook.com), **nicht** dein Hauptkonto. Name z. B. „Weihnachtsserver“, Passwort in den Passwortmanager
2. Mit dem Konto einmal auf xbox.com anmelden und ein Xbox-Profil (Gamertag) anlegen, z. B. „WeihnachtsServer“. In den Datenschutz-Einstellungen
   Freundschaftsanfragen und Multiplayer erlauben
3. Testnetz mit `MCXBOX=1 bash testnetz/neue-plugins.sh einrichten`, dann `start.cmd`. Im Proxy-Fenster erscheint eine Zeile mit `https://www.microsoft.com/link` und einem Code
4. Im Browser `microsoft.com/link` öffnen, mit dem **Bot-Konto** anmelden, Code eingeben. Das Proxy-Fenster meldet danach die Anmeldung
5. PlayStation: Minecraft → Freunde → Freund hinzufügen → Gamertag des Bots. Der Bot nimmt automatisch an, danach steht der Server im Freunde-Tab unter den beitretbaren Spielen
6. Für VM200 später dasselbe mit der dortigen Instanz (der Code kommt in der AMP-Konsole von `MinecraftProxy01`)

Risiko: Microsoft kann das Bot-Konto sperren („auf eigene Gefahr“ laut MCXboxBroadcast). Die Konten der Spieler sind nicht betroffen. Fällt der Bot aus,
treten PC- und Handy-Bedrock-Spieler weiter direkt über `mc.grahl.cloud`, Port 19132 bei.

## Test im Testnetz

Nach `neue-plugins.sh einrichten` und `start.cmd`:

1. Bedrock-Client (Windows-Version reicht) → Server hinzufügen → `localhost`, Port 19132. **Windows sperrt Bedrock-Verbindungen zum eigenen PC** (Loopback):
   entweder einmal in einer Administrator-Eingabeaufforderung `CheckNetIsolation LoopbackExempt -a -n="Microsoft.MinecraftUWP_8wekyb3d8bbwe"` (ändert eine Windows-Einstellung,
   Pascals Entscheidung) oder von einem zweiten Gerät im WLAN mit der LAN-IP des PCs (dann Windows-Firewall für UDP 19132 freigeben)
2. Beitritt landet im Hub, Name mit Präfix `.`, kein Kick wegen Resourcepack
3. Kisten-Menü per Rechtsklick bzw. langem Tippen, SMP-Eintrag anklicken → SMP. `/hub` zurück
4. Leitfaden-Texte (tellraw/title) lesbar, deutsch wo `de_de.json` greift
5. Java- und Bedrock-Spieler sehen sich, Chat in beide Richtungen
6. GrimAC meldet den Bedrock-Spieler nicht
7. Optional MCXboxBroadcast: Bot erscheint online, Beitritt über die Freundesliste (PlayStation)

## Empfehlung

Machbar mit überschaubarem Aufwand (Technik ~2 h, dazu Portfreigabe und Bot-Konto). Lohnt sich, wenn wirklich PlayStation-Freunde mitspielen wollen –
sie bekommen aber ein deutlich kleineres Spiel (kein Questbuch, keine Karte, kein Voice Chat, keine Wintertexturen ohne eigenes Pack).
Vor dem Einschalten im Testnetz mit einem Windows-Bedrock-Client prüfen: Beitritt, Whitelist, Kisten-Menü, Leitfaden-Texte, Pack-Pflicht, GrimAC-Ausnahme.
Entscheidung bei der Leitung/Pascal.
