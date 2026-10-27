import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { kalender } from './insel-kalender.mjs';

const k = JSON.parse(readFileSync(new URL('./standort-smp-spark.json', import.meta.url)));
const { funktionen: f } = kalender(k.kalender);

test('Winterkalender: 24 Türchen mit Zahl und Klickfeld, alles Entities mit Tag insel_kalender', () => {
  assert.equal(new Set(k.kalender.reihenfolge).size, 24);
  const an = f['kalender/an2'];
  for (let n = 1; n <= 24; n++) { assert.ok(an.includes(`"insel_kal_n_${n}"`)); assert.ok(an.includes(`"insel_kal_${n}"]`)); }
  assert.ok(an.split('\n').filter((z) => z.startsWith('summon')).every((z) => z.includes('"insel_kalender"')));
  assert.match(an, /^kill @e\[tag=insel_kalender\]$/m);
  assert.match(f['kalender/aus2'], /^kill @e\[tag=insel_kalender\]$/m);
  assert.match(f.kalender_an, /^forceload add /m);
});

test('Türchen: erst ab Tag X, je Spieler einmal (auch nachträglich), Belohnung per give', () => {
  const t = f['kalender/tuer_5'];
  assert.match(t, /^execute unless score #tag insel_kalender matches 5\.\. run return run tellraw/m);
  assert.match(t, /^execute if entity @s\[tag=insel_kal_hat_5\] run return run tellraw/m);
  assert.match(t, /^tag @s add insel_kal_hat_5$/m);
  assert.match(t, /^give @s minecraft:/m);
  assert.match(f['kalender/klick'], /^execute if entity @s\[tag=insel_kal_5\] on target at @s run function insel:kalender\/tuer_5$/m);
});

test('Tag: täglich +1 bis 24, Test-Befehl setzt direkt, Zahlen werden eingefärbt', () => {
  assert.match(f['kalender/naechster_tag'], /matches 25\.\. run scoreboard players set #tag insel_kalender 24/);
  assert.match(f['kalender/tag'], /^\$scoreboard players set #tag insel_kalender \$\(tag\)$/m);
  assert.match(f['kalender/anzeigen'], /matches 24\.\. run data merge entity @e\[type=text_display,tag=insel_kal_n_24,limit=1\]/);
  assert.match(f['kalender/tick'], /if data entity @s interaction run function insel:kalender\/klick/);
});

test('Tageswechsel durch serverwahl: Ankündigung nur bei neuem Tag, Merker #zuletzt', () => {
  assert.match(f['kalender/tick'], /unless score #tag insel_kalender = #zuletzt insel_kalender run function insel:kalender\/neuer_tag/);
  assert.match(f['kalender/neuer_tag'], /if score #tag insel_kalender > #zuletzt insel_kalender if score #tag insel_kalender matches 1\.\.24 run tellraw @a/);
  assert.match(f['kalender/load'], /#zuletzt insel_kalender = #tag insel_kalender/);
});

test('Belohnungen mit Gebrauchshinweis in der Lore (Übersetzungsschlüssel, deutscher fallback, grau kursiv)', () => {
  assert.ok(f['kalender/tuer_4'].includes('color:"aqua"},{translate:"item.weihnachten.kalender.hinweis.kopf",fallback:"Aufsetzen: in den Helm-Platz ziehen",color:"gray",italic:true}'));
  assert.ok(f['kalender/tuer_3'].includes('hinweis.deko2'));
  assert.ok(f['kalender/tuer_24'].includes('hinweis.andenken'));
  for (let n = 1; n <= 24; n++) assert.match(f[`kalender/tuer_${n}`], /kalender\.hinweis\./, `Türchen ${n}`);
});
