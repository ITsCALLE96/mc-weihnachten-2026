// Bestenlisten für Discord und Hub: Inhalt, Datenschutz, Webhook anlegen/bearbeiten, Geheimnis bleibt geheim.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { erzeugeTestwelt } from './testdaten.mjs';
import { steveGesicht } from './lib/kopf.mjs';
import { lauf, dauerlauf, sendeWebhook, leseWebhook } from './bestenliste.mjs';
import { ANZEIGE_LISTEN, baueBestenlisten, discordNachricht } from './lib/anzeige.mjs';

const hier = dirname(fileURLToPath(import.meta.url));
const URL_ = 'https://discord.com/api/webhooks/123456789/geheim-TOKEN_x';
let ordner; let welt; let opt;
// Köpfe ohne Netz (Mojang wird in Tests nie gefragt)
const STEVE = { gesicht: async () => steveGesicht() };

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
    const form = init.body instanceof FormData;
    const bild = form ? init.body.get('files[0]') : null;
    aufrufe.push({ url, methode: init.method, body: JSON.parse(form ? init.body.get('payload_json') : init.body), bild: bild && { name: bild.name, typ: bild.type, groesse: bild.size } });
    const status = antworten[init.method] ?? 200;
    return { ok: status < 300, status, json: async () => ({ id: '999' }) };
  };
  return { aufrufe, holen };
}

test('8 Listen in fester Reihenfolge, alle im Hub und im Discord', () => {
  assert.deepEqual(ANZEIGE_LISTEN.map((l) => l.id),
    ['spielzeit', 'spenden', 'abgebaut', 'mobs', 'strecke', 'tode', 'fortschritte', 'diamanten']);
  assert.ok(ANZEIGE_LISTEN.every((l) => l.hub));
});

test('Weltenbummler zählt alle Fortbewegungsarten außer Fallen', () => {
  const s = { spieler: [{ name: 'Rudi', werte: {
    'custom:walk_one_cm': 100, 'custom:sprint_one_cm': 100, 'custom:crouch_one_cm': 100, 'custom:swim_one_cm': 100,
    'custom:walk_under_water_one_cm': 100, 'custom:walk_on_water_one_cm': 100, 'custom:boat_one_cm': 100,
    'custom:aviate_one_cm': 100, 'custom:horse_one_cm': 100, 'custom:minecart_one_cm': 100, 'custom:pig_one_cm': 100,
    'custom:strider_one_cm': 100, 'custom:climb_one_cm': 100, 'custom:fly_one_cm': 100, 'custom:happy_ghast_one_cm': 100,
    'custom:fall_one_cm': 99999, 'custom:jump': 5,
  } }], server: { season: 's', seasonName: 'S', stand: '2026-10-31T12:00:00+01:00' } };
  assert.equal(baueBestenlisten(s).listen.find((l) => l.id === 'strecke').plaetze[0].wert, 1500);
});

test('erster Lauf legt die Nachricht an, zweiter bearbeitet sie; Ausgeblendete fehlen überall', async () => {
  const a = attrappe();
  const b = await lauf(opt, { holen: a.holen, kopfQuelle: STEVE, log: () => {} });
  await lauf(opt, { holen: a.holen, kopfQuelle: STEVE, log: () => {} });
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
  assert.deepEqual(a.aufrufe.map((x) => [x.bild.name, x.bild.typ]), [['bestenliste.png', 'image/png'], ['bestenliste.png', 'image/png']]);
  assert.ok(a.aufrufe[0].bild.groesse > 10_000);
  assert.ok(!hub.includes('uuid') && !hub.includes('einheit'), 'Hub-Datei ohne UUID');
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
  await lauf({ ...opt, zustand: z, probe: true }, { holen: a.holen, kopfQuelle: STEVE, log: (t) => { ausgabe += t; } });
  assert.equal(a.aufrufe.length, 0);
  assert.ok(!existsSync(z));
  assert.ok(ausgabe.includes('Bestenliste'));
});

test('ohne Sichtbarkeitsliste ist niemand sichtbar, falsche Webhook-Datei bricht ab', async () => {
  const leer = await lauf({ ...opt, sichtbarkeit: join(ordner, 'fehlt.json'), webhookDatei: undefined, ausgabe: undefined }, { kopfQuelle: STEVE, log: () => {} });
  assert.ok(leer.listen.every((l) => l.plaetze.length === 0));
  writeFileSync(join(ordner, 'falsch'), 'https://example.com/hook');
  await assert.rejects(lauf({ ...opt, webhookDatei: join(ordner, 'falsch') }, { holen: attrappe().holen, kopfQuelle: STEVE, log: () => {} }), /keine Discord-Webhook-URL/);
});

test('Discord-Nachricht: Text mit Season und Stand, keine Embeds, ein Bild als Anhang', () => {
  const n = discordNachricht({ seasonName: 'Generalprobe', stand: '2026-10-31T12:00:00+01:00', listen: [] });
  assert.match(n.content, /Bestenliste – Generalprobe\*\* · Stand 31\.10\., 12:00 Uhr/);
  assert.deepEqual(n.embeds, []);
  assert.deepEqual(n.attachments, [{ id: 0, filename: 'bestenliste.png' }]);
  assert.deepEqual(n.allowed_mentions, { parse: [] });
});

