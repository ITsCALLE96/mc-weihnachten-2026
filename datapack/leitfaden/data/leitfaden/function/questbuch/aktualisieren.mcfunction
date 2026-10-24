# Generiert von tools/questbuch.mjs – nicht von Hand ändern.
# Läuft einmal je Spieler nach Phasenwechsel, Serverstart oder /reload (lf_stand ≠ #phase).
execute if score #phase lf_phase matches 1.. unless entity @s[advancements={leitfaden:ankommen/start=true}] run function leitfaden:questbuch/neu/ankommen
execute if score #phase lf_phase matches 1.. unless entity @s[advancements={leitfaden:bergbau/start=true}] run function leitfaden:questbuch/neu/bergbau
execute if score #phase lf_phase matches 1.. unless entity @s[advancements={leitfaden:landwirtschaft/start=true}] run function leitfaden:questbuch/neu/landwirtschaft
execute if score #phase lf_phase matches 1.. unless entity @s[advancements={leitfaden:tiere/start=true}] run function leitfaden:questbuch/neu/tiere
execute if score #phase lf_phase matches 1.. unless entity @s[advancements={leitfaden:dorf/start=true}] run function leitfaden:questbuch/neu/dorf
execute if score #phase lf_phase matches 1.. unless entity @s[advancements={leitfaden:kampf/start=true}] run function leitfaden:questbuch/neu/kampf
execute if score #phase lf_phase matches 1.. unless entity @s[advancements={leitfaden:entdecken/start=true}] run function leitfaden:questbuch/neu/entdecken
execute if score #phase lf_phase matches 2.. unless entity @s[advancements={leitfaden:nether/start=true}] run function leitfaden:questbuch/neu/nether
execute if score #phase lf_phase matches 3.. unless entity @s[advancements={leitfaden:markt/start=true}] run function leitfaden:questbuch/neu/markt
execute if score #phase lf_phase matches 4.. unless entity @s[advancements={leitfaden:end/start=true}] run function leitfaden:questbuch/neu/end

