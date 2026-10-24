import { test } from 'node:test';
import assert from 'node:assert/strict';
import { glaetten, hoehen, saeule, kachelStruktur, Y0, EBENE, MEER } from './schem-aufschuettung.mjs';
import { leseNbt } from './nbt.mjs';

test('Glätten entfernt dünne Stege und schließt kleine Löcher', () => {
  const w = 30, h = 30, m = new Uint8Array(w * h);
  for (let z = 5; z < 25; z++) for (let x = 5; x < 25; x++) m[z * w + x] = 1; // Fläche
  m[15 * w + 15] = 0;                                                          // kleines Loch
  for (let x = 25; x < 30; x++) m[15 * w + x] = 1;                             // 1 Block breiter Steg
  const g = glaetten(m, w, h);
  assert.equal(g[15 * w + 15], 1);
  assert.equal(g[15 * w + 28], 0);
  assert.equal(g[10 * w + 10], 1);
});

test('Höhen: flach auf der Ebene, Rampe zum Wasser (1 Block auf 2)', () => {
  const w = 40, h = 1, land = new Uint8Array(w).fill(1), q = new Float32Array(w).fill(-Infinity);
  land[0] = 0; q[0] = MEER;
  const H = hoehen(land, q, w, h);
  assert.equal(H[1], MEER);         // direkt am Wasser bündig
  assert.equal(H[5], MEER + 2);
  assert.equal(H[30], EBENE);
});

test('Säule: Gras über Erde, Strand aus Sand', () => {
  const s = saeule(68);
  assert.equal(s.length, 68 - Y0 + 1);
  assert.equal(s.at(-1), 'minecraft:grass_block[snowy=false]');
  assert.equal(s.at(-2), 'minecraft:dirt');
  assert.equal(s[0], 'minecraft:stone');
  assert.equal(saeule(63).at(-1), 'minecraft:sand');
});

test('Kachel-Struktur: Blöcke nur bis zur Oberkante (keine Luft)', () => {
  const nbt = leseNbt(kachelStruktur(new Map([['0,0', 68]]), 68)).value;
  assert.equal(nbt.blocks.value.items.length, 68 - Y0 + 1);
  assert.ok(!nbt.palette.value.items.some((p) => p.Name.value === 'minecraft:air'));
});

test('Kachel-Struktur trägt die alte DataVersion (sonst wird das Palettenformat in 26.x zu Luft)', () => {
  assert.equal(leseNbt(kachelStruktur(new Map([['0,0', 68]]), 68)).value.DataVersion.value, 3955);
});
