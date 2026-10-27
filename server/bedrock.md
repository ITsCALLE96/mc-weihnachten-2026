# Bedrock und PlayStation (Geyser + Floodgate) – Vorbereitung, nicht eingerichtet

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

Floodgate `config.yml` (Proxy): `username-prefix: "."` (Standard, bleibt), `send-floodgate-data: true`.

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

## Empfehlung

Machbar mit überschaubarem Aufwand (Technik ~2 h, dazu Portfreigabe und Bot-Konto). Lohnt sich, wenn wirklich PlayStation-Freunde mitspielen wollen –
sie bekommen aber ein deutlich kleineres Spiel (kein Questbuch, keine Karte, kein Voice Chat, keine Wintertexturen ohne eigenes Pack).
Vor dem Einschalten im Testnetz mit einem Windows-Bedrock-Client prüfen: Beitritt, Whitelist, Kisten-Menü, Leitfaden-Texte, Pack-Pflicht, GrimAC-Ausnahme.
Entscheidung bei der Leitung/Pascal.
