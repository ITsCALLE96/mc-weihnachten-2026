import { test } from 'node:test';
import assert from 'node:assert/strict';
import { werteAus, ereignisseAusRoh } from './auswertung.mjs';
import { flacheStatistik, parseUsercache } from './spieler.mjs';
import { parseSichtbarkeit, Sichtbarkeit } from './sichtbarkeit.mjs';
import { anzahl, zeit, strecke } from './format.mjs';
import { erzeugeUebersetzer } from './uebersetzung.mjs';
import { ausBerlin } from './zeit.mjs';
import { WERT } from './titel.mjs';
import { SPRACHE } from './testsprache.mjs';

const U1 = '11111111-1111-4111-8111-111111111111';
const U2 = '22222222-2222-4222-8222-222222222222';
const U3 = '33333333-3333-4333-8333-333333333333';
const namen = new Map([[U1, 'Steve'], [U2, 'Alex'], [U3, 'Geheim']]);
const t = (h, m = 0) => ausBerlin('2026-12-06', h, m, 0);

test('Statistik wird flach gemacht, play_one_minute als Rückfall', () => {
  assert.deepEqual(flacheStatistik({ stats: { 'minecraft:custom': { 'minecraft:play_time': 5 }, 'minecraft:mined': { 'minecraft:stone': 12 } } }),
    { 'custom:play_time': 5, 'mined:stone': 12 });
  assert.equal(flacheStatistik({ stats: { 'minecraft:custom': { 'minecraft:play_one_minute': 7 } } })['custom:play_time'], 7);
});

test('usercache und Sichtbarkeit', () => {
  assert.equal(parseUsercache(JSON.stringify([{ name: 'Steve', uuid: U1.toUpperCase() }])).get(U1), 'Steve');
  assert.ok(parseSichtbarkeit(JSON.stringify({ ausgeblendet: [U3.replaceAll('-', '')] })).has(U3));
  assert.equal(new Sichtbarkeit(null).istSichtbar(U1), false, 'ohne Stand ist niemand sichtbar');
});

test('Formatierer', () => {
  assert.equal(anzahl(2800), '2.800');
  assert.equal(zeit(20 * 60 * (12 * 60 + 30)), '12 Std. 30 Min.');
  assert.equal(zeit(20 * 3600 * (3 * 24 + 4)), '3 Tage 4 Std.');
  assert.equal(strecke(1230000), '12,3 km');
  assert.equal(strecke(85000), '850 m');
});

function eingabe() {
  const statistiken = new Map([
    [U1, { 'custom:play_time': 20 * 3600 * 60, 'custom:deaths': 12, 'custom:walk_one_cm': 6000000, 'mined:stone': 500, 'mined:diamond_ore': 3, 'used:stone': 40, 'custom:bell_ring': 60 }],
    [U2, { 'custom:play_time': 20 * 3600 * 5, 'custom:deaths': 1, 'mined:stone': 20 }],
    [U3, { 'custom:play_time': 20 * 3600 * 999, 'custom:deaths': 999 }],
  ]);
  const ue = erzeugeUebersetzer(SPRACHE);
  const roh = [
    { zeit: t(18), typ: 'join', name: 'Steve' },
    { zeit: t(18, 10), typ: 'join', name: 'Geheim' },
    { zeit: t(18, 20), typ: 'tod', name: 'Alex', schluessel: 'death.attack.mob', args: ['Alex', 'Zombie'], text: 'Alex was slain by Zombie' },
    { zeit: t(18, 30), typ: 'tod', name: 'Alex', schluessel: 'death.attack.player', args: ['Alex', 'Geheim'], text: 'Alex was slain by Geheim' },
    { zeit: t(18, 40), typ: 'fortschritt', name: 'Steve', art: 'made', titel: 'Stone Age' },
    { zeit: t(19), typ: 'quit', name: 'Steve' },
  ];
  const n2u = new Map([...namen].map(([u, n]) => [n.toLowerCase(), u]));
  return {
    statistiken, namen, ereignisse: ereignisseAusRoh(roh, { namenZuUuid: n2u, uebersetzer: ue }),
    sichtbar: (u) => u !== U3, sprache: SPRACHE, optionen: { testmodus: true }, jetzt: t(20), laeuft: true,
  };
}

