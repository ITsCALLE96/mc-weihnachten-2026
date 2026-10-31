// Bestenlisten nach außen geben: Discord-Nachricht per Webhook bearbeiten und/oder JSON für die Hub-Text-Displays schreiben.
// Läuft auf VM200 per Cron (stündlich, siehe betrieb/einrichten.sh), einmal je Lauf.
//
// Aufruf: node statistik/bestenliste.mjs --instanz <smp> --archiv <archiv> --sichtbarkeit <datei> --sprache <datei>
//          [--webhook-datei <datei mit URL>] [--zustand <datei>] [--ausgabe <hub.json>] [--probe]
// --probe gibt die Discord-Nutzlast nur aus und sendet nichts. Die Webhook-URL ist ein Geheimnis (Datei mit Rechten 600),
// sie wird nie ausgegeben. Im Zustand steht nur die ID der Nachricht, die bearbeitet wird.
import { readFileSync, writeFileSync, renameSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Instanz } from './lib/quellen.mjs';
import { Sichtbarkeit } from './lib/sichtbarkeit.mjs';
import { baueBestenlisten, discordNachricht } from './lib/anzeige.mjs';

const schreibeAtomar = (pfad, text) => { writeFileSync(`${pfad}.tmp`, text); renameSync(`${pfad}.tmp`, pfad); };

// Webhook-Nachricht anlegen oder bearbeiten. zustand = { nachricht: "<id>" }. Gibt den neuen Zustand zurück.
export async function sendeWebhook(url, nutzlast, zustand = {}, holen = fetch) {
  const basis = url.replace(/\?.*$/, '');
  const senden = (methode, pfad) => holen(`${basis}${pfad}`, {
    method: methode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(nutzlast), signal: AbortSignal.timeout(15000),
  });
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

export async function lauf(opt, { holen = fetch, log = console.log } = {}) {
  const sichtbarkeit = new Sichtbarkeit(opt.sichtbarkeit);
  const sprache = opt.sprache ? JSON.parse(readFileSync(opt.sprache, 'utf8')) : { de: {}, en: {} };
  const instanz = new Instanz({ instanz: opt.instanz, archiv: opt.archiv ?? null, sichtbarkeit, sprache, optionen: { name: opt.name } });
  const b = baueBestenlisten(await instanz.daten({ ansicht: 'season' }));
  if (opt.ausgabe) schreibeAtomar(opt.ausgabe, `${JSON.stringify(b, null, 2)}\n`);
  const nutzlast = discordNachricht(b);
  if (opt.probe) { log(JSON.stringify(nutzlast, null, 2)); return b; }
  if (opt.webhookDatei) {
    const url = readFileSync(opt.webhookDatei, 'utf8').trim();
    if (!/^https:\/\/(?:discord\.com|discordapp\.com)\/api\/webhooks\/\d+\/[\w-]+$/.test(url)) throw new Error('Webhook-Datei enthält keine Discord-Webhook-URL');
    const alt = opt.zustand && existsSync(opt.zustand) ? JSON.parse(readFileSync(opt.zustand, 'utf8')) : {};
    const neu = await sendeWebhook(url, nutzlast, alt, holen);
    if (opt.zustand && neu.nachricht !== alt.nachricht) schreibeAtomar(opt.zustand, `${JSON.stringify(neu)}\n`);
    log(`${b.stand} [${b.season}]: Discord-Nachricht ${neu.nachricht === alt.nachricht ? 'aktualisiert' : `angelegt (${neu.nachricht})`}`);
  }
  return b;
}

// --- CLI ---
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const opt = {};
  const a = process.argv.slice(2);
  const namen = { '--webhook-datei': 'webhookDatei' };
  for (let i = 0; i < a.length; i++) {
    if (!a[i].startsWith('--')) continue;
    const name = namen[a[i]] ?? a[i].slice(2);
    if (name === 'probe') opt.probe = true;
    else opt[name] = a[++i];
  }
  if (!opt.instanz) { console.error('Aufruf: node statistik/bestenliste.mjs --instanz <ordner> --archiv <ordner> --sichtbarkeit <datei> --sprache <datei> [--webhook-datei <datei>] [--zustand <datei>] [--ausgabe <datei>] [--probe]'); process.exit(1); }
  try {
    await lauf(opt);
  } catch (e) {
    console.error(`Fehler: ${e.message}`);
    process.exit(1);
  }
}
