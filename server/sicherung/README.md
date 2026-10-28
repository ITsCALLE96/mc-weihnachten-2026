# Sicherung von spawn/quellen auf die QNAP (Pascal 28.10.: von Hand, Variante B)

`spawn/quellen` (~3,9 GB, fremde Bauten: Spark, Fantasy Village, CA12) ist git-ignoriert und liegt nur auf Pascals PC. Gesichert wird **von Hand**,
einmal pro Woche bzw. nach größeren Änderungen. Keine geplante Aufgabe (der PC ist nachts aus, die QNAP läuft per Energiezeitplan nur 03:45–04:15).

- Ziel: `\\192.168.178.79\backup\pc-c96\mc-weihnachten-2026\spawn-quellen` (SMB-Freigabe `backup` der QNAP)
- Kopiert nur Neues/Geändertes, **löscht nie** etwas am Ziel (ein versehentlich geleerter Quellordner leert die Sicherung nicht)
- Die QNAP wird per Wake-on-LAN geweckt (MAC `00:08:9b:bf:8e:f7`, aus der ARP-Tabelle von pve-main am 28.10., Hersteller-Kennung QNAP).
  Danach läuft sie bis 04:15 des nächsten Tages (Energiezeitplan); früher ausschalten nur über die QNAP-Weboberfläche `http://192.168.178.79`
- Log: `%LOCALAPPDATA%\mc-weihnachten\quellen-sichern.log`

## Einmalig: Anmeldung an der QNAP speichern (Pascal)

1. QNAP wecken (falls aus): das Skript unten mit `-Probe` starten, es wartet bis zu 5 min, bis die Freigabe da ist
2. Explorer öffnen, oben in die Adresszeile `\\192.168.178.79\backup` eingeben, Enter
3. Anmeldefenster: Benutzer `backup`, Passwort aus Bitwarden („QNAP backup“), Haken bei **„Anmeldedaten speichern“**, OK
4. Der Ordner `backup` öffnet sich → fertig. Windows merkt sich die Anmeldung (Anmeldeinformationsverwaltung → Windows-Anmeldeinformationen → `192.168.178.79`)

## Sichern (jedes Mal)

Probelauf (zeigt nur, was kopiert würde):

```
powershell -ExecutionPolicy Bypass -File C:\Users\pasca\source\repos\mc-weihnachten-2026\server\sicherung\quellen-sichern.ps1 -Wecken 00-08-9B-BF-8E-F7 -Probe
```

Sichern:

```
powershell -ExecutionPolicy Bypass -File C:\Users\pasca\source\repos\mc-weihnachten-2026\server\sicherung\quellen-sichern.ps1 -Wecken 00-08-9B-BF-8E-F7
```

Am Ende steht „Fertig (robocopy 0…7)“ = gut. Ab 8 ist etwas schiefgegangen, Details im Log. Die erste Sicherung kopiert alle ~3,9 GB (einige Minuten),
danach nur Änderungen.