# Schon erreichte Vanilla-Fortschritte nachreichen (z. B. Spieler aus dem Testlauf)
execute if entity @s[advancements={minecraft:story/root=true}] run advancement grant @s only leitfaden:ankommen/werkbank
execute if entity @s[advancements={minecraft:story/mine_stone=true}] run advancement grant @s only leitfaden:ankommen/stein
execute if entity @s[advancements={minecraft:story/upgrade_tools=true}] run advancement grant @s only leitfaden:ankommen/werkzeug
execute if entity @s[advancements={minecraft:story/smelt_iron=true}] run advancement grant @s only leitfaden:ankommen/eisen
execute if entity @s[advancements={minecraft:story/obtain_armor=true}] run advancement grant @s only leitfaden:ankommen/ruestung
execute if entity @s[advancements={minecraft:story/iron_tools=true}] run advancement grant @s only leitfaden:ankommen/eisenspitzhacke
execute if entity @s[advancements={minecraft:story/lava_bucket=true}] run advancement grant @s only leitfaden:ankommen/lava
execute if entity @s[advancements={minecraft:husbandry/root=true}] run advancement grant @s only leitfaden:ankommen/essen
execute if entity @s[advancements={minecraft:adventure/sleep_in_bed=true}] run advancement grant @s only leitfaden:ankommen/bett
execute if entity @s[advancements={minecraft:adventure/walk_on_powder_snow_with_leather_boots=true}] run advancement grant @s only leitfaden:ankommen/pulverschnee
execute if entity @s[advancements={minecraft:adventure/root=true}] run advancement grant @s only leitfaden:ankommen/abenteuer
execute if entity @s[advancements={minecraft:adventure/kill_a_mob=true}] run advancement grant @s only leitfaden:ankommen/monster
execute if entity @s[advancements={minecraft:adventure/shoot_arrow=true}] run advancement grant @s only leitfaden:ankommen/pfeil
execute if entity @s[advancements={minecraft:story/deflect_arrow=true}] run advancement grant @s only leitfaden:ankommen/schild
execute if entity @s[advancements={minecraft:adventure/fall_from_world_height=true}] run advancement grant @s only leitfaden:ankommen/freier_fall
function leitfaden:andenken/ankommen
execute if entity @s[advancements={minecraft:story/mine_diamond=true}] run advancement grant @s only leitfaden:bergbau/diamanten
execute if entity @s[advancements={minecraft:story/shiny_gear=true}] run advancement grant @s only leitfaden:bergbau/diamantruestung
execute if entity @s[advancements={minecraft:story/form_obsidian=true}] run advancement grant @s only leitfaden:bergbau/obsidian
execute if entity @s[advancements={minecraft:story/enchant_item=true}] run advancement grant @s only leitfaden:bergbau/verzaubern
execute if entity @s[advancements={minecraft:adventure/read_power_of_chiseled_bookshelf=true}] run advancement grant @s only leitfaden:bergbau/buecherregal
execute if entity @s[advancements={minecraft:adventure/crafters_crafting_crafters=true}] run advancement grant @s only leitfaden:bergbau/werker
execute if entity @s[advancements={minecraft:adventure/lighten_up=true}] run advancement grant @s only leitfaden:bergbau/kupferleuchte
execute if entity @s[advancements={minecraft:husbandry/make_a_sign_glow=true}] run advancement grant @s only leitfaden:bergbau/leuchtschild
execute if entity @s[advancements={minecraft:husbandry/plant_seed=true}] run advancement grant @s only leitfaden:landwirtschaft/feld
execute if entity @s[advancements={minecraft:husbandry/balanced_diet=true}] run advancement grant @s only leitfaden:landwirtschaft/ernaehrung
execute if entity @s[advancements={minecraft:husbandry/safely_harvest_honey=true}] run advancement grant @s only leitfaden:landwirtschaft/honig
execute if entity @s[advancements={minecraft:husbandry/silk_touch_nest=true}] run advancement grant @s only leitfaden:landwirtschaft/bienen
execute if entity @s[advancements={minecraft:adventure/honey_block_slide=true}] run advancement grant @s only leitfaden:landwirtschaft/honigblock
execute if entity @s[advancements={minecraft:husbandry/wax_on=true}] run advancement grant @s only leitfaden:landwirtschaft/wachs
execute if entity @s[advancements={minecraft:husbandry/wax_off=true}] run advancement grant @s only leitfaden:landwirtschaft/wachs_ab
execute if entity @s[advancements={minecraft:husbandry/obtain_sniffer_egg=true}] run advancement grant @s only leitfaden:landwirtschaft/schnueffler_ei
execute if entity @s[advancements={minecraft:husbandry/feed_snifflet=true}] run advancement grant @s only leitfaden:landwirtschaft/schnueffler_junges
execute if entity @s[advancements={minecraft:husbandry/plant_any_sniffer_seed=true}] run advancement grant @s only leitfaden:landwirtschaft/schnueffler_samen
execute if entity @s[advancements={minecraft:husbandry/breed_an_animal=true}] run advancement grant @s only leitfaden:tiere/zuechten
execute if entity @s[advancements={minecraft:husbandry/bred_all_animals=true}] run advancement grant @s only leitfaden:tiere/alle_tiere
execute if entity @s[advancements={minecraft:husbandry/tame_an_animal=true}] run advancement grant @s only leitfaden:tiere/zaehmen
execute if entity @s[advancements={minecraft:husbandry/whole_pack=true}] run advancement grant @s only leitfaden:tiere/woelfe
execute if entity @s[advancements={minecraft:husbandry/complete_catalogue=true}] run advancement grant @s only leitfaden:tiere/katzen
execute if entity @s[advancements={minecraft:husbandry/remove_wolf_armor=true}] run advancement grant @s only leitfaden:tiere/wolfspanzer_ab
execute if entity @s[advancements={minecraft:husbandry/repair_wolf_armor=true}] run advancement grant @s only leitfaden:tiere/wolfspanzer_flicken
execute if entity @s[advancements={minecraft:adventure/brush_armadillo=true}] run advancement grant @s only leitfaden:tiere/guerteltier
execute if entity @s[advancements={minecraft:husbandry/ride_a_boat_with_a_goat=true}] run advancement grant @s only leitfaden:tiere/ziege
execute if entity @s[advancements={minecraft:adventure/spyglass_at_parrot=true}] run advancement grant @s only leitfaden:tiere/papagei
execute if entity @s[advancements={minecraft:husbandry/fishy_business=true}] run advancement grant @s only leitfaden:tiere/angeln
execute if entity @s[advancements={minecraft:husbandry/tactical_fishing=true}] run advancement grant @s only leitfaden:tiere/eimerfisch
execute if entity @s[advancements={minecraft:husbandry/axolotl_in_a_bucket=true}] run advancement grant @s only leitfaden:tiere/axolotl
execute if entity @s[advancements={minecraft:husbandry/kill_axolotl_target=true}] run advancement grant @s only leitfaden:tiere/axolotl_kampf
execute if entity @s[advancements={minecraft:husbandry/tadpole_in_a_bucket=true}] run advancement grant @s only leitfaden:tiere/kaulquappe
execute if entity @s[advancements={minecraft:husbandry/leash_all_frog_variants=true}] run advancement grant @s only leitfaden:tiere/froesche
execute if entity @s[advancements={minecraft:husbandry/allay_deliver_item_to_player=true}] run advancement grant @s only leitfaden:tiere/hilfsgeist
execute if entity @s[advancements={minecraft:husbandry/allay_deliver_cake_to_note_block=true}] run advancement grant @s only leitfaden:tiere/hilfsgeist_kuchen
execute if entity @s[advancements={minecraft:husbandry/uh_oh=true}] run advancement grant @s only leitfaden:tiere/schwefelwuerfel
execute if entity @s[advancements={minecraft:adventure/trade=true}] run advancement grant @s only leitfaden:dorf/handel
execute if entity @s[advancements={minecraft:adventure/trade_at_world_height=true}] run advancement grant @s only leitfaden:dorf/sternhaendler
execute if entity @s[advancements={minecraft:story/cure_zombie_villager=true}] run advancement grant @s only leitfaden:dorf/zombiearzt
execute if entity @s[advancements={minecraft:adventure/summon_iron_golem=true}] run advancement grant @s only leitfaden:dorf/golem
execute if entity @s[advancements={minecraft:adventure/lightning_rod_with_villager_no_fire=true}] run advancement grant @s only leitfaden:dorf/blitzableiter
execute if entity @s[advancements={minecraft:adventure/voluntary_exile=true}] run advancement grant @s only leitfaden:dorf/hauptmann
execute if entity @s[advancements={minecraft:adventure/hero_of_the_village=true}] run advancement grant @s only leitfaden:dorf/dorfheld
execute if entity @s[advancements={minecraft:adventure/whos_the_pillager_now=true}] run advancement grant @s only leitfaden:dorf/pluenderer
execute if entity @s[advancements={minecraft:adventure/kill_all_mobs=true}] run advancement grant @s only leitfaden:kampf/alle_monster
execute if entity @s[advancements={minecraft:adventure/bullseye=true}] run advancement grant @s only leitfaden:kampf/zielblock
execute if entity @s[advancements={minecraft:adventure/sniper_duel=true}] run advancement grant @s only leitfaden:kampf/scharfschuetze
execute if entity @s[advancements={minecraft:adventure/ol_betsy=true}] run advancement grant @s only leitfaden:kampf/armbrust
execute if entity @s[advancements={minecraft:adventure/arbalistic=true}] run advancement grant @s only leitfaden:kampf/armbrust_fuenf
execute if entity @s[advancements={minecraft:adventure/two_birds_one_arrow=true}] run advancement grant @s only leitfaden:kampf/phantome
execute if entity @s[advancements={minecraft:adventure/throw_trident=true}] run advancement grant @s only leitfaden:kampf/dreizack
execute if entity @s[advancements={minecraft:adventure/very_very_frightening=true}] run advancement grant @s only leitfaden:kampf/blitz
execute if entity @s[advancements={minecraft:adventure/spear_many_mobs=true}] run advancement grant @s only leitfaden:kampf/speer
execute if entity @s[advancements={minecraft:adventure/totem_of_undying=true}] run advancement grant @s only leitfaden:kampf/totem
execute if entity @s[advancements={minecraft:adventure/who_needs_rockets=true}] run advancement grant @s only leitfaden:kampf/windkugel
execute if entity @s[advancements={minecraft:adventure/blowback=true}] run advancement grant @s only leitfaden:kampf/gegenwind
execute if entity @s[advancements={minecraft:adventure/overoverkill=true}] run advancement grant @s only leitfaden:kampf/streitkolben
execute if entity @s[advancements={minecraft:adventure/kill_mob_near_sculk_catalyst=true}] run advancement grant @s only leitfaden:kampf/sculk
execute if entity @s[advancements={minecraft:adventure/avoid_vibration=true}] run advancement grant @s only leitfaden:kampf/schleichen
execute if entity @s[advancements={minecraft:adventure/adventuring_time=true}] run advancement grant @s only leitfaden:entdecken/biome
execute if entity @s[advancements={minecraft:adventure/use_lodestone=true}] run advancement grant @s only leitfaden:entdecken/leitstein
execute if entity @s[advancements={minecraft:adventure/play_jukebox_in_meadows=true}] run advancement grant @s only leitfaden:entdecken/musik
execute if entity @s[advancements={minecraft:adventure/minecraft_trials_edition=true}] run advancement grant @s only leitfaden:entdecken/pruefkammer
execute if entity @s[advancements={minecraft:adventure/under_lock_and_key=true}] run advancement grant @s only leitfaden:entdecken/tresor
execute if entity @s[advancements={minecraft:adventure/revaulting=true}] run advancement grant @s only leitfaden:entdecken/tresor_unheil
execute if entity @s[advancements={minecraft:adventure/salvage_sherd=true}] run advancement grant @s only leitfaden:entdecken/scherbe
execute if entity @s[advancements={minecraft:adventure/craft_decorated_pot_using_only_sherds=true}] run advancement grant @s only leitfaden:entdecken/krug
execute if entity @s[advancements={minecraft:adventure/trim_with_any_armor_pattern=true}] run advancement grant @s only leitfaden:entdecken/besatz
execute if entity @s[advancements={minecraft:adventure/heart_transplanter=true}] run advancement grant @s only leitfaden:entdecken/knarzherz
execute if entity @s[advancements={minecraft:story/enter_the_nether=true,minecraft:nether/root=true}] run advancement grant @s only leitfaden:nether/portal
execute if entity @s[advancements={minecraft:nether/distract_piglin=true}] run advancement grant @s only leitfaden:nether/piglin
execute if entity @s[advancements={minecraft:nether/find_fortress=true}] run advancement grant @s only leitfaden:nether/festung
execute if entity @s[advancements={minecraft:nether/obtain_blaze_rod=true}] run advancement grant @s only leitfaden:nether/lohe
execute if entity @s[advancements={minecraft:nether/brew_potion=true}] run advancement grant @s only leitfaden:nether/trank
execute if entity @s[advancements={minecraft:nether/all_potions=true}] run advancement grant @s only leitfaden:nether/alle_traenke
execute if entity @s[advancements={minecraft:nether/get_wither_skull=true}] run advancement grant @s only leitfaden:nether/witherschaedel
execute if entity @s[advancements={minecraft:nether/summon_wither=true}] run advancement grant @s only leitfaden:nether/wither
execute if entity @s[advancements={minecraft:nether/create_beacon=true}] run advancement grant @s only leitfaden:nether/leuchtfeuer
execute if entity @s[advancements={minecraft:nether/create_full_beacon=true}] run advancement grant @s only leitfaden:nether/leuchtfeuer_voll
execute if entity @s[advancements={minecraft:nether/find_bastion=true}] run advancement grant @s only leitfaden:nether/bastion
execute if entity @s[advancements={minecraft:nether/loot_bastion=true}] run advancement grant @s only leitfaden:nether/bastion_truhe
execute if entity @s[advancements={minecraft:nether/obtain_ancient_debris=true}] run advancement grant @s only leitfaden:nether/schrott
execute if entity @s[advancements={minecraft:nether/netherite_armor=true}] run advancement grant @s only leitfaden:nether/netheritruestung
execute if entity @s[advancements={minecraft:husbandry/obtain_netherite_hoe=true}] run advancement grant @s only leitfaden:nether/netherithacke
execute if entity @s[advancements={minecraft:nether/obtain_crying_obsidian=true}] run advancement grant @s only leitfaden:nether/weinender_obsidian
execute if entity @s[advancements={minecraft:nether/charge_respawn_anchor=true}] run advancement grant @s only leitfaden:nether/seelenanker
execute if entity @s[advancements={minecraft:nether/ride_strider=true}] run advancement grant @s only leitfaden:nether/schreiter
execute if entity @s[advancements={minecraft:nether/ride_strider_in_overworld_lava=true}] run advancement grant @s only leitfaden:nether/schreiter_heim
execute if entity @s[advancements={minecraft:nether/explore_nether=true}] run advancement grant @s only leitfaden:nether/netherbiome
execute if entity @s[advancements={minecraft:nether/fast_travel=true}] run advancement grant @s only leitfaden:nether/schnellreise
execute if entity @s[advancements={minecraft:nether/return_to_sender=true}] run advancement grant @s only leitfaden:nether/ghast_feuerball
execute if entity @s[advancements={minecraft:nether/uneasy_alliance=true}] run advancement grant @s only leitfaden:nether/ghast_ausflug
execute if entity @s[advancements={minecraft:adventure/spyglass_at_ghast=true}] run advancement grant @s only leitfaden:nether/ghast_fernrohr
execute if entity @s[advancements={minecraft:husbandry/place_dried_ghast_in_water=true}] run advancement grant @s only leitfaden:nether/ausgetrockneter_ghast
execute if entity @s[advancements={minecraft:husbandry/froglights=true}] run advancement grant @s only leitfaden:nether/froschlichter
function leitfaden:andenken/nether
execute if entity @s[advancements={minecraft:story/follow_ender_eye=true}] run advancement grant @s only leitfaden:end/enderauge
execute if entity @s[advancements={minecraft:story/enter_the_end=true,minecraft:end/root=true}] run advancement grant @s only leitfaden:end/end
execute if entity @s[advancements={minecraft:end/kill_dragon=true}] run advancement grant @s only leitfaden:end/drache
execute if entity @s[advancements={minecraft:adventure/spyglass_at_dragon=true}] run advancement grant @s only leitfaden:end/drache_fernrohr
execute if entity @s[advancements={minecraft:end/dragon_egg=true}] run advancement grant @s only leitfaden:end/drachenei
execute if entity @s[advancements={minecraft:end/dragon_breath=true}] run advancement grant @s only leitfaden:end/drachenatem
execute if entity @s[advancements={minecraft:end/respawn_dragon=true}] run advancement grant @s only leitfaden:end/drache_zurueck
execute if entity @s[advancements={minecraft:end/enter_end_gateway=true}] run advancement grant @s only leitfaden:end/transitportal
execute if entity @s[advancements={minecraft:end/find_end_city=true}] run advancement grant @s only leitfaden:end/endsiedlung
execute if entity @s[advancements={minecraft:end/levitate=true}] run advancement grant @s only leitfaden:end/schweben
execute if entity @s[advancements={minecraft:end/elytra=true}] run advancement grant @s only leitfaden:end/elytra
execute if entity @s[advancements={minecraft:nether/all_effects=true}] run advancement grant @s only leitfaden:end/alle_effekte
execute if entity @s[advancements={minecraft:adventure/trim_with_all_exclusive_armor_patterns=true}] run advancement grant @s only leitfaden:end/besatz_alle
function leitfaden:andenken/end

scoreboard players operation @s lf_stand = #phase lf_phase
