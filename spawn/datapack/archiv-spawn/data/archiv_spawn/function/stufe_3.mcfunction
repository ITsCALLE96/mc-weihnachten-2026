# Testwelt: Weihnachtsinsel auf Stufe 3 (Der Baum wird geschmückt) umschalten
forceload add -24 -58 23 29
tellraw @a[distance=..200] {"text":"Weihnachtsinsel: Stufe 3 wird gebaut …","color":"gray"}
schedule function archiv_spawn:stufe_3_setzen 20t
