// Bestenlisten-Grafik für Discord (Pascal 31.10.): je Liste ein Bild (Kachel 4:3) mit Top 5 und Minecraft-Köpfen,
// in Discord als 8 Embeds untereinander (ein einzelnes hohes Bild wäre am PC unlesbar klein).
// SVG bauen (Köpfe und Symbole als Pixel-Rechtecke, gestochen scharf) → PNG mit resvg (WebAssembly, keine nativen Teile).
// Schrift: Poppins (SIL Open Font License, daten/schrift/OFL.txt).
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { Resvg, initWasm } from '@resvg/resvg-wasm';
import { anzahl, strecke } from './format.mjs';

const SCHRIFT = new URL('../daten/schrift/', import.meta.url);
const SCHNITTE = { 400: 'Poppins-Regular.ttf', 600: 'Poppins-SemiBold.ttf', 700: 'Poppins-Bold.ttf' };

// --- Schriftbreiten (cmap Format 4 + hmtx), damit lange Namen gekürzt statt abgeschnitten werden ---
function metrik(buf) {
  const tabellen = {};
  for (let i = 0, n = buf.readUInt16BE(4); i < n; i++) {
    const o = 12 + i * 16;
    tabellen[buf.toString('ascii', o, o + 4)] = buf.readUInt32BE(o + 8);
  }
  const em = buf.readUInt16BE(tabellen.head + 18);
  const nMetriken = buf.readUInt16BE(tabellen.hhea + 34);
  const vorschub = (g) => buf.readUInt16BE(tabellen.hmtx + 4 * Math.min(g, nMetriken - 1));
  const cmap = tabellen.cmap;
  let sub = null;
  for (let i = 0, n = buf.readUInt16BE(cmap + 2); i < n; i++) {
    const o = cmap + 4 + i * 8;
    if (buf.readUInt16BE(o) === 3 && buf.readUInt16BE(o + 2) === 1) sub = cmap + buf.readUInt32BE(o + 4);
  }
  const segX2 = buf.readUInt16BE(sub + 6);
  const ende = sub + 14; const start = ende + segX2 + 2; const delta = start + segX2; const bereich = delta + segX2;
  const glyphe = (c) => {
    for (let s = 0; s < segX2 / 2; s++) {
      if (c > buf.readUInt16BE(ende + 2 * s)) continue;
      const anfang = buf.readUInt16BE(start + 2 * s);
      if (c < anfang) return 0;
      const ro = buf.readUInt16BE(bereich + 2 * s);
      if (!ro) return (c + buf.readInt16BE(delta + 2 * s)) & 0xffff;
      const g = buf.readUInt16BE(bereich + 2 * s + ro + 2 * (c - anfang));
      return g ? (g + buf.readInt16BE(delta + 2 * s)) & 0xffff : 0;
    }
    return 0;
  };
  const cache = new Map();
  return (text) => {
    let summe = 0;
    for (const z of text) {
      const c = z.codePointAt(0);
      if (!cache.has(c)) cache.set(c, vorschub(glyphe(c)) / em);
      summe += cache.get(c);
    }
    return summe;
  };
}

let schrift = null;
function ladeSchrift() {
  if (!schrift) {
    schrift = {};
    for (const [gewicht, datei] of Object.entries(SCHNITTE)) {
      const buf = readFileSync(new URL(datei, SCHRIFT));
      schrift[gewicht] = { buf, breite: metrik(buf) };
    }
  }
  return schrift;
}
export const textBreite = (text, groesse, gewicht = 400) => ladeSchrift()[gewicht].breite(text) * groesse;

// --- Werte kurz und ohne Umbruch ---
export function kurzwert(einheit, wert) {
  if (einheit === 'zeit') {
    const min = Math.floor(wert / 20 / 60);
    return min < 60 ? `${min} min` : `${Math.floor(min / 60)}:${String(min % 60).padStart(2, '0')} h`;
  }
  return einheit === 'strecke' ? strecke(wert) : anzahl(wert);
}

