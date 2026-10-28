import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { datapack, inselBloecke, lichter } from './weihnachtsinsel.mjs';

const d = datapack(), f = d.funktionen;
const mission = JSON.parse(readFileSync(new URL('./mission.json', import.meta.url)));

test('Lage am Nordweg: Insel nördlich der Spark-Insel, Brücke ab dem Wegende, Kiste und Tafel am Brückenkopf', () => {
  assert.deepEqual(d.mitte, [-1, 154, -34]);
  const I = inselBloecke();
  assert.deepEqual(I.brueckeVon, [-1, 154, 29]);
  assert.ok(I.brueckeBis[2] < -5 && I.brueckeBis[0] === -1);
  assert.deepEqual(d.kiste, [2, 155, 31]);
  assert.deepEqual([mission.kiste.x, mission.kiste.y, mission.kiste.z], d.kiste);
  assert.equal(mission.tafel.x, d.tafel[0] + 0.5);
  assert.match(f.vorbereiten, /setblock 2 155 31 minecraft:chest\[facing=south\]/);
  assert.match(f.vorbereiten, /summon text_display -3\.5 158\.5 31\.5 \{Tags:\["wi_tafel"\],Rotation:\[0f,0f\]/);
});

test('Drehung: Achsen und Blickrichtungen gedreht (Brücke läuft entlang z)', () => {
  const s1 = d.insel.stufen[0];
  const kanten = [...s1].filter(([, v]) => v.startsWith('minecraft:stripped_spruce_log['));
  assert.ok(kanten.length > 0 && kanten.every(([, v]) => v.includes('axis=z')));
  assert.ok([...s1.values()].some((v) => v.includes('spruce_stairs[facing=west')));
});

test('Stufen: Merker gegen Doppelaufruf und Reihenfolge, Effekt in Schritten, fertig setzt alles, Stufe 4 endet mit Feier', () => {
  for (let n = 1; n <= 4; n++) {
    assert.match(f[`stufe_${n}`], new RegExp(`^execute if score #stufe wi_mission matches ${n}\\.\\. run return fail$`, 'm'));
    assert.match(f[`stufe_${n}`], new RegExp(`^execute unless score #stufe wi_mission matches ${n - 1}\\.\\. run return fail$`, 'm'));
    assert.match(f[`stufe_${n}/start`], /^title @a title /m);
    assert.match(f[`stufe_${n}/fertig`], /^kill @e\[type=item,/m);
  }
  assert.equal(Object.keys(f).filter((n) => n.startsWith('stufe_1/schritt_')).length, 16); // 8 Schichten + 8 Brückenabschnitte
  assert.match(f['stufe_4/ende'], /^function weihnachtsinsel:feier$/m);
  assert.match(f['stufe_4/schritt_0'], /minecraft:waxed_copper_bulb\[lit=true\] replace minecraft:waxed_copper_bulb\[lit=false\]/);
  assert.match(f['feier/schritt'], /matches 240 run summon firework_rocket/);
  assert.match(f.load, /#laeuft wi_mission matches 1\.\. run schedule function weihnachtsinsel:wiederaufnahme/);
});

test('Baum wächst ohne fill: alte Nadeln per Höhlenluft weg, kleine Fichten bleiben', () => {
  for (let i = 0; i < 5; i++) assert.doesNotMatch(f[`stufe_2/schritt_${i}`], /^fill /m);
  const w = d.insel.wachstum;
  assert.ok([...w[1].values()].includes('minecraft:cave_air'));
  assert.ok(![...w[0].values()].includes('minecraft:cave_air'));
});

test('Licht gegen Monster: nach jeder Stufe keine dunkle Spawnstelle mehr', () => {
  const welt = new Map();
  d.insel.stufen.forEach((m) => m.forEach((v, k) => welt.set(k, v)));
  for (const [k, v] of d.kumul) if (v.startsWith('minecraft:light')) welt.set(k, v);
  assert.equal(lichter(welt).length, 0);
  assert.ok(d.lichter[0] > 0);
  assert.ok([...d.kumul.values()].every((v) => v !== 'minecraft:ice')); // kein schmelzendes Eis
});

test('mission.json: 4 Stufen ohne Datum, je 3 Tränke, Funktionen passen zum Datapack', () => {
  assert.equal(mission.stufen.length, 4);
  mission.stufen.forEach((s, i) => {
    assert.equal(s.funktion, `weihnachtsinsel:stufe_${i + 1}`);
    assert.ok(f[`stufe_${i + 1}`]);
    assert.equal(s.ab, undefined);
    assert.equal(s.trank.anzahl, 3);
  });
  const e = Object.fromEntries(mission.stufen[3].trank.effekte.map((x) => [x.id, x]));
  // stärker als ein verzauberter Goldener Apfel
  assert.ok(e['minecraft:regeneration'].stufe >= 1 && e['minecraft:regeneration'].sekunden > 20);
  assert.ok(e['minecraft:absorption'].stufe >= 3 && e['minecraft:absorption'].sekunden > 120);
  assert.ok(e['minecraft:resistance'].sekunden > 300 && e['minecraft:fire_resistance'].sekunden > 300);
});
