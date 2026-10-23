import { test } from 'node:test';
import assert from 'node:assert/strict';
import { kodierePng, dekodierePng, gesichtAusSkin, kopfPngAusSkin, pixelGesicht } from './kopf.mjs';

// Test-Skin 64×64: Gesicht (8,8) rot, Hut (40,8) halbtransparent blau in der linken oberen Ecke
function skin() {
  const rgba = Buffer.alloc(64 * 64 * 4);
  for (let y = 8; y < 16; y++) for (let x = 8; x < 16; x++) rgba.set([200, 0, 0, 255], (y * 64 + x) * 4);
  rgba.set([0, 0, 255, 255], (8 * 64 + 40) * 4); // erster Hut-Pixel deckend
  return rgba;
}

test('PNG-Kodierung und Dekodierung sind verlustfrei', () => {
  const rgba = skin();
  const d = dekodierePng(kodierePng(rgba, 64, 64));
  assert.equal(d.b, 64);
  assert.ok(d.rgba.equals(rgba));
});

test('Gesicht + Hut-Ebene', () => {
  const g = gesichtAusSkin({ b: 64, h: 64, rgba: skin() });
  assert.deepEqual([...g.subarray(0, 4)], [0, 0, 255, 255]); // Hut deckt
  assert.deepEqual([...g.subarray(4, 8)], [200, 0, 0, 255]); // sonst Gesicht
});

test('Kopf-PNG ist 64×64', () => {
  const d = dekodierePng(kopfPngAusSkin(kodierePng(skin(), 64, 64)));
  assert.equal(d.b, 64);
  assert.equal(d.h, 64);
  assert.deepEqual([...d.rgba.subarray(0, 4)], [0, 0, 255, 255]);
  assert.deepEqual([...d.rgba.subarray(8 * 4, 8 * 4 + 4)], [200, 0, 0, 255]);
});

test('Pixelgesicht ist deterministisch und je UUID verschieden', () => {
  assert.ok(pixelGesicht('a').equals(pixelGesicht('a')));
  assert.ok(!pixelGesicht('a').equals(pixelGesicht('b')));
  assert.equal(dekodierePng(pixelGesicht('a')).b, 64);
});
