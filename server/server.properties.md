# Sollwerte server.properties (Instanz MinecraftSMP01)

Backend hinter dem Velocity-Proxy (seit 23.10.). Online-Prüfung macht der Proxy, das Backend nimmt nur Verbindungen von `127.0.0.1` an
und prüft das gemeinsame Secret (`velocity/README.md`).

Ports auf VM200 (Leitung 30.10.): Proxy 25577, Hub 25567, SMP 25568, Testwelt 25569 – 25565/25566 belegen dort andere Instanzen.
AMP schreibt eigene Schlüssel dazu (z. B. `server-portv6` = Port + 1, `query.port`, `rcon.port`); Paper wertet `server-portv6` nicht aus. Nach dem
ersten Start mit `ss -tlnup` prüfen, dass nur 127.0.0.1:<Port> lauscht und `enable-query=false`, `enable-rcon=false` stehen (sonst kollidieren
`query.port`/`rcon.port` zwischen Hub, SMP und anderen Instanzen).

```properties
server-ip=127.0.0.1
server-port=25568
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
enable-query=false
spawn-protection=0
difficulty=normal
require-resource-pack=true
resource-pack=https://github.com/ITsCALLE96/mc-weihnachten-2026/releases/download/rp-v6/weihnachten-rp.zip
resource-pack-sha1=99ef6e55bc93a0789c08fee13a41337dd2d15ab6
resource-pack-id=ea12c61e-6669-4c55-a40f-5ebf8dff6194
resource-pack-prompt={"text":"Pflicht: Weihnachts-Texturen und das deutsche Questbuch. Ohne Annehmen kein Beitritt.","color":"aqua"}
motd=§bSMP
```

**`difficulty=normal`** (seit 26.10., Leitung beim Testnetz-Test; war vorher nirgends festgelegt, Paper-Standard wäre `easy`). Pascal darf noch widersprechen.

**`enforce-secure-profile=false`** (seit 24.10., lokaler Testserver): Sonst lehnt Paper Chatnachrichten von Spielern mit No Chat Reports ab („missing profile public key“).
Gehört zusammen mit `force-key-authentication = false` in Velocity, Begründung in `velocity/README.md` → Chat-Signaturen.

**`resource-pack-id`** (seit 24.10.): feste UUID, damit der Client das Pack über Updates hinweg als dasselbe erkennt (sonst meldet Paper „resource-pack-id missing,
using default“). Bei neuen Pack-Versionen ändern sich URL und `resource-pack-sha1`; seit rp-v4 bekommt jede Version zusätzlich eine neue ID (Leitung 26.10.),
damit Clients sicher neu laden. ID, URL und SHA1 immer auf Hub und SMP gleichzeitig ändern.
**Seit 30.10.: `rp-v6`** (9.623.076 Bytes, SHA1 `99ef6e55bc93a0789c08fee13a41337dd2d15ab6`, von Leitung und Server-Session per Download geprüft), ID `ea12c61e-6669-4c55-a40f-5ebf8dff6194`. Auf VM200 in den AMP-Einstellungen von Hub und SMP (`Minecraft.ResourcePack*`), sonst überschreibt AMP es.
**Vorher (26.10.): `rp-v4`** (883.440 Bytes, SHA1 `45e2d461d097f6ece7f5dad8aa756d527984be0b`, von Leitung und Server-Session per Download geprüft), neue ID `366d33f6-84ba-41df-8376-97e055b7d368`.
Umgestellt: diese Datei, `testnetz/einrichten.sh`, Testnetz Hub + SMP, lokaler Testserver.
**Vorher (24.10.): `rp-v3`** (rp-v2 mit Wintergemälden ohne Musik, dazu Questbuch-Texte DE/EN und Quest-Inhalte; 878.510 Bytes, SHA1 von der Leitung nachgerechnet).
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
enable-query=false
spawn-protection=0
level-type=minecraft\:flat
generator-settings={"layers":[{"block":"minecraft:air","height":1}],"biome":"minecraft:the_void"}
generate-structures=false
gamemode=adventure
force-gamemode=true
difficulty=peaceful
spawn-monsters=false
pvp=false
allow-nether=false
require-resource-pack=true
resource-pack=https://github.com/ITsCALLE96/mc-weihnachten-2026/releases/download/rp-v6/weihnachten-rp.zip
resource-pack-sha1=99ef6e55bc93a0789c08fee13a41337dd2d15ab6
resource-pack-id=ea12c61e-6669-4c55-a40f-5ebf8dff6194
resource-pack-prompt={"text":"Pflicht: Weihnachts-Texturen und das deutsche Questbuch. Ohne Annehmen kein Beitritt.","color":"aqua"}
motd=§bHub
```

- **Resourcepack auf beiden mit derselben ID und SHA1:** Der Client lädt es einmal im Hub, beim Wechsel aufs SMP erkennt er es wieder und lädt nicht neu.
  Bei einem neuen Pack (`rp-vN`) URL und SHA1 auf **beiden** Servern gleichzeitig ändern, sonst lädt jeder Wechsel neu.
- **Whitelist auf beiden** (entschieden Leitung 24.10., Hub nicht offen): Wer nicht auf der Liste steht, kommt schon im Hub nicht rein. Neue Namen also auf Hub und SMP eintragen
  (`whitelist add <name>` in beiden Konsolen).
- `force-gamemode=true` setzt jeden Beitritt auf Abenteuer, auch Ops. Bauen im Hub: `/gamemode creative` nach dem Beitritt.
- **Spielregeln** (einmal in der Hub-Konsole, bleiben in der Welt; Namen in 26.3, geprüft im Testnetz 24.10.):
  `gamerule advance_time false` · `gamerule advance_weather false` · `gamerule spawn_mobs false` · `gamerule fall_damage false` ·
  `gamerule show_advancement_messages false` · `time set noon` · `weather clear`
- **Leerwelt** (`generator-settings` oben, Welt `world`): Die Spawn-&-Welt-Session setzt das Fantasy Village hinein (Ursprung −150/80/−158), Spawn `setworldspawn 0 237 0 180` (Brunnen, Blick Norden; Spawn & Welt 26.10.).
- Keine Datapacks des SMP im Hub (Leitfaden, Rabatt, Statistik laufen nur auf dem SMP).
