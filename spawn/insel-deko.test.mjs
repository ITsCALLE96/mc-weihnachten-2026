import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deko } from './insel-deko.mjs';
import { neu, setze } from '../tools/schem.mjs';

// Mini-Insel: Grasfläche, Weg, ein Baum mit Laub; die echte Insel liegt nur lokal
function mini() {
  const m = neu(9, 30, 9, 3955);
  for (let x = 0; x < 9; x++) for (let z = 0; z < 9; z++) setze(m, x, 0, z, x === 4 ? 'minecraft:coarse_dirt' : 'minecraft:grass_block');
  for (let y = 1; y < 25; y++) setze(m, 6, y, 6, 'minecraft:spruce_log');
  for (let y = 12; y < 22; y++) setze(m, 7, y, 6, 'minecraft:spruce_leaves[distance=1,persistent=true,waterlogged=false]');
  return m;
}
const k = { struktur: { ursprung: [0, 150, 0] }, deko: { baeume: [[6, 6]], weihnachtsbaum: 0, kiste: [0, 151, 0], laternenAbstand: 1, geschenke: [[1, 0, 'minecraft:red_wool', 0.6]], kerzen: [[0, 151, 8, 'red']] } };

test('Deko: Schnee nur in Luft, Laternen am Wegrand, alles wieder entfernbar', () => {
  const { funktionen: f, zahlen } = deko(k, mini());
  assert.ok(zahlen.schnee > 40);
  assert.match(f.deko_an2, /^setblock 2 151 2 minecraft:snow keep$/m);
  assert.match(f.deko_an2, /^setblock 7 172 6 minecraft:snow keep$/m); // Schnee auf dem Laub
  assert.match(f.deko_an2, /minecraft:lantern keep/);
  assert.match(f.deko_an2, /^setblock 0 151 8 minecraft:red_candle\[candles=3,lit=true\] keep$/m);
  assert.match(f.deko_an2, /nether_star/);
  assert.ok(f.deko_an2.split('\n').filter((z) => z.startsWith('summon')).every((z) => z.includes('"insel_deko"')));
  assert.match(f.deko_weg, /^kill @e\[tag=insel_deko\]$/m);
  assert.match(f.deko_weg, /^fill 0 150 0 0 179 8 minecraft:air replace minecraft:snow$/m);
  assert.match(f.deko_weg, /minecraft:air replace minecraft:lantern/);
  assert.match(f.deko_weg, /minecraft:air replace #minecraft:candles/);
  assert.match(f.deko_an, /^forceload add 0 0 8 8$/m);
  assert.match(f.deko_an2, /^function insel:deko_weg$/m);
});

test('Deko: Blockanzeigen mit block_state als Text (26.3 kennt {Name:…} dort nicht)', () => {
  const { funktionen: f } = deko(k, mini());
  assert.doesNotMatch(f.deko_an2, /block_state:\{/);
  assert.match(f.deko_an2, /block_state:"minecraft:/);
});
