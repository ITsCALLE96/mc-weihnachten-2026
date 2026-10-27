import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEKO, FARBEN, palette, modell } from './deko.mjs';

test('Alle Deko-Modelle bleiben im erlaubten Modellraum und nutzen gültige Drehungen', () => {
  for (const [name, elemente] of Object.entries(DEKO)) {
    for (const el of elemente) {
      for (const k of [...el.from, ...el.to]) assert.ok(k >= -16 && k <= 32, `${name}: ${k} außerhalb`);
      el.from.forEach((v, i) => assert.ok(v <= el.to[i], `${name}: from > to`));
      if (el.rotation) assert.ok([-45, -22.5, 0, 22.5, 45].includes(el.rotation.angle), `${name}: Winkel`);
    }
  }
});

test('Jede Fläche greift ein belegtes Palettenpixel ab', () => {
  const p = palette();
  for (const elemente of Object.values(DEKO)) {
    for (const el of elemente) {
      for (const f of Object.values(el.faces)) {
        const [u, v] = f.uv;
        assert.ok(u < Object.keys(FARBEN).length && v === 0);
        assert.equal(p.data[(v * 16 + u) * 4 + 3], 255);
      }
    }
  }
});

test('Modell verweist auf die Palette', () => {
  assert.equal(modell([]).textures.p, 'weihnachten:item/deko_palette');
});
