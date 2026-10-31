// Auswertung: Statistiken + Logereignisse → JSON aus DATENFORMAT.md (/api/daten).
// Datenschutz: ausgeblendete Spieler (sichtbar(uuid) === false) tauchen nirgends auf.
import { WERT, BESTENLISTEN, SPRUECHE, PLATZ_EINS, FAKTEN } from './titel.mjs';
import { fmt, nachEinheit } from './format.mjs';
import { isoBerlin } from './zeit.mjs';
import { baueSitzungen, tageAusSitzungen } from './sitzungen.mjs';

export const KATEGORIEN = {
  custom: 'Allgemein', mined: 'Abgebaut', used: 'Benutzt', crafted: 'Hergestellt', broken: 'Verbraucht',
  picked_up: 'Aufgesammelt', dropped: 'Fallen gelassen', killed: 'Getötet', killed_by: 'Getötet von',
  server: 'Server',
};

// Eigene Werte (lib/zusatz.mjs)
const SERVER_NAMEN = { fortschritte: 'Fortschritte geschafft', spenden: 'Spenden für die Weihnachtsinsel' };

const SPIELER_EREIGNISSE = new Set(['join', 'quit', 'tod', 'fortschritt']);
const TAGE_30 = 30 * 24 * 3600 * 1000;

// --- Hilfen aus der Sprachdatei -------------------------------------------------------

export function erzeugeHilfe(sprache) {
  const hat = (k) => sprache?.de?.[k] !== undefined || sprache?.en?.[k] !== undefined;
  return { istBlock: (x) => hat(`block.minecraft.${x}`) };
}

const huebsch = (s) => s.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

export function anzeigeName(schluessel, sprache) {
  const i = schluessel.indexOf(':');
  const kat = schluessel.slice(0, i);
  const sache = schluessel.slice(i + 1);
  if (kat === 'server') return SERVER_NAMEN[sache] ?? huebsch(sache);
  const de = sprache?.de ?? {};
  const kandidaten = kat === 'custom' ? [`stat.minecraft.${sache}`]
    : kat === 'mined' ? [`block.minecraft.${sache}`, `item.minecraft.${sache}`]
      : (kat === 'killed' || kat === 'killed_by') ? [`entity.minecraft.${sache}`]
        : [`item.minecraft.${sache}`, `block.minecraft.${sache}`];
  for (const k of kandidaten) if (de[k]) return de[k];
  return huebsch(sache);
}

export function einheitFuer(schluessel) {
  if (!schluessel.startsWith('custom:')) return 'anzahl';
  const s = schluessel.slice(7);
  if (s.endsWith('_one_cm')) return 'strecke';
  if (['play_time', 'total_world_time', 'time_since_death', 'time_since_rest', 'sneak_time', 'play_one_minute'].includes(s)) return 'zeit';
  if (s.startsWith('damage_')) return 'schaden';
  return 'anzahl';
}

// --- Rohereignisse (aus dem Log) → Ereignisse mit uuid und deutschem Text ---------------

// namenZuUuid: Map Name(klein) → uuid; uebersetzer: erzeugeUebersetzer(...)
export function ereignisseAusRoh(roh, { namenZuUuid, uebersetzer }) {
  const aus = [];
  for (const e of roh) {
    if (e.typ === 'uuid') continue;
    const uuid = e.name ? (namenZuUuid.get(e.name.toLowerCase()) ?? null) : null;
    let text;
    switch (e.typ) {
      case 'join': text = `${e.name} ist dem Server beigetreten`; break;
      case 'quit': text = `${e.name} hat den Server verlassen`; break;
      case 'tod': text = uebersetzer.todDeutsch(e.schluessel, e.args) ?? e.text; break;
      case 'fortschritt': text = uebersetzer.fortschrittDeutsch(e.art, e.name, e.titel); break;
      case 'start': text = 'Server gestartet'; break;
      case 'stopp': text = 'Server gestoppt'; break;
      default: continue;
    }
    aus.push({ zeit: e.zeit, typ: e.typ, uuid, text });
  }
  return aus;
}

