import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dateien } from './hub.mjs';

const k = JSON.parse(readFileSync(new URL('./hub.json', import.meta.url)));
const { funktionen: f, fortschritte: a } = dateien(k);

test('Aufbau: Kacheln, Kirschhain, Spawn mit Blick, Hub-Gamerules, Weltgrenze über die ganze Insel', () => {
  assert.equal(f.aufbau_teil2.match(/^place template spawn:fantasy_village_\d_\d /gm).length, 16);
  assert.match(f.aufbau_teil2, /^kill @e\[type=!player,x=-150,y=80,z=-158,dx=240,dy=215,dz=244\]$/m);
  assert.match(f.aufbau_teil2, /minecraft:cherry_grove$/m);
  assert.match(f.aufbau_teil2, /^setworldspawn 0 237 0 180 0$/m);
  for (const r of ['random_tick_speed 0', 'fall_damage false', 'spawn_monsters false', 'pvp false']) assert.match(f.aufbau_teil2, new RegExp(`^gamerule ${r}$`, 'm'));
  assert.match(f.aufbau_teil2, /^worldborder center -30 -36\nworldborder set 260$/m);
});

test('Hub-Regeln: zurück zum Brunnen unter y 190 und beim Betreten, Abenteuermodus, satt', () => {
  // Kasten an der Spielerposition (at @s vor der Prüfung) und bis weit unter −64 (Pascal fiel im Test bis y −7570)
  assert.match(f.tick, /^execute as @a at @s if entity @s\[y=-2048,dy=2237\] run function hub:zurueck$/m);
  assert.match(f.zurueck, /^tp @s 0\.5 237 0\.5 180 0$/m);
  assert.match(f.ankommen, /^tp @s 0\.5 237 0\.5 180 0$/m);
  assert.match(f.load, /minecraft\.custom:minecraft\.leave_game/);
  assert.match(f.sekunde, /gamemode adventure @a\[gamemode=survival\]/);
  assert.match(f.sekunde, /saturation infinite/);
});

