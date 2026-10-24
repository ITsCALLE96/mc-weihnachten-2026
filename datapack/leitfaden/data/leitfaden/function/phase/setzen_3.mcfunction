scoreboard players set #phase lf_phase 3
# Kapitel und Meldung je Spieler kommen über tick → questbuch/aktualisieren
tellraw @a {"translate":"leitfaden.phase.3.chat","fallback":"✦ The server mission begins! Press L for details.","color":"green","bold":true}
title @a title {"translate":"leitfaden.phase.3.titel","fallback":"Server Mission","color":"green"}
