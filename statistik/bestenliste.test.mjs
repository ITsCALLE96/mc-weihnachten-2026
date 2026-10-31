// Bestenlisten für Discord und Hub: Inhalt, Datenschutz, Webhook anlegen/bearbeiten, Geheimnis bleibt geheim.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { erzeugeTestwelt } from './testdaten.mjs';
import { lauf, sendeWebhook } from './bestenliste.mjs';
import { ANZEIGE_LISTEN, discordNachricht } from './lib/anzeige.mjs';

const hier = dirname(fileURLToPath(import.meta.url));
const URL_ = 'https://discord.com/api/webhooks/123456789/geheim-TOKEN_x';
let ordner; let welt; let opt;

before(() => {
  ordner = mkdtempSync(join(tmpdir(), 'statistik-bestenliste-'));
  welt = erzeugeTestwelt(join(ordner, 'welt'));
  writeFileSync(join(ordner, 'webhook'), `${URL_}\n`);
  opt = {
    instanz: welt.ziel, sichtbarkeit: welt.sichtbarkeit, sprache: join(hier, 'daten', 'sprache.json'),
    webhookDatei: join(ordner, 'webhook'), zustand: join(ordner, 'zustand.json'), ausgabe: join(ordner, 'hub.json'),
  };
});
after(() => rmSync(ordner, { recursive: true, force: true }));

// Discord-Attrappe: merkt Aufrufe, POST liefert eine ID
function attrappe(antworten = {}) {
  const aufrufe = [];
  const holen = async (url, init) => {
    aufrufe.push({ url, methode: init.method, body: JSON.parse(init.body) });
    const status = antworten[init.method] ?? 200;
    return { ok: status < 300, status, json: async () => ({ id: '999' }) };
  };
  return { aufrufe, holen };
}

test('8 Hub-Listen in fester Reihenfolge, Diamantenjäger nur im Discord', () => {
  assert.deepEqual(ANZEIGE_LISTEN.filter((l) => l.hub).map((l) => l.id),
    ['spielzeit', 'spenden', 'abgebaut', 'mobs', 'strecke', 'tode', 'fortschritte', 'handel']);
  assert.deepEqual(ANZEIGE_LISTEN.filter((l) => !l.hub).map((l) => l.id), ['diamanten']);
});

test('erster Lauf legt die Nachricht an, zweiter bearbeitet sie; Ausgeblendete fehlen überall', async () => {
  const a = attrappe();
  const b = await lauf(opt, { holen: a.holen, log: () => {} });
  await lauf(opt, { holen: a.holen, log: () => {} });
  assert.deepEqual(a.aufrufe.map((x) => x.methode), ['POST', 'PATCH']);
  assert.equal(a.aufrufe[0].url, 'https://discord.com/api/webhooks/123456789/geheim-TOKEN_x?wait=true');
  assert.equal(a.aufrufe[1].url, 'https://discord.com/api/webhooks/123456789/geheim-TOKEN_x/messages/999');
  assert.deepEqual(JSON.parse(readFileSync(opt.zustand, 'utf8')), { nachricht: '999' });
  assert.ok(b.listen.every((l) => l.plaetze.length <= 5));
  assert.ok(b.listen.find((l) => l.id === 'spielzeit').plaetze.length === 5);
  const hub = readFileSync(opt.ausgabe, 'utf8');
  for (const text of [hub, JSON.stringify(a.aufrufe)]) {
    assert.ok(!text.includes(welt.ausgeblendet.name), 'Name des Ausgeblendeten');
    assert.ok(!text.includes(welt.ausgeblendet.uuid), 'UUID des Ausgeblendeten');
  }
  assert.ok(!hub.includes('geheim'), 'Webhook-URL nicht in der Hub-Datei');
  assert.equal(JSON.parse(hub).season, 'weihnachten-2026');
  assert.deepEqual(a.aufrufe[0].body.allowed_mentions, { parse: [] });
});

test('gelöschte Nachricht (404) wird neu angelegt, andere Fehler brechen ab', async () => {
  const a = attrappe({ PATCH: 404 });
  assert.deepEqual(await sendeWebhook(URL_, {}, { nachricht: '1' }, a.holen), { nachricht: '999' });
  assert.deepEqual(a.aufrufe.map((x) => x.methode), ['PATCH', 'POST']);
  await assert.rejects(sendeWebhook(URL_, {}, { nachricht: '1' }, attrappe({ PATCH: 429 }).holen), (e) => !e.message.includes('geheim'));
});

test('--probe sendet nichts und schreibt keinen Zustand', async () => {
  const a = attrappe();
  const z = join(ordner, 'probe-zustand.json');
  let ausgabe = '';
  await lauf({ ...opt, zustand: z, probe: true }, { holen: a.holen, log: (t) => { ausgabe += t; } });
  assert.equal(a.aufrufe.length, 0);
  assert.ok(!existsSync(z));
  assert.ok(ausgabe.includes('Bestenliste'));
});

test('ohne Sichtbarkeitsliste ist niemand sichtbar, falsche Webhook-Datei bricht ab', async () => {
  const leer = await lauf({ ...opt, sichtbarkeit: join(ordner, 'fehlt.json'), webhookDatei: undefined, ausgabe: undefined }, { log: () => {} });
  assert.ok(leer.listen.every((l) => l.plaetze.length === 0));
  writeFileSync(join(ordner, 'falsch'), 'https://example.com/hook');
  await assert.rejects(lauf({ ...opt, webhookDatei: join(ordner, 'falsch') }, { holen: attrappe().holen, log: () => {} }), /keine Discord-Webhook-URL/);
});

test('Discord-Text: Markdown in Namen entschärft, leere Liste lesbar', () => {
  const n = discordNachricht({ seasonName: 'Generalprobe', stand: '2026-10-31T12:00:00+01:00', listen: [
    { titel: 'Dauerzocker', unter: 'Spielzeit', symbol: '⏱️', plaetze: [{ name: 'Rentier_Rudi', text: '3 Std. 0 Min.' }] },
    { titel: 'Pechvogel', unter: 'Tode', symbol: '💀', plaetze: [] },
  ] });
  assert.match(n.embeds[0].fields[0].value, /Rentier\\_Rudi/);
  assert.match(n.embeds[0].fields[1].value, /noch niemand/);
  assert.equal(n.embeds[0].title, 'Bestenliste – Generalprobe');
});
