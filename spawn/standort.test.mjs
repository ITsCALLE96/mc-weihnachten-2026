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
