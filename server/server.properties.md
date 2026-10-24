# Sollwerte server.properties (Instanz MinecraftWeihnachten01)

Backend hinter dem Velocity-Proxy (seit 23.10.). Online-Prüfung macht der Proxy, das Backend nimmt nur Verbindungen von `127.0.0.1` an
und prüft das gemeinsame Secret (`velocity/README.md`).

```properties
server-ip=127.0.0.1
server-port=25566
max-players=30
view-distance=8
simulation-distance=6
network-compression-threshold=-1
sync-chunk-writes=false
online-mode=false
enforce-secure-profile=false
white-list=true
enforce-whitelist=true
enable-rcon=false
spawn-protection=0
require-resource-pack=false
resource-pack=https://github.com/ITsCALLE96/mc-weihnachten-2026/releases/download/rp-v3/weihnachten-rp.zip
resource-pack-sha1=34a0d1971ccd9b960e5107a5510191bbb122a0cb
resource-pack-id=73014a80-9072-4aee-961a-5ed01a359e3f
resource-pack-prompt={"text":"Weihnachts-Texturen für unseren Server – annehmen empfohlen, Ablehnen geht aber auch.","color":"aqua"}
motd=§b❄ Weihnachtsserver ❄
```

**`enforce-secure-profile=false`** (seit 24.10., lokaler Testserver): Sonst lehnt Paper Chatnachrichten von Spielern mit No Chat Reports ab („missing profile public key“).
Gehört zusammen mit `force-key-authentication = false` in Velocity, Begründung in `velocity/README.md` → Chat-Signaturen.

**`resource-pack-id`** (seit 24.10.): feste UUID, damit der Client das Pack über Updates hinweg als dasselbe erkennt (sonst meldet Paper „resource-pack-id missing,
using default“). Bei neuen Pack-Versionen bleibt die ID gleich, nur URL und `resource-pack-sha1` ändern sich.
**Seit 24.10.: `rp-v3`** (rp-v2 mit Wintergemälden ohne Musik, dazu Questbuch-Texte DE/EN und Quest-Inhalte; 878.510 Bytes, SHA1 von der Leitung nachgerechnet).
ID unverändert, die neue SHA1 reicht, damit Clients das Pack neu laden. Lokaler Testserver auf dieselben Werte umgestellt.
**Questbuch braucht das Pack:** Ohne Pack sehen Spieler die Quests nur englisch. Ob `require-resource-pack=true` kommt, entscheidet die Leitung (Empfehlung im Plan, Stand Server).

**Serverliste:** Spieler verbinden sich mit Velocity. Dort stehen die sichtbare MOTD (`velocity/velocity.toml.auszug`) und das Bild
(`icon/server-icon.png` neben `velocity.toml`). Die Paper-`motd` sieht nur, wer den Backend-Port direkt anfragt, sie bleibt nur der Ordnung halber gesetzt.

**Wichtig:** `online-mode=false` ist nur zusammen mit `proxies.velocity.enabled: true` und `online-mode: true` in `config/paper-global.yml` sicher
(`paper/paper-global.yml.auszug`). Ohne Proxy-Konfiguration nie so starten.

In AMP lassen sich Port und Bindung in den Instanz-Einstellungen setzen. AMP überschreibt `server.properties` sonst beim Start.

Begründung für Spielerzahl, Sichtweiten und Kompression: `kapazitaet.md`.

Port, RAM und Pfade: siehe Administration-Doku im Vault.
