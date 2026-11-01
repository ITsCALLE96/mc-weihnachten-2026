#!/usr/bin/env bash
# Aufräumen nach dem gescheiterten clans-test.sh (01.11., Rate-Limit 429): Test-Discord-IDs 900000000000000001–3 (Notch, jeb_, Dinnerbone) von der
# Discord-Whitelist und die Test-Clans TEST1/TEST2 entfernen. Erst über die API (geht, solange VM200 nach dem fehlenden Reload noch erlaubt ist),
# langsam (1 Anfrage/s, bei 429 warten und wiederholen). Danach Prüfung DIREKT in den Dateien (discord.json, luckperms/groups, users).
# Bleibt etwas übrig: Rückfall direkt in den Dateien, mit Sicherung vorher. Als root auf VM200, kein Neustart. API-Schlüssel wird nur gelesen.
set -uo pipefail
H=/home/amp/.ampdata/instances/MinecraftHub01/Minecraft/plugins/Serverwahl
G=/srv/ampdata/mc-netzwerk-geteilt
W=$G/whitelist/discord.json
L=$G/luckperms
echo "== 1. über die API"
python3 - "$H" <<'PY'
import json, re, sys, time, urllib.request, urllib.error, os
H = sys.argv[1]
KEY = open(os.path.join(H, "whitelist-api.key")).read().strip()
conf = open(os.path.join(H, "config.yml"), encoding="utf-8").read()
GILDEN = re.findall(r'"(\d{15,25})"', re.search(r'^\s+gilden:.*$', conf, re.M).group(0))
URL = "http://192.168.178.78:8765"
def api(methode, pfad):
    for versuch in range(8):
        time.sleep(1.0)
        req = urllib.request.Request(URL + pfad, method=methode, headers={"Authorization": "Bearer " + KEY})
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                return r.status, r.read().decode()[:200]
        except urllib.error.HTTPError as e:
            if e.code == 429:
                time.sleep(3)
                continue
            return e.code, e.read().decode()[:200]
        except OSError as e:
            return 0, str(e)
    return 429, "immer noch zu viele"
for k in ("TEST1", "TEST2"):
    print("Clan", k, *api("DELETE", f"/clans/{k}?admin=1&von=900000000000000001"))
for d in ("900000000000000001", "900000000000000002", "900000000000000003"):
    for g in GILDEN:
        s, t = api("DELETE", f"/whitelist/{d}?guild={g}")
        print("Whitelist", d, "Guild", g[-4:], s, t)
PY
sleep 12   # Hub schreibt die Datei sofort, SMP/Hub gleichen alle 10 s ab
echo "== 2. Prüfung in den Dateien"
rest_w=$(python3 -c "import json,sys; d=json.load(open(sys.argv[1])); print(' '.join(e['discord']+'='+e['name'] for e in d.get('eintraege',[]) if e['discord'].startswith('9000000000000000') or e['name'] in ('Notch','jeb_','Dinnerbone')))" "$W") || rest_w="PRÜFUNG FEHLGESCHLAGEN"
rest_g=$(ls "$L/groups" | grep -i '^clan-test[0-9]*\.yml$' | tr '\n' ' ')
rest_u=$(grep -l -i -E 'clan-test[0-9]' "$L/users/"*.yml 2>/dev/null | tr '\n' ' ')
echo "Whitelist-Reste: ${rest_w:-keine}"
echo "Gruppen-Reste:   ${rest_g:-keine}"
echo "Nutzer mit clan-test*: ${rest_u:-keine}"
if [ -n "$rest_w$rest_g$rest_u" ]; then
  echo "== 3. Rückfall: direkt in den Dateien (Sicherung vorher)"
  B=/root/mcw-staging/clans-aufraeumen-$(date +%m%d-%H%M%S); mkdir -p "$B"
  cp -p "$W" "$B/"; tar -czf "$B/luckperms.tar.gz" -C "$G" luckperms
  if [ -n "$rest_w" ]; then
    python3 - "$W" <<'PY'
import json, os, sys
p = sys.argv[1]
d = json.load(open(p))
vorher = len(d["eintraege"])
d["eintraege"] = [e for e in d["eintraege"] if not (e["discord"].startswith("9000000000000000") or e["name"] in ("Notch", "jeb_", "Dinnerbone"))]
tmp = p + ".tmp"
json.dump(d, open(tmp, "w"), indent=2, ensure_ascii=False)
os.replace(tmp, p)
print("discord.json:", vorher, "→", len(d["eintraege"]), "Einträge")
PY
    chown amp:amp "$W"
  fi
  for f in $rest_g; do rm -f "$L/groups/$f"; echo "Gruppe $f gelöscht"; done
  for f in $rest_u; do
    sed -i -E '/clan-test[0-9]+/d' "$f"; chown amp:amp "$f"; echo "Verweis in $(basename "$f") entfernt"
  done
  sleep 12
  echo "== 4. Prüfung nach dem Rückfall"
  python3 -c "import json,sys; d=json.load(open(sys.argv[1])); r=[e['name'] for e in d['eintraege'] if e['discord'].startswith('9000000000000000') or e['name'] in ('Notch','jeb_','Dinnerbone')]; print('Whitelist-Reste:', r or 'keine')" "$W"
  echo "Gruppen-Reste: $(ls "$L/groups" | grep -i '^clan-test' | tr '\n' ' ' || true)"
  echo "Sicherung: $B"
fi
echo "== Hub-Log (Whitelist/Clan, letzte Zeilen)"
{ grep -E "Whitelist: -|Clan/Team" /home/amp/.ampdata/instances/MinecraftHub01/Minecraft/logs/latest.log | tail -12 || true; }
echo "Danach in der Hub-Konsole: serverwahl reload   (VM200 fliegt aus api.erlaubt)"
exit 0
