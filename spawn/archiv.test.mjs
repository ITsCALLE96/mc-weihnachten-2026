import { test } from 'node:test';
import assert from 'node:assert/strict';
import { archivSpawn, itemNbt } from './archiv.mjs';

test('give-Text → Item-NBT (Komponenten mit Werten, Entfernen per !)', () => {
  assert.equal(itemNbt('minecraft:paper[minecraft:item_model="weihnachten:stern",minecraft:lore=[{text:"a, b",italic:false}]]'),
    '{id:"minecraft:paper",count:1,components:{"minecraft:item_model":"weihnachten:stern","minecraft:lore":[{text:"a, b",italic:false}]}}');
  assert.equal(itemNbt('minecraft:leather_helmet[minecraft:attribute_modifiers=[],!minecraft:max_damage]'),
    '{id:"minecraft:leather_helmet",count:1,components:{"minecraft:attribute_modifiers":[],"!minecraft:max_damage":{}}}');
  assert.equal(itemNbt('minecraft:emerald', 3), '{id:"minecraft:emerald",count:3}');
});

test('Archiv: Funktions-Tags für weihnachtsinsel und deko, fertige Insel + 4 Stufen, Galerie mit allen Items', () => {
  const { dateien: d, strukturen } = archivSpawn();
  assert.deepEqual(JSON.parse(d['data/archiv/tags/function/saal/weihnachtsinsel.json']).values, ['archiv_spawn:weihnachtsinsel']);
  assert.deepEqual(JSON.parse(d['data/archiv/tags/function/saal/deko.json']).values, ['archiv_spawn:deko']);
  assert.equal(Object.keys(strukturen).length, 5);
  const w2 = d['data/archiv_spawn/function/weihnachtsinsel2.mcfunction'];
  assert.match(w2, /^place template archiv_spawn:wi_0 -24 /m); // fertige Insel an der SMP-Stelle
  assert.match(w2, /^place template archiv_spawn:wi_4 -304 /m);
  assert.equal((w2.match(/^summon mannequin /gm) ?? []).length, 2); // fertige Insel und Stufe 4
  assert.ok(!/x=1[1-9]\d|x=2[0-4]\d/.test(w2)); // nicht über dem Zoo
  const g = d['data/archiv_spawn/function/deko3.mcfunction'];
  assert.equal((g.match(/^summon glow_item_frame /gm) ?? []).length, 28);
  assert.equal((g.match(/^summon armor_stand /gm) ?? []).length, 6);
  assert.match(d['data/archiv_spawn/function/deko.mcfunction'], /^forceload add -32 140 32 160$/m);
});
