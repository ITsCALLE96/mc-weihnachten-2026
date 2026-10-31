// Seasons: eine Season = eine Welt. Pascal startet und beendet sie von Hand (Kennung in <archiv>/SEASON).
// Archiv-Aufbau (server/statistik/README.md): <archiv>/<season>/schnappschuesse/JJJJ-MM-TT.tar.gz, <archiv>/<season>/logs/paper/*.log.gz
// Abgeschlossene Seasons werden aus ihrem letzten Schnappschuss + ihren Logs gelesen (ändern sich nicht mehr).
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { flacheStatistik, parseUsercache } from './spieler.mjs';
import { normUuid } from './sichtbarkeit.mjs';
import { zaehleFortschritte, parseSpenden } from './zusatz.mjs';

export const SEASON_MUSTER = /^[a-z0-9][a-z0-9-]*$/;

// „weihnachten-2026“ → „Weihnachten 2026“; eine Datei <archiv>/<season>/NAME überschreibt das
export function seasonName(id, archiv = null) {
  if (archiv) {
    try {
      const n = readFileSync(join(archiv, id, 'NAME'), 'utf8').trim();
      if (n) return n;
    } catch { /* kein eigener Name */ }
  }
  return id.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export function aktuelleSeason(archiv) {
  try {
    const id = readFileSync(join(archiv, 'SEASON'), 'utf8').split(/\r?\n/)[0].trim();
    return SEASON_MUSTER.test(id) ? id : null;
  } catch { return null; }
}

// Alle Season-Ordner im Archiv (gültige Kennung, mit Schnappschüssen oder Logs), alphabetisch
export function seasonsImArchiv(archiv) {
  if (!archiv || !existsSync(archiv)) return [];
  return readdirSync(archiv, { withFileTypes: true })
    .filter((d) => d.isDirectory() && SEASON_MUSTER.test(d.name))
    .filter((d) => existsSync(join(archiv, d.name, 'schnappschuesse')) || existsSync(join(archiv, d.name, 'logs')))
    .map((d) => d.name)
    .sort();
}

// Minimaler tar-Leser (ustar/GNU, auch lange Namen über „L“-Einträge) → Map pfad → Buffer
export function leseTar(buf) {
  const dateien = new Map();
  let pos = 0;
  let langerName = null;
  const text = (von, laenge) => buf.toString('utf8', von, von + laenge).replace(/\0.*$/s, '');
  while (pos + 512 <= buf.length) {
    if (buf[pos] === 0) break; // Endblock
    const groesse = parseInt(text(pos + 124, 12).trim() || '0', 8);
    const typ = String.fromCharCode(buf[pos + 156] || 48);
    const praefix = text(pos + 345, 155);
    let name = langerName ?? (praefix ? `${praefix}/${text(pos, 100)}` : text(pos, 100));
    langerName = null;
    const daten = buf.subarray(pos + 512, pos + 512 + groesse);
    if (typ === 'L') langerName = daten.toString('utf8').replace(/\0.*$/s, '');
    else if (typ === '0' || typ === '\0') dateien.set(name.replace(/^\.\//, ''), daten);
    pos += 512 + Math.ceil(groesse / 512) * 512;
  }
  return dateien;
}

// Gegenstück für Testdaten und Tests: [{ pfad, inhalt }] → tar-Buffer (ustar, Namen bis 100 Zeichen)
export function schreibeTar(eintraege) {
  const bloecke = [];
  for (const { pfad, inhalt } of eintraege) {
    const daten = Buffer.from(inhalt);
    const kopf = Buffer.alloc(512);
    kopf.write(pfad, 0, 100, 'utf8');
    kopf.write('0000644\0', 100); kopf.write('0000000\0', 108); kopf.write('0000000\0', 116);
    kopf.write(`${daten.length.toString(8).padStart(11, '0')}\0`, 124);
    kopf.write(`${Math.floor(Date.now() / 1000).toString(8).padStart(11, '0')}\0`, 136);
    kopf.write('        ', 148); kopf.write('0', 156); kopf.write('ustar\0', 257); kopf.write('00', 263);
    let summe = 0;
    for (const b of kopf) summe += b;
    kopf.write(`${summe.toString(8).padStart(6, '0')}\0 `, 148);
    bloecke.push(kopf, daten, Buffer.alloc((512 - (daten.length % 512)) % 512));
  }
  bloecke.push(Buffer.alloc(1024));
  return Buffer.concat(bloecke);
}

// Letzter Schnappschuss einer Season → { datum, statistiken, namen, fortschritte, spenden } (Maps je uuid)
// Spenden nur, wenn der Schnappschuss <datum>/mission-stand.yml enthält
export function letzterSchnappschuss(seasonOrdner) {
  const ordner = join(seasonOrdner, 'schnappschuesse');
  if (!existsSync(ordner)) return null;
  const datei = readdirSync(ordner).filter((f) => /^\d{4}-\d{2}-\d{2}\.tar\.gz$/.test(f)).sort().at(-1);
  if (!datei) return null;
  const dateien = leseTar(gunzipSync(readFileSync(join(ordner, datei))));
  const statistiken = new Map();
  const fortschritte = new Map();
  let namen = new Map();
  let spenden = new Map();
  for (const [pfad, inhalt] of dateien) {
    if (pfad.endsWith('/usercache.json') && pfad.split('/').length === 2) {
      try { namen = parseUsercache(inhalt.toString('utf8')); } catch { /* ohne Namen */ }
      continue;
    }
    if (pfad.endsWith('/mission-stand.yml') && pfad.split('/').length === 2) {
      spenden = parseSpenden(inhalt.toString('utf8'));
      continue;
    }
    const a = /(?:^|\/)advancements\/([0-9a-fA-F-]{32,36})\.json$/.exec(pfad);
    if (a && !pfad.includes('/datapacks/')) {
      const u = normUuid(a[1]);
      try { if (u) fortschritte.set(u, zaehleFortschritte(JSON.parse(inhalt.toString('utf8')))); } catch { /* kaputte Datei */ }
      continue;
    }
    const m = /(?:^|\/)stats\/([0-9a-fA-F-]{32,36})\.json$/.exec(pfad);
    if (!m) continue;
    const uuid = normUuid(m[1]);
    if (!uuid) continue;
    try { statistiken.set(uuid, flacheStatistik(JSON.parse(inhalt.toString('utf8')))); } catch { /* kaputte Datei */ }
  }
  return { datum: datei.slice(0, 10), statistiken, namen, fortschritte, spenden };
}

// Signatur einer Season (zum Neu-Einlesen, falls doch noch etwas hinzukommt)
export function seasonSignatur(seasonOrdner) {
  const teile = [];
  for (const unter of ['schnappschuesse', 'logs/paper']) {
    const o = join(seasonOrdner, unter);
    if (!existsSync(o)) continue;
    for (const f of readdirSync(o).sort()) {
      try { const s = statSync(join(o, f)); teile.push(`${unter}/${f}:${s.size}:${s.mtimeMs}`); } catch { /* weg */ }
    }
  }
  return teile.join('|');
}

// Werte mehrerer Seasons je Spieler aufsummieren (jede Welt beginnt bei null)
export function summiereStatistiken(karten) {
  const summe = new Map();
  for (const karte of karten) {
    for (const [uuid, werte] of karte) {
      const ziel = summe.get(uuid) ?? {};
      for (const [k, v] of Object.entries(werte)) ziel[k] = (ziel[k] ?? 0) + v;
      summe.set(uuid, ziel);
    }
  }
  return summe;
}
