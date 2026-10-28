# Testwelt: Weihnachtsinsel auf „Der Baum wird geschmückt“ umschalten
forceload add -24 -58 23 29
tellraw @a[distance=..200] {"text":"Weihnachtsinsel: Der Baum wird geschmückt wird gebaut …","color":"gray"}
schedule function archiv_spawn:stufe_3_setzen 20t
