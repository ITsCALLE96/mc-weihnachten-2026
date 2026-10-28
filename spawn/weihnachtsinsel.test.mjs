import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { datapack, inselBloecke, lichter } from './weihnachtsinsel.mjs';

const d = datapack(), f = d.funktionen;
const mission = JSON.parse(readFileSync(new URL('./mission.json', import.meta.url)));

test('Lage am Nordweg: Insel nördlich der Spark-Insel, Brücke ab dem Wegende, Tafel am Brückenkopf, keine Kiste', () => {
  assert.deepEqual(d.mitte, [-1, 154, -34]);
  const I = inselBloecke();
  assert.deepEqual(I.brueckeVon, [-1, 154, 29]);
  assert.ok(I.brueckeBis[2] < -5 && I.brueckeBis[0] === -1);
  assert.equal(mission.kiste, undefined); // gespendet wird im Ender-Kisten-Menü
  assert.equal(mission.tafel.x, d.tafel[0] + 0.5);
  assert.equal(mission.tafel.welt, 'world');
  assert.match(f.vorbereiten, /^forceload add -4 31$/m);
  assert.match(f.vorbereiten2, /summon text_display -3\.5 158\.5 31\.5 \{Tags:\["wi_tafel"\],Rotation:\[0f,0f\]/);
});

test('Drehung: Achsen und Blickrichtungen gedreht (Brücke läuft entlang z)', () => {
  const s1 = d.insel.stufen[0];
  const kanten = [...s1].filter(([, v]) => v.startsWith('minecraft:stripped_spruce_log['));
  assert.ok(kanten.length > 0 && kanten.every(([, v]) => v.includes('axis=z')));
  assert.ok([...s1.values()].some((v) => v.includes('spruce_stairs[facing=west')));
});

test('Stufen: je 10 Bauabschnitte mit Merker, Abschluss setzt alles, Stufe 4 endet mit Feier', () => {
  for (let n = 1; n <= 4; n++) {
    assert.match(f[`stufe_${n}`], new RegExp(`^execute if score #stufe wi_mission matches ${n}\\.\\. run return fail$`, 'm'));
    assert.match(f[`stufe_${n}`], new RegExp(`^execute unless score #stufe wi_mission matches ${n - 1}\\.\\. run return fail$`, 'm'));
    assert.match(f[`stufe_${n}/abschluss`], /^title @a title /m);
    assert.match(f[`stufe_${n}/fertig`], /^kill @e\[type=item,/m);
    for (let k = 1; k <= 10; k++) {
      assert.match(f[`stufe_${n}_teil_${k}`], new RegExp(`^execute if score #t${n}_${k} wi_mission matches 1 run return fail$`, 'm'));
      assert.match(f[`stufe_${n}_teil_${k}/setzen`], new RegExp(`^scoreboard players set #t${n}_${k} wi_mission 1$`, 'm'));
      assert.match(f[`stufe_${n}_teil_${k}/setzen`], /^particle /m);
      assert.match(f[`stufe_${n}/fertig`], new RegExp(`#t${n}_${k} wi_mission 1`));
    }
  }
  assert.match(f['stufe_4/abschluss'], /^function weihnachtsinsel:feier$/m);
  assert.match(f['stufe_4_teil_1/setzen'], /minecraft:waxed_copper_bulb\[lit=true\] replace minecraft:waxed_copper_bulb\[lit=false\]/);
  // Entities je Abschnitt erst weg, dann neu (kein Doppel nach Neustart)
  assert.match(f['stufe_3_teil_10/setzen'], /^kill @e\[tag=wi_e_s3_10\]\nsummon allay /m);
  assert.match(f['stufe_4_teil_10/setzen'], /summon mannequin -0\.50 155\.00 -54\.50 \{Tags:\["wi_insel","wi_e_s4_10","wi_weihnachtsmann"\],Rotation:\[0f,0f\]/);
  assert.match(f['stufe_2_teil_6/setzen'], /block_state:\{id:"minecraft:carved_pumpkin",properties:\{facing:"south"\}\}/);
  assert.match(f['feier/schritt'], /matches 240 run summon firework_rocket/);
  assert.match(f.load, /#laeuft wi_mission matches 1\.\. run schedule function weihnachtsinsel:wiederaufnahme/);
});

test('Baum wächst ohne fill: alte Nadeln per Höhlenluft weg, kleine Fichten bleiben', () => {
  for (let k = 1; k <= 10; k++) assert.doesNotMatch(f[`stufe_2_teil_${k}/setzen`], /^fill /m);
  const w = d.insel.wachstum;
  assert.ok([...w[1].values()].includes('minecraft:cave_air'));
  assert.ok(![...w[0].values()].includes('minecraft:cave_air'));
});

test('Licht gegen Monster: am Ende keine dunkle Spawnstelle mehr', () => {
  const welt = new Map();
  d.insel.stufen.forEach((m) => m.forEach((v, k) => welt.set(k, v)));
  for (const [k, v] of d.kumul) if (v.startsWith('minecraft:light')) welt.set(k, v);
  assert.equal(lichter(welt).length, 0);
  assert.ok(d.lichter[0] > 0);
  assert.ok([...d.kumul.values()].every((v) => v !== 'minecraft:ice')); // kein schmelzendes Eis
});

test('mission.json: 4 Stufen ohne Datum, 10 Abschnitte, je 3 Tränke, Funktionen passen zum Datapack', () => {
  assert.equal(mission.stufen.length, 4);
  assert.equal(mission.teile, 10);
  mission.stufen.forEach((s, i) => {
    assert.equal(s.funktion, `weihnachtsinsel:stufe_${i + 1}`);
    assert.ok(f[s.teil_funktion.replace('weihnachtsinsel:', '').replace('{k}', '10')]);
    assert.equal(s.ab, undefined);
    assert.equal(s.trank.anzahl, 3);
  });
  const e = Object.fromEntries(mission.stufen[3].trank.effekte.map((x) => [x.id, x]));
  // stärker als ein verzauberter Goldener Apfel
  assert.ok(e['minecraft:regeneration'].stufe >= 1 && e['minecraft:regeneration'].sekunden > 20);
  assert.ok(e['minecraft:absorption'].stufe >= 3 && e['minecraft:absorption'].sekunden > 120);
  assert.ok(e['minecraft:resistance'].sekunden > 300 && e['minecraft:fire_resistance'].sekunden > 300);
});

test('Feier nur einmal und nur nach Stufe 4 (serverwahl ruft sie zusätzlich auf), Zurücksetzen erlaubt sie wieder', () => {
  assert.match(f.feier, /^execute unless score #stufe wi_mission matches 4 run return fail\nexecute if score #gefeiert wi_mission matches 1 run return fail\nscoreboard players set #gefeiert wi_mission 1$/m);
  assert.match(f.zuruecksetzen2, /#gefeiert wi_mission 0/);
  assert.match(f.feier_nochmal, /#gefeiert wi_mission 0\nfunction weihnachtsinsel:feier/);
});

test('Weihnachtsmann: Händlerliste mit allen Kalender-Items, Stollen und 9 Platten; Lichterkrone am teuersten', () => {
  const w = JSON.parse(readFileSync(new URL('./weihnachtsmann.json', import.meta.url)));
  assert.equal(w.ware.length, 24 + 1 + 9);
  assert.equal(w.dezemberFaktor, 0.5);
  assert.deepEqual([w.mannequin.x, w.mannequin.y, w.mannequin.z], d.weihnachtsmann.pos.map((v) => +v.toFixed(2)));
  assert.equal(Math.max(...w.ware.map((x) => x.preis)), w.ware.find((x) => x.name.includes('Krone')).preis);
  assert.ok(w.ware.every((x) => !x.item.includes('Tag ') && x.preis >= 1 && x.anzahl >= 1));
  assert.deepEqual([w.jukebox.x, w.jukebox.y, w.jukebox.z], d.jukebox);
});
