import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseLog, parseZeile, logDatumAusDateiname, klassifiziere } from './log.mjs';
import { erzeugeUebersetzer } from './uebersetzung.mjs';
import { isoBerlin } from './zeit.mjs';
import { SPRACHE } from './testsprache.mjs';

const ue = erzeugeUebersetzer(SPRACHE);
const opt = { todeMuster: ue.todeMuster };

test('Dateiname → Datum', () => {
  assert.equal(logDatumAusDateiname('2026-12-05-1.log.gz'), '2026-12-05');
  assert.equal(logDatumAusDateiname('latest.log'), null);
});

test('Zeilenformate Paper und alt', () => {
  assert.equal(parseZeile('[18:04:12 INFO]: Steve joined the game').sek, 18 * 3600 + 4 * 60 + 12);
  assert.equal(parseZeile('[18:04:12] [Server thread/INFO]: Steve joined the game').text, 'Steve joined the game');
  assert.equal(parseZeile('\tat net.minecraft.Foo'), null);
});

test('Join, Quit, Fortschritt, Start, Stopp, UUID', () => {
  assert.deepEqual(klassifiziere('Steve joined the game'), { typ: 'join', name: 'Steve' });
  assert.deepEqual(klassifiziere('Steve left the game'), { typ: 'quit', name: 'Steve' });
  assert.deepEqual(klassifiziere('Steve has made the advancement [Stone Age]'), { typ: 'fortschritt', name: 'Steve', art: 'made', titel: 'Stone Age' });
  assert.equal(klassifiziere('Steve has completed the challenge [Hero of the Village]').art, 'challenge');
  assert.equal(klassifiziere('Steve has reached the goal [Sniper Duel]').art, 'goal');
  assert.equal(klassifiziere('Done (3.4s)! For help, type "help"').typ, 'start');
  assert.equal(klassifiziere('Stopping server').typ, 'stopp');
  assert.equal(klassifiziere('UUID of player Steve is 069a79f4-44e9-4726-a5be-fca90e38aaf5').typ, 'uuid');
  assert.equal(klassifiziere('<Steve> Alex joined the game'), null, 'Chat ist kein Join');
});

test('Todesmeldungen mit und ohne Gegenstand', () => {
  const t1 = klassifiziere('Steve was slain by Zombie', opt);
  assert.equal(t1.typ, 'tod');
  assert.equal(t1.name, 'Steve');
  assert.equal(t1.schluessel, 'death.attack.mob');
  const t2 = klassifiziere('Steve was slain by Alex using [Iron Sword]', opt);
  assert.equal(t2.schluessel, 'death.attack.mob.item');
  assert.deepEqual(t2.args, ['Steve', 'Alex', '[Iron Sword]']);
  assert.equal(klassifiziere('Steve fell from a high place', opt).schluessel, 'death.fell.accident.generic');
  assert.equal(klassifiziere('Hello world', opt), null);
});

test('Datum aus Dateiname, Zeit in Europe/Berlin (Winter +01:00)', () => {
  const e = parseLog('[18:04:12 INFO]: Steve joined the game\n', { datum: '2026-12-06' });
  assert.equal(isoBerlin(e[0].zeit), '2026-12-06T18:04:12+01:00');
});

test('Sommerzeit wird beachtet', () => {
  const e = parseLog('[18:04:12 INFO]: Steve joined the game\n', { datum: '2026-07-06' });
  assert.equal(isoBerlin(e[0].zeit), '2026-07-06T18:04:12+02:00');
});

test('Mitternachtswechsel innerhalb einer Datei', () => {
  const text = '[23:50:00 INFO]: Steve joined the game\n[00:20:00 INFO]: Steve left the game\n';
  const e = parseLog(text, { datum: '2026-12-06' });
  assert.equal(isoBerlin(e[0].zeit), '2026-12-06T23:50:00+01:00');
  assert.equal(isoBerlin(e[1].zeit), '2026-12-07T00:20:00+01:00');
});

test('latest.log: Startdatum rückwärts aus Änderungsdatum', () => {
  const text = '[23:50:00 INFO]: Steve joined the game\n[00:20:00 INFO]: Steve left the game\n[01:00:00 INFO]: Alex joined the game\n';
  const e = parseLog(text, { endDatum: '2026-12-07' });
  assert.equal(isoBerlin(e[0].zeit).slice(0, 10), '2026-12-06');
  assert.equal(isoBerlin(e[2].zeit).slice(0, 10), '2026-12-07');
});

test('WARN-Zeilen und Stacktraces werden ignoriert', () => {
  const text = '[10:00:00 WARN]: Steve joined the game\n\tat foo\n[10:00:01 INFO]: Steve left the game\n';
  assert.equal(parseLog(text, { datum: '2026-12-06' }).length, 1);
});
