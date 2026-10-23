// Integrationstest: Dienst auf der Testwelt, Datenschutz in allen Antworten.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, rmSync, readFileSync, appendFileSync, utimesSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { erzeugeTestwelt } from './testdaten.mjs';
import { starteDienst } from './dienst.mjs';
import { dekodierePng, kodierePng } from './lib/kopf.mjs';
import { SPRACHE } from './lib/testsprache.mjs';

const hier = dirname(fileURLToPath(import.meta.url));
const echteSprache = join(hier, 'daten', 'sprache.json');
let ordner; let welt; let dienst; let basis; let web;

before(async () => {
  ordner = mkdtempSync(join(tmpdir(), 'statistik-test-'));
  welt = erzeugeTestwelt(join(ordner, 'welt'));
  web = join(ordner, 'web');
  mkdirSync(join(web, 'schrift'), { recursive: true });
  writeFileSync(join(web, 'index.html'), '<!doctype html><title>t</title>');
  writeFileSync(join(web, 'schrift', 'a.woff2'), 'x');
  writeFileSync(join(web, 'logo.svg'), '<svg/>');
  writeFileSync(join(ordner, 'geheim.txt'), 'nicht ausliefern');
  dienst = await starteDienst({
    instanz: welt.ziel, sichtbarkeit: welt.sichtbarkeit, port: 0, testmodus: true, web, cache: join(ordner, 'cache'),
    spracheObjekt: existsSync(echteSprache) ? JSON.parse(readFileSync(echteSprache, 'utf8')) : SPRACHE,
    live: { intervallMs: 100 },
  });
  basis = `http://127.0.0.1:${dienst.port}`;
});

after(async () => {
  await dienst.schliesse();
  rmSync(ordner, { recursive: true, force: true });
});

const wanda = () => welt.ausgeblendet;

test('/api/gesund und /api/daten', async () => {
  assert.equal(await (await fetch(`${basis}/api/gesund`)).text(), 'ok');
  const d = await (await fetch(`${basis}/api/daten`)).json();
  assert.equal(d.server.testmodus, true);
  assert.equal(d.gesamt.spieler, 9);
  assert.equal(d.spieler.length, 9);
  assert.ok(d.bestenlisten.length >= 15);
  assert.ok(d.fakten.length >= 5);
  assert.ok(d.tage.length >= 18);
  assert.equal(d.server.online.length, 2);
  assert.ok(d.ereignisse.some((e) => e.typ === 'tod' && /erschlagen|erschossen|Schwerkraft|Lava|ertrank/.test(e.text)), 'deutsche Todestexte');
});

test('Datenschutz: Name und UUID des ausgeblendeten Spielers kommen nirgends vor', async () => {
  const { name, uuid } = wanda();
  const antworten = [
    await (await fetch(`${basis}/api/daten`)).text(),
    await (await fetch(`${basis}/api/gesund`)).text(),
  ];
  // Live-Strom kurz mitlesen
  const ac = new AbortController();
  const r = await fetch(`${basis}/api/live`, { signal: ac.signal });
  assert.equal(r.headers.get('content-type').startsWith('text/event-stream'), true);
  const leser = r.body.getReader();
  let strom = '';
  const ende = Date.now() + 600;
  try {
    while (Date.now() < ende) {
      const { value, done } = await Promise.race([leser.read(), new Promise((ok) => setTimeout(() => ok({ done: true }), 300))]);
      if (value) strom += Buffer.from(value).toString('utf8');
      if (done) break;
    }
  } finally { ac.abort(); }
  antworten.push(strom);
  assert.ok(strom.includes('event: online'));
  // Kopf des ausgeblendeten Spielers: 404; Kopf eines sichtbaren: PNG
  const k1 = await fetch(`${basis}/api/kopf/${uuid}.png`);
  assert.equal(k1.status, 404);
  antworten.push(await k1.text());
  const sichtbarer = welt.spieler.find((p) => p !== wanda());
  const k2 = await fetch(`${basis}/api/kopf/${sichtbarer.uuid}.png`);
  assert.equal(k2.status, 200);
  assert.equal(dekodierePng(Buffer.from(await k2.arrayBuffer())).b, 64);
  for (const a of antworten) {
    assert.ok(!a.includes(name), `Name in Antwort: ${a.slice(0, 80)}`);
    assert.ok(!a.toLowerCase().includes(uuid.toLowerCase()));
    assert.ok(!a.toLowerCase().includes(uuid.replaceAll('-', '').toLowerCase()));
  }
});

