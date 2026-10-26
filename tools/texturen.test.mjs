import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sprite, aufhellen, hsv, rgb, umfaerben } from './texturen.mjs';

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

test('HSV hin und zurück ergibt dieselbe Farbe', () => {
  for (const farbe of [[36, 57, 94], [98, 14, 0], [242, 192, 57], [0, 0, 0], [255, 255, 255]]) assert.deepEqual(rgb(hsv(farbe)), farbe);
});

test('Umfärben nimmt die erste passende Regel und lässt Transparentes', () => {
  const daten = new Uint8Array([36, 57, 94, 255, 36, 57, 94, 0, 181, 123, 103, 255]);
  umfaerben(daten, [{ wenn: (h) => h > 200, dann: () => [1, 2, 3] }, { wenn: () => true, dann: () => [9, 9, 9] }]);
  assert.deepEqual([...daten], [1, 2, 3, 255, 36, 57, 94, 0, 9, 9, 9, 255]);
});