// --- Pixel-Symbole (10×10) ---
const SYMBOLE = {
  spielzeit: ['...kkkk...', '..kyyyyk..', '.kyyykyyk.', 'kyyyykyyyk', 'kyyyykyyyk', 'kyyyykkkyk', 'kyyyyyyyyk', '.kyyyyyyk.', '..kyyyyk..', '...kkkk...'],
  spenden: ['.rr....rr.', 'r..r..r..r', '.rrrrrrrr.', 'ggggrrgggg', 'ggggrrgggg', '.gggrrggg.', '.gggrrggg.', '.gggrrggg.', '.gggrrggg.', '.gggrrggg.'],
  abgebaut: ['..ssss....', '.s...sss..', '......hss.', '.....h..s.', '....h...s.', '...h......', '..h.......', '.h........', 'h.........', '..........'],
  mobs: ['.........w', '........ww', '.......ww.', '......ww..', '..y..ww...', '...yww....', '...hy.....', '..h..y....', '.h........', 'h.........'],
  strecke: ['..bbbb....', '..bbbb....', '..bbbb....', '..bbbb....', '..bbbb....', '..bbbbbb..', '..bbbbbbbb', '..bbbbbbbb', '..dddddddd', '..........'],
  tode: ['..wwwwww..', '.wwwwwwww.', 'wwwwwwwwww', 'wwkkwwkkww', 'wwkkwwkkww', 'wwwwkkwwww', '.wwwwwwww.', '..wkwkwk..', '..wwwwww..', '..........'],
  fortschritte: ['yyyyyyyyyy', 'y.yyyyyy.y', 'y.yyyyyy.y', '.yyyyyyyy.', '..yyyyyy..', '...yyyy...', '....yy....', '....yy....', '..yyyyyy..', '..kkkkkk..'],
  diamanten: ['..........', '..cccccc..', '.cwwccccd.', 'cwccccccdd', '.ccccccdd.', '..ccccdd..', '...ccdd...', '....cd....', '..........', '..........'],
};
const SYMBOL_FARBEN = {
  k: '#6b4f22', y: '#e2b955', r: '#c4423c', g: '#3f8a55', s: '#b8c4c9', h: '#8a5a3b', w: '#e6ecee', b: '#8a5a3b', d: '#5a3a26', c: '#6fd6e0',
};

