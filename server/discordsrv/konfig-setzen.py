#!/usr/bin/env python3
"""DiscordSRV 1.30.5 für die Chat-Brücke #mc-chat ↔ SMP einstellen (Leitung/Pascal 31.10.), aus den Standard-Configs, die DiscordSRV beim ersten
Start anlegt. Nur SMP. Spiel → Discord ohne Pings, Discord → Spiel nur aus #mc-chat mit Discord-Namen, Tode und Fortschritte an,
Beitritt/Abmeldung aus, keine Konsole und keine Befehle aus Discord, keine Spielerliste, keine Start-/Stopp-Meldungen (Neustart 04:00),
kein Kanalthema, kein Update-Check.
Der Token steht NICHT in der Config: DiscordSRV liest plugins/DiscordSRV/.token (Datei 600, aus den AMP-Sicherungen ausgenommen).
Aufruf: python3 konfig-setzen.py <standard-ordner> <ziel-ordner> [kanal-id]   (ohne Kanal-ID bleibt der Platzhalter 000000000000000000)
"""
import os
import re
import sys

quelle, ziel = sys.argv[1], sys.argv[2]
kanal = sys.argv[3] if len(sys.argv) > 3 else "000000000000000000"
if not re.fullmatch(r"\d{17,20}", kanal):
    sys.exit(f"Kanal-ID ungültig: {kanal}")

CONFIG = [
    (r"^BotToken: .*$", 'BotToken: ""'),
    (r"^Channels: .*$", f'Channels: {{"global": "{kanal}"}}'),
    (r"^DiscordConsoleChannelId: .*$", 'DiscordConsoleChannelId: "000000000000000000"'),
    (r"^DiscordGameStatus: .*$", 'DiscordGameStatus: ["playing auf dem SMP"]'),
    (r"^Experiment_WebhookChatMessageDelivery: .*$", "Experiment_WebhookChatMessageDelivery: true"),
    (r"^DiscordChatChannelTranslateMentions: .*$", "DiscordChatChannelTranslateMentions: false"),
    (r"^DiscordChatChannelAllowedMentions: .*$", "DiscordChatChannelAllowedMentions: []"),
    (r"^DiscordChatChannelRolesAllowedToUseColorCodesInChat: .*$", "DiscordChatChannelRolesAllowedToUseColorCodesInChat: []"),
    (r"^DiscordChatChannelBlockBots: .*$", "DiscordChatChannelBlockBots: true"),
    (r"^DiscordChatChannelConsoleCommandEnabled: .*$", "DiscordChatChannelConsoleCommandEnabled: false"),
    (r"^DiscordChatChannelListCommandEnabled: .*$", "DiscordChatChannelListCommandEnabled: false"),
    (r"^ChannelTopicUpdaterChannelTopicsAtShutdownEnabled: .*$", "ChannelTopicUpdaterChannelTopicsAtShutdownEnabled: false"),
    (r"^ServerWatchdogEnabled: .*$", "ServerWatchdogEnabled: false"),
    # Update-Check aus (Schlüssel fehlt in der Standard-Config, DiscordSRV kennt ihn: isUpdateCheckDisabled)
    (r"^ForcedLanguage: (.*)$", "ForcedLanguage: none\nUpdateCheckDisabled: true"),
    (r"^MinecraftMentionSound: .*$", "MinecraftMentionSound: false"),
    # Standard-Platzhalter raus: Antworten auf !ip/!site, Kanal-Umbenennung mit Dummy-IDs
    (r"^DiscordCannedResponses: .*$", "DiscordCannedResponses: {}"),
    (r"^ChannelUpdater:\n(?:  .*\n)+", "ChannelUpdater: []\n"),
]
MESSAGES = [
    (r"^DiscordToMinecraftChatMessageFormat: .*$", 'DiscordToMinecraftChatMessageFormat: "[<aqua>Discord</aqua>] %name%%reply% » %message%"'),
    (r"^DiscordToMinecraftChatMessageFormatNoRole: .*$", 'DiscordToMinecraftChatMessageFormatNoRole: "[<aqua>Discord</aqua>] %name%%reply% » %message%"'),
    (r"^DiscordToMinecraftMessageReplyFormat: .*$", 'DiscordToMinecraftMessageReplyFormat: " (Antwort an %name%)"'),
    (r"^MinecraftChatToDiscordMessageFormat: .*$", 'MinecraftChatToDiscordMessageFormat: "%displayname% » %message%"'),
    (r"^DiscordChatChannelServerStartupMessage: .*$", 'DiscordChatChannelServerStartupMessage: ""'),
    (r"^DiscordChatChannelServerShutdownMessage: .*$", 'DiscordChatChannelServerShutdownMessage: ""'),
    # Kanalthema nicht setzen (würde Online-Zahl und Spieler zeigen, dem Bot fehlt dafür auch das Recht)
    (r"^ChannelTopicUpdaterChatChannelTopicFormat: .*$", 'ChannelTopicUpdaterChatChannelTopicFormat: ""'),
    (r"^ChannelTopicUpdaterConsoleChannelTopicFormat: .*$", 'ChannelTopicUpdaterConsoleChannelTopicFormat: ""'),
    (r"^ChannelTopicUpdaterChatChannelTopicAtServerShutdownFormat: .*$", 'ChannelTopicUpdaterChatChannelTopicAtServerShutdownFormat: ""'),
    (r"^ChannelTopicUpdaterConsoleChannelTopicAtServerShutdownFormat: .*$", 'ChannelTopicUpdaterConsoleChannelTopicAtServerShutdownFormat: ""'),
]
# Beitritt, erster Beitritt, Abmeldung aus (kein Protokoll, wer wann online ist); Tod und Fortschritt bleiben an
AUS = ["MinecraftPlayerJoinMessage", "MinecraftPlayerFirstJoinMessage", "MinecraftPlayerLeaveMessage"]


def ersetzen(text, regeln, datei):
    for muster, neu in regeln:
        text, n = re.subn(muster, lambda m: neu, text, count=1, flags=re.M)
        if n != 1:
            sys.exit(f"{datei}: Schlüssel nicht gefunden: {muster}")
    return text


def block_aus(text, name):
    """setzt die erste „  Enabled:“-Zeile direkt unter „<name>:“ auf false"""
    m = re.search(rf"(?m)^{name}:\n  Enabled: (true|false)$", text)
    if not m:
        sys.exit(f"messages.yml: Block {name} nicht gefunden")
    return text[:m.start(1)] + "false" + text[m.end(1):]



def lesen(name):
    return open(os.path.join(quelle, name), encoding="utf-8").read().replace("\r\n", "\n")


def schreiben(name, text):
    open(os.path.join(ziel, name), "w", encoding="utf-8", newline="\n").write(text)


os.makedirs(ziel, exist_ok=True)
schreiben("config.yml", ersetzen(lesen("config.yml"), CONFIG, "config.yml"))
m = ersetzen(lesen("messages.yml"), MESSAGES, "messages.yml")
for name in AUS:
    m = block_aus(m, name)
schreiben("messages.yml", m)
print(f"DiscordSRV-Config geschrieben nach {ziel} (Kanal {'gesetzt' if kanal != '000000000000000000' else 'noch offen'})")
