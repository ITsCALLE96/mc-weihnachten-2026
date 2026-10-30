#!/usr/bin/env python3
# Einmalig auf VM200 (als root): AMP-Instanzen MinecraftProxy01/Hub01/Weihnachten01 einrichten (Session „Minecraft – Server“, 30.10.).
# Instanzen müssen gestoppt sein (ampinstmgr -q <name>, danach -s). Fasst nur diese drei Instanzordner an. Geheimnisse werden erzeugt, nie ausgegeben.
# AMP verwaltet viele server.properties-Werte selbst (MinecraftModule.kvp: Minecraft.*, Game.*, Limits.*) und überschreibt sie beim Start,
# deshalb stehen die Sollwerte aus server/server.properties.md hier als kvp-Werte. Staging: /root/mcw-staging (Jars, Plugins, einspielen.sh vm200,
# velocity.toml aus testnetz/proxy mit Produktions-MOTD, server-icon.png).
import os, re, secrets, shutil, subprocess, sys

ST = "/root/mcw-staging/vm200"
INST = "/home/amp/.ampdata/instances"
RP = {
    "Minecraft.RequireResourcePack": "True",
    "Minecraft.ResourcePackURL": "https://github.com/ITsCALLE96/mc-weihnachten-2026/releases/download/rp-v6/weihnachten-rp.zip",
    "Minecraft.ResourcePackSHA1": "99ef6e55bc93a0789c08fee13a41337dd2d15ab6",
    "Minecraft.ResourcePackID": "ea12c61e-6669-4c55-a40f-5ebf8dff6194",
    "Minecraft.ResourcePackPrompt": '{"text":"Pflicht: Weihnachts-Texturen und das deutsche Questbuch. Ohne Annehmen kein Beitritt.","color":"aqua"}',
}
AIKAR = ("-XX:+UseG1GC -XX:+ParallelRefProcEnabled -XX:MaxGCPauseMillis=200 -XX:+UnlockExperimentalVMOptions -XX:+DisableExplicitGC "
         "-XX:+AlwaysPreTouch -XX:G1NewSizePercent={n} -XX:G1MaxNewSizePercent={m} -XX:G1HeapRegionSize={r} -XX:G1ReservePercent={res} "
         "-XX:G1HeapWastePercent=5 -XX:G1MixedGCCountTarget=4 -XX:InitiatingHeapOccupancyPercent={ihop} -XX:G1MixedGCLiveThresholdPercent=90 "
         "-XX:G1RSetUpdatingPauseTimePercent=5 -XX:SurvivorRatio=32 -XX:+PerfDisableSharedMem -XX:MaxTenuringThreshold=1 "
         "-Dusing.aikars.flags=https://mcflags.emc.gs -Daikars.new.flags=true")
GEMEINSAM_BACKEND = {
    "Minecraft.ServerType": "Spigot",                # nicht Paper_Spigot: AMP hängt dort --log-strip-color an, das Paper 26.3 ablehnt
    "Minecraft.StandaloneServer": "False",           # schreibt online-mode=false (hinter Velocity)
    "Game.Whitelist": "True",
    "Game.EnforceWhitelist": "True",
    "Game.SpawnProtectionRadius": "0",
    "Limits.MaxPlayers": "30",
    "Limits.SleepMode": "False",                     # sonst schläft ein leeres Backend hinter dem Proxy ein
    "Limits.SleepOnStart": "False",
    "Minecraft.ServerJAR": "paper-26.3-207.jar",
    "Minecraft.ServerIPBinding": "127.0.0.1",
    "Minecraft.NetworkCompressionThreshold": "-1",
    "Minecraft.EnforceSecureProfile": "False",
    "Minecraft.EnableStatus": "True",
    "Minecraft.LevelName": "world",
    "Minecraft.AllowAnalytics": "False",
    **RP,
}
INSTANZEN = {
    "MinecraftProxy01": {
        "quelle": "proxy",
        "kvp": {
            "Minecraft.ServerType": "VelocityProxy",          # AMP-Enum (nicht „Velocity“)
            "Limits.SleepMode": "False",
            "Limits.SleepOnStart": "False",
            "Minecraft.ServerJAR": "velocity-4.3.0-44.jar",
            "Minecraft.ServerIPBinding": "0.0.0.0",
            "Minecraft.PortNumber": "25577",
            "Java.MaxHeapSizeMB": "1024",
            "Java.MinHeapSizeMB": "512",
            "Java.CustomOpts": "-XX:+UseG1GC -XX:G1HeapRegionSize=4M -XX:+UnlockExperimentalVMOptions -XX:+ParallelRefProcEnabled -XX:+AlwaysPreTouch -XX:MaxInlineLevel=15",
        },
    },
    "MinecraftHub01": {
        "quelle": "hub",
        "kvp": {
            **GEMEINSAM_BACKEND,
            "Minecraft.PortNumber": "25567",
            "Minecraft.ViewDistance": "6",
            "Minecraft.SimulationDistance": "4",
            "Minecraft.SyncChunkWrites": "False",
            "Minecraft.GenStructures": "False",
            "Minecraft.EnableNether": "False",
            "Minecraft.WorldGenSettings": '{"layers":[{"block":"minecraft:air","height":1}],"biome":"minecraft:the_void"}',
            "Minecraft.ServerMOTD": "§bHub",
            "Game.GameMode": "adventure",
            "Game.ForceGameMode": "True",
            "Game.Difficulty": "Peaceful",
            "Game.EnableMonsters": "False",
            "Game.EnablePVPCombat": "False",
            "Java.MaxHeapSizeMB": "2048",
            "Java.MinHeapSizeMB": "2048",
            "Java.CustomOpts": AIKAR.format(n=30, m=40, r="8M", res=20, ihop=15),
        },
    },
    "MinecraftSMP01": {
        "quelle": "smp",
        "kvp": {
            **GEMEINSAM_BACKEND,
            "Minecraft.PortNumber": "25568",
            "Minecraft.ViewDistance": "8",
            "Minecraft.SimulationDistance": "6",
            "Minecraft.SyncChunkWrites": "False",
            "Minecraft.ServerMOTD": "§bSMP",
            "Game.GameMode": "survival",
            "Game.ForceGameMode": "False",
            "Game.Difficulty": "Normal",
            "Java.MaxHeapSizeMB": "12288",
            "Java.MinHeapSizeMB": "12288",
            "Java.CustomOpts": AIKAR.format(n=40, m=50, r="16M", res=15, ihop=20),
        },
    },
}
# server.properties: Schlüssel, die AMP nicht selbst schreibt (Sollwerte server/server.properties.md)
PROPS = {
    "hub": {"online-mode": "false", "white-list": "true", "enforce-whitelist": "true", "enable-rcon": "false", "enable-query": "false",
            "spawn-protection": "0", "max-players": "30", "level-type": "minecraft\\:flat", "gamemode": "adventure", "force-gamemode": "true",
            "difficulty": "peaceful", "spawn-monsters": "false", "pvp": "false", "allow-nether": "false", "generate-structures": "false"},
    "smp": {"online-mode": "false", "white-list": "true", "enforce-whitelist": "true", "enable-rcon": "false", "enable-query": "false",
            "spawn-protection": "0", "max-players": "30", "difficulty": "normal"},
}


