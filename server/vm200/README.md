# VM200: AMP-Instanzen einrichten (30.10.)

Pascal legt die Instanzen in der AMP-Weboberfläche nur an (Name, Application „Minecraft Java Edition“, Autostart aus). Den Rest macht `einrichten.py`
als root auf VM200, bei gestoppten Instanzen (`su - amp -c "ampinstmgr -q <name>"`, danach `-s`): Server-Typ, Jar, Port und Bindung, RAM und JVM-Flags,
AMP-eigene Spielregeln, Schlafmodus aus, Jars/Plugins/Configs aus dem Staging, `velocity.toml`, Velocity-Secret (erzeugt, nur auf dem Server, Rechte 600).

Wichtig zu AMP 2.8 (Minecraft-Modul):
- **AMP schreibt `server.properties` beim Start** aus `MinecraftModule.kvp` (`Minecraft.*`, `Game.*`, `Limits.*`). Sollwerte deshalb dort setzen, nicht nur in der Datei.
- Server-Typ-Werte: `Paper_Spigot` (Paper), `VelocityProxy` (Velocity), `Official`, `Fabric` … – „Paper“/„Velocity“ lehnt AMP ab (Log: „Requested value … was not found“)
- `Minecraft.StandaloneServer=False` schreibt `online-mode=false` (nötig hinter Velocity)
- `Limits.SleepMode=False`: Sonst legt AMP ein leeres Backend schlafen, der Proxy fände es nicht
- In der Weboberfläche **nicht „Update“ klicken**: AMP lädt sonst die neueste Paper/Velocity-Version statt der eingefrorenen (`VERSION.md`)
- Die Container sehen nur ihren Instanzordner (`/AMP`), nicht `/opt/...` – gemeinsame Ordner brauchen einen Bind-Mount (offen, Leitung)

Staging: `/root/mcw-staging/vm200/{proxy,hub,smp}` = Server-Jar + `plugins/*.jar` aus `testnetz/`, Configs mit
`server/plugin-konfig/einspielen.sh <ordner> <rolle> vm200`; dazu `velocity.toml` (aus `testnetz/proxy`, Produktions-MOTD, ohne Testwelt) und `server-icon.png`.
