import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEKO, KALENDER, FARBEN, palette, modell } from './deko.mjs';
const ALLE = { ...DEKO, ...KALENDER };

test('Alle Deko-Modelle bleiben im erlaubten Modellraum und nutzen gültige Drehungen', () => {
  for (const [name, elemente] of Object.entries(ALLE)) {
    for (const el of elemente) {
      for (const k of [...el.from, ...el.to]) assert.ok(k >= -16 && k <= 32, `${name}: ${k} außerhalb`);
      el.from.forEach((v, i) => assert.ok(v <= el.to[i], `${name}: from > to`));
      if (el.rotation) assert.ok([-45, -22.5, 0, 22.5, 45].includes(el.rotation.angle), `${name}: Winkel`);
    }
  }
});

test('Jede Fläche greift ein belegtes Palettenpixel ab', () => {
  const p = palette();
  for (const elemente of Object.values(ALLE)) {
    for (const el of elemente) {
      for (const f of Object.values(el.faces)) {
        const [u, v] = f.uv;
        assert.ok(v * 16 + u < Object.keys(FARBEN).length);
        assert.equal(p.data[(v * 16 + u) * 4 + 3], 255);
      }
    }
  }
});

test('Modell verweist auf die Palette', () => {
  assert.equal(modell([]).textures.p, 'weihnachten:item/deko_palette');
});

test('Keine Deko-ID kollidiert mit den Sprite-Items (lebkuchen, lichterkette, weihnachtsmuetze)', () => {
  for (const id of ['lebkuchen', 'lichterkette', 'weihnachtsmuetze']) assert.ok(!(id in ALLE), id);
});

test('Weihnachtsplatten: eindeutige IDs, Etikettfarben aus der Palette, höchstens 15 (Komparator)', async () => {
  const { readFileSync } = await import('node:fs');
  const platten = JSON.parse(readFileSync(new URL('./platten.json', import.meta.url), 'utf8'));
  assert.ok(platten.length <= 15);
  assert.equal(new Set(platten.map((p) => p.id)).size, platten.length);
  for (const p of platten) {
    assert.ok(!(p.id in ALLE), p.id);
    for (const f of p.etikett) assert.ok(f in FARBEN, `${p.id}: ${f}`);
  }
});
