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
require-resource-pack=true
resource-pack=https://github.com/ITsCALLE96/mc-weihnachten-2026/releases/download/rp-v3/weihnachten-rp.zip
resource-pack-sha1=34a0d1971ccd9b960e5107a5510191bbb122a0cb
resource-pack-id=73014a80-9072-4aee-961a-5ed01a359e3f
resource-pack-prompt={"text":"Pflicht: Weihnachts-Texturen und das deutsche Questbuch. Ohne Annehmen kein Beitritt.","color":"aqua"}
motd=§b❄ Weihnachtsserver ❄
```

**`enforce-secure-profile=false`** (seit 24.10., lokaler Testserver): Sonst lehnt Paper Chatnachrichten von Spielern mit No Chat Reports ab („missing profile public key“).
Gehört zusammen mit `force-key-authentication = false` in Velocity, Begründung in `velocity/README.md` → Chat-Signaturen.

**`resource-pack-id`** (seit 24.10.): feste UUID, damit der Client das Pack über Updates hinweg als dasselbe erkennt (sonst meldet Paper „resource-pack-id missing,
using default“). Bei neuen Pack-Versionen bleibt die ID gleich, nur URL und `resource-pack-sha1` ändern sich.
**Seit 24.10.: `rp-v3`** (rp-v2 mit Wintergemälden ohne Musik, dazu Questbuch-Texte DE/EN und Quest-Inhalte; 878.510 Bytes, SHA1 von der Leitung nachgerechnet).
ID unverändert, die neue SHA1 reicht, damit Clients das Pack neu laden. Lokaler Testserver auf dieselben Werte umgestellt.
**Questbuch braucht das Pack:** Ohne Pack sehen Spieler die Quests nur englisch. Deshalb **`require-resource-pack=true`** (Pascal, 24.10.): Wer ablehnt, wird mit dem Hinweistext getrennt und kann beim nächsten Beitritt annehmen.

**Serverliste:** Spieler verbinden sich mit Velocity. Dort stehen die sichtbare MOTD (`velocity/velocity.toml.auszug`) und das Bild
(`icon/server-icon.png` neben `velocity.toml`). Die Paper-`motd` sieht nur, wer den Backend-Port direkt anfragt, sie bleibt nur der Ordnung halber gesetzt.

**Wichtig:** `online-mode=false` ist nur zusammen mit `proxies.velocity.enabled: true` und `online-mode: true` in `config/paper-global.yml` sicher
(`paper/paper-global.yml.auszug`). Ohne Proxy-Konfiguration nie so starten.

In AMP lassen sich Port und Bindung in den Instanz-Einstellungen setzen. AMP überschreibt `server.properties` sonst beim Start.

Begründung für Spielerzahl, Sichtweiten und Kompression: `kapazitaet.md`.

Port, RAM und Pfade: siehe Administration-Doku im Vault.

## Hub `MinecraftHub01` (seit 24.10.)

Zweites Backend hinter Velocity, jeder Beitritt landet hier (`velocity/velocity.toml.auszug` → `try = ["hub"]`). Gleiche Sicherheitslogik wie das SMP
(nur `127.0.0.1`, Modern Forwarding mit **demselben** Secret in `config/paper-global.yml`).

```properties
server-ip=127.0.0.1
server-port=25567
max-players=30
view-distance=6
simulation-distance=4
network-compression-threshold=-1
online-mode=false
enforce-secure-profile=false
white-list=true
enforce-whitelist=true
enable-rcon=false
spawn-protection=0
gamemode=adventure
force-gamemode=true
difficulty=peaceful
spawn-monsters=false
pvp=false
allow-nether=false
require-resource-pack=true
resource-pack=https://github.com/ITsCALLE96/mc-weihnachten-2026/releases/download/rp-v3/weihnachten-rp.zip
resource-pack-sha1=34a0d1971ccd9b960e5107a5510191bbb122a0cb
resource-pack-id=73014a80-9072-4aee-961a-5ed01a359e3f
resource-pack-prompt={"text":"Pflicht: Weihnachts-Texturen und das deutsche Questbuch. Ohne Annehmen kein Beitritt.","color":"aqua"}
motd=§b❄ Hub ❄
```

- **Resourcepack auf beiden mit derselben ID und SHA1:** Der Client lädt es einmal im Hub, beim Wechsel aufs SMP erkennt er es wieder und lädt nicht neu.
  Bei einem neuen Pack (`rp-vN`) URL und SHA1 auf **beiden** Servern gleichzeitig ändern, sonst lädt jeder Wechsel neu.
- **Whitelist auf beiden** (Annahme, liegt bei der Leitung): Wer nicht auf der Liste steht, kommt schon im Hub nicht rein. Neue Namen also auf Hub und SMP eintragen
  (`whitelist add <name>` in beiden Konsolen).
- `force-gamemode=true` setzt jeden Beitritt auf Abenteuer, auch Ops. Bauen im Hub: `/gamemode creative` nach dem Beitritt.
- **Spielregeln** (einmal in der Hub-Konsole, bleiben in der Welt; Namen in 26.3, geprüft im Testnetz 24.10.):
  `gamerule advance_time false` · `gamerule advance_weather false` · `gamerule spawn_mobs false` · `gamerule fall_damage false` ·
  `gamerule show_advancement_messages false` · `time set noon` · `weather clear`
- Keine Datapacks des SMP im Hub (Leitfaden, Rabatt, Statistik laufen nur auf dem SMP).
