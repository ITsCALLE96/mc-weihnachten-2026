// Bestenlisten nach außen geben: Discord-Nachricht per Webhook bearbeiten und/oder JSON für die Hub-Text-Displays schreiben.
// Läuft auf VM200 als dauerhafter Dienst (betrieb/compose.yml, --alle 15): Hub-Datei nur bei Änderung neu,
// Discord-Nachricht nur bei Änderung und höchstens einmal je --discord-abstand Sekunden (Standard 60).
//
// Aufruf: node statistik/bestenliste.mjs --instanz <smp> --archiv <archiv> --sichtbarkeit <datei> --sprache <datei>
//          [--webhook-datei <datei mit URL>] [--zustand <datei>] [--ausgabe <hub.json>] [--probe] [--bilder <ordner>] [--koepfe <ordner>]
//          [--alle <sek>] [--discord-abstand <sek>]
// Discord bekommt kurzen Text und je Liste ein Bild als Embed (lib/grafik.mjs); Köpfe von Mojang, zwischengespeichert in <zustand-ordner>/koepfe.
// Ohne --alle ein einzelner Lauf. --probe gibt die Discord-Nutzlast nur aus und sendet nichts.
// Im Dauerlauf darf die Webhook-Datei fehlen (dann nur Hub-Datei); sie wird bei jeder Runde neu gesucht. Die Webhook-URL ist ein Geheimnis (Datei mit Rechten 600),
// sie wird nie ausgegeben. Im Zustand steht nur die ID der Nachricht, die bearbeitet wird.
import { readFileSync, writeFileSync, renameSync, existsSync, mkdirSync } from 'node:fs';
import { setTimeout as warte } from 'node:timers/promises';
import { resolve, join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { Instanz } from './lib/quellen.mjs';
import { Sichtbarkeit } from './lib/sichtbarkeit.mjs';
import { baueBestenlisten, discordNachricht, hubDatei } from './lib/anzeige.mjs';
import { bestenlistenBilder } from './lib/grafik.mjs';
import { KopfCache } from './lib/kopf.mjs';

const schreibeAtomar = (pfad, inhalt) => { writeFileSync(`${pfad}.tmp`, inhalt); renameSync(`${pfad}.tmp`, pfad); };
const alsJson = (wert) => `${JSON.stringify(wert, null, 2)}\n`;

// Webhook-Nachricht anlegen oder bearbeiten. zustand = { nachricht: "<id>" }. Gibt den neuen Zustand zurück.
// bilder ([{ datei, png }]): als Anhänge mitschicken (multipart, ersetzen beim Bearbeiten die alten Anhänge).
export async function sendeWebhook(url, nutzlast, zustand = {}, holen = fetch, bilder = []) {
  const basis = url.replace(/\?.*$/, '');
  const koerper = () => {
    if (!bilder.length) return { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(nutzlast) };
    const form = new FormData();
    form.append('payload_json', JSON.stringify(nutzlast));
    bilder.forEach((b, i) => form.append(`files[${i}]`, new Blob([b.png], { type: 'image/png' }), b.datei));
    return { body: form };
  };
  const senden = (methode, pfad) => holen(`${basis}${pfad}`, { method: methode, ...koerper(), signal: AbortSignal.timeout(30000) });
  if (zustand.nachricht) {
    const r = await senden('PATCH', `/messages/${zustand.nachricht}`);
    if (r.ok) return zustand;
    // Nachricht gelöscht oder Webhook neu: neu anlegen. Andere Fehler (z. B. Rate-Limit) nicht überspielen.
    if (r.status !== 404) throw new Error(`Discord antwortet ${r.status} beim Bearbeiten`);
  }
  const r = await senden('POST', '?wait=true');
  if (!r.ok) throw new Error(`Discord antwortet ${r.status} beim Anlegen`);
  const { id } = await r.json();
  return { nachricht: id };
}

function erzeugeInstanz(opt, extra = {}) {
  const sichtbarkeit = new Sichtbarkeit(opt.sichtbarkeit);
  const sprache = opt.sprache ? JSON.parse(readFileSync(opt.sprache, 'utf8')) : { de: {}, en: {} };
  return new Instanz({ instanz: opt.instanz, archiv: opt.archiv ?? null, sichtbarkeit, sprache, optionen: { name: opt.name }, ...extra });
}

// Auch Links aus Discord PTB/Canary (ptb./canary.discord.com) und discordapp.com; gesendet wird immer an discord.com
const WEBHOOK = /^https:\/\/(?:(?:ptb|canary)\.)?discord(?:app)?\.com(\/api\/webhooks\/\d+\/[\w-]+)$/;
export function leseWebhook(datei) {
  const m = WEBHOOK.exec(readFileSync(datei, 'utf8').trim());
  if (!m) throw new Error('Webhook-Datei enthält keine Discord-Webhook-URL');
  return `https://discord.com${m[1]}`;
}
const leseZustand = (datei) => (datei && existsSync(datei) ? JSON.parse(readFileSync(datei, 'utf8')) : {});

// Köpfe: Zwischenspeicher neben dem Discord-Zustand (bzw. --koepfe), sonst im Temp-Ordner
const kopfOrdner = (opt) => opt.koepfe ?? (opt.zustand ? join(dirname(opt.zustand), 'koepfe') : join(tmpdir(), 'mc-statistik-koepfe'));

// Discord-Nachricht mit Grafik senden, gibt den neuen Zustand zurück
async function sendeDiscord(opt, b, kopfQuelle, holen) {
  const bilder = await bestenlistenBilder(b, kopfQuelle);
  const alt = leseZustand(opt.zustand);
  const neu = await sendeWebhook(leseWebhook(opt.webhookDatei), discordNachricht(b, bilder.map((x) => x.datei)), alt, holen, bilder);
  if (opt.zustand && neu.nachricht !== alt.nachricht) schreibeAtomar(opt.zustand, `${JSON.stringify(neu)}\n`);
  return { alt, neu };
}

// Ein einzelner Lauf: Hub-Datei schreiben, Discord-Nachricht anlegen/bearbeiten.
// --probe sendet nichts; mit --bilder <ordner> werden die Bilder als PNG gespeichert.
export async function lauf(opt, { holen = fetch, log = console.log, kopfQuelle = new KopfCache(kopfOrdner(opt)) } = {}) {
  const b = baueBestenlisten(await erzeugeInstanz(opt).daten({ ansicht: 'season' }));
  if (opt.ausgabe) schreibeAtomar(opt.ausgabe, alsJson(hubDatei(b)));
  if (opt.bilder) {
    mkdirSync(opt.bilder, { recursive: true });
    for (const x of await bestenlistenBilder(b, kopfQuelle)) schreibeAtomar(join(opt.bilder, x.datei), x.png);
  }
  if (opt.probe) { log(JSON.stringify(discordNachricht(b), null, 2)); return b; }
  if (opt.webhookDatei) {
    const { alt, neu } = await sendeDiscord(opt, b, kopfQuelle, holen);
    log(`${b.stand} [${b.season}]: Discord-Nachricht ${neu.nachricht === alt.nachricht ? 'aktualisiert' : `angelegt (${neu.nachricht})`}`);
  }
  return b;
}

// Inhalt ohne Zeitstempel: ändert sich nur, wenn sich an den Listen etwas ändert
const inhalt = (b) => JSON.stringify([b.season, b.seasonName, b.listen]);

// Dauerlauf: alle opt.alle Sekunden auswerten. Hub-Datei nur bei Änderung (der Hub prüft die Änderungszeit),
// Discord nur bei Änderung und frühestens opt.discordAbstand Sekunden nach dem letzten Senden. Fehler werden
// gemeldet und in der nächsten Runde erneut versucht. runden/jetzt/schlafen/kopfQuelle sind für Tests.
export async function dauerlauf(opt, { holen = fetch, log = console.log, runden = Infinity, jetzt = Date.now, schlafen = warte, kopfQuelle = new KopfCache(kopfOrdner(opt)) } = {}) {
  const instanz = erzeugeInstanz(opt, { datenAlterMs: 0 });
  const abstandMs = Number(opt.discordAbstand ?? 60) * 1000;
  let hubInhalt = null;
  let discordInhalt = null;
  let letztesSenden = -Infinity;
  let gemeldet = '';
  const melde = (text) => { if (text !== gemeldet) log(text); gemeldet = text; };
  for (let r = 0; r < runden; r++) {
    if (r > 0) await schlafen(Number(opt.alle) * 1000);
    try {
      const b = baueBestenlisten(await instanz.daten({ ansicht: 'season' }));
      const i = inhalt(b);
      if (opt.ausgabe && (i !== hubInhalt || !existsSync(opt.ausgabe))) {
        schreibeAtomar(opt.ausgabe, alsJson(hubDatei(b)));
        hubInhalt = i;
      }
      if (opt.webhookDatei && existsSync(opt.webhookDatei) && i !== discordInhalt && jetzt() - letztesSenden >= abstandMs) {
        letztesSenden = jetzt();
        const { alt, neu } = await sendeDiscord(opt, b, kopfQuelle, holen);
        discordInhalt = i;
        if (neu.nachricht !== alt.nachricht) log(`${b.stand} [${b.season}]: Discord-Nachricht angelegt (${neu.nachricht})`);
      }
      melde(`läuft [${b.season}]`);
    } catch (e) {
      melde(`Fehler: ${e.message}`);
    }
  }
}

// --- CLI ---
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const opt = {};
  const a = process.argv.slice(2);
  const namen = { '--webhook-datei': 'webhookDatei', '--discord-abstand': 'discordAbstand' };
  for (let i = 0; i < a.length; i++) {
    if (!a[i].startsWith('--')) continue;
    const name = namen[a[i]] ?? a[i].slice(2);
    if (name === 'probe') opt.probe = true;
    else opt[name] = a[++i];
  }
  if (!opt.instanz) { console.error('Aufruf: node statistik/bestenliste.mjs --instanz <ordner> --archiv <ordner> --sichtbarkeit <datei> --sprache <datei> [--webhook-datei <datei>] [--zustand <datei>] [--ausgabe <datei>] [--probe] [--bilder <ordner>] [--koepfe <ordner>] [--alle <sek>] [--discord-abstand <sek>]'); process.exit(1); }
  try {
    if (opt.alle) await dauerlauf(opt);
    else await lauf(opt);
  } catch (e) {
    console.error(`Fehler: ${e.message}`);
    process.exit(1);
  }
}