def kvp_setzen(pfad, werte):
    zeilen = open(pfad, encoding="utf-8").read().split("\n")
    gesetzt = set()
    for i, z in enumerate(zeilen):
        k = z.split("=", 1)[0]
        if k in werte:
            zeilen[i] = f"{k}={werte[k]}"
            gesetzt.add(k)
    fehlt = [k for k in werte if k not in gesetzt]
    if fehlt:
        print("  WARNUNG Schlüssel fehlen:", fehlt)
    open(pfad, "w", encoding="utf-8").write("\n".join(zeilen))


def props_setzen(pfad, werte):
    zeilen = open(pfad, encoding="utf-8").read().split("\n") if os.path.exists(pfad) else []
    rest = dict(werte)
    for i, z in enumerate(zeilen):
        k = z.split("=", 1)[0]
        if k in rest:
            zeilen[i] = f"{k}={rest.pop(k)}"
    zeilen = [z for z in zeilen if z != ""] + [f"{k}={v}" for k, v in rest.items()]
    open(pfad, "w", encoding="utf-8").write("\n".join(zeilen) + "\n")


def kopieren(von, nach):
    for wurzel, _, dateien in os.walk(von):
        ziel = os.path.join(nach, os.path.relpath(wurzel, von))
        os.makedirs(ziel, exist_ok=True)
        for d in dateien:
            shutil.copy2(os.path.join(wurzel, d), os.path.join(ziel, d))


# gemeinsames Velocity-Secret: einmal erzeugen (bleibt bei erneutem Lauf gleich)
proxy_mc = f"{INST}/MinecraftProxy01/Minecraft"
secret_datei = f"{proxy_mc}/forwarding.secret"
if not os.path.exists(secret_datei):
    open(secret_datei, "w").write(secrets.token_urlsafe(24))
secret = open(secret_datei).read().strip()

for name, c in INSTANZEN.items():
    basis = f"{INST}/{name}"
    mc = f"{basis}/Minecraft"
    print("==", name)
    kvp = f"{basis}/MinecraftModule.kvp"
    if not os.path.exists(kvp + ".vor-einrichtung"):
        shutil.copy2(kvp, kvp + ".vor-einrichtung")
    kvp_setzen(kvp, c["kvp"])
    kopieren(f"{ST}/{c['quelle']}", mc)
    if c["quelle"] == "proxy":
        shutil.copy2("/root/mcw-staging/velocity.toml", f"{mc}/velocity.toml")
        shutil.copy2("/root/mcw-staging/server-icon.png", f"{mc}/server-icon.png")
    else:
        open(f"{mc}/eula.txt", "w").write("eula=true\n")
        props_setzen(f"{mc}/server.properties", PROPS[c["quelle"]])
        os.makedirs(f"{mc}/config", exist_ok=True)
        pg = f"{mc}/config/paper-global.yml"
        if not os.path.exists(pg):
            open(pg, "w").write("proxies:\n  velocity:\n    enabled: true\n    online-mode: true\n    secret: '" + secret + "'\n")
        else:
            print("  paper-global.yml existiert schon – Secret von Hand prüfen")
    subprocess.run(["chown", "-R", "amp:amp", basis], check=True)
    for f in [secret_datei, f"{mc}/config/paper-global.yml"]:
        if os.path.exists(f):
            os.chmod(f, 0o600)
    print("  ok")
