#!/usr/bin/env bash
# Durchlauf der Clan/Team-API (server/clans-api.md) auf VM200 in der Generalprobe (Leitung 01.11.), als root nach clans-einspielen.sh und
# dem Neustart von Hub und SMP. Nur Test-Clans TEST1/TEST2 und Test-Discord-IDs 900000000000000001–3; die drei werden vorübergehend mit
# Mojang-Konten (Notch, jeb_, Dinnerbone) auf die Discord-Whitelist gesetzt, weil die Clan-API Discord-IDs über die Whitelist zuordnet.
# Am Ende wird alles wieder abgeräumt (Clans, Whitelist-Einträge), auch wenn ein Schritt scheitert, und geprüft, dass keine clan-test*-Gruppe
# übrig ist. Danach nimmt das Skript VM200 (192.168.178.78) wieder aus api.erlaubt; wirksam nach „serverwahl reload“ in der Hub-Konsole.
# Der API-Schlüssel wird nur aus der Datei gelesen, nie ausgegeben. Kein Neustart.
set -uo pipefail
H=/home/amp/.ampdata/instances/MinecraftHub01/Minecraft/plugins/Serverwahl
python3 - "$H" <<'PY'
import json, re, sys, urllib.request, urllib.error, os
H = sys.argv[1]
KEY = open(os.path.join(H, "whitelist-api.key")).read().strip()
conf = open(os.path.join(H, "config.yml"), encoding="utf-8").read()
GUILD = re.search(r'^\s+gilden:\s*\["?(\d+)', conf, re.M).group(1)
URL = "http://192.168.178.78:8765"
T1, T2, T3 = "900000000000000001", "900000000000000002", "900000000000000003"
fehler = 0

