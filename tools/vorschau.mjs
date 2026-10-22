// Rendert eine Schematic als Schrägansicht (Front + Dach) mit Vanilla-Texturen nach PNG.
// Aufruf: node tools/vorschau.mjs <datei.schem> <ausgabe.png> <ordner mit textures/block> [--hinten]
// Teilblöcke (Treppen, Stufen, Scheiben) werden als ganze Blöcke gezeichnet – reicht für einen Eindruck.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pngjs from 'pngjs';
import { lade, hole, LUFT } from './schem.mjs';

const { PNG } = pngjs;
const S = 16; // Pixel pro Block
const K = 8;  // Versatz pro Block Tiefe

const WEGLASSEN = /button|lever|tripwire|torch|chain$|ladder|_sign|banner|redstone_wire|^minecraft:fire|structure_void|^minecraft:barrier|light$/;
const HOLZ = ['oak', 'spruce', 'birch', 'jungle', 'acacia', 'dark_oak', 'mangrove', 'cherry', 'pale_oak', 'bamboo', 'crimson', 'warped'];

// Mögliche Texturnamen für einen Blocknamen (ohne Namespace/Properties).
export function texturKandidaten(name, oben) {
  const basen = [name];
  const ohne = name.replace(/_(stairs|slab|wall|fence_gate|fence|pressure_plate|trapdoor|door|carpet|pane)$/, '');
  if (ohne !== name) basen.push(ohne, ohne + 's', ohne.replace(/_brick$/, '_bricks'), ohne.replace(/_tile$/, '_tiles'));
  if (/carpet$/.test(name)) basen.push(ohne + '_wool');
  if (HOLZ.includes(ohne)) basen.push(ohne + '_planks');
  if (/_wood$/.test(name)) basen.push(name.replace(/_wood$/, '_log'));
  if (/_hyphae$/.test(name)) basen.push(name.replace(/_hyphae$/, '_stem'));
  if (/_glass_pane$/.test(name)) basen.push(name.replace(/_pane$/, ''));
  if (name === 'glass_pane') basen.push('glass');
  if (/^(snow|powder_snow)$/.test(name)) basen.push('snow');
  const endungen = oben ? ['_top', '', '_side', '_front'] : ['', '_side', '_front', '_top'];
  return basen.flatMap((b) => endungen.map((e) => b + e));
}

function ladeTexturen(ordner) {
  const cache = new Map();
  return (block, oben) => {
    const name = block.split('[')[0].replace('minecraft:', '');
    const schluessel = name + (oben ? '^' : '');
    if (cache.has(schluessel)) return cache.get(schluessel);
    let tex = null;
    for (const k of texturKandidaten(name, oben)) {
      const pfad = join(ordner, k + '.png');
      if (existsSync(pfad)) { tex = PNG.sync.read(readFileSync(pfad)); break; }
    }
    // Gras/Laub sind in der Textur grau und werden im Spiel eingefärbt
    if (tex && /leaves|grass|vine|fern/.test(name)) tex.tint = name.includes('spruce') ? [97, 153, 97] : [119, 171, 47];
    cache.set(schluessel, tex);
    return tex;
  };
}

function pixel(tex, u, v) {
  const x = Math.min(15, Math.max(0, Math.floor(u))) * (tex.width / 16) | 0;
  const y = Math.min(15, Math.max(0, Math.floor(v))) * (tex.width / 16) | 0; // Animationen: nur erstes Bild
  const i = (y * tex.width + x) * 4;
  let [r, g, b, a] = tex.data.subarray(i, i + 4);
  if (tex.tint) { r = r * tex.tint[0] / 255; g = g * tex.tint[1] / 255; b = b * tex.tint[2] / 255; }
  return [r, g, b, a];
}

export function rendere(m, texturOrdner, { hinten = false } = {}) {
  const tex = ladeTexturen(texturOrdner);
  const breite = m.w * S + m.l * K;
  const hoehe = m.h * S + m.l * K;
  const png = new PNG({ width: breite, height: hoehe });
  for (let i = 0; i < png.data.length; i += 4) png.data.set([235, 241, 248, 255], i);
  const z0 = (z) => (hinten ? m.l - 1 - z : z); // --hinten: von der anderen Längsseite schauen
  const sichtbar = (b) => b && b !== LUFT && !/air$/.test(b) && !WEGLASSEN.test(b);
  const mal = (px, py, [r, g, b, a], hell) => {
    if (a < 20 || px < 0 || py < 0 || px >= breite || py >= hoehe) return;
    const i = (py * breite + px) * 4;
    const t = a / 255;
    png.data[i] = png.data[i] * (1 - t) + r * hell * t;
    png.data[i + 1] = png.data[i + 1] * (1 - t) + g * hell * t;
    png.data[i + 2] = png.data[i + 2] * (1 - t) + b * hell * t;
  };
  for (let zz = m.l - 1; zz >= 0; zz--) {
    const z = z0(zz);
    for (let y = 0; y < m.h; y++) for (let xx = 0; xx < m.w; xx++) {
      const x = hinten ? m.w - 1 - xx : xx;
      const b = hole(m, x, y, z);
      if (!sichtbar(b)) continue;
      const sx = xx * S + zz * K;
      const sy = (m.h - 1 - y) * S + (m.l - 1 - zz) * K;
      const oben = y + 1 >= m.h || !sichtbar(hole(m, x, y + 1, z)) || /glass/.test(hole(m, x, y + 1, z));
      const tTop = tex(b, true);
      if (oben && tTop) {
        for (let v = 0; v < K; v++) for (let u = 0; u < S; u++) {
          mal(sx + u + (K - v), sy - K + v, pixel(tTop, u, (v / K) * 16), 1.0);
        }
      }
      const vorne = zz === 0 || !sichtbar(hole(m, x, y, z0(zz - 1))) || /glass/.test(hole(m, x, y, z0(zz - 1)));
      const tSeite = tex(b, false);
      if (vorne && tSeite) {
        for (let v = 0; v < S; v++) for (let u = 0; u < S; u++) mal(sx + u, sy + v, pixel(tSeite, u, v), 0.82);
      }
    }
  }
  return PNG.sync.write(png);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [ein, aus, ordner] = process.argv.slice(2);
  if (!ein || !aus || !ordner) { console.error('Aufruf: node tools/vorschau.mjs <datei.schem> <ausgabe.png> <textures/block> [--hinten]'); process.exit(1); }
  writeFileSync(aus, rendere(lade(readFileSync(ein)), ordner, { hinten: process.argv.includes('--hinten') }));
  console.log(`${aus} geschrieben`);
}
