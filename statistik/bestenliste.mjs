// Bestenlisten nach außen geben: Discord-Nachricht per Webhook bearbeiten und/oder JSON für die Hub-Text-Displays schreiben.
// Läuft auf VM200 als dauerhafter Dienst (betrieb/compose.yml, --alle 15): Hub-Datei nur bei Änderung neu,
// Discord-Nachricht nur bei Änderung und höchstens einmal je --discord-abstand Sekunden (Standard 60).
//
// Aufruf: node statistik/bestenliste.mjs --instanz <smp> --archiv <archiv> --sichtbarkeit <datei> --sprache <datei>
//          [--webhook-datei <datei mit URL>] [--zustand <datei>] [--ausgabe <hub.json>] [--probe] [--alle <sek>] [--discord-abstand <sek>]
// Ohne --alle ein einzelner Lauf. --probe gibt die Discord-Nutzlast nur aus und sendet nichts.
// Im Dauerlauf darf die Webhook-Datei fehlen (dann nur Hub-Datei); sie wird bei jeder Runde neu gesucht. Die Webhook-URL ist ein Geheimnis (Datei mit Rechten 600),
// sie wird nie ausgegeben. Im Zustand steht nur die ID der Nachricht, die bearbeitet wird.
import { readFileSync, writeFileSync, renameSync, existsSync } from 'node:fs';
import { setTimeout as warte } from 'node:timers/promises';
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

function erzeugeInstanz(opt, extra = {}) {
  const sichtbarkeit = new Sichtbarkeit(opt.sichtbarkeit);
  const sprache = opt.sprache ? JSON.parse(readFileSync(opt.sprache, 'utf8')) : { de: {}, en: {} };
  return new Instanz({ instanz: opt.instanz, archiv: opt.archiv ?? null, sichtbarkeit, sprache, optionen: { name: opt.name }, ...extra });
}

const WEBHOOK = /^https:\/\/(?:discord\.com|discordapp\.com)\/api\/webhooks\/\d+\/[\w-]+$/;
function leseWebhook(datei) {
  const url = readFileSync(datei, 'utf8').trim();
  if (!WEBHOOK.test(url)) throw new Error('Webhook-Datei enthält keine Discord-Webhook-URL');
  return url;
}
const leseZustand = (datei) => (datei && existsSync(datei) ? JSON.parse(readFileSync(datei, 'utf8')) : {});

// Ein einzelner Lauf: Hub-Datei schreiben, Discord-Nachricht anlegen/bearbeiten
export async function lauf(opt, { holen = fetch, log = console.log } = {}) {
  const b = baueBestenlisten(await erzeugeInstanz(opt).daten({ ansicht: 'season' }));
  if (opt.ausgabe) schreibeAtomar(opt.ausgabe, `${JSON.stringify(b, null, 2)}\n`);
  const nutzlast = discordNachricht(b);
  if (opt.probe) { log(JSON.stringify(nutzlast, null, 2)); return b; }
  if (opt.webhookDatei) {
    const alt = leseZustand(opt.zustand);
    const neu = await sendeWebhook(leseWebhook(opt.webhookDatei), nutzlast, alt, holen);
    if (opt.zustand && neu.nachricht !== alt.nachricht) schreibeAtomar(opt.zustand, `${JSON.stringify(neu)}\n`);
    log(`${b.stand} [${b.season}]: Discord-Nachricht ${neu.nachricht === alt.nachricht ? 'aktualisiert' : `angelegt (${neu.nachricht})`}`);
  }
  return b;
}

// Inhalt ohne Zeitstempel: ändert sich nur, wenn sich an den Listen etwas ändert
const inhalt = (b) => JSON.stringify([b.season, b.seasonName, b.listen]);

// Dauerlauf: alle opt.alle Sekunden auswerten. Hub-Datei nur bei Änderung (der Hub prüft die Änderungszeit),
// Discord nur bei Änderung und frühestens opt.discordAbstand Sekunden nach dem letzten Senden. Fehler werden
// gemeldet und in der nächsten Runde erneut versucht. runden/jetzt/schlafen sind für Tests.
export async function dauerlauf(opt, { holen = fetch, log = console.log, runden = Infinity, jetzt = Date.now, schlafen = warte } = {}) {
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
        schreibeAtomar(opt.ausgabe, `${JSON.stringify(b, null, 2)}
`);
        hubInhalt = i;
      }
      if (opt.webhookDatei && existsSync(opt.webhookDatei) && i !== discordInhalt && jetzt() - letztesSenden >= abstandMs) {
        letztesSenden = jetzt();
        const alt = leseZustand(opt.zustand);
        const neu = await sendeWebhook(leseWebhook(opt.webhookDatei), discordNachricht(b), alt, holen);
        if (opt.zustand && neu.nachricht !== alt.nachricht) schreibeAtomar(opt.zustand, `${JSON.stringify(neu)}
`);
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
  if (!opt.instanz) { console.error('Aufruf: node statistik/bestenliste.mjs --instanz <ordner> --archiv <ordner> --sichtbarkeit <datei> --sprache <datei> [--webhook-datei <datei>] [--zustand <datei>] [--ausgabe <datei>] [--probe] [--alle <sek>] [--discord-abstand <sek>]'); process.exit(1); }
  try {
    if (opt.alle) await dauerlauf(opt);
    else await lauf(opt);
  } catch (e) {
    console.error(`Fehler: ${e.message}`);
    process.exit(1);
  }
}
