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

test('Gekaufter Bau: eigenes Biom, Infotafel gewachst, Zufallsticken beim Einfügen aus, Grenze fährt auf, Eröffnung ohne Ausgänge', () => {
  const kf = JSON.parse(readFileSync(new URL('./standort-fantasy-village-test.json', import.meta.url)));
  const { funktionen: f, regionen } = dateien(kf);
  assert.match(f.pilzland, /fillbiome .* minecraft:cherry_grove$/m);
  assert.doesNotMatch(f.pilzland, /mushroom_fields/);
  assert.match(f.tafeln, /^setblock -3 235 15 minecraft:spruce_sign\[rotation=0\]\{is_waxed:1b,front_text:\{messages:\["Spawn","Fantasy Village","gebaut von","LavaBuilds"\]\}\}$/m);
  assert.match(f.aufbau_teil2, /gamerule random_tick_speed 0\nplace template spawn:fantasy_village_0_0 -150 80 -158\n/);
  assert.match(f.aufbau_teil2, /^place template spawn:fantasy_village_3_3 42 80 34$/m);
  assert.equal(f.aufbau_teil2.match(/place template/g).length, 16);
  assert.match(f.aufbau_teil2, /function insel:tafeln/);
  assert.match(f.aufbau_ende, /gamerule random_tick_speed 3/);
  assert.match(f.willkommen, /^worldborder set 10000 20$/m);
  assert.match(f.eroeffnung_start, /Das Dorf öffnet sich/);
  assert.match(f.schliessen, /worldborder set 80/);
  assert.match(f.oeffnen, /schedule function insel:willkommen 20t/);
  assert.match(regionen, /vine-growth: deny/);
  assert.deepEqual(ladeKasten(kf), [-152, -152, 88, 88]); // 16 × 16 = 256 Chunks, Grenze von forceload
});

test('Spark-Insel auf dem SMP: Struktur, Plattform, Tafel, Teleport, Lichter nachträglich', () => {
  const ks = JSON.parse(readFileSync(new URL('./standort-smp-spark.json', import.meta.url)));
  const { funktionen: f } = dateien(ks);
  assert.match(f.aufbau_teil2, /^place template spawn:spark_insel -26 89 22$/m);
  assert.match(f.aufbau_teil2, /^setworldspawn 0 156 48 0 0$/m);
  assert.ok(f.tafeln.includes('SparkofPhoenix'));
  assert.match(f.erstbesuch, /^tp @s 0\.5 156 48\.5 0 0$/m);
  assert.match(f.plattform, /^setblock 0 66 48 minecraft:pearlescent_froglight$/m);
  assert.match(f.lichter_fertig, /^forceload add /m);
  assert.match(f.lichter_fertig2, /^function insel:lichter\n/);
  assert.equal(f.schliessen, undefined); // keine Eröffnung auf dem SMP (läuft im Hub)
});

test('Spark-Insel 27.10.: Portal entfernt (vor dem Bau), Ender-Kiste, Schild am Baum, Sättigung oben', () => {
  const ks = JSON.parse(readFileSync(new URL('./standort-smp-spark.json', import.meta.url)));
  const f = dateien(ks).funktionen, t = f.aufbau_teil2;
  assert.ok(t.indexOf('fill -3 154 29 1 158 29 minecraft:air') < t.indexOf('place template spawn:spark_insel'));
  assert.doesNotMatch(t, /nether_portal|minecraft:obsidian$/m);
  assert.ok(t.includes('\nfill -1 156 47 -1 156 47 minecraft:ender_chest[facing=south]\n'));
  assert.ok(f.tafeln.includes('setblock -9 158 39 minecraft:spruce_wall_sign[facing=south]'));
  assert.ok(f.heilen_spieler.includes('unless score @s insel_hunger matches 20.. run return run effect give @s minecraft:saturation 1 0 true'));
  assert.ok(f.heilen_spieler.includes('unless score @s insel_leben matches 20..'));
  assert.ok(f.heilen.includes('at @s positioned -1 ~ 47 if entity @s[distance=..28] run function insel:heilen_spieler'));
  assert.ok(f.load.includes('insel_hunger food\nscoreboard objectives add insel_leben health'));
  assert.ok(f.tick.includes('matches 20.. run function insel:heilen'));
  assert.equal(f.betreten, undefined);
});

test('Region nur in Inselhöhe plus Kasten um die Rückweg-Plattform', () => {
  const ks = JSON.parse(readFileSync(new URL('./standort-smp-spark.json', import.meta.url)));
  const { regionen } = dateien(ks);
  assert.match(regionen, /min-y: 89\n        max-y: 319/);
  assert.match(regionen, /rueckweg:\n        type: cuboid/);
  assert.match(regionen, /min: \{x: -5, y: 64, z: 43\}/);
  assert.doesNotMatch(dateien(k).regionen, /rueckweg/);
});

test('Lichtung um die Rückweg-Plattform: Kreis frei, Löcher mit Gras, Bäume im Rand weg; alte Plattform zurückgebaut', async () => {
  const { lichtungBefehle } = await import('./standort.mjs');
  const b = lichtungBefehle({ x: 0, z: 84, r: 9, boden: 64, hoehe: 20, rand: 4 });
  assert.ok(b.includes('fill -9 65 84 9 84 84 minecraft:air'));
  assert.ok(b.includes('fill -9 64 84 9 64 84 minecraft:grass_block replace #minecraft:replaceable'));
  assert.ok(b.includes('fill -9 64 84 9 64 84 minecraft:grass_block replace #minecraft:base_stone_overworld'));
  assert.ok(b.includes('fill -13 65 84 13 84 84 minecraft:air replace #minecraft:logs'));
  assert.ok(!b.some((c) => c.startsWith('fill -9 65 71 ')));
  for (const c of b) { const n = c.split(' ').slice(1, 7).map(Number); assert.ok((n[3] - n[0] + 1) * (n[4] - n[1] + 1) * (n[5] - n[2] + 1) <= 32768); }
  const ks = JSON.parse(readFileSync(new URL('./standort-smp-spark.json', import.meta.url)));
  const t = dateien(ks).funktionen.aufbau_teil2;
  assert.ok(t.includes('fill -4 63 80 4 63 88 minecraft:dirt replace minecraft:stone_brick_stairs'));
  assert.ok(t.indexOf('# Lichtung') < t.indexOf('function insel:plattform'));
  assert.ok(dateien(ks).funktionen.heilen_spieler.includes('saturation 1 0 true'));
});

test('Regionen mit deutschem Hinweis (deny-message) für spawn und rueckweg', () => {
  const ks = JSON.parse(readFileSync(new URL('./standort-smp-spark.json', import.meta.url)));
  const { regionen } = dateien(ks);
  assert.equal(regionen.match(/deny-message: '§7Am Spawn kannst du nichts verändern\.'/g).length, 2);
});
