import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dateien, ladeKasten, ovalPunkte, plattformTeile } from './standort.mjs';

const k = JSON.parse(readFileSync(new URL('./standort-testserver.json', import.meta.url)));

test('Ladekasten deckt Oval und Plattform ab (Chunk-Mitten)', () => {
  assert.deepEqual(ladeKasten(k), [8, -24, 136, 72]);
});

test('Spawnpunkt, Plattform und Weltgrenze kommen aus der Konfiguration', () => {
  const { funktionen } = dateien({ ...k, spawn: { x: 1, y: 100, z: 2, yaw: 90, pitch: 0 }, plattform: { x: 10, y: 62, z: 20, radius: 4 }, weltgrenze: { x: 5, z: 6, breite: 8000 } });
  assert.match(funktionen.zurueck, /^tp @s 1\.5 100 2\.5 90 0$/m);
  assert.match(funktionen.aufbau_teil2, /^setworldspawn 1 100 2 90 0$/m);
  assert.match(funktionen.aufbau_teil2, /^worldborder center 5 6\nworldborder set 8000$/m);
  assert.match(funktionen.tick, /x=10\.5,y=63,z=20\.5,distance=\.\.4/);
  assert.match(funktionen.plattform, /^setblock 10 62 20 minecraft:pearlescent_froglight$/m);
});

test('Ohne Struktur kein place template (eigenes Design oder fertige Welt)', () => {
  const { funktionen } = dateien({ ...k, struktur: null });
  assert.doesNotMatch(funktionen.aufbau_teil2, /place template/);
});

test('Oval-Region mit 32 Punkten, Plattform mit 125 Blöcken', () => {
  assert.equal(ovalPunkte(k.oval).length, 32);
  assert.deepEqual(ovalPunkte(k.oval)[0], [133, 25]);
  assert.equal(plattformTeile().length, 125);
  assert.match(dateien(k).regionen, /type: poly2d/);
});

test('Wurzel-Stil und Spawn-Teleport (erstes Betreten, Respawn ohne Bett)', () => {
  const { funktionen } = dateien({ ...k, spawnTeleport: true, plattform: { ...k.plattform, stil: 'wurzel' } });
  assert.match(funktionen.plattform, /minecraft:shroomlight/);
  assert.doesNotMatch(funktionen.plattform, /amethyst/);
  assert.match(funktionen.load, /insel_tod deathCount/);
  assert.match(funktionen.erstbesuch, /^tp @s 64\.5 179 29\.5 0 0$/m);
  assert.match(funktionen.respawn, /unless data entity @s respawn run tp/);
  assert.equal(plattformTeile('wurzel').length, plattformTeile('stein').length);
});

test('Pilzland: fillbiome in 8×8-Säulen über die ganze Höhe, nur im Oval, unter der Befehlsgrenze', async () => {
  const { pilzlandBefehle } = await import('./standort.mjs');
  const b = pilzlandBefehle({ x: 0, z: 0, a: 20, b: 12 });
  assert.ok(b.length > 10);
  for (const c of b) { const n = c.split(' ').slice(1, 7).map(Number); assert.equal((n[3] - n[0] + 1) * (n[4] - n[1] + 1) * (n[5] - n[2] + 1), 8 * 384 * 8); }
  assert.ok(!b.some((c) => c.startsWith('fillbiome 24 ')));
  const { funktionen } = dateien({ ...k, pilzland: { x: 64, z: 37, a: 30, b: 30 } });
  assert.match(funktionen.aufbau_teil2, /function insel:pilzland/);
  assert.match(funktionen.pilzland, /minecraft:mushroom_fields/);
});

test('Ohne Plattform und Sättigung: keine Teleport- oder Sättigungslogik', () => {
  const { plattform, saettigung, ...rest } = k;
  const { funktionen } = dateien({ ...rest, lichter: null });
  assert.equal(funktionen.plattform, undefined);
  assert.equal(funktionen.betreten, undefined);
  assert.doesNotMatch(funktionen.tick, /insel_tp|insel_satt/);
  assert.doesNotMatch(funktionen.aufbau_teil2, /insel:plattform|insel:lichter/);
});

test('Eröffnung: schließen setzt Wurzeln, Barriere und kleine Grenze; Eröffnung nur einmal; Ausgänge öffnen, große Grenze', () => {
  const e = { sekunden: 10, grenzeZu: { x: 5, z: 6, breite: 128 }, ausgaenge: [{ wurzeln: [1, 65, 1, 3, 68, 1], barriere: [1, 65, 2, 3, 68, 2] }] };
  const { funktionen: f } = dateien({ ...k, eroeffnung: e });
  assert.match(f.schliessen, /fill 1 65 1 3 68 1 minecraft:mangrove_roots/);
  assert.match(f.schliessen, /fill 1 65 2 3 68 2 minecraft:barrier/);
  assert.match(f.schliessen, /worldborder center 5 6\nworldborder set 128/);
  assert.match(f.eroeffnung, /if score #offen insel_zustand matches 1 run say/);
  assert.match(f.oeffnen, /schedule function insel:ausgang_0/);
  assert.match(f.ausgang_0, /fill 1 65 1 3 68 1 minecraft:air\n/); // ohne destroy: nichts fällt als Gegenstand heraus
  assert.doesNotMatch(f.ausgang_0, /destroy/);
  assert.match(f.willkommen, /worldborder set 10000/);
  assert.match(f.aufbau_teil2, /function insel:schliessen/);
});