// Einzelnes Ereignis für die Öffentlichkeit prüfen (Datenschutz). Gibt Ereignis in Ausgabeform oder null.
export function oeffentlichesEreignis(e, { sichtbar, versteckteNamen }) {
  if (SPIELER_EREIGNISSE.has(e.typ) && (!e.uuid || !sichtbar(e.uuid))) return null;
  if (versteckteNamen.some((re) => re.test(e.text))) return null;
  return { zeit: isoBerlin(e.zeit), typ: e.typ, uuid: e.uuid ?? null, text: e.text };
}

export function versteckteNamenRegex(namen, sichtbar) {
  const aus = [];
  for (const [uuid, name] of namen) {
    if (sichtbar(uuid)) continue;
    aus.push(new RegExp(`(?<![A-Za-z0-9_])${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![A-Za-z0-9_])`, 'i'));
  }
  return aus;
}

// --- Hauptfunktion ---------------------------------------------------------------------

export function werteAus({ statistiken, namen, ereignisse, sichtbar, sprache, optionen = {}, jetzt, laeuft = true }) {
  const hilfe = erzeugeHilfe(sprache);
  const versteckt = versteckteNamenRegex(namen, sichtbar);

  // Sitzungen aus allen Ereignissen bilden, danach nach Sichtbarkeit filtern
  const sortiert = [...ereignisse].sort((a, b) => a.zeit - b.zeit);
  const alleSitzungen = baueSitzungen(sortiert, { laeuft });
  const sitzungen = alleSitzungen.filter((s) => sichtbar(s.uuid));

  // sichtbare Spieler: Statistikdatei oder Sitzung
  const uuids = new Set();
  for (const u of statistiken.keys()) if (sichtbar(u)) uuids.add(u);
  for (const s of sitzungen) uuids.add(s.uuid);

  const online = [...new Set(sitzungen.filter((s) => s.ende === null).map((s) => s.uuid))];
  const erste = new Map();
  const letzte = new Map();
  for (const s of sitzungen) {
    if (!erste.has(s.uuid)) erste.set(s.uuid, s.start);
    letzte.set(s.uuid, s.ende ?? jetzt);
  }

  const spieler = [...uuids].map((uuid) => ({
    uuid,
    name: namen.get(uuid) ?? `Spieler-${uuid.slice(0, 8)}`,
    online: online.includes(uuid),
    erstesMal: erste.has(uuid) ? isoBerlin(erste.get(uuid)) : null,
    zuletzt: letzte.has(uuid) ? isoBerlin(letzte.get(uuid)) : null,
    werte: statistiken.get(uuid) ?? {},
  })).sort((a, b) => a.name.localeCompare(b.name, 'de'));

  // WERT-Namen je Spieler
  const wNamen = Object.keys(WERT);
  for (const s of spieler) {
    s.w = {};
    for (const n of wNamen) s.w[n] = WERT[n](s.werte, hilfe) || 0;
  }
  const gesamt = { spieler: spieler.length };
  for (const n of wNamen) gesamt[n] = spieler.reduce((sum, s) => sum + s.w[n], 0);

  // Ränge je WERT-Name
  const rang = {}; // wertName → [{ uuid, wert }] absteigend
  for (const n of wNamen) {
    rang[n] = spieler.filter((s) => s.w[n] > 0)
      .sort((a, b) => b.w[n] - a.w[n] || a.name.localeCompare(b.name, 'de'))
      .map((s) => ({ uuid: s.uuid, wert: s.w[n] }));
  }

  const bestenlisten = BESTENLISTEN
    .map((d) => ({ id: d.id, titel: d.titel, unter: d.unter, einheit: d.einheit, eintraege: (rang[d.wert] ?? []).slice(0, 10) }))
    .filter((b) => b.eintraege.length > 0);

  // Sprüche
  const listeZu = Object.fromEntries(BESTENLISTEN.map((d) => [d.wert, d]));
  const sprueche = {};
  for (const s of spieler) {
    const liste = [];
    for (const n of wNamen) {
      const platz = rang[n].findIndex((r) => r.uuid === s.uuid) + 1;
      if (!platz) continue;
      const d = listeZu[n];
      const einheit = d?.einheit ?? 'anzahl';
      const id = d?.id ?? n;
      const schwellen = SPRUECHE[n] ?? [];
      let hoechste = null;
      for (const [grenze, text] of schwellen) if (s.w[n] >= grenze) hoechste = text;
      if (hoechste) liste.push({ liste: id, text: hoechste.replaceAll('{n}', nachEinheit(einheit, s.w[n])), rang: platz, eins: false });
      // Platz-1-Spruch nur, wenn keine Schwelle greift – sonst stünde dieselbe Liste doppelt da
      if (platz === 1 && d && !hoechste) {
        liste.push({ liste: id, text: PLATZ_EINS.replaceAll('{titel}', d.titel).replaceAll('{n}', nachEinheit(einheit, s.w[n])), rang: 1, eins: true });
      }
    }
    if (!liste.length) continue;
    liste.sort((a, b) => a.rang - b.rang || (b.eins - a.eins));
    sprueche[s.uuid] = liste.slice(0, 8).map(({ liste: l, text, rang: r }) => ({ liste: l, text, rang: r }));
  }

  // Fakten
  const fakten = [];
  for (const f of FAKTEN) {
    try {
      const t = f({ gesamt, spieler: spieler.map((s) => ({ name: s.name, w: s.w })), fmt });
      if (typeof t === 'string' && t) fakten.push(t);
    } catch { /* ein kaputter Fakt darf die Seite nicht kippen */ }
  }

  // Tage und Sitzungen
  const tage = tageAusSitzungen(sitzungen, { jetzt });
  const sitzungenAus = sitzungen
    .filter((s) => (s.ende ?? jetzt) >= jetzt - TAGE_30)
    .map((s) => ({ uuid: s.uuid, start: isoBerlin(s.start), ende: s.ende === null ? null : isoBerlin(s.ende) }));

  // Ereignisse (neueste zuerst, höchstens 50)
  const ereignisseAus = [];
  for (const e of [...sortiert].reverse().sort((a, b) => b.zeit - a.zeit)) {
    const o = oeffentlichesEreignis(e, { sichtbar, versteckteNamen: versteckt });
    if (o) ereignisseAus.push(o);
    if (ereignisseAus.length >= 50) break;
  }

  // Namen und Einheiten nur für vorkommende Schlüssel
  const schluessel = new Set();
  for (const s of spieler) for (const k of Object.keys(s.werte)) schluessel.add(k);
  const namenAus = {};
  const einheiten = {};
  for (const k of [...schluessel].sort()) {
    namenAus[k] = anzeigeName(k, sprache);
    const e = einheitFuer(k);
    if (e !== 'anzahl') einheiten[k] = e;
  }

  return {
    server: {
      name: optionen.name ?? 'Weihnachtsserver',
      season: optionen.season ?? 'weihnachten-2026',
      seasonName: optionen.seasons?.find((s) => s.aktuell)?.name ?? optionen.seasonName ?? 'Weihnachten 2026',
      seasons: optionen.seasons ?? [{ id: optionen.season ?? 'weihnachten-2026', name: optionen.seasonName ?? 'Weihnachten 2026', aktuell: true }],
      ansicht: optionen.ansicht ?? 'season',
      stand: isoBerlin(jetzt),
      online,
      ...(optionen.testmodus ? { testmodus: true } : {}),
    },
    gesamt,
    spieler: spieler.map(({ uuid, name, online: o, erstesMal, zuletzt, werte }) => ({ uuid, name, online: o, erstesMal, zuletzt, werte })),
    bestenlisten,
    sprueche,
    fakten,
    tage,
    sitzungen: sitzungenAus,
    ereignisse: ereignisseAus,
    namen: namenAus,
    kategorien: KATEGORIEN,
    einheiten,
  };
}
