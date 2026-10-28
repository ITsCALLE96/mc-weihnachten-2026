import { test } from 'node:test';
import assert from 'node:assert/strict';
import { archivSpawn, itemNbt, verschiebeY, turm, TIEF } from './archiv.mjs';

test('give-Text → Item-NBT (Komponenten mit Werten, Entfernen per !)', () => {
  assert.equal(itemNbt('minecraft:paper[minecraft:item_model="weihnachten:stern",minecraft:lore=[{text:"a, b",italic:false}]]'),
    '{id:"minecraft:paper",count:1,components:{"minecraft:item_model":"weihnachten:stern","minecraft:lore":[{text:"a, b",italic:false}]}}');
  assert.equal(itemNbt('minecraft:leather_helmet[minecraft:attribute_modifiers=[],!minecraft:max_damage]'),
    '{id:"minecraft:leather_helmet",count:1,components:{"minecraft:attribute_modifiers":[],"!minecraft:max_damage":{}}}');
  assert.equal(itemNbt('minecraft:emerald', 3), '{id:"minecraft:emerald",count:3}');
});

test('Archiv: eine Weihnachtsinsel TIEF tiefer, Stufen 1–4 per Schalter, Treppenturm, Galerie mit allen Items', () => {
  const { dateien: d, strukturen } = archivSpawn();
  assert.deepEqual(JSON.parse(d['data/archiv/tags/function/saal/weihnachtsinsel.json']).values, ['archiv_spawn:weihnachtsinsel']);
  assert.deepEqual(JSON.parse(d['data/archiv/tags/function/saal/deko.json']).values, ['archiv_spawn:deko']);
  assert.deepEqual(Object.keys(strukturen).sort(), ['wi_stufe_1', 'wi_stufe_2', 'wi_stufe_3', 'wi_stufe_4']);
  assert.equal(TIEF, -152);
  for (let s = 1; s <= 4; s++) {
    const f = d[`data/archiv_spawn/function/stufe_${s}_setzen.mcfunction`];
    assert.match(f, new RegExp(`^place template archiv_spawn:wi_stufe_${s} -24 -52 -58$`, 'm')); // SMP-Stelle, 152 tiefer
    assert.match(f, /^kill @e\[tag=wi_archiv_insel\]$/m);
    assert.equal(JSON.parse(d[`data/archiv_spawn/advancement/stufe_${s}.json`]).rewards.function, `archiv_spawn:klick_${s}`);
  }
  assert.equal((d['data/archiv_spawn/function/stufe_4_setzen.mcfunction'].match(/^summon mannequin /gm) ?? []).length, 1);
  assert.equal((d['data/archiv_spawn/function/stufe_1_setzen.mcfunction'].match(/^summon mannequin /gm) ?? []).length, 0);
  const w2 = d['data/archiv_spawn/function/weihnachtsinsel2.mcfunction'];
  assert.match(w2, /^fill -304 100 -58 -257 \d+ 29 minecraft:air$/m); // alte Stufen-Insel ganz im Westen wird geleert
  assert.match(w2, /^function archiv_spawn:stufe_4_setzen$/m);
  assert.equal((w2.match(/^summon interaction /gm) ?? []).length, 6); // 4 Stufen-Schalter, 2 Abkürzungen
  const g = d['data/archiv_spawn/function/deko3.mcfunction'];
  assert.equal((g.match(/^summon glow_item_frame /gm) ?? []).length, 28);
  assert.equal((g.match(/^summon armor_stand /gm) ?? []).length, 6);
  assert.match(d['data/archiv_spawn/function/deko.mcfunction'], /^forceload add -32 140 32 160$/m);
});

test('Treppenturm: 65 Stufen vom Boden (y −60) bis zum Brückendeck (y 4), jede einen Block höher und neben der vorigen', () => {
  const st = turm().filter((z) => z.includes('spruce_stairs')).map((z) => z.split(' ').slice(1, 4).map(Number));
  assert.equal(st.length, 65);
  assert.equal(st[0][1], -60); assert.equal(st.at(-1)[1], 4);
  for (let i = 1; i < st.length; i++) {
    assert.equal(st[i][1] - st[i - 1][1], 1);
    assert.equal(Math.abs(st[i][0] - st[i - 1][0]) + Math.abs(st[i][2] - st[i - 1][2]), 1);
  }
});

test('verschiebeY: absolute Höhen in Befehlen, relative (~) bleiben', () => {
  assert.equal(verschiebeY('setblock -4 152 27 minecraft:snow keep', -152), 'setblock -4 0 27 minecraft:snow keep');
  assert.equal(verschiebeY('fill -1 156 47 -1 156 47 minecraft:ender_chest[facing=south]', -152), 'fill -1 4 47 -1 4 47 minecraft:ender_chest[facing=south]');
  assert.equal(verschiebeY('summon item_display 11.88 163.45 34.5 {a:1}', -152), 'summon item_display 11.88 11.45 34.5 {a:1}');
  assert.equal(verschiebeY('particle minecraft:firework 1.5 157.8 65.4 0.25 0.25 0.05 0.03 25 normal @s', -152), 'particle minecraft:firework 1.5 5.8 65.4 0.25 0.25 0.05 0.03 25 normal @s');
  assert.equal(verschiebeY('particle minecraft:happy_villager ~ ~1.2 ~ 0.4 0.4 0.4 0 15 normal @s', -152), 'particle minecraft:happy_villager ~ ~1.2 ~ 0.4 0.4 0.4 0 15 normal @s');
  assert.equal(verschiebeY('execute if entity @a[x=1,y=150,z=2,dx=3] positioned 1 155 2 run setblock 1 160 3 stone', -152), 'execute if entity @a[x=1,y=-2,z=2,dx=3] positioned 1 3 2 run setblock 1 8 3 stone');
  assert.equal(verschiebeY('give @s minecraft:paper[minecraft:max_stack_size=1] 1', -152), 'give @s minecraft:paper[minecraft:max_stack_size=1] 1');
});
