import { test } from 'node:test';
import assert from 'node:assert/strict';
import { verschiebe, verschiebeRegionen } from './verschieben.mjs';

const d = [320, -1, -176];

test('Blöcke, Bereiche, Strukturen, Spawn und Grenze werden verschoben', () => {
  assert.equal(verschiebe('setblock -1 156 47 minecraft:ender_chest[facing=south]', d), 'setblock 319 155 -129 minecraft:ender_chest[facing=south]');
  assert.equal(verschiebe('fill -4 64 80 4 68 88 minecraft:air replace minecraft:lantern', d), 'fill 316 63 -96 324 67 -88 minecraft:air replace minecraft:lantern');
  assert.equal(verschiebe('place template spawn:spark_insel -26 89 22', d), 'place template spawn:spark_insel 294 88 -154');
  assert.equal(verschiebe('setworldspawn 0 156 48 0 0', d), 'setworldspawn 320 155 -128 0 0');
  assert.equal(verschiebe('worldborder center 0 48', d), 'worldborder center 320 -128');
  assert.equal(verschiebe('forceload add -24 -58 23 29', d), 'forceload add 296 -234 343 -147');
  assert.equal(verschiebe('tp @s 0.5 156 48.5 0 0', d), 'tp @s 320.5 155 -127.5 0 0');
  assert.equal(verschiebe('summon text_display -3.45 155 65.65 {Tags:["a"],text:"1 2 3"}', d), 'summon text_display 316.55 154 -110.35 {Tags:["a"],text:"1 2 3"}');
  assert.equal(verschiebe('playsound minecraft:block.bell.use master @a 0 160 -10 6 0.8', d), 'playsound minecraft:block.bell.use master @a 320 159 -186 6 0.8');
  assert.equal(verschiebe('data merge block 41 237 -18 {is_waxed:1b}', d), 'data merge block 361 236 -194 {is_waxed:1b}');
});

test('execute: Selektoren, positioned, if block/loaded, verschachteltes run; relative Angaben und dx bleiben', () => {
  assert.equal(verschiebe('execute as @a[x=-29,y=150,z=19,dx=56,dy=169,dz=56] at @s run particle minecraft:portal ~ ~1 ~ 0.4 0.9 0.4 0.6 6 normal', d),
    'execute as @a[x=291,y=149,z=-157,dx=56,dy=169,dz=56] at @s run particle minecraft:portal ~ ~1 ~ 0.4 0.9 0.4 0.6 6 normal');
  assert.equal(verschiebe('execute unless block 41 237 -18 #minecraft:wall_signs run setblock 41 237 -18 minecraft:spruce_wall_sign', d),
    'execute unless block 361 236 -194 #minecraft:wall_signs run setblock 361 236 -194 minecraft:spruce_wall_sign');
  assert.equal(verschiebe('execute store success score #geladen insel_tp if loaded -32 68 16 if loaded 16 68 16', d),
    'execute store success score #geladen insel_tp if loaded 288 67 -160 if loaded 336 67 -160');
  assert.equal(verschiebe('execute positioned 0 155 -40 run summon firework_rocket ~ ~ ~', d), 'execute positioned 320 154 -216 run summon firework_rocket ~ ~ ~');
  assert.equal(verschiebe('execute if score #feuer wi_mission matches 1 run summon firework_rocket -9 182 -5 {LifeTime:26}', d),
    'execute if score #feuer wi_mission matches 1 run summon firework_rocket 311 181 -181 {LifeTime:26}');
  assert.equal(verschiebe('$scoreboard players set #tag insel_kalender $(tag)', d), '$scoreboard players set #tag insel_kalender $(tag)');
  assert.equal(verschiebe('# fill 0 0 0 1 1 1 air', d), '# fill 0 0 0 1 1 1 air');
  assert.equal(verschiebe('title @a times 10 70 20', d), 'title @a times 10 70 20');
});

test('Regionen: poly2d-Punkte, Würfel und Höhen', () => {
  const y = '    spawn:\n        type: poly2d\n        min-y: 89\n        max-y: 319\n        points:\n            - {x: 27, z: 47}\n    weihnachtsinsel:\n        min: {x: -24, y: 100, z: -58}\n';
  assert.equal(verschiebeRegionen(y, [320, 10, -176]),
    '    spawn:\n        type: poly2d\n        min-y: 99\n        max-y: 319\n        points:\n            - {x: 347, z: -129}\n    weihnachtsinsel:\n        min: {x: 296, y: 110, z: -234}\n');
});
