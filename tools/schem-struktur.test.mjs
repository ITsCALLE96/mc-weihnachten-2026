import { test } from 'node:test';
import assert from 'node:assert/strict';
import { leseNbt, tag } from './nbt.mjs';
import { neu, setze } from './schem.mjs';
import { struktur } from './schem-struktur.mjs';

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
});