test('Eröffnung schaltet die SMP-Kiste frei (#offen in insel_zustand), schließen sperrt sie', () => {
  assert.match(f.load, /scoreboard objectives add insel_zustand dummy/);
  assert.match(f.oeffnen, /^scoreboard players set #offen insel_zustand 1$/m);
  assert.match(f.schliessen, /^scoreboard players set #offen insel_zustand 0$/m);
  assert.match(f.aufbau_ende, /^function hub:schliessen$/m);
  assert.doesNotMatch(f.oeffnen, /worldborder/);
});

test('Schriften über den 5 Kisten, 8 Bestenlisten, 8 Info-Stände mit Standbetreiber, Schildern, Hologramm und Links', () => {
  assert.ok(f.aufbau_ende.includes('summon text_display 25.5 237.2 -8.5 {text:[{"text":"SMP\\n","color":"gold","bold":true},{"text":"Rechtsklick"'));
  assert.equal(f.aufbau_ende.match(/hub_bestenliste_\d/g).length, 8);
  assert.equal((f.staende.match(/^summon villager /gm) ?? []).length, 8);
  assert.ok(f.staende.includes('summon villager 42.5 235 -18.5 {Tags:["hub","hub_stand","hub_stand_1"],NoAI:1b,Invulnerable:1b,PersistenceRequired:1b,'));
  assert.ok(f.staende.includes('VillagerData:{type:"minecraft:snow",profession:"minecraft:cleric",level:5},Offers:{Recipes:[]}'));
  assert.ok(f.aufbau_ende.split('\n').includes('kill @e[tag=hub_stand]'));
  assert.ok(f.staende.split('\n').includes('execute unless block 41 237 -18 #minecraft:wall_signs run setblock 41 237 -18 minecraft:spruce_wall_sign[facing=west]'));
  assert.ok(f.staende.split('\n').includes('data merge block 41 237 -18 {is_waxed:1b,front_text:{messages:["","Modpack","",""]}}'));
  assert.ok(f.staende.includes('messages:["","Winterkalender","&","Weihnachtsinsel"]'));
  assert.equal(a['stand/3'].rewards.function, 'hub:stand/3');
  assert.ok(f['stand/1'].includes('Kein Griefing')); // Regeln aus k.regeln
  assert.ok(f['stand/2'].includes('"click_event":{"action":"open_url","url":"https://github.com/ITsCALLE96/mc-weihnachten-2026/releases/tag/modpack-v2"}'));
  assert.ok(f['stand/6'].includes('Discord beitreten: Link folgt')); // leerer Link → Platzhalter
  assert.ok(f['stand/5'].includes('Termine im Discord') && !/\d{1,2}\.\d{1,2}\.(?!\d)/.test(f['stand/5']));
  assert.ok(f.staende.includes('LavaBuilds')); // Danke als Hologramm am Dorfschild
  assert.ok(!/hub_f_stand_\d/.test(f.aufbau_ende)); // keine Klickfläche mehr, der Dorfbewohner ist der Klick
});

test('Info-Dorfbewohner: markiert, Fortschritt mit Belohnung, Fortschritt wird zurückgenommen', () => {
  assert.equal(k.dorfbewohner.length, 13);
  assert.match(f.aufbau_ende, /^tag @e\[type=villager,x=-54\.5,y=234,z=0\.5,distance=\.\.1\.5,limit=1\] add hub_npc_2$/m);
  assert.equal(a['npc/2'].criteria.klick.trigger, 'minecraft:player_interacted_with_entity');
  assert.equal(a['npc/2'].criteria.klick.conditions.entity.predicate['minecraft:nbt'], '{Tags:["hub_npc_2"]}');
  assert.equal(a['npc/2'].rewards.function, 'hub:npc/2');
  assert.match(f['npc/2'], /^advancement revoke @s only hub:npc\/2$/m);
});

test('Adventskalender im Hub entfällt (Winterkalender auf der SMP-Spawn-Insel, 27.10.)', () => {
  assert.equal(k.advent.length, 0);
  assert.doesNotMatch(f.aufbau_ende, /hub_advent/);
  assert.equal(f['advent/naechster_tag'], undefined);
});

test('Adventskalender (Funktion bleibt im Generator): 24 Geschenke, freigeschaltet nach #tag, je Spieler einmal', () => {
  const ka = { ...k, advent: Array.from({ length: 24 }, (_, i) => [i, 235, 0]), adventGeschenke: Array.from({ length: 24 }, (_, i) => (i === 2 ? 'minecraft:green_candle' : 'minecraft:cookie')) };
  const f = dateien(ka).funktionen;
  assert.ok(f.aufbau_ende.includes('scale:[0f,0f,0f]},Tags:["hub","hub_advent","hub_advent_zu","hub_g_24"]'));
  assert.ok(f.aufbau_ende.includes('\nscoreboard players set @e[tag=hub_g_24] hub_advent 24\n'));
  assert.ok(f.sekunde.includes('\nexecute as @e[tag=hub_advent_zu] if score @s hub_advent <= #tag hub_advent run function hub:advent/zeigen\n'));
  assert.ok(f['advent/zeigen'].includes('transformation.scale set value [0.5f,0.5f,0.5f]'));
  assert.match(f['advent/naechster_tag'], /matches 25\.\. run scoreboard players set #tag hub_advent 24/);
  assert.match(f['advent/fund_3'], /unless entity @s\[tag=hub_hat_3\] run function hub:advent\/neu_3/);
  assert.match(f['advent/neu_3'], /^tag @s add hub_hat_3$/m);
  assert.match(f['advent/neu_3'], /^give @s minecraft:green_candle\[custom_name=/m);
  assert.match(f.aufbau_ende, /"hub_klick","hub_advent","hub_advent_zu","hub_g_1"/);
  assert.ok(f.klick.includes('hub_f_advent_fund_24,tag=!hub_advent_zu] on target at @s run function hub:advent/fund_24'));
});

test('Sichtbare Klickpunkte: Hinweis „Titel + Rechtsklick“ an Ständen, Voice-Ecke und Dorfbewohnern, Partikel, Korrektur roter Wolle', () => {
  const hinweise = f.aufbau_ende.split('\n').filter((z) => z.includes('"hub_hinweis"'));
  assert.equal(hinweise.length, 8 + 1 + 13);
  assert.ok(hinweise.every((z) => z.includes('{"text":"Rechtsklick","color":"gray"}')));
  assert.ok(f.aufbau_ende.includes('summon text_display 42.5 238.05 -18.5 {Tags:["hub","hub_stand","hub_hinweis"],billboard:"center"')); // über dem Standbetreiber
  assert.ok(f.aufbau_ende.includes('summon text_display -54.5 236.4 0.5 {text:[{"text":"Fischer\\n","color":"green","bold":true}'));
  assert.ok(f.sekunde.includes('execute at @e[type=text_display,tag=hub_hinweis] run particle minecraft:end_rod'));
  assert.ok(f.aufbau_ende.includes('\nsetblock -50 234 11 minecraft:air\n'));
  assert.ok(f['npc/2'].includes('{"text":"Fischer: ","color":"green"}'));
});
