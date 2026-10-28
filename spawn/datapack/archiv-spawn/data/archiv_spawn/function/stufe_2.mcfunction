# Testwelt: Weihnachtsinsel auf Stufe 2 (Der Baum wächst) umschalten
forceload add -24 -58 23 29
tellraw @a[distance=..200] {"text":"Weihnachtsinsel: Stufe 2 wird gebaut …","color":"gray"}
schedule function archiv_spawn:stufe_2_setzen 20t
