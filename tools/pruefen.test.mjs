import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { pruefeDatapack, pruefeResourcepack } from './pruefen.mjs';

function pack(dateien) {
  const wurzel = mkdtempSync(join(tmpdir(), 'mcpack-'));
  for (const [pfad, inhalt] of Object.entries(dateien)) {
    const ziel = join(wurzel, pfad);
    mkdirSync(dirname(ziel), { recursive: true });
    writeFileSync(ziel, typeof inhalt === 'string' ? inhalt : JSON.stringify(inhalt));
  }
  return wurzel;
}

const dpMeta = { pack: { description: 'test', min_format: [121, 0], max_format: [121, 0] } };
const rpMeta = { pack: { description: 'test', min_format: [97, 1], max_format: [97, 1] } };

test('gültiges Datapack hat keine Fehler', () => {
  const dir = pack({
    'pack.mcmeta': dpMeta,
    'data/leitfaden/advancement/root.json': { criteria: { a: { trigger: 'minecraft:impossible' } } },
    'data/leitfaden/advancement/k1/stein.json': { parent: 'leitfaden:root', criteria: { a: { trigger: 'minecraft:impossible' } } },
  });
  assert.deepEqual(pruefeDatapack(dir), []);
});

test('kaputtes JSON wird gemeldet', () => {
  const dir = pack({ 'pack.mcmeta': dpMeta, 'data/leitfaden/advancement/root.json': '{ kaputt' });
  const fehler = pruefeDatapack(dir);
  assert.equal(fehler.length, 1);
  assert.match(fehler[0], /root\.json/);
});

test('falsches pack_format wird gemeldet', () => {
  const dir = pack({ 'pack.mcmeta': { pack: { description: 'x', min_format: [107, 1], max_format: [107, 1] } } });
  const fehler = pruefeDatapack(dir);
  assert.equal(fehler.length, 1);
  assert.match(fehler[0], /121/);
});

test('fehlende pack.mcmeta wird gemeldet', () => {
  const dir = pack({ 'data/leitfaden/advancement/root.json': { criteria: {} } });
  assert.match(pruefeDatapack(dir).join(), /pack\.mcmeta/);
});

test('unbekannter advancement parent wird gemeldet', () => {
  const dir = pack({
    'pack.mcmeta': dpMeta,
    'data/leitfaden/advancement/k1/stein.json': { parent: 'leitfaden:gibtsnicht', criteria: { a: { trigger: 'minecraft:impossible' } } },
  });
  const fehler = pruefeDatapack(dir);
  assert.equal(fehler.length, 1);
  assert.match(fehler[0], /leitfaden:gibtsnicht/);
});

test('vanilla parent ist erlaubt', () => {
  const dir = pack({
    'pack.mcmeta': dpMeta,
    'data/leitfaden/advancement/x.json': { parent: 'minecraft:story/root', criteria: { a: { trigger: 'minecraft:impossible' } } },
  });
  assert.deepEqual(pruefeDatapack(dir), []);
});

test('gültiges Resourcepack hat keine Fehler', () => {
  const dir = pack({
    'pack.mcmeta': rpMeta,
    'assets/weihnachten/models/item/lebkuchen.json': { parent: 'minecraft:item/generated', textures: { layer0: 'weihnachten:item/lebkuchen' } },
    'assets/weihnachten/textures/item/lebkuchen.png': 'png',
  });
  assert.deepEqual(pruefeResourcepack(dir), []);
});

test('fehlende Textur zu Modell wird gemeldet', () => {
  const dir = pack({
    'pack.mcmeta': rpMeta,
    'assets/weihnachten/models/item/lebkuchen.json': { parent: 'minecraft:item/generated', textures: { layer0: 'weihnachten:item/lebkuchen' } },
  });
  const fehler = pruefeResourcepack(dir);
  assert.equal(fehler.length, 1);
  assert.match(fehler[0], /weihnachten:item\/lebkuchen/);
});

test('Vanilla-Textur im Modell wird nicht als fehlend gemeldet', () => {
  const dir = pack({
    'pack.mcmeta': rpMeta,
    'assets/weihnachten/models/item/x.json': { textures: { layer0: 'minecraft:item/apple', ref: '#layer0' } },
  });
  assert.deepEqual(pruefeResourcepack(dir), []);
});

test('falsches Resourcepack-Format wird gemeldet', () => {
  const dir = pack({ 'pack.mcmeta': dpMeta });
  assert.match(pruefeResourcepack(dir).join(), /97/);
});
