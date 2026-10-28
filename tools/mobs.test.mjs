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

test('Paket 3: Tiere und Helfer laufen durch, EMF gültig', async () => {
  const { TIERE3, TIERE3_EMF } = await import('./tiere.mjs');
  for (const [name, fn] of Object.entries(TIERE3)) assert.doesNotThrow(() => fn(leer(128, 128)), name);
  for (const teile of Object.values(TIERE3_EMF)) assert.ok(jem(teile).models.every((m) => m.boxes.every((b) => b.coordinates.every(Number.isFinite))));
});

test('Paket 4: Berufs-Outfits und Zombie-Dorfbewohner laufen durch', async () => {
  const { BERUFE, ZOMBIE_BERUFE, zombieDorf, DORF_EMF } = await import('./dorf.mjs');
  for (const [name, fn] of [...Object.entries(BERUFE), ...Object.entries(ZOMBIE_BERUFE)]) assert.doesNotThrow(() => fn(leer(64, 64)), name);
  assert.doesNotThrow(() => zombieDorf(leer(64, 64), 1));
  for (const teile of Object.values(DORF_EMF)) assert.ok(jem(teile).models.every((m) => m.boxes.every((b) => b.coordinates.every(Number.isFinite))));
});

// Nachbau der EMF-Rechnung (EMFPartData.prepare, EMFBoxData.prepare, EMFModelPartCustom: Kind des Vanilla-Teils mit
// Position = translate): Ergebnis muss genau der gewollte Quader im Teil-Raum sein (y nach unten).
function emfImTeilraum(modell) {
  const inv = [...'xyz'].map((a) => (modell.invertAxis ?? '').includes(a));
  const t = modell.translate.map((v, i) => (inv[i] ? -v : v));
  return modell.boxes.map(({ coordinates: c }) => [0, 1, 2].map((i) => (inv[i] ? -c[i] - c[i + 3] : c[i]) + t[i]));
}
test('EMF-Kalibrierung: Quader landen nach EMF-Rechnung genau dort, wo sie gemeint sind (Mütze oben, nicht als Bart)', async () => {
  const { BOSS_EMF } = await import('./bosse.mjs'), { MONSTER2_EMF } = await import('./monster2.mjs');
  const { TIERE3_EMF } = await import('./tiere.mjs'), { DORF_EMF } = await import('./dorf.mjs');
  // Gegenprobe Vanilla-Kopf: addBox(-4, -8, -4, 8, 8, 8) am Pivot 0 0 0
  assert.deepEqual(emfImTeilraum(jem({ head: { pivot: [0, 0, 0], quader: [[[-4, -8, -4], [8, 8, 8], 'rot']] } }).models[0]), [[-4, -8, -4]]);
  for (const teile of [EMF, BOSS_EMF, MONSTER2_EMF, TIERE3_EMF, DORF_EMF].flatMap(Object.values)) {
    const j = jem(teile);
    Object.values(teile).forEach(({ quader }, k) => {
      emfImTeilraum(j.models[k]).forEach((p, n) => p.forEach((v, i) => assert.ok(Math.abs(v - quader[n][0][i]) < 1e-6, `${j.models[k].part} Quader ${n}`)));
    });
  }
  // Zipfelmütze des Zombies sitzt über dem Kopf (Kopf-Oberkante y −8, y nach unten)
  const zombie = emfImTeilraum(jem(EMF.zombie).models[0]);
  assert.ok(zombie.slice(0, 6).every(([, y]) => y < -8));
});
