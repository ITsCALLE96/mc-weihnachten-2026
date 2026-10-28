# Testwelt: Weihnachtsinsel auf „Der Baum wächst“ umschalten
forceload add -24 -58 23 29
tellraw @a[distance=..200] {"text":"Weihnachtsinsel: Der Baum wächst wird gebaut …","color":"gray"}
schedule function archiv_spawn:stufe_2_setzen 20t
