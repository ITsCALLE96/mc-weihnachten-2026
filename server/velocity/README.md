# Velocity-Proxy `MinecraftProxy01` (Task 2 Schritt 6)

Ein Proxy vor zwei Backends (Kurswechsel 24.10.): **`hub`** (Fantasy Village, Abenteuermodus) und **`smp`** (Weihnachtsserver).
Jeder Beitritt landet im Hub (`try = ["hub"]`). Von dort geht es per Crate-Kiste (Plugin `../serverwahl/`) oder `/server smp` aufs SMP, mit `/hub` zurück.
Später kommen weitere Server (zweites SMP, Testwelt, Minigames) einfach als neue Zeile unter `[servers]` und als Eintrag im Kisten-Menü dazu.

## Ports auf VM200 (192.168.178.78)

| Dienst | Port | Bindung | Von außen (FritzBox) |
|---|---|---|---|
| Velocity (Spieler) | TCP **25577** | `0.0.0.0` | **ja**, FritzBox extern **25565 → intern 25577** |
| Simple Voice Chat über den Proxy | UDP 24454 | `0.0.0.0` | **ja** |
| Paper-Backend `MinecraftHub01` (Hub) | TCP 25567 | `127.0.0.1` | nein |
| Paper-Backend `MinecraftWeihnachten01` (SMP) | TCP **25568** | `127.0.0.1` | nein |
| Paper-Backend `MinecraftTestwelt01` (optional, meist gestoppt) | TCP 25569 | `127.0.0.1` | nein |
| Voice Chat Backend SMP | UDP 24455 | `127.0.0.1` | nein |
| Voice Chat Backend Hub | UDP 24456 | `127.0.0.1` | nein |
| Geyser (Bedrock, im Velocity-Prozess, entschieden 27.10.) | UDP 19132 (dazu TCP 19132) | `0.0.0.0` | **ja** (`../bedrock.md`) |
| AMP-Web-UI, RCON | wie bisher | – | nein |

**Ports festgelegt (Leitung 30.10.):** Auf VM200 belegen Minecraft101 25565 (RCON 25575) und MinecraftForeverWorld01 25566 (Voice Chat 24454, RCON 25575).
Deshalb dieselben Ports wie im lokalen Testnetz: Proxy 25577, Hub 25567, SMP 25568, Testwelt 25569. Die FritzBox leitet extern 25565 auf 25577 um,
Spieler brauchen also keine Portangabe. Alle AMP-Instanzen nutzen das Docker-Host-Netz, Ports gelten deshalb für die ganze VM: **Minecraft101 und
ForeverWorld01 dürfen während der Saison nicht laufen** (Voice 24454 und RCON würden kollidieren, RAM reicht nicht). Geyser 19132 und Voice 24455/24456
nutzt sonst keine Instanz (geprüft 30.10.). Stand und Messwerte: Vault, Administration-Doku.

Weil Backend und Voice-Backend nur auf `127.0.0.1` lauschen, kann niemand von einem anderen Rechner am Proxy vorbei beitreten.
Eine Firewall-Regel ist dafür nicht nötig. Geprüft wird es trotzdem (Task 2 Schritt 6).

## Gemeinsames Secret (Modern Forwarding)

Das Secret liegt nur auf dem Server, nie im Repo und nie im Vault:

```bash
openssl rand -hex 32 > /home/amp/.ampdata/instances/MinecraftProxy01/velocity/forwarding.secret
chown amp:amp /home/amp/.ampdata/instances/MinecraftProxy01/velocity/forwarding.secret
chmod 600 /home/amp/.ampdata/instances/MinecraftProxy01/velocity/forwarding.secret
```

Denselben Wert in `config/paper-global.yml` **beider** Backends (SMP und Hub) unter `proxies.velocity.secret` eintragen (`../paper/paper-global.yml.auszug`).
Den Pfad prüfe ich, sobald die Instanz angelegt ist, denn AMP legt Velocity eventuell in einem anderen Unterordner ab.

## Einstellungen

- `velocity.toml.auszug`: Werte für die von Velocity erzeugte `velocity.toml`
- Backend `server.properties`: `online-mode=false`, `server-ip=127.0.0.1`, `server-port=25568` (SMP) bzw. `25567` (Hub) (`../server.properties.md`).
  Die Whitelist bleibt auf dem Backend: Mit Modern Forwarding sieht Paper die echten UUIDs, `white-list` und `enforce-whitelist` greifen.
