import { test } from 'node:test';
import assert from 'node:assert/strict';
import pngjs from 'pngjs';
import { MOBS, TIERE, VARIANTEN, EMF, EMF_FARBEN, jem, emfPalette } from './mobs.mjs';

const { PNG } = pngjs;
const leer = (w, h) => { const p = new PNG({ width: w, height: h }); for (let i = 0; i < p.data.length; i += 4) p.data.set([100, 100, 100, 255], i); return p; };

test('Alle Mob-Bemalungen laufen auf einer deckenden Fläche durch und bleiben im Bild', () => {
  for (const [name, fn] of [...Object.entries(MOBS), ...Object.entries(TIERE), ...Object.values(VARIANTEN).map(([q, f]) => [q, f])]) {
    const p = leer(128, 128);
    assert.doesNotThrow(() => fn(p), name);
    assert.equal(p.data.length, 128 * 128 * 4, name);
  }
});

test('EMF-Zusätze: gültige JEM-Struktur, Farben aus der Palette, nur Anhängen', () => {
  const zahl = Object.keys(EMF_FARBEN).length;
  for (const [modell, teile] of Object.entries(EMF)) {
    const j = jem(teile);
    for (const m of j.models) {
      assert.equal(m.attach, true, modell);
      for (const b of m.boxes) {
        assert.equal(b.coordinates.length, 6);
        assert.ok(b.coordinates.every(Number.isFinite), modell);
        assert.ok(b.uvNorth[1] * 16 + b.uvNorth[0] < zahl, modell);
      }
    }
  }
  const p = emfPalette(true, PNG);
  assert.equal(p.width, 16);
});

test('Bosse und Geschosse laufen durch, Boss-EMF gültig', async () => {
  const { BOSSE, GESCHOSSE, BOSS_EMF, gluehkugel } = await import('./bosse.mjs');
  for (const [name, fn] of Object.entries({ ...BOSSE, ...GESCHOSSE })) assert.doesNotThrow(() => fn(leer(256, 256)), name);
  for (const teile of Object.values(BOSS_EMF)) assert.ok(jem(teile).models.every((m) => m.boxes.every((b) => b.coordinates.every(Number.isFinite))));
  assert.equal(gluehkugel(PNG).width, 16);
});

test('Paket 2: alle übrigen Monster laufen durch, EMF gültig', async () => {
  const { MONSTER2, MONSTER2_EMF } = await import('./monster2.mjs');
  for (const [name, fn] of Object.entries(MONSTER2)) assert.doesNotThrow(() => fn(leer(128, 128)), name);
  for (const teile of Object.values(MONSTER2_EMF)) assert.ok(jem(teile).models.every((m) => m.boxes.every((b) => b.coordinates.every(Number.isFinite))));
});
