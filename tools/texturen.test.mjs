import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sprite, aufhellen } from './texturen.mjs';

test('Sprite setzt Farben aus der Palette, Punkt ist transparent', () => {
  const png = sprite(['r.', '.r'], { r: [200, 32, 42] }, 2);
  assert.deepEqual([...png.data.subarray(0, 4)], [200, 32, 42, 255]);
  assert.equal(png.data[7], 0);
});

test('Sprite mit falscher Zeilenbreite bricht ab', () => {
  assert.throws(() => sprite(['rr', 'r'], { r: [1, 2, 3] }, 2), /Zeile 1/);
});

test('Sprite mit unbekannter Farbe bricht ab', () => {
  assert.throws(() => sprite(['rx'], { r: [1, 2, 3] }, 2), /x/);
});

test('Aufhellen mischt Richtung Weiß und lässt Alpha', () => {
  const daten = Buffer.from([100, 0, 200, 128]);
  aufhellen(daten, 0.5);
  assert.deepEqual([...daten], [178, 128, 228, 128]);
});
