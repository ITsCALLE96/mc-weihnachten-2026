import { test } from 'node:test';
import assert from 'node:assert/strict';
import { neu, setze } from './schem.mjs';
import { lichter, imOval } from './schem-licht.mjs';

test('Licht auf dem Boden unter der Insel und direkt unter der Inselunterseite', () => {
  const m = neu(1, 20, 1, 0);
  for (let y = 0; y <= 3; y++) setze(m, 0, y, 0, 'minecraft:stone'); // Boden bis y 3
  setze(m, 0, 4, 0, 'minecraft:water');                                 // Wasser darüber
  for (let y = 12; y <= 15; y++) setze(m, 0, y, 0, 'minecraft:dirt');  // Insel ab y 12
  assert.deepEqual(lichter(m, [10, 100, 20], 110, 6), [
    'setblock 10 105 20 minecraft:light[level=15] keep',
    'setblock 10 111 20 minecraft:light[level=15] keep',
  ]);
});

test('Schon gesetzte Lichtblöcke zählen als Luft (erneutes Berechnen ergibt dieselben Positionen)', () => {
  const m = neu(1, 20, 1, 0);
  for (let y = 0; y <= 3; y++) setze(m, 0, y, 0, 'minecraft:stone');
  setze(m, 0, 4, 0, 'minecraft:light[level=15,waterlogged=false]');
  for (let y = 12; y <= 15; y++) setze(m, 0, y, 0, 'minecraft:dirt');
  assert.deepEqual(lichter(m, [0, 100, 0], 110, 6), ['setblock 0 104 0 minecraft:light[level=15] keep', 'setblock 0 111 0 minecraft:light[level=15] keep']);
});

test('Oval und nurBoden: nur Spalten in der Ellipse, nur das Bodenlicht', () => {
  assert.ok(imOval([0, 0, 10, 5], 9, 0)); assert.ok(!imOval([0, 0, 10, 5], 0, 6));
  const m = neu(13, 20, 1, 0);
  for (let x = 0; x < 13; x++) { for (let y = 0; y <= 3; y++) setze(m, x, y, 0, 'minecraft:stone'); for (let y = 12; y <= 15; y++) setze(m, x, y, 0, 'minecraft:dirt'); }
  assert.deepEqual(lichter(m, [0, 100, 0], 110, 6, { oval: [0, 0, 7, 3], nurBoden: true }), ['setblock 0 104 0 minecraft:light[level=15] keep', 'setblock 6 104 0 minecraft:light[level=15] keep']);
});
