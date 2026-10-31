// Zusatzwerte: Fortschritte (nur Vanilla, ohne Rezepte) und Spenden für die Weihnachtsinsel.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { zaehleFortschritte, parseSpenden, ergaenzeWerte, leseFortschritte, leseSpenden } from './zusatz.mjs';
import { letzterSchnappschuss } from './seasons.mjs';
import { erzeugeTestwelt, erzeugeArchiv } from '../testdaten.mjs';
import { werteAus } from './auswertung.mjs';
import { SPRACHE } from './testsprache.mjs';

const U1 = '90e3cb68-f696-4418-a56f-d6482902c9e3';
const U2 = '4e808d21-2a8d-401f-955d-7532511a9b7a';

test('Fortschritte: nur minecraft:, ohne Rezepte, nur erledigte', () => {
  assert.equal(zaehleFortschritte({
    'minecraft:story/mine_stone': { done: true },
    'minecraft:story/upgrade_tools': { done: false },
    'minecraft:recipes/misc/stick': { done: true },
    'leitfaden:ankommen/start': { done: true },
    DataVersion: 5023,
  }), 1);
});

test('Spenden: nur Abschnitt gesamt-spender (wie Bukkit es schreibt)', () => {
  const yml = `stufe: 1\nspender:\n  '1':\n    ${U1}: 99\ngesamt-spender:\n  ${U1}: 12\n  '${U2}': 3\nnamen:\n  ${U1}: Steve\n`;
  assert.deepEqual([...parseSpenden(yml)], [[U1, 12], [U2, 3]]);
  assert.equal(parseSpenden('gesamt-spender: {}\n').size, 0);
});

test('ergaenzeWerte lässt die Eingabe unverändert und lässt Nullen weg', () => {
  const st = new Map([[U1, { 'custom:jump': 1 }]]);
  const aus = ergaenzeWerte(st, { fortschritte: new Map([[U1, 4], [U2, 0]]), spenden: new Map([[U2, 5]]) });
  assert.deepEqual(aus.get(U1), { 'custom:jump': 1, 'server:fortschritte': 4 });
  assert.deepEqual(aus.get(U2), { 'server:spenden': 5 });
  assert.deepEqual(st.get(U1), { 'custom:jump': 1 });
});

test('Testwelt und Schnappschuss liefern Fortschritte und Spenden, Bestenlisten zeigen sie ohne Ausgeblendete', () => {
  const ordner = mkdtempSync(join(tmpdir(), 'statistik-zusatz-'));
  try {
    const welt = erzeugeTestwelt(join(ordner, 'welt'));
    erzeugeArchiv(welt.ziel);
    const f = leseFortschritte(join(welt.ziel, 'world'));
    const s = leseSpenden(welt.ziel);
    const p = welt.spieler.find((x) => x.fortschritte.length > 0);
    assert.equal(f.get(p.uuid), p.fortschritte.length);
    assert.ok([...s.values()].some((n) => n > 0));
    const schnapp = letzterSchnappschuss(join(welt.ziel, 'archiv', 'herbst-2026'));
    assert.equal(schnapp.fortschritte.size, 10);
    assert.ok(schnapp.spenden.size > 0);

    const statistiken = ergaenzeWerte(new Map(welt.spieler.map((x) => [x.uuid, {}])), { fortschritte: f, spenden: s });
    const d = werteAus({
      statistiken, namen: new Map(welt.spieler.map((x) => [x.uuid, x.name])), ereignisse: [],
      sichtbar: (u) => u !== welt.ausgeblendet.uuid, sprache: SPRACHE, jetzt: welt.jetzt,
    });
    for (const id of ['weihnachtself', 'abenteurer']) {
      const liste = d.bestenlisten.find((b) => b.id === id);
      assert.ok(liste, id);
      assert.ok(!JSON.stringify(liste).includes(welt.ausgeblendet.uuid));
    }
    assert.equal(d.namen['server:spenden'], 'Spenden für die Weihnachtsinsel');
  } finally {
    rmSync(ordner, { recursive: true, force: true });
  }
});