test('Dauerlauf: Hub-Datei und Discord nur bei Änderung, Discord höchstens einmal je Abstand, Webhook darf erst später kommen', async () => {
  const a = attrappe();
  const zustand = join(ordner, 'dauer-zustand.json');
  const ausgabe = join(ordner, 'dauer-hub.json');
  const webhook = join(ordner, 'dauer-webhook');
  let uhr = 0;
  const schritte = [];
  const o = { ...opt, zustand, ausgabe, webhookDatei: webhook, alle: 15, discordAbstand: 60 };
  // Runde 1: ohne Webhook-Datei nur Hub; danach Webhook da → Runde 2 sendet; Runde 3 ohne Änderung nichts
  await dauerlauf(o, {
    holen: a.holen, kopfQuelle: STEVE, log: () => {}, runden: 3, jetzt: () => uhr,
    schlafen: async (ms) => { uhr += ms; schritte.push(ms); if (schritte.length === 1) writeFileSync(webhook, `${URL_}\n`); },
  });
  assert.deepEqual(schritte, [15000, 15000]);
  assert.deepEqual(a.aufrufe.map((x) => x.methode), ['POST']);
  const vorher = statSync(ausgabe).mtimeMs;
  // Änderung: ein Spieler stirbt (Live-Datei) → neue Hub-Datei, Discord aber erst nach 60 s
  const live = join(opt.instanz, 'plugins', 'Serverwahl', 'live');
  mkdirSync(live, { recursive: true });
  const p = welt.spieler.find((s) => s.name === 'Rentier_Rudi');
  writeFileSync(join(live, `${p.uuid}.json`), JSON.stringify({ uuid: p.uuid, zeit: Date.now(), werte: { 'custom:deaths': 9999 } }));
  const b = attrappe();
  uhr = 30_000;
  const logs = [];
  await dauerlauf(o, { holen: b.holen, kopfQuelle: STEVE, log: (t) => logs.push(t), runden: 1, jetzt: () => uhr, schlafen: async () => {} });
  assert.ok(statSync(ausgabe).mtimeMs >= vorher);
  assert.match(readFileSync(ausgabe, 'utf8'), /9\.999|9999/);
  // neuer Prozess hat noch nicht gesendet → PATCH auf die gemerkte Nachricht
  assert.deepEqual(b.aufrufe.map((x) => x.methode), ['PATCH']);
  rmSync(live, { recursive: true });
  assert.ok(!JSON.stringify(logs).includes('geheim'));
});

test('Dauerlauf: Discord-Fehler bricht nicht ab und nennt die URL nicht', async () => {
  const logs = [];
  await dauerlauf({ ...opt, zustand: join(ordner, 'f-zustand.json'), alle: 1, discordAbstand: 0 },
    { holen: attrappe({ POST: 500 }).holen, kopfQuelle: STEVE, log: (t) => logs.push(t), runden: 2, schlafen: async () => {} });
  assert.ok(logs.some((t) => t.includes('Discord antwortet 500')));
  assert.ok(!logs.join().includes('geheim'));
});

test('Webhook-Datei: PTB/Canary/discordapp werden auf discord.com umgestellt, anderes abgelehnt', () => {
  const d = join(ordner, 'wh-test');
  const lies = (text) => { writeFileSync(d, text); return leseWebhook(d); };
  for (const host of ['discord.com', 'ptb.discord.com', 'canary.discord.com', 'discordapp.com', 'ptb.discordapp.com']) {
    assert.equal(lies(`https://${host}/api/webhooks/123456789/geheim-TOKEN_x\r\n`), URL_);
  }
  for (const falsch of ['https://evil.com/api/webhooks/1/x', 'https://ptb.discord.com.evil.com/api/webhooks/1/x', 'http://discord.com/api/webhooks/1/x', 'https://xptb.discord.com/api/webhooks/1/x']) {
    assert.throws(() => lies(falsch), (e) => /keine Discord-Webhook-URL/.test(e.message) && !e.message.includes('webhooks'));
  }
});

test('Dauerlauf: kaputte Webhook-Datei wird ohne URL gemeldet, Hub-Datei läuft weiter, Dienst endet nicht', async () => {
  const webhook = join(ordner, 'kaputt-webhook');
  writeFileSync(webhook, 'https://example.com/api/webhooks/1/geheim-x\n');
  const ausgabe = join(ordner, 'kaputt-hub.json');
  const logs = [];
  const a = attrappe();
  await dauerlauf({ ...opt, webhookDatei: webhook, ausgabe, zustand: join(ordner, 'k-zustand.json'), alle: 1, discordAbstand: 0 },
    { holen: a.holen, kopfQuelle: STEVE, log: (t) => logs.push(t), runden: 3, schlafen: async () => {} });
  assert.equal(a.aufrufe.length, 0);
  assert.ok(existsSync(ausgabe));
  assert.deepEqual(logs, ['Fehler: Webhook-Datei enthält keine Discord-Webhook-URL'], 'einmal gemeldet, nicht jede Runde');
  // PTB-Link wirkt ohne Neustart und sendet an discord.com
  writeFileSync(webhook, 'https://ptb.discord.com/api/webhooks/123456789/geheim-TOKEN_x\n');
  await dauerlauf({ ...opt, webhookDatei: webhook, ausgabe, zustand: join(ordner, 'k-zustand.json'), alle: 1, discordAbstand: 0 },
    { holen: a.holen, kopfQuelle: STEVE, log: (t) => logs.push(t), runden: 1, schlafen: async () => {} });
  assert.equal(a.aufrufe[0].url, `${URL_}?wait=true`);
  assert.ok(!logs.join().includes('geheim'));
});
