// Live-Werte der Online-Spieler: Prüfung der Datei, Alter, Vorrang vor den Statistikdateien, Datenschutz.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseLive, leseLive, mitLive, LIVE_ORDNER } from './livewerte.mjs';
import { erzeugeTestwelt } from '../testdaten.mjs';
import { Instanz } from './quellen.mjs';
import { Sichtbarkeit } from './sichtbarkeit.mjs';
import { baueBestenlisten } from './anzeige.mjs';
import { SPRACHE } from './testsprache.mjs';

const U1 = '90e3cb68-f696-4418-a56f-d6482902c9e3';
const JETZT = 1_800_000_000_000;
let ordner; let welt;

before(() => {
  ordner = mkdtempSync(join(tmpdir(), 'statistik-live-'));
  welt = erzeugeTestwelt(join(ordner, 'welt'));
});
after(() => rmSync(ordner, { recursive: true, force: true }));

const datei = (o) => JSON.stringify({ uuid: U1, name: 'Steve', zeit: JETZT, werte: { 'custom:play_time': 100 }, ...o });

test('parseLive: frisch und gültig, sonst null; unbrauchbare Werte fallen weg', () => {
  assert.deepEqual(parseLive(datei({ werte: { 'custom:play_time': 100, 'mined:stone': 3, 'x': 1, 'custom:deaths': -1, 'custom:jump': 'viel' } }), { jetzt: JETZT }),
    { uuid: U1, name: 'Steve', werte: { 'custom:play_time': 100, 'mined:stone': 3 } });
  assert.equal(parseLive(datei(), { jetzt: JETZT + 91_000 }), null, 'veraltet');
  assert.equal(parseLive(datei(), { jetzt: JETZT - 91_000 }), null, 'aus der Zukunft');
  assert.equal(parseLive(datei({ uuid: 'kaputt' }), { jetzt: JETZT }), null);
  assert.equal(parseLive('{', { jetzt: JETZT }), null);
  assert.equal(parseLive(datei({ name: '<b>x</b>' }), { jetzt: JETZT }).name, null);
});

test('mitLive: je Wert der größere, Eingabe bleibt unverändert, neue Spieler kommen dazu', () => {
  const st = new Map([[U1, { 'custom:play_time': 500, 'custom:deaths': 2 }]]);
  const aus = mitLive(st, new Map([[U1, { werte: { 'custom:play_time': 900, 'custom:deaths': 1 } }], ['neu', { werte: { 'mined:stone': 4 } }]]));
  assert.deepEqual(aus.get(U1), { 'custom:play_time': 900, 'custom:deaths': 2 });
  assert.deepEqual(aus.get('neu'), { 'mined:stone': 4 });
  assert.equal(st.get(U1)['custom:play_time'], 500);
});

test('Instanz: Live-Werte zählen sofort, Ausgeblendete bleiben weg, veraltete Dateien zählen nicht', async () => {
  const live = join(welt.ziel, LIVE_ORDNER);
  mkdirSync(live, { recursive: true });
  const rudi = welt.spieler.find((p) => p.name === 'Rentier_Rudi');
  const jetzt = Date.now();
  const schreibe = (uuid, o) => writeFileSync(join(live, `${uuid}.json`), JSON.stringify({ uuid, zeit: jetzt, ...o }));
  schreibe(rudi.uuid, { name: 'Rentier_Rudi', werte: { 'custom:deaths': 9999, 'server:fortschritte': 77 } });
  schreibe(welt.ausgeblendet.uuid, { name: welt.ausgeblendet.name, werte: { 'custom:deaths': 99999 } });
  const neu = '11111111-2222-4333-8444-555555555555';
  schreibe(neu, { name: 'Neu_Hier', werte: { 'mined:diamond_ore': 500 } });
  const alt = '66666666-2222-4333-8444-555555555555';
  writeFileSync(join(live, `${alt}.json`), JSON.stringify({ uuid: alt, name: 'Alt_Weg', zeit: jetzt - 120_000, werte: { 'custom:mob_kills': 99999 } }));
  // falscher Dateiname zur UUID im Inhalt
  writeFileSync(join(live, `${U1}.json`), JSON.stringify({ uuid: rudi.uuid, zeit: jetzt, werte: { 'custom:play_time': 1e12 } }));

  const sichtbarkeit = new Sichtbarkeit(welt.sichtbarkeit);
  const b = baueBestenlisten(await new Instanz({ instanz: welt.ziel, sichtbarkeit, sprache: SPRACHE }).daten());
  const liste = (id) => b.listen.find((l) => l.id === id).plaetze;
  assert.deepEqual([liste('tode')[0].name, liste('tode')[0].wert], ['Rentier_Rudi', 9999]);
  assert.equal(liste('fortschritte')[0].wert, 77);
  assert.equal(liste('diamanten')[0].name, 'Neu_Hier');
  assert.ok(liste('spielzeit')[0].wert < 1e12);
  const text = JSON.stringify(b);
  assert.ok(!text.includes(welt.ausgeblendet.name) && !text.includes('Alt_Weg'));
  rmSync(live, { recursive: true });
});

test('leseLive ohne Ordner: leer', () => {
  assert.equal(leseLive(join(ordner, 'fehlt')).size, 0);
});
