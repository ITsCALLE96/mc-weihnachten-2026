# Discord-Whitelist (Spezifikation, 28.10., Entwurf zur Freigabe durch die Leitung)

Pascal 28.10.: Wer auf Pascals Discord eine bestimmte Rolle hat (z. B. „Minecraft“), trägt sich in einem Kanal mit seinem Minecraft-Namen ein und
steht sofort, ohne Neustart, auf der Whitelist. Wer den Discord verlässt oder die Rolle verliert, fliegt automatisch von der Whitelist; seine Bauten bleiben.
Java und Bedrock (Floodgate). Der Bot-Teil kommt in den Community-Bot (`C:\dev\discord-bots\community-bot`, LXC 202), den baut eine eigene Session.
Dieser Text beschreibt die Server-Seite und die Schnittstelle dazwischen.

## Kurzfassung der Entscheidungen (Vorschlag Server-Session)

| Frage | Vorschlag | Warum |
|---|---|---|
| Wo greift die Whitelist? | **Vanilla-Whitelist auf Hub und SMP** (wie bisher `enforce-whitelist=true`), beide aus **einer** gemeinsamen Datei gespeist | Velocity hat keine eigene Whitelist. Jeder kommt zuerst in den Hub, das SMP prüft zusätzlich (zweite Tür). Ein gemeinsamer Ordner ist bei uns schon üblich (Eröffnungs-Merker, LuckPerms) |
| Zugang Bot → VM200 | **kleiner HTTP-Endpunkt in serverwahl auf dem Hub**, nur LAN, nur von LXC 202, mit eigenem Schlüssel, darf **nur** die Whitelist ändern | RCON hieße: volles Konsolenrecht für den Bot, Passwort im Klartext über das Netz. Der Endpunkt kann nichts außer Whitelist |
| Namensprüfung | **auf dem Server** (serverwahl): Java über die Mojang-API, Bedrock über die GeyserMC-API (XUID) | eine Stelle, die die UUIDs kennt; der Bot zeigt nur das Ergebnis an |
| Quelle der Wahrheit | **Discord** (Rolle + Eintrag im Kanal). Der Bot gleicht regelmäßig den vollständigen Stand ab | übersteht verpasste Ereignisse, Bot-Neustarts und Server-Neustarts |

## 1. Server-Seite (serverwahl, Hub und SMP)

- Gemeinsame Datei `/opt/mc-weihnachten/whitelist/discord.json` (Testnetz: `testnetz/status/whitelist-discord.json`), Besitzer `amp`, nicht im Repo:
  ```json
  { "stand": "2026-11-20T18:00:00Z",
    "eintraege": [ { "discord": "123456789012345678", "name": "Steve", "uuid": "…", "edition": "java" },
                   { "discord": "234567890123456789", "name": ".Gamertag", "uuid": "00000000-0000-0000-0009-…", "edition": "bedrock" } ] }
  ```
- Der **Hub** schreibt die Datei (nur er hat den Endpunkt). Hub **und** SMP lesen sie alle 10 s (Änderungszeit) und gleichen die Vanilla-Whitelist ab:
  - neu → `OfflinePlayer(uuid).setWhitelisted(true)`
  - entfernt → `setWhitelisted(false)` und, wenn online, Kick mit „Du stehst nicht mehr auf der Whitelist (Discord-Rolle fehlt).“
  - **Nur Einträge, die serverwahl selbst angelegt hat**, werden entfernt (Liste `plugins/Serverwahl/whitelist-verwaltet.txt`). Von Hand eingetragene
    (Pascal, Tester ohne Discord, `whitelist add` in der Konsole) bleiben unangetastet
  - Spielerdaten, Bauten, LuckPerms-Daten bleiben beim Entfernen erhalten (nur die Whitelist ändert sich)
- Bedrock: Floodgate-UUID aus der XUID: `00000000-0000-0000-` + XUID als 16-stellige Hex-Zahl (`0009…`), Name mit Floodgate-Präfix `.` (Standard,
  `username-prefix` unverändert). Vanilla `whitelist add` geht für Bedrock nicht (sucht bei Mojang), deshalb über die UUID
- Ein Discord-Konto hat **höchstens ein** Minecraft-Konto. Ein neuer Eintrag ersetzt den alten (alter Name fliegt von der Whitelist)
- Ein Minecraft-Konto gehört höchstens einem Discord-Konto: Ist die UUID schon vergeben, lehnt der Server ab (`belegt`)

## 2. Endpunkt (serverwahl, nur Hub)

- Lauscht auf `192.168.178.78:8765` (VM200, nur LAN; **keine** Portfreigabe in der FritzBox), eingebauter Java-HTTP-Server, kein weiteres Plugin
- **Zugang doppelt begrenzt:** Quell-IP muss in `whitelist-api.erlaubt` stehen (LXC 202) **und** Header `Authorization: Bearer <schluessel>`.
  Zusätzlich Firewall auf VM200: Port 8765 nur von LXC 202 (Proxmox-Firewall der VM oder `nft`, Pascal/Leitung entscheiden)
- **Schlüssel:** 32 zufällige Bytes (`openssl rand -hex 32`), liegt auf dem Server in `plugins/Serverwahl/whitelist-api.key` (Rechte 600, Besitzer `amp`)
  und im Bot in dessen `.env`/Secret-Speicher. **Nie im Repo, nie im Vault, nie im Chat.** Wechsel: Datei ersetzen + `/serverwahl reload`
