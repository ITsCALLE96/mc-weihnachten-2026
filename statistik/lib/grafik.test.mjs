// Discord-Grafik: Kurzwerte, Kürzen langer Namen, Datenschutz, echtes PNG; Kopf-Zwischenspeicher mit Ersatz-Steve.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { kurzwert, textBreite, bestenlistenSvg, bestenlistenGrafik } from './grafik.mjs';
import { KopfCache, steveGesicht, kodierePng, dekodierePng } from './kopf.mjs';
import { baueBestenlisten } from './anzeige.mjs';
import { erzeugeTestwelt } from '../testdaten.mjs';
import { Instanz } from './quellen.mjs';
import { Sichtbarkeit } from './sichtbarkeit.mjs';
import { SPRACHE } from './testsprache.mjs';

let ordner; let b; let welt;
before(async () => {
  ordner = mkdtempSync(join(tmpdir(), 'statistik-grafik-'));
  welt = erzeugeTestwelt(join(ordner, 'welt'));
  b = baueBestenlisten(await new Instanz({ instanz: welt.ziel, sichtbarkeit: new Sichtbarkeit(welt.sichtbarkeit), sprache: SPRACHE }).daten());
});
after(() => rmSync(ordner, { recursive: true, force: true }));

test('Kurzwerte ohne Umbruch: Zeit als h:mm, Strecke, Anzahl mit Punkt', () => {
  assert.equal(kurzwert('zeit', 20 * 60 * (4 * 60 + 4)), '4:04 h');
  assert.equal(kurzwert('zeit', 20 * 60 * 42), '42 min');
  assert.equal(kurzwert('strecke', 12_300_000), '123,0 km');
  assert.equal(kurzwert('anzahl', 186621), '186.621');
});

test('Schriftbreite wird aus der Schrift gemessen', () => {
  assert.ok(textBreite('WWWW', 30, 700) > textBreite('iiii', 30, 700) * 2);
  assert.ok(Math.abs(textBreite('Rentier_Rudi', 30) - 2 * textBreite('Rentier_Rudi', 15)) < 0.01);
});

test('SVG: lange Namen gekürzt, leere Liste lesbar, Ausgeblendete und UUIDs fehlen', () => {
  const kopie = structuredClone(b);
  kopie.listen[0].plaetze[0].name = 'Xx_SehrLangerName';
  kopie.listen[1].plaetze = [];
  const svg = bestenlistenSvg(kopie, { einheiten: Object.fromEntries(b.listen.map((l) => [l.id, l.einheit])) });
  assert.match(svg, /Xx_SehrLange[^<]*…/);
  assert.match(svg, /noch niemand/);
  assert.ok(!svg.includes(welt.ausgeblendet.name));
  for (const l of b.listen) for (const p of l.plaetze) assert.ok(!svg.includes(p.uuid));
  assert.ok(!/\d+ Std\.|undefined|NaN/.test(svg));
});

test('PNG: 1080 px breit, hoch statt breit, verkleinerte Vorschau 400 px', async () => {
  const { png, klein } = await bestenlistenGrafik(b, { gesicht: async () => steveGesicht() }, { vorschauBreite: 400 });
  const d = dekodierePng(png);
  assert.equal(d.b, 1080);
  assert.ok(d.h > d.b);
  assert.equal(dekodierePng(klein).b, 400);
});

test('KopfCache: holt einmal, merkt im Ordner, Fehler → Steve und kein neuer Versuch innerhalb einer Stunde', async () => {
  const u = '90e3cb68-f696-4418-a56f-d6482902c9e3';
  const skin = Buffer.alloc(64 * 64 * 4);
  for (let i = 0; i < 64 * 64; i++) skin.set([10, 200, 30, 255], i * 4);
  let aufrufe = 0;
  let uhr = 0;
  const k = new KopfCache(join(ordner, 'koepfe'), { holeSkin: async () => { aufrufe++; return kodierePng(skin, 64, 64); }, jetzt: () => uhr });
  const g = await k.gesicht(u);
  assert.deepEqual([...g.subarray(0, 4)], [10, 200, 30, 255]);
  assert.ok(existsSync(join(ordner, 'koepfe', `${u}.png`)));
  const k2 = new KopfCache(join(ordner, 'koepfe'), { holeSkin: async () => { aufrufe++; throw new Error('aus'); }, jetzt: () => Date.now() });
  assert.deepEqual([...(await k2.gesicht(u)).subarray(0, 4)], [10, 200, 30, 255], 'aus dem Ordner');
  assert.equal(aufrufe, 1);
  let fehler = 0;
  const k3 = new KopfCache(join(ordner, 'leer'), { holeSkin: async () => { fehler++; throw new Error('Mojang 404'); }, jetzt: () => uhr });
  assert.ok((await k3.gesicht(u)).equals(steveGesicht()));
  await k3.gesicht(u);
  assert.equal(fehler, 1);
  uhr += 3600_001;
  await k3.gesicht(u);
  assert.equal(fehler, 2);
});
