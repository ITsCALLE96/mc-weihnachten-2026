import { test } from 'node:test';
import assert from 'node:assert/strict';
import { neu, setze, hole, lade, speichere, ersetze, einfuegen, LUFT } from './schem.mjs';

function testModell() {
  const m = neu(10, 14, 11, 3953);
  for (let x = 0; x < 10; x++) for (let z = 0; z < 11; z++) setze(m, x, 0, z, 'stone');
  setze(m, 5, 5, 5, 'red_nether_brick_stairs[facing=east,half=bottom,shape=straight,waterlogged=false]');
  return m;
}

test('Schematic übersteht Speichern und Laden unverändert', () => {
  const m = testModell();
  m.blockEntities.push({ pos: [1, 0, 1], id: 'minecraft:chest', daten: {} });
  const zurueck = lade(speichere(m));
  assert.deepEqual([zurueck.w, zurueck.h, zurueck.l], [10, 14, 11]);
  assert.deepEqual(zurueck.bloecke, m.bloecke);
  assert.deepEqual(zurueck.blockEntities[0].pos, [1, 0, 1]);
});

test('Ersetzen tauscht den Namen und behält die Properties', () => {
  const m = testModell();
  ersetze(m, { 'minecraft:red_nether_brick_stairs': 'minecraft:polished_blackstone_brick_stairs' });
  assert.equal(hole(m, 5, 5, 5), 'minecraft:polished_blackstone_brick_stairs[facing=east,half=bottom,shape=straight,waterlogged=false]');
});

test('Einfügen versetzt Blöcke und Block-Entities, Luft überschreibt nichts', () => {
  const ziel = neu(4, 2, 4, 3953);
  setze(ziel, 3, 0, 3, 'dirt');
  const teil = neu(2, 1, 2, 3953);
  setze(teil, 0, 0, 0, 'stone');
  teil.blockEntities.push({ pos: [0, 0, 0], id: 'minecraft:chest', daten: {} });
  einfuegen(ziel, teil, 2, 0, 2);
  assert.equal(hole(ziel, 2, 0, 2), 'minecraft:stone');
  assert.equal(hole(ziel, 3, 0, 3), 'minecraft:dirt');
  assert.equal(hole(ziel, 0, 0, 0), LUFT);
  assert.deepEqual(ziel.blockEntities[0].pos, [2, 0, 2]);
});
