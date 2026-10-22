import { test } from 'node:test';
import assert from 'node:assert/strict';
import { neu, setze, hole, lade, speichere, ersetze, LUFT } from './schem.mjs';
import { wagen, baueZug, WAGEN_LAENGE } from './zug.mjs';

function testLok() {
  const lok = neu(10, 14, 11, 3953);
  for (let x = 0; x < 10; x++) for (let z = 0; z < 11; z++) setze(lok, x, 0, z, 'stone');
  for (let x = 2; x < 10; x++) { setze(lok, x, 1, 3, 'polished_basalt'); setze(lok, x, 1, 7, 'polished_basalt'); }
  setze(lok, 5, 5, 5, 'red_nether_brick_stairs[facing=east,half=bottom,shape=straight,waterlogged=false]');
  return lok;
}

test('Schematic übersteht Speichern und Laden unverändert', () => {
  const m = testLok();
  m.blockEntities.push({ pos: [1, 0, 1], id: 'minecraft:chest', daten: {} });
  const zurueck = lade(speichere(m));
  assert.deepEqual([zurueck.w, zurueck.h, zurueck.l], [10, 14, 11]);
  assert.deepEqual(zurueck.bloecke, m.bloecke);
  assert.deepEqual(zurueck.blockEntities[0].pos, [1, 0, 1]);
});

test('Ersetzen tauscht den Namen und behält die Properties', () => {
  const m = testLok();
  ersetze(m, { 'minecraft:red_nether_brick_stairs': 'minecraft:polished_blackstone_brick_stairs' });
  assert.equal(hole(m, 5, 5, 5), 'minecraft:polished_blackstone_brick_stairs[facing=east,half=bottom,shape=straight,waterlogged=false]');
});

test('Wagen: durchgehender Gang von Ende zu Ende auf Höhe 4–5', () => {
  const w = wagen(3953, () => []);
  for (let x = 0; x < WAGEN_LAENGE; x++) {
    for (const y of [4, 5]) {
      const b = hole(w, x, y, 5);
      assert.ok(b === LUFT || b.includes('carpet'), `x${x} y${y}: ${b}`);
    }
    assert.notEqual(hole(w, x, 3, 5), LUFT, `Boden fehlt bei x${x}`);
  }
});

test('Zug: Wagen vor der Lok, Gleis läuft durch, Lok wird schwarz', () => {
  const zug = baueZug(testLok(), 2);
  assert.equal(zug.w, 2 * WAGEN_LAENGE + 10);
  for (let x = 0; x < zug.w; x++) assert.notEqual(hole(zug, x, 0, 0), LUFT, `Gleisbett fehlt bei x${x}`);
  assert.match(hole(zug, 2 * WAGEN_LAENGE + 5, 5, 5), /polished_blackstone_brick_stairs/);
});
