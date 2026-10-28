# Sichert spawn/quellen (fremde Bauten: Spark, Fantasy Village, CA12 – git-ignoriert, ~3,9 GB, nur auf Pascals PC) auf die QNAP.
# VORSCHLAG (Leitung 28.10.), noch nicht eingerichtet. Zugangsdaten stehen NICHT hier: Windows nimmt die gespeicherte Anmeldung für die QNAP
# (einmalig von Pascal: Explorer → \\192.168.178.79\backup öffnen, Benutzer „backup“, „Anmeldedaten speichern“ – Passwort steht in Bitwarden).
#
# Die QNAP läuft nur 03:45–04:15 (Energiezeitplan, Vault: Administration - QNAP). Deshalb:
#   - Standard: kurz prüfen, ob die Freigabe erreichbar ist; wenn nicht, mit Hinweis beenden (nichts aufwecken).
#   - -Wecken <MAC>: QNAP per Wake-on-LAN starten und bis zu 5 min auf die Freigabe warten. Sie bleibt dann bis 04:15 des Folgetags an
#     (Energiezeitplan); ausschalten nur über die QNAP-Oberfläche.
#
# Aufruf:  powershell -ExecutionPolicy Bypass -File server\sicherung\quellen-sichern.ps1 [-Wecken AA-BB-CC-DD-EE-FF] [-Probe]
#   -Probe: zeigt nur, was robocopy kopieren würde (/L)
param(
    [string]$Quelle = (Join-Path $PSScriptRoot '..\..\spawn\quellen'),
    [string]$Ziel = '\\192.168.178.79\backup\pc-c96\mc-weihnachten-2026\spawn-quellen',
    [string]$Wecken = '',
    [switch]$Probe
)
$ErrorActionPreference = 'Stop'
$Quelle = (Resolve-Path $Quelle).Path
$Freigabe = '\\192.168.178.79\backup'
$Log = Join-Path $env:LOCALAPPDATA 'mc-weihnachten\quellen-sichern.log'
New-Item -ItemType Directory -Force (Split-Path $Log) | Out-Null

function Erreichbar { Test-Path -LiteralPath $Freigabe }

if (-not (Erreichbar)) {
    if (-not $Wecken) {
        Write-Output "QNAP-Freigabe $Freigabe nicht erreichbar (läuft nur 03:45–04:15). Mit -Wecken <MAC> aufwecken oder im Fenster laufen lassen."
        exit 2
    }
    # Magic Packet: 6 × 0xFF + 16 × MAC, Broadcast UDP 9
    $mac = [byte[]]($Wecken -split '[:-]' | ForEach-Object { [Convert]::ToByte($_, 16) })
    $paket = [byte[]]((,0xFF * 6) + ($mac * 16))
    $udp = New-Object System.Net.Sockets.UdpClient
    $udp.EnableBroadcast = $true
    [void]$udp.Send($paket, $paket.Length, '255.255.255.255', 9)
    $udp.Close()
    Write-Output 'Wake-on-LAN gesendet, warte auf die Freigabe (höchstens 5 min) …'
    $bis = (Get-Date).AddMinutes(5)
    while (-not (Erreichbar)) {
        if ((Get-Date) -gt $bis) { Write-Output 'QNAP antwortet nicht.'; exit 3 }
        Start-Sleep -Seconds 15
    }
}

# Spiegeln ohne Löschen: /E statt /MIR, damit ein versehentlich geleerter Quellordner die Sicherung nicht leert.
# /Z wiederaufnehmbar, /R:2 /W:10 kurze Wiederholung, /XO nur neuere Dateien, /NP ohne Prozentanzeige im Log
$argumente = @($Quelle, $Ziel, '/E', '/Z', '/XO', '/R:2', '/W:10', '/NP', '/NDL', "/LOG+:$Log", '/TEE')
if ($Probe) { $argumente += '/L' }
robocopy @argumente
$rc = $LASTEXITCODE
# robocopy: 0–7 = Erfolg (mit/ohne kopierte Dateien), ab 8 = Fehler
if ($rc -ge 8) { Write-Output "robocopy meldet Fehler ($rc), siehe $Log"; exit $rc }
Write-Output "Fertig (robocopy $rc). Log: $Log"
exit 0
