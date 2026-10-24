// Seasons: Archiv lesen, „Diese Season“/„Allzeit“, testlauf zählt nicht in Allzeit, Datenschutz in beiden Ansichten.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { leseTar, schreibeTar, seasonName, aktuelleSeason, seasonsImArchiv, letzterSchnappschuss, summiereStatistiken } from './seasons.mjs';
import { erzeugeTestwelt, erzeugeArchiv } from '../testdaten.mjs';
import { starteDienst } from '../dienst.mjs';
import { SPRACHE } from './testsprache.mjs';

const hier = dirname(fileURLToPath(import.meta.url));
const echteSprache = join(hier, '..', 'daten', 'sprache.json');
let ordner; let welt; let dienst; let basis;

before(async () => {
  ordner = mkdtempSync(join(tmpdir(), 'statistik-season-'));
  welt = erzeugeTestwelt(join(ordner, 'welt'));
  erzeugeArchiv(welt.ziel);
  // eine Testlauf-Season, die in „Allzeit“ nicht mitzählen darf
  const testlauf = join(welt.ziel, 'archiv', 'testlauf', 'schnappschuesse');
  mkdirSync(testlauf, { recursive: true });
  const rudi = welt.spieler.find((p) => p.name === 'Rentier_Rudi');
  writeFileSync(join(testlauf, '2026-11-22.tar.gz'), gzipSync(schreibeTar([
    { pfad: `2026-11-22/world/players/stats/${rudi.uuid}.json`, inhalt: JSON.stringify({ stats: { 'minecraft:custom': { 'minecraft:play_time': 999999999 } } }) },
  ])));
  dienst = await starteDienst({
    instanz: welt.ziel, archiv: join(welt.ziel, 'archiv'), sichtbarkeit: welt.sichtbarkeit, port: 0, testmodus: true,
    cache: join(ordner, 'cache'), spracheObjekt: existsSync(echteSprache) ? JSON.parse(readFileSync(echteSprache, 'utf8')) : SPRACHE,
    live: { intervallMs: 100 },
  });
  basis = `http://127.0.0.1:${dienst.port}`;
});

after(async () => {
  await dienst.schliesse();
  rmSync(ordner, { recursive: true, force: true });
});

const daten = async (ansicht) => (await fetch(`${basis}/api/daten${ansicht ? `?ansicht=${ansicht}` : ''}`)).json();
const spielzeit = (d, name) => d.spieler.find((s) => s.name === name)?.werte['custom:play_time'] ?? 0;

test('tar: schreiben und lesen ergibt denselben Inhalt', () => {
  const tar = leseTar(schreibeTar([{ pfad: 'a/b.json', inhalt: '{"x":1}' }, { pfad: 'c.txt', inhalt: 'x'.repeat(700) }]));
  assert.equal(tar.get('a/b.json').toString(), '{"x":1}');
  assert.equal(tar.get('c.txt').length, 700);
});

test('Season-Namen und SEASON-Datei', () => {
  assert.equal(seasonName('weihnachten-2026'), 'Weihnachten 2026');
  assert.equal(seasonName('testlauf'), 'Testlauf');
  const a = join(ordner, 'leer');
  mkdirSync(a, { recursive: true });
  writeFileSync(join(a, 'SEASON'), 'Ungültig!\n');
  assert.equal(aktuelleSeason(a), null);
  writeFileSync(join(a, 'SEASON'), 'weihnachten-2026\r\n');
  assert.equal(aktuelleSeason(a), 'weihnachten-2026');
  assert.deepEqual(seasonsImArchiv(join(welt.ziel, 'archiv')), ['herbst-2026', 'testlauf', 'weihnachten-2026']);
});

test('letzter Schnappschuss liefert Statistiken und Namen', () => {
  const s = letzterSchnappschuss(join(welt.ziel, 'archiv', 'herbst-2026'));
  assert.equal(s.statistiken.size, 10);
  assert.ok([...s.namen.values()].includes('Lebkuchenlars'));
  assert.deepEqual(summiereStatistiken([new Map([['u', { a: 1 }]]), new Map([['u', { a: 2, b: 3 }]])]).get('u'), { a: 3, b: 3 });
});

test('Diese Season ist Standard, Allzeit summiert die abgeschlossene Season dazu', async () => {
  const s = await daten();
  const a = await daten('allzeit');
  assert.equal(s.server.ansicht, 'season');
  assert.equal(s.server.season, 'weihnachten-2026');
  assert.equal(s.server.seasonName, 'Weihnachten 2026');
  assert.deepEqual(s.server.seasons.map((x) => x.id), ['herbst-2026', 'weihnachten-2026']);
  assert.equal(a.server.ansicht, 'allzeit');
  assert.ok(spielzeit(a, 'Lebkuchenlars') > spielzeit(s, 'Lebkuchenlars'));
  assert.ok(a.tage[0].datum < '2026-11-01', 'Allzeit beginnt in der alten Season');
  assert.equal(s.tage[0].datum, '2026-12-05');
});

test('testlauf zählt nicht in Allzeit', async () => {
  const a = await daten('allzeit');
  assert.ok(spielzeit(a, 'Rentier_Rudi') < 999999999);
  assert.ok(!a.server.seasons.some((x) => x.id === 'testlauf'));
});

test('Datenschutz: ausgeblendeter Spieler fehlt auch in Allzeit', async () => {
  const text = JSON.stringify(await daten('allzeit'));
  assert.ok(!text.includes(welt.ausgeblendet.name));
  assert.ok(!text.includes(welt.ausgeblendet.uuid));
  assert.equal((await fetch(`${basis}/api/kopf/${welt.ausgeblendet.uuid}.png`)).status, 404);
});
