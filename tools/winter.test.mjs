import { test } from 'node:test';
import assert from 'node:assert/strict';
import pngjs from 'pngjs';
import { frostOben, frostSeite, winterFarbkarte, weihnachtsmuetze, weihnachtsschal, tierschal, TIER_SCHAL } from './winter.mjs';

const { PNG } = pngjs;
const pixel = (png, x, y) => [...png.data.subarray((y * png.width + x) * 4, (y * png.width + x) * 4 + 4)];
const leer = (b, h) => { const p = new PNG({ width: b, height: h }); p.data.fill(0); return p; };

test('Reif ist bei jedem Bau gleich und lässt Lücken', () => {
  const a = frostOben(), b = frostOben();
  assert.deepEqual(a.data, b.data);
  const belegt = [...Array(256).keys()].filter((i) => a.data[i * 4 + 3]).length;
  assert.ok(belegt > 30 && belegt < 130, `${belegt} Reifpixel`);
});

test('Reifkante deckt die oberste Reihe ganz, die unterste nie', () => {
  const s = frostSeite();
  for (let x = 0; x < 16; x++) {
    assert.equal(pixel(s, x, 0)[3], 255);
    assert.equal(pixel(s, x, 15)[3], 0);
  }
});

test('Winter-Farbkarte macht sattes Grün blasser und heller', () => {
  const d = Buffer.from([60, 160, 40, 255]);
  winterFarbkarte(d);
  const [r, g, b] = d;
  assert.ok(g - r < 50 && g - b < 50, `noch zu grün: ${[r, g, b]}`);
  assert.ok(r + g + b > 60 + 160 + 40);
  assert.equal(d[3], 255);
});

test('Mütze überschreibt Hut-Oberseite und obere Seitenreihen, lässt Gesicht und Rest der Hutebene', () => {
  const p = leer(64, 64);
  p.data.set([1, 2, 3, 255], (12 * 64 + 34) * 4); // z. B. Brille in der Hutebene
  p.data.set([9, 9, 9, 255], (50 * 64 + 40) * 4); // Hutkrempe
  weihnachtsmuetze(p);
  assert.deepEqual(pixel(p, 41, 1).slice(0, 1), [186]);
  assert.deepEqual(pixel(p, 43, 3), [242, 244, 246, 255]); // Bommel
  assert.equal(pixel(p, 50, 10)[3], 255); // Fellrand
  assert.deepEqual(pixel(p, 34, 12), [1, 2, 3, 255]);
  assert.equal(pixel(p, 40, 50)[3], 0);
  assert.equal(pixel(p, 10, 10)[3], 0); // Kopf selbst unberührt
});

test('Schal und Tierschal färben genau zwei Reihen', () => {
  const p = leer(64, 64);
  weihnachtsschal(p);
  assert.equal(pixel(p, 3, 44)[3], 255);
  assert.equal(pixel(p, 3, 46)[3], 0);
  assert.equal(pixel(p, 20, 27)[3], 255);
  const k = leer(64, 64);
  tierschal(k, TIER_SCHAL.kuh);
  assert.equal(pixel(k, 18, 14)[3], 255);
  assert.equal(pixel(k, 18, 16)[3], 0);
  assert.equal(pixel(k, 17, 14)[3], 0);
});
