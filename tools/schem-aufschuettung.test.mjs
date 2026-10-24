import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bodenSpalte, kachelStruktur, Y0, Y1 } from './schem-aufschuettung.mjs';
import { leseNbt } from './nbt.mjs';

const spalte = (bis, oben) => Array.from({ length: Y1 - Y0 + 1 }, (_, i) => (i <= bis ? 'minecraft:dirt' : oben?.[i - bis - 1] ?? 'minecraft:air'));

test('Bodenspalte: Oberfläche wird Gras, Bau darüber fällt weg', () => {
  const s = spalte(28, ['minecraft:oak_planks', 'minecraft:oak_planks', 'minecraft:glass']); // Erde bis y 68, Haus darauf
  const b = bodenSpalte(s);
  assert.equal(b[28], 'minecraft:grass_block[snowy=false]');
  assert.equal(b[29], 'minecraft:air');
  assert.equal(b[0], 'minecraft:dirt');
});

test('Bodenspalte: Baurest unter der Oberfläche wird Erde, Kanal bleibt Wasser bis y 62', () => {
  const s = spalte(15); s[10] = 'minecraft:chest[facing=north]';           // Oberfläche y 55 unter dem Meeresspiegel
  const b = bodenSpalte(s);
  assert.equal(b[10], 'minecraft:dirt');
  assert.equal(b[16], 'minecraft:water[level=0]');
  assert.equal(b[62 - Y0], 'minecraft:water[level=0]');
  assert.equal(b[63 - Y0], 'minecraft:air');
});

test('Kachel-Struktur enthält auch Luft (schneidet Gelände ab)', () => {
  const nbt = leseNbt(kachelStruktur(new Map([['0,0', bodenSpalte(spalte(28))]]), 3955)).value;
  assert.equal(nbt.blocks.value.items.length, Y1 - Y0 + 1);
  assert.ok(nbt.palette.value.items.some((p) => p.Name.value === 'minecraft:air'));
});
