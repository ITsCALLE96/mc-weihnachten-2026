# Velocity-Proxy `MinecraftProxy01` (Task 2 Schritt 6)

Ein Proxy vor genau einem Backend (`smp`). Spieler landen direkt auf dem SMP, eine Lobby kommt erst mit einem zweiten Server dazu.

## Ports auf VM200 (192.168.178.78)

| Dienst | Port | Bindung | Von außen (FritzBox) |
|---|---|---|---|
| Velocity (Spieler) | TCP 25565 | `0.0.0.0` | **ja** |
| Simple Voice Chat über den Proxy | UDP 24454 | `0.0.0.0` | **ja** |
| Paper-Backend `MinecraftWeihnachten01` | TCP 25566 | `127.0.0.1` | nein |
| Voice Chat Backend | UDP 24455 | `127.0.0.1` | nein |
| AMP-Web-UI, RCON | wie bisher | – | nein |

Falls 25565 auf VM200 schon von einer anderen AMP-Instanz belegt ist: Velocity bekommt den nächsten freien Port, die FritzBox
leitet trotzdem extern 25565 darauf um (dann braucht niemand eine Portangabe). Der tatsächliche Wert kommt in die Administration-Doku.

Weil Backend und Voice-Backend nur auf `127.0.0.1` lauschen, kann niemand von einem anderen Rechner am Proxy vorbei beitreten.
Eine Firewall-Regel ist dafür nicht nötig. Geprüft wird es trotzdem (Task 2 Schritt 6).

## Gemeinsames Secret (Modern Forwarding)

Das Secret liegt nur auf dem Server, nie im Repo und nie im Vault:

```bash
openssl rand -hex 32 > /home/amp/.ampdata/instances/MinecraftProxy01/velocity/forwarding.secret
chown amp:amp /home/amp/.ampdata/instances/MinecraftProxy01/velocity/forwarding.secret
chmod 600 /home/amp/.ampdata/instances/MinecraftProxy01/velocity/forwarding.secret
```

Denselben Wert in `config/paper-global.yml` des Backends unter `proxies.velocity.secret` eintragen (`../paper/paper-global.yml.auszug`).
Den Pfad prüfe ich, sobald die Instanz angelegt ist, denn AMP legt Velocity eventuell in einem anderen Unterordner ab.

## Einstellungen

- `velocity.toml.auszug`: Werte für die von Velocity erzeugte `velocity.toml`
- Backend `server.properties`: `online-mode=false`, `server-ip=127.0.0.1`, `server-port=25566` (`../server.properties.md`).
  Die Whitelist bleibt auf dem Backend: Mit Modern Forwarding sieht Paper die echten UUIDs, `white-list` und `enforce-whitelist` greifen.
- Die MOTD in der Serverliste kommt jetzt von Velocity (`motd` in `velocity.toml`), nicht vom Backend.
- Das Resourcepack bietet weiterhin das Backend an, das funktioniert durch den Proxy hindurch.
- Voice Chat: `voicechat-proxy.properties` (Proxy, UDP 24454) und `../paper/voicechat-server.properties.auszug` (Backend, UDP 24455 lokal).
  Der Velocity-Plugin erkennt den Backend-Port selbst und leitet weiter.
  **Plan B**, falls die Velocity-Version von Simple Voice Chat nicht läuft: Plugin vom Proxy nehmen, Backend auf `port=24454` und
  `bind_address=` (alle) stellen, `voice_host=mc.grahl.cloud`. Die Portfreigabe UDP 24454 bleibt dann gleich.

## Prüfen

1. Beitritt über `192.168.178.78:25565` mit Pascals Account klappt, `/velocity info` zeigt die Version
2. Fremder Account wird abgewiesen (Meldung der Whitelist vom Backend)
3. Von einem anderen Rechner: `Test-NetConnection 192.168.178.78 -Port 25566` → keine Verbindung
4. Backend-Log zeigt beim Beitritt die echte UUID (nicht die Offline-UUID)
5. Zwei Clients mit Pack: Voice-Chat-Symbol verbunden, gegenseitig hörbar
