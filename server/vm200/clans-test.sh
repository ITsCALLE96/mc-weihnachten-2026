#!/usr/bin/env bash
# Durchlauf der Clan/Team-API (server/clans-api.md) auf VM200 in der Generalprobe, Fassung 2 (01.11., nach dem 429-Fehlschlag). Als root, kein Neustart.
# Ablauf:
#  1. Sicherung discord.json + LuckPerms-Ordner, Vorbedingungen: niemand online (tps-*.json), es gibt keinen Clan TEST1/TEST2, die drei Test-Spieler
#     sind in keinem Clan. Test-Spieler = vorhandene Einträge der Discord-Whitelist (ITsCALLE96 + die zwei ersten weiteren nach Name); die
#     Whitelist wird NICHT verändert, die Discord-Zuordnung bleibt exakt gleich (wird am Ende verglichen).
#  2. VM200 (192.168.178.78) in api.erlaubt, dann wartet das Skript bis 10 min auf „serverwahl reload“ in der Hub-Konsole (Log-Zeile „erlaubt von“).
#  3. Durchlauf: 1 Anfrage je 1,2 s, bei 429 warten und wiederholen; beim ersten fehlgeschlagenen Schritt Abbruch.
#  4. Aufräumen immer (Admin-Löschen TEST1/TEST2), dann Prüfung DIREKT in den Dateien: keine clan-test*-Gruppe, kein Nutzer mit clan-test*/clan.seit
#     bei den Test-Spielern, Whitelist-Zuordnung wie vorher. Danach VM200 wieder aus api.erlaubt → zweites „serverwahl reload“.
# Der API-Schlüssel wird nur gelesen, nie ausgegeben; Discord-IDs nur gekürzt.
set -uo pipefail
H=/home/amp/.ampdata/instances/MinecraftHub01/Minecraft/plugins/Serverwahl
LOG=/home/amp/.ampdata/instances/MinecraftHub01/Minecraft/logs/latest.log
G=/srv/ampdata/mc-netzwerk-geteilt
C=$H/config.yml
B=/root/mcw-staging/vor-clans-test-$(date +%m%d-%H%M%S); mkdir -p "$B"
cp -p "$G/whitelist/discord.json" "$B/"; tar -czf "$B/luckperms.tar.gz" -C "$G" luckperms
echo "Sicherung: $B"
for s in smp hub; do
  n=$(python3 -c "import json,sys; print(json.load(open(sys.argv[1]))['spieler'])" "$G/status/tps-$s.json" 2>/dev/null || echo "?")
  [ "$n" = 0 ] || { echo "Abbruch: auf $s sind Spieler online ($n) – Test nur, wenn niemand spielt (Tags würden kurz sichtbar)"; exit 0; }
done
echo "== VM200 vorübergehend in api.erlaubt"
grep -q '^    erlaubt: \[192\.168\.178\.22\]$' "$C" || { echo "Abbruch: api.erlaubt hat nicht die erwartete Form"; grep -n '^    erlaubt:' "$C"; exit 0; }
n0=$(grep -c "erlaubt von" "$LOG")
sed -i 's/^    erlaubt: \[192\.168\.178\.22\]$/    erlaubt: [192.168.178.22, 192.168.178.78]  # 192.168.178.78 nur für clans-test.sh/' "$C"
chown amp:amp "$C"
echo ">>> JETZT in der Hub-Konsole: serverwahl reload   (das Skript wartet bis 10 min)"
for i in $(seq 120); do
  [ "$(grep -c "erlaubt von" "$LOG")" -gt "$n0" ] && tail -n 200 "$LOG" | grep -o "erlaubt von \[[^]]*\]" | tail -1 | grep -q "192\.168\.178\.78" && break
  sleep 5
done
if ! tail -n 200 "$LOG" | grep -o "erlaubt von \[[^]]*\]" | tail -1 | grep -q "192\.168\.178\.78"; then
  echo "Kein Reload gesehen – nichts getestet."
  sed -i 's/^    erlaubt: \[192\.168\.178\.22, 192\.168\.178\.78\]  # 192.168.178.78 nur für clans-test.sh$/    erlaubt: [192.168.178.22]/' "$C"
  echo "api.erlaubt zurückgesetzt: $(grep '^    erlaubt:' "$C")"; exit 0
fi
echo "Reload gesehen, API nimmt VM200 an."
python3 - "$H" "$G" <<'PY'
import json, os, re, sys, time, urllib.request, urllib.error
H, G = sys.argv[1], sys.argv[2]
KEY = open(os.path.join(H, "whitelist-api.key")).read().strip()
URL = "http://192.168.178.78:8765"
wl = json.load(open(os.path.join(G, "whitelist", "discord.json")))
zuordnung_vorher = sorted((e["discord"], e["uuid"]) for e in wl["eintraege"])
eintraege = sorted(wl["eintraege"], key=lambda e: (e["name"] != "ITsCALLE96", e["name"].lower()))
if len(eintraege) < 3:
    sys.exit("Abbruch: weniger als 3 Einträge auf der Discord-Whitelist")
