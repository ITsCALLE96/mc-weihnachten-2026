# Chat-Brücke #mc-chat ↔ SMP und Hub (DiscordSRV, Leitung/Pascal 31.10.)

- Plugin: **DiscordSRV 1.30.5** (Modrinth `UmLGoGij`, 24.04.2026, GPL-3.0-or-later, Quelle github.com/DiscordSRV/DiscordSRV), im SMP und (seit 31.10. abends) im Hub.
  `DiscordSRV-Build-1.30.5.jar`, 10.653.915 Bytes, SHA-1 `cbe8f9803af8dba9728c5fa44f23ac993862211c`,
  SHA-512 `ef31c7dd8962c7f907bc37b6d762c0ebd1b52f20ff72bb2dd35edb0e354010c03d3eb4cafa8f7acec42aa5e91988814bd0c338a5bced06095c07a6b9b366505c`
- Eigene Discord-Application (nicht der Community-Bot), **Message Content Intent und Server Members Intent an** (ohne Members Intent schaltet sich DiscordSRV 1.x ab, 31.10.). Rechte im Finale-Server: View Channel, Send Messages,
  Read Message History, Manage Webhooks (Spielernamen mit Kopf).
- Token **nicht** in der Config: `plugins/DiscordSRV/.token` (600, amp), ausgenommen aus den AMP-Sicherungen (`backupExclusions.conf`).
  DiscordSRV liest auch `DISCORDSRV_TOKEN` aus der Umgebung (im Jar gesehen), das brauchen wir nicht.
- `konfig-setzen.py` stellt die Standard-Configs ein: keine Pings (allowed_mentions leer, keine Übersetzung von @Namen), Discord → Spiel nur aus
  #mc-chat mit Discord-Namen, Tode und Fortschritte an, Beitritt/Abmeldung aus, kein Konsolenkanal, keine Befehle (`!c`) und keine Spielerliste
  aus Discord, keine Start-/Stopp-Meldungen, keine Platzhalter-Antworten, kein Kanalthema (Online-Zahl), kein Update-Check, Bots in #mc-chat werden ignoriert.

Einrichten (VM200): `discordsrv-probe.sh` (Jar holen, Wegwerf-Start) → `discordsrv-einspielen.sh` (Jar + Config, Helfer) →
interaktiv `ssh -t root@192.168.178.200 "ssh -t root@192.168.178.78 mc-discord-einrichten"` (Kanal-ID, Token verdeckt, SMP-Neustart).

Hub: derselbe Bot-Token und Kanal (Discord erlaubt mehrere Gateway-Verbindungen eines Bots; jede Instanz zeigt #mc-chat einmal im eigenen Spiel).
`konfig-setzen.py … hub`: „[Hub]“ vor dem Namen, Tode/Fortschritte aus. Webhook- und Bot-Nachrichten verarbeitet keine Instanz (BlockWebhooks/BlockBots), also
kein Kreislauf; SMP-Chat erscheint dadurch nicht im Hub und umgekehrt (nur über Discord). Einrichten: `discordsrv-hub.sh` (Token-Kopie aus dem SMP).

Spielerkopf: `AvatarUrl` minotar.net/helm (31.10.: mc-heads.net lieferte für alle Spieler Steve, crafatar 500). Fortschritt-Text deutsch;
Fortschrittsnamen und Todesmeldungen kommen fertig vom Server (Paper hat nur en_us) und bleiben englisch, deutsche Namen wären ein eigener Schritt
(serverwahl über die DiscordSRV-API mit der de_de-Tabelle der Statistik).
