import { test } from 'node:test';
import assert from 'node:assert/strict';
import { neu, setze } from './schem.mjs';
import { lichter } from './schem-licht.mjs';

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
