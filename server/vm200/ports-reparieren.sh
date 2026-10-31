#!/usr/bin/env bash
# Ports des Minecraft-Netzes reparieren (Leitung 30.10. 23:57): „Edit Settings → Start on Boot“ in der ADS-Oberfläche hat die Ports aus dem
# ADS-Register (instances.json → DeploymentArgs) in die Instanzen zurückgeschrieben (Hub 25568, SMP 25569, Proxy-kvp 25567, alle 0.0.0.0).
# Setzt Register UND Instanzen dauerhaft auf die Sollwerte: Proxy 0.0.0.0:25577, Hub 127.0.0.1:25567, SMP 127.0.0.1:25568. Start on Boot bleibt an.
# Als root auf VM200. Stoppt SMP, Hub, Proxy und kurz ADS01 (nur die Weboberfläche, andere Spiele laufen weiter), startet alles wieder.
set -euo pipefail
I=/home/amp/.ampdata/instances
J=/home/amp/.ampdata/instances.json
B=/root/mcw-staging/vor-portfix-$(date +%m%d-%H%M); mkdir -p "$B"
amp() { su - amp -c "ampinstmgr $*" </dev/null 2>&1 | tail -1; }
cp -p "$J" "$B/"
for x in MinecraftProxy01 MinecraftHub01 MinecraftSMP01; do cp -p $I/$x/MinecraftModule.kvp "$B/$x.kvp"; done
cp -p $I/MinecraftHub01/Minecraft/server.properties "$B/hub-server.properties"; cp -p $I/MinecraftSMP01/Minecraft/server.properties "$B/smp-server.properties"
echo "== stoppen"
for x in MinecraftSMP01 MinecraftHub01 MinecraftProxy01 ADS01; do echo "$x: $(amp -q $x)"; done
sleep 3
echo "== Register und Instanzen setzen"
python3 - <<'PY'
import json, re, shutil
I = "/home/amp/.ampdata/instances"
J = "/home/amp/.ampdata/instances.json"
SOLL = {"MinecraftProxy01": ("0.0.0.0", "25577"), "MinecraftHub01": ("127.0.0.1", "25567"), "MinecraftSMP01": ("127.0.0.1", "25568")}
d = json.load(open(J, encoding="utf-8"))
for i in d:
    if i["InstanceName"] in SOLL:
        ip, port = SOLL[i["InstanceName"]]
        i["DeploymentArgs"]["MinecraftModule.Minecraft.ServerIPBinding"] = ip
        i["DeploymentArgs"]["MinecraftModule.Minecraft.PortNumber"] = port
        print(i["InstanceName"], "Register:", ip, port, "Start on Boot:", i["DaemonAutostart"])
json.dump(d, open(J, "w", encoding="utf-8"), indent=2, ensure_ascii=False)
shutil.chown(J, "amp", "amp")
for inst, (ip, port) in SOLL.items():
    p = f"{I}/{inst}/MinecraftModule.kvp"
    s = open(p, encoding="utf-8").read()
    s = re.sub(r"(?m)^Minecraft\.ServerIPBinding=.*$", f"Minecraft.ServerIPBinding={ip}", s)
    s = re.sub(r"(?m)^Minecraft\.PortNumber=.*$", f"Minecraft.PortNumber={port}", s)
    open(p, "w", encoding="utf-8").write(s)
    shutil.chown(p, "amp", "amp")
    sp = f"{I}/{inst}/Minecraft/server.properties"
    if inst != "MinecraftProxy01":
        t = open(sp, encoding="utf-8").read()
        t = re.sub(r"(?m)^server-ip=.*$", f"server-ip={ip}", t)
        t = re.sub(r"(?m)^server-port=.*$", f"server-port={port}", t)
        open(sp, "w", encoding="utf-8").write(t)
        shutil.chown(sp, "amp", "amp")
    print(inst, "kvp/server.properties:", ip, port)
PY
echo "== starten"
echo "ADS01: $(amp -s ADS01)"; sleep 10
for x in MinecraftProxy01 MinecraftHub01 MinecraftSMP01; do echo "$x: $(amp -s $x)"; sleep 15; done
for n in $(seq 36); do ss -tln | grep -q '127.0.0.1:25568 ' && break; sleep 5; done
echo "== Belege"
{ ss -tlnp | grep -E ':2556[0-9] |:25577 ' | awk '{print $4}' || true; }
{ grep -E '^Minecraft\.(PortNumber|ServerIPBinding)' $I/MinecraftHub01/MinecraftModule.kvp $I/MinecraftSMP01/MinecraftModule.kvp $I/MinecraftProxy01/MinecraftModule.kvp || true; }
{ su - amp -c "ampinstmgr -l" </dev/null 2>&1 | grep -A6 -E 'MinecraftProxy01|MinecraftHub01|MinecraftSMP01' | grep -i -E 'Instance Name|Boot|Running' | head -9 || true; }
echo "Sicherung: $B"
exit 0