(T1, N1), (T2, N2), (T3, N3) = [(e["discord"], e["name"]) for e in eintraege[:3]]
kurz = lambda d: "…" + d[-4:]
print(f"Test-Spieler: {N1} ({kurz(T1)}), {N2} ({kurz(T2)}), {N3} ({kurz(T3)})")

class Abbruch(Exception):
    pass

def api(methode, pfad, rumpf=None):
    for versuch in range(10):
        time.sleep(1.2)
        req = urllib.request.Request(URL + pfad, method=methode, data=None if rumpf is None else json.dumps(rumpf).encode(),
                                     headers={"Authorization": "Bearer " + KEY, "Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                return r.status, json.loads(r.read() or b"{}")
        except urllib.error.HTTPError as e:
            if e.code == 429:
                time.sleep(3)
                continue
            try:
                return e.code, json.loads(e.read() or b"{}")
            except ValueError:
                return e.code, {}
        except OSError as e:
            return 0, {"fehler": "keine Verbindung: " + str(e)}
    return 429, {"fehler": "zu viele (nach 10 Versuchen)"}

def schritt(name, methode, pfad, rumpf=None, status=200, fehlercode=None, test=None):
    s, j = api(methode, pfad, rumpf)
    try:
        ok = s == status and (fehlercode is None or j.get("fehler") == fehlercode) and (test is None or test(j))
    except Exception:
        ok = False
    text = json.dumps(j, ensure_ascii=False)
    for d in (T1, T2, T3):
        text = text.replace(d, kurz(d))
    print(("OK    " if ok else "FEHLER"), name, "→", s, text[:150])
    if not ok:
        raise Abbruch(name)
    return j

ergebnis = 0
try:
    s, j = api("GET", "/clans")
    if s != 200:
        raise Abbruch(f"GET /clans → {s}")
    if any(c["kuerzel"] in ("TEST1", "TEST2") for c in j["clans"]):
        raise Abbruch("TEST1/TEST2 gibt es schon")
    for d in (T1, T2, T3):
        s, j = api("GET", "/clans/von/" + d)
        if s != 200 or j.get("clan") is not None:
            raise Abbruch(f"Test-Spieler {kurz(d)} ist schon in einem Clan oder nicht abfragbar ({s})")
    schritt("prüfen ok", "GET", "/clans/pruefen?kuerzel=test1&name=Test%20Eins&farbe=red", test=lambda j: j.get("kuerzel") == "TEST1")
    schritt("prüfen Sperrliste", "GET", "/clans/pruefen?kuerzel=ADMIN&name=Test%20Eins&farbe=red", status=422, fehlercode="gesperrt")
    schritt("prüfen Wortliste", "GET", "/clans/pruefen?kuerzel=NAZI1&name=Test%20Eins&farbe=red", status=422, fehlercode="gesperrt")
    schritt("prüfen Farbe", "GET", "/clans/pruefen?kuerzel=TEST1&name=Test%20Eins&farbe=black", status=400, fehlercode="farbe")
    schritt("prüfen Kürzel", "GET", "/clans/pruefen?kuerzel=TEST-1&name=Test%20Eins&farbe=red", status=400, fehlercode="kuerzel")
    schritt("unbekanntes Konto", "POST", "/clans", {"von": "900000000000000009", "kuerzel": "TEST9", "name": "Test Neun", "farbe": "red"}, 404, "konto")
    schritt("gründen TEST1", "POST", "/clans", {"von": T1, "kuerzel": "TEST1", "name": "Test Eins", "farbe": "red"}, 201,
            test=lambda j: j["leiter"]["discord"] == T1 and len(j["mitglieder"]) == 1)
    schritt("doppelt (TE5T1)", "POST", "/clans", {"von": T2, "kuerzel": "TE5T1", "name": "Test Zwei", "farbe": "blue"}, 409, "kuerzel-vergeben")
    schritt("zweiter Clan des Leiters", "POST", "/clans", {"von": T1, "kuerzel": "TEST2", "name": "Test Zwei", "farbe": "blue"}, 409, "im-clan")
    schritt("einladen ohne Leitung", "POST", "/clans/TEST1/einladungen", {"von": T2, "an": T3}, 403, "kein-leiter")
    schritt("sich selbst einladen", "POST", "/clans/TEST1/einladungen", {"von": T1, "an": T1}, 400, "selbst")
    schritt("einladen T2", "POST", "/clans/TEST1/einladungen", {"von": T1, "an": T2}, test=lambda j: j.get("kuerzel") == "TEST1" and j.get("farbe") == "red")
    schritt("erneut einladen (ersetzt)", "POST", "/clans/TEST1/einladungen", {"von": T1, "an": T2})
    schritt("von/T2 zeigt Einladung", "GET", "/clans/von/" + T2, test=lambda j: j["clan"] is None and j["einladungen"][0]["kuerzel"] == "TEST1")
    schritt("beitreten ohne Einladung", "POST", "/clans/TEST1/mitglieder", {"von": T3}, 403, "keine-einladung")
    schritt("T2 tritt bei", "POST", "/clans/TEST1/mitglieder", {"von": T2}, test=lambda j: len(j["clan"]["mitglieder"]) == 2)
    schritt("T3 gründet TEST2", "POST", "/clans", {"von": T3, "kuerzel": "TEST2", "name": "Test Zwei", "farbe": "blue"}, 201)
    schritt("TEST2 lädt T2 ein", "POST", "/clans/TEST2/einladungen", {"von": T3, "an": T2})
    schritt("T2 wechselt zu TEST2", "POST", "/clans/TEST2/mitglieder", {"von": T2}, test=lambda j: j["verlassen"] == "TEST1" and j["aufgeloest"] is None)
    schritt("Leitung TEST2 → T2", "PUT", "/clans/TEST2/leiter", {"von": T3, "an": T2}, test=lambda j: j["leiter"]["discord"] == T2)
    schritt("rauswerfen ohne Recht", "DELETE", "/clans/TEST2/mitglieder/" + T2 + "?von=" + T3, status=403, fehlercode="kein-recht")
    schritt("Leiter T2 tritt aus → T3 leitet", "DELETE", "/clans/TEST2/mitglieder/" + T2 + "?von=" + T2, test=lambda j: j["neuer_leiter"] == T3 and j["aufgeloest"] is False)
    schritt("letzter tritt aus → TEST1 aufgelöst", "DELETE", "/clans/TEST1/mitglieder/" + T1 + "?von=" + T1, test=lambda j: j["aufgeloest"] is True)
    schritt("TEST1 weg", "GET", "/clans/TEST1", status=404, fehlercode="clan")
    schritt("Admin löscht TEST2", "DELETE", "/clans/TEST2?admin=1&von=" + T1, test=lambda j: j.get("aufgeloest") == "TEST2")
    print("DURCHLAUF: alle Schritte OK")
except Abbruch as e:
    ergebnis = 1
    print("ABBRUCH bei:", e)
finally:
    print("== Aufräumen")
    for k in ("TEST1", "TEST2"):
        s, j = api("DELETE", f"/clans/{k}?admin=1&von={T1}")
        print("Admin-Löschen", k, "→", s, "(404 = war schon weg)")
    time.sleep(3)
    print("== Prüfung in den Dateien")
    reste = []
    gruppen = [f for f in os.listdir(os.path.join(G, "luckperms", "groups")) if f.lower().startswith("clan-test")]
    if gruppen:
        reste.append(f"Gruppen {gruppen}")
    for f in os.listdir(os.path.join(G, "luckperms", "users")):
        t = open(os.path.join(G, "luckperms", "users", f), encoding="utf-8").read()
        if re.search(r"clan-test", t, re.I):
            reste.append(f"Nutzer {f} mit clan-test")
    wl2 = json.load(open(os.path.join(G, "whitelist", "discord.json")))
    if sorted((e["discord"], e["uuid"]) for e in wl2["eintraege"]) != zuordnung_vorher:
        reste.append("Whitelist-Zuordnung geändert")
    print("Gruppen clan-test*:", gruppen or "keine")
    print("Whitelist-Zuordnung:", "wie vorher" if "Whitelist-Zuordnung geändert" not in reste else "GEÄNDERT")
    print("AUFRÄUMEN:", "sauber" if not reste else "RESTE: " + "; ".join(reste))
    if reste:
        ergebnis = 1
print("ERGEBNIS:", "alles OK" if ergebnis == 0 else "FEHLER – siehe oben (Sicherung im Ordner oben)")
PY
echo "== VM200 wieder aus api.erlaubt"
sed -i 's/^    erlaubt: \[192\.168\.178\.22, 192\.168\.178\.78\]  # 192.168.178.78 nur für clans-test.sh$/    erlaubt: [192.168.178.22]/' "$C"
chown amp:amp "$C"
grep -n '^    erlaubt:' "$C"
echo ">>> JETZT noch einmal in der Hub-Konsole: serverwahl reload   (danach nur noch der Bot-Host)"
exit 0
