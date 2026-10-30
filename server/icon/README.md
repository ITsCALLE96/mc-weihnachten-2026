# Server-Bild und MOTD

**Bild:** `server-icon.png`, 64 × 64 Pixel (Minecraft nimmt nur genau diese Größe). Motiv: Tannenbaum mit Stern, Schnee, Nachthimmel. Das Bild wird von
`erzeuge-icon.js` erzeugt (`node server/icon/erzeuge-icon.js` im Repo-Wurzelordner, braucht `pngjs` aus `package.json`). Es ist ein Platzhalter. Ein eigenes Bild
von Pascal oder der Gruppe ersetzt es einfach, solange es 64 × 64 PNG bleibt.

**Wohin:** in den Velocity-Ordner neben `velocity.toml` (Instanz MinecraftProxy01). Velocity zeigt das Bild in der Serverliste, Paper nicht, weil `ping-passthrough`
aus ist. Nach dem Kopieren Velocity neu starten.

**MOTD:** steht in `../velocity/velocity.toml.auszug` (MiniMessage, zwei Zeilen):
- Zeile 1: „Minecraft SMP“ im Verlauf Grün → Weiß → Blau (neutral seit 30.10., Pascal: Dauer-Server, kein reiner Weihnachtsserver). Platzhalter, bis Pascal den Namen von den Mitspielern hat
- Zeile 2: „Start am 27.11.“, ab dem Start ein anderer Text; im Dezember darf eine Saison-Zeile („Frohe Weihnachten!“) hinein

Nach einer Änderung: in Velocity `/velocity reload` und in der Serverliste prüfen, dass Farben, Zeilenumbruch und Bild ankommen.