test('Mörder-Ereignis mit ausgeblendetem Spieler wird verworfen (Quelle enthält es)', async () => {
  const latest = readFileSync(join(welt.ziel, 'logs', 'latest.log'), 'utf8');
  assert.ok(existsSync(join(welt.ziel, 'logs', '2026-12-16-1.log.gz')));
  assert.ok(latest.length > 0);
  const d = await (await fetch(`${basis}/api/daten`)).json();
  assert.ok(!d.ereignisse.some((e) => e.text.includes('Wichtel')));
  assert.ok(!d.spieler.some((s) => s.uuid === wanda().uuid));
});

test('Live: neue Zeilen kommen als Ereignis, ausgeblendeter Spieler nicht', async () => {
  const ac = new AbortController();
  const r = await fetch(`${basis}/api/live`, { signal: ac.signal });
  const leser = r.body.getReader();
  let strom = '';
  const lies = async (ms) => {
    const ende = Date.now() + ms;
    while (Date.now() < ende) {
      const { value } = await Promise.race([leser.read(), new Promise((ok) => setTimeout(() => ok({}), 200))]);
      if (value) strom += Buffer.from(value).toString('utf8');
    }
  };
  const sichtbarer = welt.spieler.find((p) => p.name === 'Rentier_Rudi');
  const log = join(welt.ziel, 'logs', 'latest.log');
  appendFileSync(log, `[21:50:00 INFO]: ${sichtbarer.name} was slain by Zombie\n[21:51:00 INFO]: ${sichtbarer.name} was slain by ${wanda().name}\n[21:52:00 INFO]: ${wanda().name} joined the game\n`);
  utimesSync(log, new Date(welt.jetzt + 300000), new Date(welt.jetzt + 300000));
  await lies(1800);
  ac.abort();
  assert.ok(strom.includes('event: ereignis'), strom);
  assert.ok(strom.includes('Rentier_Rudi wurde von Zombie erschlagen') || strom.includes('Zombie'), strom);
  assert.ok(!strom.includes(wanda().name));
});

test('Statische Dateien: Content-Types, kein Pfad-Traversal, kein Listing', async () => {
  assert.equal((await fetch(`${basis}/`)).headers.get('content-type'), 'text/html; charset=utf-8');
  assert.equal((await fetch(`${basis}/schrift/a.woff2`)).headers.get('content-type'), 'font/woff2');
  assert.equal((await fetch(`${basis}/logo.svg`)).headers.get('content-type'), 'image/svg+xml');
  assert.equal((await fetch(`${basis}/schrift/`)).status, 404, 'kein Verzeichnislisting');
  for (const p of ['/../geheim.txt', '/%2e%2e/geheim.txt', '/..%2fgeheim.txt', '/schrift/..%5c..%5cgeheim.txt', '/%00']) {
    const res = await fetch(`${basis}${p}`);
    assert.equal(res.status, 404, p);
    assert.ok(!(await res.text()).includes('nicht ausliefern'));
  }
  // rohe Anfrage mit „..“, die der Client nicht normalisiert
  const roh = await new Promise((ok) => {
    import('node:net').then(({ createConnection }) => {
      const s = createConnection(dienst.port, '127.0.0.1', () => s.write('GET /../geheim.txt HTTP/1.0\r\n\r\n'));
      let t = ''; s.on('data', (c) => { t += c; }); s.on('close', () => ok(t));
    });
  });
  assert.ok(roh.startsWith('HTTP/1.1 404') && !roh.includes('nicht ausliefern'));
  assert.equal((await fetch(`${basis}/api/unbekannt`)).status, 404);
});

test('Kopf-Endpunkt (Echtbetrieb) schneidet Gesicht aus Test-Skin und legt Cache an', async () => {
  const skin = Buffer.alloc(64 * 64 * 4);
  for (let y = 8; y < 16; y++) for (let x = 8; x < 16; x++) skin.set([10, 200, 10, 255], (y * 64 + x) * 4);
  const png = kodierePng(skin, 64, 64);
  let aufrufe = 0;
  const d2 = await starteDienst({
    instanz: welt.ziel, sichtbarkeit: welt.sichtbarkeit, port: 0, web, cache: join(ordner, 'cache2'),
    spracheObjekt: SPRACHE, holeSkin: async () => { aufrufe++; return png; },
  });
  try {
    const u = welt.spieler.find((p) => !p.ausgeblendet).uuid;
    for (let i = 0; i < 2; i++) {
      const r = await fetch(`http://127.0.0.1:${d2.port}/api/kopf/${u}.png`);
      const k = dekodierePng(Buffer.from(await r.arrayBuffer()));
      assert.deepEqual([...k.rgba.subarray(0, 3)], [10, 200, 10]);
    }
    assert.equal(aufrufe, 1, 'Skin wird zwischengespeichert');
    assert.equal((await fetch(`http://127.0.0.1:${d2.port}/api/kopf/${wanda().uuid}.png`)).status, 404);
  } finally { await d2.schliesse(); }
});
