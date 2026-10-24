import { test } from 'node:test';
import assert from 'node:assert/strict';
import { leseNbt, tag } from './nbt.mjs';
import { neu, setze, hole } from './schem.mjs';
import { struktur, kacheln } from './schem-struktur.mjs';

test('Struktur: Größe, Palette mit Eigenschaften, Luft weggelassen, Block-Entity mit id', () => {
  const m = neu(2, 1, 2, 3955);
  setze(m, 0, 0, 0, 'minecraft:stone');
  setze(m, 1, 0, 1, 'minecraft:chest[facing=north,type=single]');
  m.blockEntities.push({ pos: [1, 0, 1], id: 'minecraft:chest', daten: { CustomName: tag('string', 'Kiste') } });
  const s = leseNbt(struktur(m)).value;
  assert.equal(s.DataVersion.value, 3955);
  assert.deepEqual(s.size.value.items, [2, 1, 2]);
  assert.equal(s.blocks.value.items.length, 2);
  const kiste = s.blocks.value.items.find((b) => b.nbt);
  assert.deepEqual(kiste.pos.value.items, [1, 0, 1]);
  assert.equal(kiste.nbt.value.id.value, 'minecraft:chest');
  assert.equal(kiste.nbt.value.CustomName.value, 'Kiste');
  const p = s.palette.value.items[kiste.state.value];
  assert.equal(p.Name.value, 'minecraft:chest');
  assert.equal(p.Properties.value.facing.value, 'north');
  assert.equal(s.entities.value.items.length, 0);
});

test('Struktur: Entities mit Position, Blockposition und id', () => {
  const m = neu(2, 2, 2, 3953);
  setze(m, 0, 0, 0, 'minecraft:stone');
  m.entities = [{ pos: [1.5, 1, 0.25], id: 'minecraft:villager', daten: { Invulnerable: tag('byte', 1) } }];
  const e = leseNbt(struktur(m)).value.entities.value.items[0];
  assert.deepEqual(e.pos.value.items, [1.5, 1, 0.25]);
  assert.deepEqual(e.blockPos.value.items, [1, 1, 0]);
  assert.equal(e.nbt.value.id.value, 'minecraft:villager');
  assert.equal(e.nbt.value.Invulnerable.value, 1);
});

test('Kacheln: volle Höhe, Rand kleiner, Blöcke, Block-Entities und Entities relativ zur Kachel', () => {
  const m = neu(5, 2, 3, 3953);
  setze(m, 4, 1, 2, 'minecraft:chest[facing=north,type=single]');
  m.blockEntities.push({ pos: [4, 1, 2], id: 'minecraft:chest', daten: {} });
  m.entities = [{ pos: [3.5, 0, 0.5], id: 'minecraft:armor_stand', daten: {} }];
  const k = [...kacheln(m, 2)];
  assert.equal(k.length, 6);
  const r = k.find((t) => t.i === 2 && t.j === 1).teil;
  assert.deepEqual([r.w, r.h, r.l], [1, 2, 1]);
  assert.equal(hole(r, 0, 1, 0), 'minecraft:chest[facing=north,type=single]');
  assert.deepEqual(r.blockEntities[0].pos, [0, 1, 0]);
  assert.deepEqual(k.find((t) => t.i === 1 && t.j === 0).teil.entities[0].pos, [1.5, 0, 0.5]);
});