const esc = (s) => String(s).replace(/[&<>"']/g, (z) => `&#${z.charCodeAt(0)};`);

// Pixelraster als Rechtecke (gleiche Farben einer Zeile zusammengefasst)
function pixel(x, y, groesse, b, h, farbe) {
  const teile = [];
  for (let py = 0; py < h; py++) {
    let px = 0;
    while (px < b) {
      const f = farbe(px, py);
      let n = 1;
      while (px + n < b && farbe(px + n, py) === f) n++;
      if (f) teile.push(`<rect x="${x + px * groesse}" y="${y + py * groesse}" width="${n * groesse}" height="${groesse}" fill="${f}"/>`);
      px += n;
    }
  }
  return teile.join('');
}

const hex = (rgba, i) => `#${[rgba[i], rgba[i + 1], rgba[i + 2]].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
const kopfSvg = (x, y, groesse, rgba) => pixel(x, y, groesse / 8, 8, 8, (px, py) => hex(rgba, (py * 8 + px) * 4));
const symbolSvg = (id, x, y, groesse) => {
  const s = SYMBOLE[id];
  return s ? pixel(x, y, groesse / 10, 10, 10, (px, py) => SYMBOL_FARBEN[s[py][px]] ?? null) : '';
};

// Farben: dunkle Winternacht, Gold als Akzent, Platz 1–3 in Gold/Silber/Bronze
const F = {
  grundOben: '#102029', grundUnten: '#0a1419', kachel: '#142a33', rahmen: '#ffffff14', gold: '#e2b955', silber: '#c9d3d8', bronze: '#cf8f5e',
  text: '#eef3f5', leise: '#8ea3ab', zeile1: '#e2b9551f',
};
const RANG_FARBE = [F.gold, F.silber, F.bronze, F.leise, F.leise];

// Eine Kachel = ein Bild im Format 4:3 (600 × 450, gerendert doppelt so groß). Discord zeigt jedes Embed-Bild am PC
// etwa 400 × 300 px und am Handy fast bildschirmbreit (~350 px): Namen und Werte erscheinen dann mit ~18–21 px.
export const MASSE = { breite: 600, hoehe: 450, innen: 26, kopf: 112, zeile: 62, faktor: 2 };

// Name passend kürzen: erst kleinere Schrift (bis 26 px), dann mit „…“
function passeName(name, max, groesse, gewicht) {
  let g = groesse;
  while (g > 26 && textBreite(name, g, gewicht) > max) g -= 1;
  if (textBreite(name, g, gewicht) <= max) return { text: name, groesse: g };
  let n = name;
  while (n.length > 1 && textBreite(`${n}…`, g, gewicht) > max) n = n.slice(0, -1);
  return { text: `${n}…`, groesse: g };
}

// l = eine Liste aus baueBestenlisten(…), koepfe = Map uuid → RGBA 8×8 (fehlend → kein Kopf)
export function kachelSvg(l, { koepfe = new Map() } = {}) {
  const { breite: B, hoehe: H, innen: P, kopf: K, zeile: Z } = MASSE;
  const t = [];
  t.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${B}" height="${H}" viewBox="0 0 ${B} ${H}" font-family="Poppins">`);
  t.push(`<defs><linearGradient id="grund" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${F.grundOben}"/><stop offset="1" stop-color="${F.grundUnten}"/></linearGradient>`);
  t.push(`<radialGradient id="schein" cx="0.15" cy="0" r="0.8"><stop offset="0" stop-color="${F.gold}" stop-opacity="0.14"/><stop offset="1" stop-color="${F.gold}" stop-opacity="0"/></radialGradient>`);
  t.push(`<linearGradient id="linie" x1="0" x2="1"><stop offset="0" stop-color="${F.gold}" stop-opacity="0.6"/><stop offset="1" stop-color="${F.gold}" stop-opacity="0"/></linearGradient></defs>`);
  t.push(`<rect width="${B}" height="${H}" fill="url(#grund)"/><rect width="${B}" height="${H}" fill="url(#schein)"/>`);
  // ein paar ruhige Schneeflocken-Punkte oben rechts
  for (const [x, y, r, o] of [[430, 30, 2.2, 0.3], [505, 62, 1.5, 0.22], [560, 26, 2, 0.28], [470, 92, 1.3, 0.18], [575, 88, 1.6, 0.22]]) {
    t.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="#ffffff" fill-opacity="${o}"/>`);
  }
  t.push(symbolSvg(l.id, P, P + 4, 48));
  t.push(`<text x="${P + 64}" y="${P + 34}" font-size="36" font-weight="700" fill="${F.text}">${esc(l.titel)}</text>`);
  t.push(`<text x="${P + 64}" y="${P + 66}" font-size="24" fill="${F.leise}">${esc(l.unter)}</text>`);
  t.push(`<rect x="${P}" y="${K - 8}" width="${B - 2 * P}" height="2" fill="url(#linie)"/>`);
  if (!l.plaetze.length) {
    t.push(`<text x="${B / 2}" y="${K + 2.5 * Z + 10}" text-anchor="middle" font-size="30" fill="${F.leise}">noch niemand</text>`);
  }
  l.plaetze.forEach((p, r) => {
    const mitte = K + r * Z + Z / 2;
    if (r === 0) {
      t.push(`<rect x="${P - 12}" y="${mitte - 28}" width="${B - 2 * P + 24}" height="56" rx="12" fill="${F.zeile1}"/>`);
      t.push(`<rect x="${P - 12}" y="${mitte - 19}" width="4" height="38" rx="2" fill="${F.gold}"/>`);
    }
    t.push(`<text x="${P + 12}" y="${mitte + 10}" text-anchor="middle" font-size="28" font-weight="700" fill="${RANG_FARBE[r]}">${r + 1}</text>`);
    const kopf = koepfe.get(p.uuid);
    if (kopf) {
      t.push(`<rect x="${P + 37}" y="${mitte - 23}" width="50" height="50" rx="4" fill="#000000" fill-opacity="0.35"/>`);
      t.push(kopfSvg(P + 36, mitte - 24, 48, kopf));
    }
    const wert = kurzwert(l.einheit, p.wert);
    const gw = r === 0 ? 700 : 600;
    const wb = textBreite(wert, 32, gw);
    const nx = P + 102;
    const name = passeName(p.name, B - P - wb - 18 - nx, 32, r === 0 ? 600 : 400);
    t.push(`<text x="${nx}" y="${mitte + 11}" font-size="${name.groesse}" font-weight="${r === 0 ? 600 : 400}" fill="${F.text}">${esc(name.text)}</text>`);
    t.push(`<text x="${B - P}" y="${mitte + 11}" text-anchor="end" font-size="32" font-weight="${gw}" fill="${r === 0 ? F.gold : F.text}">${esc(wert)}</text>`);
  });
  t.push('</svg>');
  return t.join('');
}

let wasmBereit = null;
export async function svgZuPng(svg, { breite } = {}) {
  wasmBereit ??= initWasm(readFileSync(createRequire(import.meta.url).resolve('@resvg/resvg-wasm/index_bg.wasm')));
  await wasmBereit;
  const s = ladeSchrift();
  const r = new Resvg(svg, {
    font: { fontBuffers: Object.values(s).map((x) => new Uint8Array(x.buf)), defaultFontFamily: 'Poppins', loadSystemFonts: false },
    ...(breite ? { fitTo: { mode: 'width', value: breite } } : {}),
  });
  return Buffer.from(r.render().asPng());
}

// Alle Hub-Listen als Bilder: [{ id, datei: "kachel-1.png", svg, png }]. kopfQuelle.gesicht(uuid) → RGBA 8×8.
export async function bestenlistenBilder(b, kopfQuelle) {
  const koepfe = new Map();
  const listen = b.listen.filter((l) => l.hub);
  for (const l of listen) {
    for (const p of l.plaetze) if (p.uuid && !koepfe.has(p.uuid)) koepfe.set(p.uuid, await kopfQuelle.gesicht(p.uuid));
  }
  const bilder = [];
  for (const [i, l] of listen.entries()) {
    const svg = kachelSvg(l, { koepfe });
    bilder.push({ id: l.id, datei: `kachel-${i + 1}.png`, svg, png: await svgZuPng(svg, { breite: MASSE.breite * MASSE.faktor }) });
  }
  return bilder;
}