test('Auswertung: Struktur, gesamt mit allen WERT-Namen, Testmodus-Feld', () => {
  const d = werteAus(eingabe());
  assert.equal(d.server.testmodus, true);
  assert.equal(d.gesamt.spieler, 2);
  for (const k of Object.keys(WERT)) assert.equal(typeof d.gesamt[k], 'number', k);
  assert.equal(d.gesamt.tode, 13);
  assert.equal(d.gesamt.spielzeit, 20 * 3600 * 65);
  assert.deepEqual(d.spieler.map((s) => s.name), ['Alex', 'Steve']);
  assert.equal(d.spieler.find((s) => s.name === 'Steve').online, false);
  assert.equal(d.gesamt.gebaut, 40, 'used:stone zählt als gesetzter Block');
});

test('Bestenlisten: Top 10, nur > 0, leere weggelassen, Reihenfolge nach Wert', () => {
  const d = werteAus(eingabe());
  const ids = d.bestenlisten.map((b) => b.id);
  assert.ok(ids.includes('dauerzocker') && ids.includes('friedhof'));
  assert.ok(!ids.includes('elytra'), 'Liste ohne Einträge fehlt');
  const dz = d.bestenlisten.find((b) => b.id === 'dauerzocker');
  assert.deepEqual(dz.eintraege.map((e) => e.uuid), [U1, U2]);
  assert.equal(dz.einheit, 'zeit');
});

test('Sprüche: Schwelle und Platz 1, formatiert', () => {
  const d = werteAus(eingabe());
  const s = d.sprueche[U1];
  assert.ok(s.some((x) => x.text.startsWith('60 Std. 0 Min.') || x.text.includes('2 Tage 12 Std.')), JSON.stringify(s));
  assert.ok(s.some((x) => x.text.includes('Platz 1')));
  assert.equal(s[0].rang, 1);
  assert.ok(s.length <= 8);
});

test('Fakten und Namen/Einheiten', () => {
  const d = werteAus(eingabe());
  assert.ok(d.fakten.some((f) => f.includes('Mal gestorben')));
  assert.equal(d.namen['mined:stone'], 'Stein');
  assert.equal(d.namen['custom:play_time'], 'Spieldauer');
  assert.equal(d.einheiten['custom:play_time'], 'zeit');
  assert.equal(d.einheiten['custom:walk_one_cm'], 'strecke');
  assert.equal(d.kategorien.mined, 'Abgebaut');
});

test('Datenschutz: ausgeblendeter Spieler und Mörder-Ereignis verschwinden überall', () => {
  const d = werteAus(eingabe());
  const text = JSON.stringify(d);
  assert.ok(!text.includes('Geheim'));
  assert.ok(!text.includes(U3));
  assert.ok(!d.ereignisse.some((e) => e.text.includes('Alex wurde von Geheim')));
  assert.ok(d.ereignisse.some((e) => e.text === 'Alex wurde von Zombie erschlagen'));
  assert.ok(d.ereignisse.some((e) => e.text === 'Steve hat den Fortschritt [Steinzeit] erzielt'));
  assert.ok(!d.sitzungen.some((s) => s.uuid === U3));
  assert.deepEqual(d.server.online, []);
});

test('Nichts sichtbar, solange kein Stand vorliegt', () => {
  const e = eingabe();
  e.sichtbar = () => false;
  const d = werteAus(e);
  assert.equal(d.spieler.length, 0);
  assert.equal(d.ereignisse.every((x) => x.uuid === null), true);
  assert.ok(!JSON.stringify(d).includes('Steve'));
});

test('Ereignisse: neueste zuerst, höchstens 50; Tage und Sitzungen gefüllt', () => {
  const e = eingabe();
  const d = werteAus(e);
  assert.ok(d.ereignisse[0].zeit > d.ereignisse.at(-1).zeit);
  assert.equal(d.tage[0].datum, '2026-12-06');
  assert.equal(d.tage[0].min[U1], 60);
  assert.equal(d.sitzungen.length, 1);
  const viele = [];
  for (let i = 0; i < 80; i++) viele.push({ zeit: t(10) + i * 1000, typ: 'start', uuid: null, text: 'Server gestartet' });
  assert.equal(werteAus({ ...e, ereignisse: viele }).ereignisse.length, 50);
});