- Klartext-HTTP im LAN ist bewusst gewählt: kein Zertifikat zu pflegen; der Schlüssel könnte im LAN mitgelesen werden, er erlaubt aber nur Whitelist-Änderungen,
  und die IP-Sperre gilt zusätzlich. Wenn die Leitung TLS will: selbstsigniertes Zertifikat, Fingerprint im Bot fest hinterlegt
- Grenzen: höchstens 10 Anfragen/s, Rumpf höchstens 64 KB, jede Änderung ins Server-Log („Whitelist: +Steve (Discord …)“)

| Methode, Pfad | Rumpf | Antwort |
|---|---|---|
| `GET /whitelist` | – | `200` `{ "eintraege": [ … ] }` (wie die Datei) |
| `PUT /whitelist/<discordId>` | `{ "name": "Steve", "edition": "java" }` oder `{ "name": "Gamertag", "edition": "bedrock" }` | `200` `{ "name", "uuid", "edition", "neu": true/false }` · `404 {"fehler":"unbekannt"}` (Name gibt es nicht) · `409 {"fehler":"belegt"}` · `400 {"fehler":"name"}` (Format) · `503 {"fehler":"mojang"}` (API nicht erreichbar, später erneut) |
| `DELETE /whitelist/<discordId>` | – | `200` (auch wenn nicht vorhanden, idempotent) |
| `PUT /whitelist` (Abgleich) | `{ "discord": ["<id>", …] }` = alle Discord-IDs, die **jetzt** die Rolle haben | `200` `{ "entfernt": [ … ] }`. Entfernt jeden Eintrag, dessen Discord-ID fehlt. Legt nichts an |

Namensformat: Java `^[A-Za-z0-9_]{3,16}$`; Bedrock 1–16 Zeichen, Buchstaben/Ziffern/Leerzeichen (Leerzeichen → `_` wie Floodgate), ohne Präfix übergeben.

## 3. Namensprüfung (Server)

- **Java:** `GET https://api.mojang.com/users/profiles/minecraft/<name>` → `id` (UUID ohne Bindestriche), richtiger Groß-/Kleinschreibung. `404/204` → `unbekannt`.
  Zwischenspeicher 10 min, Zeitlimit 5 s, bei Fehler `503`
- **Bedrock:** `GET https://api.geysermc.org/v2/xbox/xuid/<gamertag>` → `xuid`. Unbekannt → `unbekannt`. Hinweis an den Spieler: Die GeyserMC-API kennt
  einen Gamertag erst, wenn der Spieler einmal auf **irgendeinem** Geyser-Server war; sonst einmal kurz verbinden (er wird abgewiesen, ist danach aber bekannt)
  und erneut eintragen. Fallback: Floodgate-Befehl `fwhitelist add <gamertag>` von Hand
- Keine Speicherung von Discord-Namen, nur Discord-ID (Zahl), MC-Name, UUID, Edition

## 4. Bot-Seite (für die Bot-Session, Community-Bot)

- Konfiguration (Bot-Secrets): `MC_WHITELIST_URL=http://192.168.178.78:8765`, `MC_WHITELIST_KEY=<schluessel>`, Rollen-ID, Kanal-ID
- **Eintragen:** Nachricht im Kanal (nur Mitglieder mit der Rolle): nur der Name → Java; `bedrock <Gamertag>` oder `.Gamertag` → Bedrock.
  Bot ruft `PUT /whitelist/<discordId>`, reagiert ✅ (mit Antwort „Steve steht auf der Whitelist“) oder ❌ mit kurzem Grund
  (unbekannt / belegt / Server gerade nicht erreichbar → später automatisch erneut, siehe Abgleich). Nachricht nach z. B. 1 min löschen (Kanal bleibt sauber)
  – Pascal bevorzugt im Bot ein Dashboard statt Slash-Befehle; der Kanal-Eintrag passt dazu
- **Rolle weg / Server verlassen:** Bot ruft `DELETE /whitelist/<discordId>` (Ereignisse `on_member_update`, `on_member_remove`)
- **Abgleich alle 10 min und beim Bot-Start:** `PUT /whitelist` mit allen IDs, die die Rolle haben → fängt verpasste Ereignisse ab
- Ausstehende Einträge (Server war aus) merkt sich der Bot und schickt sie beim nächsten Abgleich erneut
- Dashboard (optional): Liste Discord-Mitglied ↔ MC-Name, Knopf „entfernen“
- Keine Schreibrechte auf VM200 außer diesem Endpunkt; kein RCON, kein SSH

## 5. Betrieb, Backup, Test

- Backup: `/opt/mc-weihnachten/whitelist/` zusammen mit `/opt/mc-weihnachten/luckperms/` sichern (Task 9). Verlust ist harmlos: der nächste Abgleich baut ihn
  nicht neu auf (nur Löschungen), deshalb Bot-Befehl „alle neu senden“ für den Notfall
- Testnetz: Endpunkt auf `127.0.0.1:8765`, Testschlüssel in `testnetz/hub/plugins/Serverwahl/whitelist-api.key` (git-ignoriert); Proben mit `curl`:
  eintragen (Java/Bedrock), unbekannter Name, doppelter Name, entfernen (Spieler online → Kick), Abgleich, falscher Schlüssel → `401`, fremde IP → `403`,
  SMP übernimmt binnen 10 s, Hub-Neustart verliert nichts
- Offen für die Leitung/Pascal: Rollenname, Kanal, ob die bisherigen ~25 Namen von Hand oder über Discord kommen, Firewall-Weg auf VM200, TLS ja/nein
