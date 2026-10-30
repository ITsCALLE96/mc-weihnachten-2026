# VM200: AMP-Instanzen einrichten (30.10.)

Pascal legt die Instanzen in der AMP-Weboberfläche nur an (Name, Application „Minecraft Java Edition“, Autostart aus). Den Rest macht `einrichten.py`
als root auf VM200, bei gestoppten Instanzen (`su - amp -c "ampinstmgr -q <name>"`, danach `-s`): Server-Typ, Jar, Port und Bindung, RAM und JVM-Flags,
AMP-eigene Spielregeln, Schlafmodus aus, Jars/Plugins/Configs aus dem Staging, `velocity.toml`, Velocity-Secret (erzeugt, nur auf dem Server, Rechte 600).

Wichtig zu AMP 2.8 (Minecraft-Modul):
- **AMP schreibt `server.properties` beim Start** aus `MinecraftModule.kvp` (`Minecraft.*`, `Game.*`, `Limits.*`). Sollwerte deshalb dort setzen, nicht nur in der Datei.
- Server-Typ-Werte: `Paper_Spigot` (Paper), `VelocityProxy` (Velocity), `Official`, `Fabric` … – „Paper“/„Velocity“ lehnt AMP ab (Log: „Requested value … was not found“)
- **Versionen über AMP (Pascal 30.10.):** Hub/SMP `Paper_Spigot`, `ReleaseStream=SpecificVersion`, `SpecificPaperVersion=26.3`, `ServerJAR=[Autoselect]`;
  Proxy `VelocityProxy`, `ReleaseStream=Stable`. Das Jar holt AMP mit „Update“ (Paper: neuester Build von 26.3, Velocity: neueste stabile Version).
  Belegt aus `MinecraftModule.dll` (`GetUpdateURI`, `BuildArgumentList`, Enums `ReleaseStream.SpecificVersion=3`, `ServerType.Paper_Spigot=31`).
- **`--log-strip-color`:** AMP 2.8.0.10 hängt bei Paper ` -nojline --log-strip-color` an, wenn `SpecificPaperVersion` keine lesbare Versionsnummer ≥ 1.21.11 ist
  (z. B. leer bei „Stable“ oder `26.3-rc-3`), sonst nur ` -nojline`. Paper 26.3 lehnt `--log-strip-color` ab. Mit `26.3` gewählt tritt es nicht auf,
  eine Sonder-Einstellung ist nicht nötig. Leere `SpecificVersion`/`SpecificVelocityVersion` füllt AMP mit dem ersten Listeneintrag (wirkungslos, s. o.)
- Proxy-Voice: `plugin-konfig/proxy/plugins/voicechat/voicechat-proxy.properties` (`port=24454`), sonst nimmt Voice Chat den Proxy-Port (Standard `-1`)
- `Minecraft.StandaloneServer=False` schreibt `online-mode=false` (nötig hinter Velocity)
- `Limits.SleepMode=False`: Sonst legt AMP ein leeres Backend schlafen, der Proxy fände es nicht
- In der Weboberfläche **nicht „Update“ klicken**: AMP lädt sonst die neueste Paper/Velocity-Version statt der eingefrorenen (`VERSION.md`)
- Die Container sehen nur ihren Instanzordner (`/AMP`), nicht `/opt/...` – gemeinsamer Ordner per Bind-Mount: `geteilt-einrichten.sh` (entschieden 30.10., im Container `/AMP/geteilt`)

Staging: `/root/mcw-staging/vm200/{proxy,hub,smp}` = Server-Jar + `plugins/*.jar` aus `testnetz/`, Configs mit
`server/plugin-konfig/einspielen.sh <ordner> <rolle> vm200`; dazu `velocity.toml` (aus `testnetz/proxy`, Produktions-MOTD, ohne Testwelt) und `server-icon.png`.