- Die MOTD in der Serverliste kommt jetzt von Velocity (`motd` in `velocity.toml`), nicht vom Backend.
- Das Resourcepack bieten beide Backends an, mit derselben ID und SHA1. Der Client lädt es im Hub und behält es beim Wechsel.
- Voice Chat: `voicechat-proxy.properties` (Proxy, UDP 24454) und `../paper/voicechat-server.properties.auszug` (Backend, UDP 24455 lokal).
  Hub: `../plugin-konfig/hub/plugins/voicechat/voicechat-server.properties` (UDP 24456 lokal). Spieler brauchen nach außen weiter nur UDP 24454.
  Der Velocity-Plugin erkennt den Backend-Port selbst und leitet beim Serverwechsel um.
  **Plan B**, falls die Velocity-Version von Simple Voice Chat nicht läuft: Plugin vom Proxy nehmen, Backend auf `port=24454` und
  `bind_address=` (alle) stellen, `voice_host=mc.grahl.cloud`. Die Portfreigabe UDP 24454 bleibt dann gleich.

## Chat-Signaturen (No Chat Reports)

Im Modpack ist **No Chat Reports**. Die Mod signiert Chatnachrichten nicht, damit sie nicht an Mojang gemeldet werden können. Auf dem lokalen Testserver
(24.10.) kam deshalb „Chat disabled due to missing profile public key“, und Nachrichten wurden abgelehnt. Die Signatur prüfen zwei Stellen, beide müssen aus sein:
- **Velocity:** `force-key-authentication = false` (`velocity.toml.auszug`). Sonst verlangt der Proxy beim Beitritt einen gültigen Chat-Schlüssel
- **Paper:** `enforce-secure-profile=false` (`../server.properties.md`). Sonst lehnt das Backend unsignierte Nachrichten ab

Das betrifft nur die Chat-Meldefunktion, nicht die Anmeldung. Velocity prüft mit `online-mode = true` weiter jedes Konto bei Mojang, die Whitelist bleibt.
Spieler ohne Pack (Vanilla) können ebenfalls chatten, ihre Nachrichten sind dann signiert, das stört nicht.

## Prüfen

1. Beitritt über `192.168.178.78:25577` (LAN) mit Pascals Account klappt, `/velocity info` zeigt die Version
2. Fremder Account wird abgewiesen (Meldung der Whitelist vom Backend)
3. Von einem anderen Rechner: `Test-NetConnection 192.168.178.78 -Port 25568` (und 25567) → keine Verbindung
4. Backend-Log zeigt beim Beitritt die echte UUID (nicht die Offline-UUID)
5. Zwei Clients mit Pack: Voice-Chat-Symbol verbunden, gegenseitig hörbar
6. Chat: ein Client mit Pack und ein Vanilla-Client schreiben sich gegenseitig, keine Meldung „missing profile public key“

## Server wechseln (seit 24.10.)

| Weg | Wo | Wie |
|---|---|---|
| Crate-Kiste anklicken | Hub | Menü der Kategorie, Klick auf den Server. Plugin `../serverwahl/` schickt „Connect“ über den BungeeCord-Kanal |
| `/server smp`, `/server hub` | überall | eingebaut in Velocity (ohne Rechte-Plugin für alle Spieler verfügbar) |
| `/hub` (`/lobby`) | SMP | Serverwahl auf dem SMP, schickt in den Hub. Im Hub selbst: zurück zum Spawn |

- `bungee-plugin-message-channel = true` muss bleiben (Standard), sonst kommt „Connect“ nicht an.
- `failover-on-unexpected-server-disconnect = true` (Standard): Stürzt das SMP ab oder startet neu, landen Spieler im Hub statt mit Fehlermeldung getrennt zu werden.
- **Neustart 05:00:** Wer im SMP ist, landet beim Neustart im Hub und muss danach wieder per Kiste oder `/server smp` rüber. Nachts egal.
- Lokal getestet im Testnetz (`../../testnetz/README.md`): Proxy auf 25577, Hub 25567, leeres SMP 25568.