def api(methode, pfad, rumpf=None):
    req = urllib.request.Request(URL + pfad, method=methode, data=None if rumpf is None else json.dumps(rumpf).encode(),
                                 headers={"Authorization": "Bearer " + KEY, "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, json.loads(r.read() or b"{}")
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read() or b"{}")
        except ValueError:
            return e.code, {}

def pruefe(name, methode, pfad, rumpf=None, status=200, fehlercode=None, test=None):
    global fehler
    s, j = api(methode, pfad, rumpf)
    ok = s == status and (fehlercode is None or j.get("fehler") == fehlercode) and (test is None or test(j))
    if not ok:
        fehler += 1
    print(("OK    " if ok else "FEHLER"), name, "→", s, json.dumps(j, ensure_ascii=False)[:160])
    return j

try:
    for d, n in ((T1, "Notch"), (T2, "jeb_"), (T3, "Dinnerbone")):
        pruefe("Whitelist " + n, "PUT", "/whitelist/" + d, {"name": n, "edition": "java", "guild": GUILD})
    pruefe("prüfen ok", "GET", "/clans/pruefen?kuerzel=test1&name=Test%20Eins&farbe=red", test=lambda j: j.get("kuerzel") == "TEST1")
    pruefe("prüfen Sperrliste", "GET", "/clans/pruefen?kuerzel=ADMIN&name=Test%20Eins&farbe=red", status=422, fehlercode="gesperrt")
    pruefe("prüfen Wortliste", "GET", "/clans/pruefen?kuerzel=NAZI1&name=Test%20Eins&farbe=red", status=422, fehlercode="gesperrt")
    pruefe("prüfen Farbe", "GET", "/clans/pruefen?kuerzel=TEST1&name=Test%20Eins&farbe=black", status=400, fehlercode="farbe")
    pruefe("prüfen Kürzel", "GET", "/clans/pruefen?kuerzel=TEST-1&name=Test%20Eins&farbe=red", status=400, fehlercode="kuerzel")
    pruefe("unbekanntes Konto", "POST", "/clans", {"von": "900000000000000009", "kuerzel": "TEST9", "name": "Test Neun", "farbe": "red"}, 404, "konto")
    pruefe("gründen TEST1", "POST", "/clans", {"von": T1, "kuerzel": "TEST1", "name": "Test Eins", "farbe": "red"}, 201,
           test=lambda j: j["leiter"]["discord"] == T1 and len(j["mitglieder"]) == 1)
    pruefe("doppelt (Grundform TE5T1)", "POST", "/clans", {"von": T2, "kuerzel": "TE5T1", "name": "Test Zwei", "farbe": "blue"}, 409, "kuerzel-vergeben")
    pruefe("zweiter Clan des Leiters", "POST", "/clans", {"von": T1, "kuerzel": "TEST2", "name": "Test Zwei", "farbe": "blue"}, 409, "im-clan")
    pruefe("einladen ohne Leitung", "POST", "/clans/TEST1/einladungen", {"von": T2, "an": T3}, 403, "kein-leiter")
    pruefe("sich selbst einladen", "POST", "/clans/TEST1/einladungen", {"von": T1, "an": T1}, 400, "selbst")
    pruefe("einladen T2", "POST", "/clans/TEST1/einladungen", {"von": T1, "an": T2}, test=lambda j: j.get("kuerzel") == "TEST1" and j.get("farbe") == "red")
    pruefe("erneut einladen (ersetzt)", "POST", "/clans/TEST1/einladungen", {"von": T1, "an": T2})
    pruefe("von/T2 zeigt Einladung", "GET", "/clans/von/" + T2, test=lambda j: j["clan"] is None and j["einladungen"][0]["kuerzel"] == "TEST1")
    pruefe("beitreten ohne Einladung", "POST", "/clans/TEST1/mitglieder", {"von": T3}, 403, "keine-einladung")
    pruefe("T2 tritt bei", "POST", "/clans/TEST1/mitglieder", {"von": T2}, test=lambda j: len(j["clan"]["mitglieder"]) == 2)
    pruefe("T3 gründet TEST2", "POST", "/clans", {"von": T3, "kuerzel": "TEST2", "name": "Test Zwei", "farbe": "blue"}, 201)
    pruefe("TEST2 lädt T2 ein", "POST", "/clans/TEST2/einladungen", {"von": T3, "an": T2})
    pruefe("T2 wechselt zu TEST2", "POST", "/clans/TEST2/mitglieder", {"von": T2}, test=lambda j: j["verlassen"] == "TEST1" and j["aufgeloest"] is None)
    pruefe("Leitung TEST2 → T2", "PUT", "/clans/TEST2/leiter", {"von": T3, "an": T2}, test=lambda j: j["leiter"]["discord"] == T2)
    pruefe("rauswerfen ohne Recht", "DELETE", "/clans/TEST2/mitglieder/" + T2 + "?von=" + T3, status=403, fehlercode="kein-recht")
    pruefe("Leiter T2 tritt aus → T3 leitet", "DELETE", "/clans/TEST2/mitglieder/" + T2 + "?von=" + T2, test=lambda j: j["neuer_leiter"] == T3 and j["aufgeloest"] is False)
    pruefe("letzter tritt aus → TEST1 aufgelöst", "DELETE", "/clans/TEST1/mitglieder/" + T1 + "?von=" + T1, test=lambda j: j["aufgeloest"] is True)
    pruefe("TEST1 weg", "GET", "/clans/TEST1", status=404, fehlercode="clan")
    pruefe("Admin löscht TEST2", "DELETE", "/clans/TEST2?admin=1&von=" + T1, test=lambda j: j.get("aufgeloest") == "TEST2")
finally:
    for k in ("TEST1", "TEST2"):
        api("DELETE", "/clans/" + k + "?admin=1&von=" + T1)
    for d in (T1, T2, T3):
        api("DELETE", "/whitelist/" + d + "?guild=" + GUILD)
    s, j = api("GET", "/clans")
    rest = [c["kuerzel"] for c in j.get("clans", []) if c["kuerzel"].startswith("TEST")]
    s2, w = api("GET", "/whitelist")
    wrest = [e["discord"] for e in w.get("eintraege", []) if e["discord"].startswith("9000000000000000")]
    print("Aufräumen:", "OK" if not rest and not wrest else f"FEHLER Reste {rest} {wrest}")
    if rest or wrest:
        fehler += 1
print("ERGEBNIS:", "alles OK" if fehler == 0 else f"{fehler} Fehler")
PY
echo "== Gruppen-Dateien clan-test* im LuckPerms-Speicher:"
{ ls /srv/ampdata/mc-netzwerk-geteilt/luckperms/groups/ | grep -i '^clan-test[12]' || echo "keine (gut)"; }
echo "== VM200 wieder aus api.erlaubt nehmen"
C=$H/config.yml
sed -i 's/^    erlaubt: \[192\.168\.178\.22, 192\.168\.178\.78\]  # 192.168.178.78 nur für clans-test.sh$/    erlaubt: [192.168.178.22]/' "$C"
grep -n '^    erlaubt:' "$C"
echo "Jetzt in der Hub-Konsole: serverwahl reload   (danach nimmt die API nur noch den Bot-Host an)"
exit 0
