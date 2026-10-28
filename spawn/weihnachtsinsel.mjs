// Server-Mission „Weihnachtsinsel“ (Pascal 28.10.): schwebende Insel am Ende des Nordwegs der Spark-Insel, entsteht in 4 Stufen durch Spenden
// (Logik in serverwahl, Wunschlisten und Tränke in spawn/mission.json). Eigenes Design, prozedural, kein fremdes Material, bleibt nach der Season.
//   Stufe 1: Insel taucht auf (Schichten von unten), Brücke mit drei Torbögen, Girlanden und Laternen baut sich von der Spark-Insel aus
//   Stufe 2: großer Weihnachtsbaum wächst in 5 Schritten
//   Stufe 3: Schmuck (Kupferbirnen-Lichterkette noch aus, Girlande, Kugeln, Stern schwach leuchtend, Geschenke)
//   Stufe 4: Lichter gehen von unten nach oben an, Stern hell, danach Feier mit Feuerwerk
// Gebaut wird in einem „Ost-Rahmen“ (Brücke entlang +x) und am Ende um die Spark-Mitte auf die Zielrichtung gedreht; spätere Event-Inseln an den
// anderen Wegen nutzen dieselbe Anbindung (Brücke + Torbögen) mit anderer Richtung.
// Licht: unsichtbare Lichtblöcke (Stufe 9) nur wo nötig, per Lichtsimulation, damit keine Monster spawnen, aber nicht taghell.
// Aufruf: node spawn/weihnachtsinsel.mjs [ausgabe=spawn]            → <ausgabe>/datapack/weihnachtsinsel (Funktionen + Strukturen)
//         node spawn/weihnachtsinsel.mjs --vorschau <ordner>        → stufe_1.schem … stufe_4.schem (kumulativ, mit Licht) + bereich.json
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { neu, setze, LUFT, speichere } from '../tools/schem.mjs';
import { struktur } from '../tools/schem-struktur.mjs';
import { rauschen, zufall } from './entwuerfe/basis.mjs';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
// Spark-Mitte (Drehpunkt), Abstand der Inselmitte, Richtung des Wegs; Laufhöhe 155 (oberster Block 154)
export const SPARK = { x: -1, z: 47 };
export const LAGE = { richtung: 'nord', abstand: 81, oben: 154, radius: 24, brueckeAb: 17 };
const b = (n) => `minecraft:${n}`;
const LAUB = b('spruce_leaves[distance=7,persistent=true,waterlogged=false]');
const BIRNE = (an, art = '') => b(`waxed_${art}copper_bulb[lit=${an},powered=false]`);
const LICHTBLOCK = b('light[level=9,waterlogged=false]');

// ---------- Drehung Ost-Rahmen → Zielrichtung (um die Spark-Mitte) ----------
const DREH = { ost: 0, sued: 1, west: 2, nord: 3 }; // Vierteldrehungen von oben gesehen (Ost → Süd → West → Nord)
const FACING = ['east', 'south', 'west', 'north'];
function dreher(richtung) {
  const n = DREH[richtung];
  const punkt = (x, z) => { let dx = x - SPARK.x, dz = z - SPARK.z; for (let i = 0; i < n; i++) [dx, dz] = [-dz, dx]; return [SPARK.x + dx, SPARK.z + dz]; };
  const zustand = (bl) => bl.replace(/facing=(east|south|west|north)/, (_, f) => `facing=${FACING[(FACING.indexOf(f) + n) % 4]}`)
    .replace(/axis=(x|z)/, (_, a) => `axis=${n % 2 ? (a === 'x' ? 'z' : 'x') : a}`);
  return { punkt, zustand };
}

export function inselBloecke(lage = LAGE) {
  const CX = SPARK.x + lage.abstand, CZ = SPARK.z, T = lage.oben, R0 = lage.radius;
  const stufen = [new Map(), new Map(), new Map(), new Map()];
  const welt = new Map();
  const K = (x, y, z) => `${x},${y},${z}`;
  const set = (s, x, y, z, bl) => { stufen[s].set(K(x, y, z), bl); welt.set(K(x, y, z), bl); };
  const weg = (s, x, y, z) => { stufen[s].delete(K(x, y, z)); welt.delete(K(x, y, z)); };
  const get = (x, y, z) => welt.get(K(x, y, z)) ?? LUFT;
  const r = (x, z) => Math.hypot(x - CX, z - CZ);
  const winkel = (x, z) => Math.atan2(z - CZ, x - CX);
  const rand = (x, z) => R0 + 3.5 * (rauschen(Math.cos(winkel(x, z)) * 4 + 10, Math.sin(winkel(x, z)) * 4 + 10, 1.6, 3) - 0.5) * 2;

  // ---------- Stufe 1: Insel ----------
  for (let x = CX - R0 - 5; x <= CX + R0 + 5; x++) for (let z = CZ - R0 - 5; z <= CZ + R0 + 5; z++) {
    const d = r(x, z), Rr = rand(x, z);
    if (d > Rr) continue;
    const t = d / Rr;
    const tiefe = Math.round((1 - Math.pow(t, 1.4)) * (30 + 22 * rauschen(x, z, 5, 5)) + 3 + (rauschen(x, z, 2.5, 6) > 0.72 ? 6 : 0));
    for (let y = T - tiefe; y <= T; y++) {
      const vonOben = T - y, vonUnten = y - (T - tiefe);
      let bl;
      if (vonOben === 0) bl = zufall(x, 1, z) < 0.18 && t > 0.45 ? b('grass_block[snowy=true]') : b('snow_block');
      else if (vonOben <= 3 && t < 0.9) bl = b('dirt');
      else if (vonOben <= 2) bl = vonOben === 1 ? b('snow_block') : b('stone');
      else if (vonUnten <= 1 && t > 0.3) bl = zufall(x, y, z) < 0.3 ? b('packed_ice') : zufall(x, y, z, 2) < 0.5 ? b('snow_block') : b('cobblestone');
      else { const q = rauschen(x + y * 0.7, z - y * 0.5, 5, 9); bl = q < 0.3 ? b('stone') : q < 0.5 ? b('andesite') : q < 0.66 ? b('tuff') : q < 0.8 ? b('cobblestone') : q < 0.9 ? b('calcite') : b('deepslate'); }
      if (vonOben > 4 && t > 0.9 && zufall(x, y, z, 4) < 0.15) bl = b('packed_ice');
      if (vonOben > 6 && rauschen(x, z + y, 4, 12) > 0.9) bl = b('blue_ice');
      set(0, x, y, z, bl);
    }
    if (t > 0.25 && zufall(x, 2, z, 8) < 0.06) { const l = 1 + Math.floor(zufall(x, 3, z) * 4); for (let i = 1; i <= l; i++) set(0, x, T - tiefe - i, z, b('packed_ice')); }
    if (get(x, T, z) === b('grass_block[snowy=true]')) set(0, x, T + 1, z, b('snow[layers=1]'));
  }
  // Platz in der Mitte (Radius 9), Weg zur Brücke
  for (let x = CX - 10; x <= CX + 10; x++) for (let z = CZ - 10; z <= CZ + 10; z++) {
    const d = r(x, z); if (d > 9.5) continue;
    set(0, x, T, z, d > 8.4 ? b('polished_andesite') : d < 2.2 ? b('spruce_planks') : zufall(x, 5, z) < 0.15 ? b('cracked_stone_bricks') : b('stone_bricks'));
    weg(0, x, T + 1, z);
  }
  const westRand = Math.ceil(CX - rand(CX - R0, CZ));
  for (let x = westRand - 1; x <= CX - 9; x++) for (let dz = -1; dz <= 1; dz++) { set(0, x, T, CZ + dz, dz === 0 ? b('stone_bricks') : b('polished_andesite')); weg(0, x, T + 1, CZ + dz); }
  // kleine verschneite Fichten
  for (const [dist, w] of [[14, 0.7], [16, 1.9], [15, 4.0], [17, 5.0], [14, 2.9], [16, 5.8]]) {
    const tx = Math.round(CX + dist * Math.cos(w)), tz = Math.round(CZ + dist * Math.sin(w)), h = 7 + Math.floor(zufall(tx, 9, tz) * 3);
    if (Math.abs(tz - CZ) <= 2 && tx < CX) continue;
    for (let i = 1; i <= h; i++) set(0, tx, T + i, tz, b('spruce_log[axis=y]'));
    for (let i = 2; i <= h + 1; i++) { const rr = Math.max(0, Math.round((h + 1 - i) * 0.42 + ((i % 2) ? 0.6 : 0))); for (let dx = -rr; dx <= rr; dx++) for (let dz = -rr; dz <= rr; dz++) if (Math.abs(dx) + Math.abs(dz) <= rr + 0.5 && (dx || dz || i > h)) set(0, tx + dx, T + i, tz + dz, LAUB); }
    set(0, tx, T + h + 2, tz, b('snow[layers=1]'));
  }
  // Pfosten am Platz (Kerzen ab Stufe 3, Laternen ab Stufe 4)
  const pfosten = [];
  for (let i = 0; i < 8; i++) { const w = i * Math.PI / 4 + Math.PI / 8; pfosten.push([Math.round(CX + 8.9 * Math.cos(w)), Math.round(CZ + 8.9 * Math.sin(w))]); }
  for (const [px, pz] of pfosten) { set(0, px, T + 1, pz, b('spruce_fence')); set(0, px, T + 2, pz, b('spruce_fence')); set(0, px, T + 3, pz, b('stripped_spruce_wood[axis=y]')); }

  // ---------- Stufe 1: Brücke (5 breit, leichter Bogen), Geländer mit Girlande, Pfosten mit Laternen, drei Torbögen ----------
  const bx0 = lage.brueckeAb, bx1 = westRand + 1, bz = CZ;
  const deck = (x) => T + Math.round(Math.sin(((x - bx0) / (bx1 - bx0)) * Math.PI) * 2);
  const brueckeBloecke = [];
  const bset = (x, y, z, bl) => { set(0, x, y, z, bl); brueckeBloecke.push([x, y, z]); };
  for (let x = bx0; x <= bx1; x++) {
    const y = deck(x), pf = (x - bx0) % 4 === 0;
    for (let dz = -2; dz <= 2; dz++) {
      const kante = Math.abs(dz) === 2;
      bset(x, y, bz + dz, kante ? b('stripped_spruce_log[axis=x]') : (dz === 0 ? b('spruce_planks') : b('stripped_spruce_wood[axis=x]')));
      if (!kante) { for (let k = 1; k <= 3; k++) weg(0, x, y + k, bz + dz); bset(x, y - 1, bz + dz, b('spruce_slab[type=top,waterlogged=false]')); }
      if (kante) {
        if (pf) { bset(x, y + 1, bz + dz, b('stripped_spruce_wood[axis=y]')); bset(x, y + 2, bz + dz, b('red_wool')); bset(x, y + 3, bz + dz, b('lantern[hanging=false,waterlogged=false]')); }
        else { bset(x, y + 1, bz + dz, b('spruce_fence')); bset(x, y + 2, bz + dz, (x - bx0) % 4 === 2 ? BIRNE(true, 'exposed_') : LAUB); }
        if ((x - bx0) % 8 === 4) { bset(x, y - 1, bz + dz, b('chain[axis=y]')); bset(x, y - 2, bz + dz, b('lantern[hanging=true,waterlogged=false]')); }
      }
    }
  }
  // Torbogen quer über die Brücke: Säulen bei dz ±3, Bogen aus Treppen, Balken, Kranz aus Laub mit roter Schleife, hängende Laterne,
  // Kupferbirnen auf den Säulen. Dieselbe Form für alle Anbindungen (Spark-Insel → Brücke → Event-Insel)
  const torbogen = (x) => {
    const y = deck(x);
    for (const dz of [-3, 3]) {
      bset(x, y, bz + dz, b('stripped_spruce_log[axis=x]'));
      for (let k = -2; k < 0; k++) bset(x, y + k, bz + dz, b('stripped_spruce_wood[axis=y]'));
      for (let k = 1; k <= 6; k++) bset(x, y + k, bz + dz, b('stripped_spruce_wood[axis=y]'));
      bset(x, y + 7, bz + dz, BIRNE(true, 'exposed_'));
      for (const dx of [-1, 1]) for (let k = 2; k <= 6; k += 2) bset(x + dx, y + k, bz + dz, LAUB);
    }
    for (let dz = -2; dz <= 2; dz++) bset(x, y + 7, bz + dz, b('spruce_log[axis=z]'));
    bset(x, y + 6, bz - 2, b('spruce_stairs[facing=north,half=top,shape=straight,waterlogged=false]'));
    bset(x, y + 6, bz + 2, b('spruce_stairs[facing=south,half=top,shape=straight,waterlogged=false]'));
    for (let dz = -3; dz <= 3; dz++) bset(x, y + 8, bz + dz, Math.abs(dz) <= 1 ? b('red_wool') : LAUB);
    for (const dz of [-2, -1, 0, 1, 2]) { bset(x - 1, y + 7, bz + dz, LAUB); bset(x + 1, y + 7, bz + dz, LAUB); }
    bset(x, y + 9, bz, b('red_wool'));
    bset(x, y + 6, bz, b('chain[axis=y]')); bset(x, y + 5, bz, b('lantern[hanging=true,waterlogged=false]'));
  };
  for (const x of [bx0 + 1, Math.round((bx0 + bx1) / 2), bx1 - 1]) torbogen(x);

  // ---------- Stufe 2: großer Weihnachtsbaum (5 Wachstumsschritte) ----------
  const BH = 42, BR = 13.5, basis = T + 1;
  const baum = (s) => {
    const out = new Map(); const h = Math.round(BH * s), rmax = BR * s;
    for (let i = 0; i < Math.round(h * 0.85); i++) for (const [dx, dz] of i < h * 0.5 ? [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]] : [[0, 0]]) out.set(K(CX + dx, basis + i, CZ + dz), b('spruce_log[axis=y]'));
    for (let i = Math.round(h * 0.12); i <= h; i++) {
      const tt = i / h, l7 = (tt * 7) % 1, rr = rmax * (1 - tt) * (0.62 + 0.38 * (1 - l7)) + 0.6;
      for (let dx = -Math.ceil(rr); dx <= Math.ceil(rr); dx++) for (let dz = -Math.ceil(rr); dz <= Math.ceil(rr); dz++) {
        const dd = Math.hypot(dx, dz), w = Math.atan2(dz, dx);
        if (dd <= rr * (0.88 + 0.12 * Math.sin(w * 5 + i))) { const k = K(CX + dx, basis + i, CZ + dz); if (!out.has(k)) out.set(k, LAUB); }
      }
    }
    out.set(K(CX, basis + h, CZ), LAUB);
    return out;
  };
  const wachstum = [0.3, 0.5, 0.7, 0.85, 1].map(baum);
  for (const [k, v] of wachstum.at(-1)) { const [x, y, z] = k.split(',').map(Number); set(1, x, y, z, v); }
  const schnee = new Map();
  for (const [k, v] of wachstum.at(-1)) { if (v !== LAUB) continue; const [x, y, z] = k.split(',').map(Number); if (get(x, y + 1, z) === LUFT && zufall(x, y, z, 11) < 0.7) { set(1, x, y + 1, z, b('snow[layers=1]')); schnee.set(K(x, y + 1, z), b('snow[layers=1]')); } }
  // Jeder Schritt räumt das Laub des vorigen, das nicht mehr dazugehört, per Höhlenluft weg (place template setzt sie, normale Luft nicht);
  // kein fill, sonst verlieren die kleinen Fichten ihre Nadeln
  const baumTeile = wachstum.map((m, i) => {
    const t2 = new Map(m);
    if (i > 0) for (const [k, v] of wachstum[i - 1]) if (v === LAUB && !m.has(k)) t2.set(k, b('cave_air'));
    if (i === 4) schnee.forEach((v, k) => t2.set(k, v));
    return t2;
  });

  // ---------- Stufe 3: Schmuck ----------
  const aussen = [];
  for (const [k, v] of wachstum.at(-1)) {
    if (v !== LAUB) continue; const [x, y, z] = k.split(',').map(Number);
    const dx = Math.sign(x - CX), dz = Math.sign(z - CZ);
    if ((dx && get(x + dx, y, z) === LUFT) || (dz && get(x, y, z + dz) === LUFT)) aussen.push([x, y, z]);
  }
  const birnen = [];
  for (const [x, y, z] of aussen) {
    const w = (winkel(x, z) + Math.PI) / (2 * Math.PI), u = (y - basis) / BH * 3.2;
    const p1 = ((w - u) % 1 + 1) % 1, p2 = ((w - u + 0.5) % 1 + 1) % 1;
    if (p1 < 0.05) { set(2, x, y, z, BIRNE(false)); birnen.push([x, y, z]); }
    else if (p2 < 0.045) set(2, x, y, z, b('red_wool'));
    else if (zufall(x, y, z, 21) < 0.1) set(2, x, y, z, [b('gold_block'), b('red_wool'), b('white_wool'), b('light_blue_wool')][Math.floor(zufall(x, y, z, 22) * 4)]);
  }
  // Stern (9 × 9, fünfzackig, Fläche zeigt zur Spark-Insel); Kern in Stufe 3 schwach (verwitterte Kupferbirne, Licht 8), in Stufe 4 Glowstone
  const st = basis + BH + 3;
  const FORM = ['....#....', '....#....', '...###...', '#########', '.#######.', '..#####..', '..##.##..', '.##...##.', '.#.....#.'];
  const kern = [];
  FORM.forEach((zeile, i) => [...zeile].forEach((c, j) => {
    if (c !== '#') return; const dz = j - 4, dy = 4 - i;
    const mitte = Math.abs(dz) + Math.abs(dy - 1) <= 1;
    set(2, CX, st + dy, CZ + dz, mitte ? BIRNE(true, 'weathered_') : b('gold_block'));
    if (mitte) kern.push([CX, st + dy, CZ + dz]);
  }));
  for (let y = basis + BH; y < st - 1; y++) set(2, CX, y, CZ, b('gold_block'));
  const farben = ['red', 'lime', 'light_blue', 'yellow', 'white', 'purple', 'orange', 'green'];
  for (let i = 0; i < 14; i++) {
    const w = i * 2 * Math.PI / 14 + 0.3, gx = Math.round(CX + 6.2 * Math.cos(w)), gz = Math.round(CZ + 6.2 * Math.sin(w));
    if (Math.abs(gz - CZ) <= 1 && gx < CX) continue;
    const fa = farben[i % 8];
    set(2, gx, T + 1, gz, b(`${fa}_concrete`));
    if (i % 3 === 0) { set(2, gx, T + 2, gz, b(`${fa}_concrete`)); set(2, gx, T + 3, gz, b(`${farben[(i + 3) % 8]}_carpet`)); }
    else set(2, gx, T + 2, gz, b(`${farben[(i + 3) % 8]}_carpet`));
  }
  for (const [px, pz] of pfosten) set(2, px, T + 4, pz, b('red_candle[candles=3,lit=false,waterlogged=false]'));

  // ---------- Stufe 4: Lichter an ----------
  for (const [x, y, z] of birnen) set(3, x, y, z, BIRNE(true));
  for (const [x, y, z] of kern) set(3, x, y, z, b('glowstone'));
  for (const [px, pz] of pfosten) {
    set(3, px, T + 4, pz, b('red_candle[candles=3,lit=true,waterlogged=false]'));
    const innenX = Math.abs(px - CX) >= Math.abs(pz - CZ);
    set(3, px + (innenX ? Math.sign(CX - px) : 0), T + 1, pz + (innenX ? 0 : Math.sign(CZ - pz)), b('lantern[hanging=false,waterlogged=false]'));
  }
  for (const [dz, dy] of [[0, 5], [5, 2], [-5, 2]]) set(3, CX, st + dy, CZ + dz, b(`end_rod[facing=${dy === 5 ? 'up' : dz > 0 ? 'south' : 'north'}]`));

  // ---------- drehen ----------
  const { punkt, zustand } = dreher(lage.richtung);
  const dp = (x, y, z) => { const [X, Z] = punkt(x, z); return [X, y, Z]; };
  const drehMap = (m) => new Map([...m].map(([k, v]) => { const [x, y, z] = k.split(',').map(Number); return [K(...dp(x, y, z)), zustand(v)]; }));
  return {
    stufen: stufen.map(drehMap), wachstum: baumTeile.map(drehMap),
    bruecke: brueckeBloecke.map(([x, y, z]) => dp(x, y, z)), brueckeVon: dp(bx0, T, bz), brueckeBis: dp(bx1, T, bz),
    mitte: dp(CX, T, CZ), basis, hoehe: BH, baumRadius: Math.ceil(BR) + 1, stern: dp(CX, st, CZ),
    kiste: dp(bx0 - 2, T + 1, bz + 3), tafel: dp(bx0 - 2, T + 4, bz - 3),
  };
}

// ---------- Licht gegen Monster: Lichtsimulation, Lichtblöcke (Stufe 9) nur an dunklen Spawnstellen ----------
const DURCH = /^minecraft:(air|light|snow|spruce_fence|chain|lantern|end_rod|[a-z_]*carpet|[a-z_]*candle)(\[|$)/;
const emitter = (bl) => {
  let m;
  if ((m = bl.match(/^minecraft:light\[level=(\d+)/))) return +m[1];
  if (/^minecraft:(lantern|glowstone|shroomlight)/.test(bl)) return 15;
  if (/^minecraft:end_rod/.test(bl)) return 14;
  if (/copper_bulb\[lit=true/.test(bl)) return bl.includes('oxidized_') ? 4 : bl.includes('weathered_') ? 8 : bl.includes('exposed_') ? 12 : 15;
  if ((m = bl.match(/candle\[candles=(\d).*lit=true/))) return 3 * +m[1];
  return 0;
};
export function lichter(welt) {
  let lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (const k of welt.keys()) { const p = k.split(',').map(Number); for (let i = 0; i < 3; i++) { lo[i] = Math.min(lo[i], p[i]); hi[i] = Math.max(hi[i], p[i]); } }
  lo = lo.map((v) => v - 10); hi = hi.map((v) => v + 10);
  const [W, H, L] = [0, 1, 2].map((i) => hi[i] - lo[i] + 1);
  const idx = (x, y, z) => (x - lo[0]) + (z - lo[2]) * W + (y - lo[1]) * W * L;
  const N = W * H * L, kosten = new Uint8Array(N).fill(1), hell = new Uint8Array(N);
  for (const [k, v] of welt) { const [x, y, z] = k.split(',').map(Number); kosten[idx(x, y, z)] = DURCH.test(v) ? 1 : v.includes('leaves') || /^minecraft:ice$/.test(v) ? 2 : 0; }
  const ausbreiten = (start) => {
    const q = [...start];
    while (q.length) {
      const i = q.pop(), l = hell[i]; if (l <= 1) continue;
      const x = i % W, z = ((i / W) | 0) % L, y = (i / (W * L)) | 0;
      for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
        const X = x + dx, Y = y + dy, Z = z + dz; if (X < 0 || Y < 0 || Z < 0 || X >= W || Y >= H || Z >= L) continue;
        const j = X + Z * W + Y * W * L, c = kosten[j]; if (!c) continue;
        const nl = l - c; if (nl > hell[j]) { hell[j] = nl; q.push(j); }
      }
    }
  };
  const start = [];
  for (const [k, v] of welt) { const e = emitter(v); if (e) { const [x, y, z] = k.split(',').map(Number); const i = idx(x, y, z); hell[i] = e; start.push(i); } }
  ausbreiten(start);
  // Spawnstellen: frei mit freiem Block darüber, darunter ein voller Block, auf dem Monster stehen können (kein Laub, keine Platte unten …)
  const frei = (bl) => bl === LUFT || /^minecraft:(snow|light)(\[|$)/.test(bl);
  const boden = (bl) => bl !== LUFT && !DURCH.test(bl) && !/leaves|slab\[type=bottom|stairs|_fence|_wall|glass/.test(bl);
  const stellen = [];
  for (const [k, v] of welt) {
    if (!boden(v)) continue; const [x, y, z] = k.split(',').map(Number);
    const a = welt.get(`${x},${y + 1},${z}`) ?? LUFT, c = welt.get(`${x},${y + 2},${z}`) ?? LUFT;
    if (frei(a) && frei(c)) stellen.push([x, y + 1, z, a === LUFT]);
  }
  stellen.sort((p, q) => q[1] - p[1] || p[0] - q[0] || p[2] - q[2]);
  const neue = [];
  for (const [x, y, z, luft] of stellen) {
    if (hell[idx(x, y, z)] > 0) continue;
    const ly = luft ? y : y + 1; // auf Schneeschicht: Licht darüber
    if ((welt.get(`${x},${ly},${z}`) ?? LUFT) !== LUFT) continue;
    const i = idx(x, ly, z); hell[i] = 9; neue.push([x, ly, z]); ausbreiten([i]);
  }
  return neue;
}

// ---------- Strukturen und Funktionen ----------
function bereich(bloecke) {
  let lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (const k of bloecke.keys()) { const p = k.split(',').map(Number); for (let i = 0; i < 3; i++) { lo[i] = Math.min(lo[i], p[i]); hi[i] = Math.max(hi[i], p[i]); } }
  return { lo, hi };
}
function teilStruktur(bloecke) {
  const { lo, hi } = bereich(bloecke);
  const m = neu(hi[0] - lo[0] + 1, hi[1] - lo[1] + 1, hi[2] - lo[2] + 1, 3955);
  for (const [k, v] of bloecke) { const [x, y, z] = k.split(',').map(Number); setze(m, x - lo[0], y - lo[1], z - lo[2], v); }
  return { nbt: struktur(m), ecke: lo };
}
// fill in Scheiben unter 32768 Blöcken
const fillsLuft = ([x1, y1, z1], [x2, y2, z2], filter = '') => {
  const out = [], proY = Math.max(1, Math.floor(32768 / ((x2 - x1 + 1) * (z2 - z1 + 1))));
  for (let y = y1; y <= y2; y += proY) out.push(`fill ${x1} ${y} ${z1} ${x2} ${Math.min(y2, y + proY - 1)} ${z2} minecraft:air${filter}`);
  return out;
};

export function datapack(lage = LAGE) {
  const I = inselBloecke(lage);
  const K = (x, y, z) => `${x},${y},${z}`;
  const NS = 'weihnachtsinsel', f = {}, strukturen = {};
  const struk = (name, bloecke) => { if (!bloecke.size) return null; const { nbt, ecke } = teilStruktur(bloecke); strukturen[name] = nbt; return `place template ${NS}:${name} ${ecke.join(' ')}`; };
  const gesamt = new Map(); I.stufen.forEach((m) => m.forEach((v, k) => gesamt.set(k, v)));
  const { lo, hi } = bereich(gesamt);
  const fl = `${lo[0]} ${lo[2]} ${hi[0]} ${hi[2]}`;
  const [mx, my, mz] = I.mitte;
  const kasten = `x=${lo[0]},y=${lo[1]},z=${lo[2]},dx=${hi[0] - lo[0]},dy=${hi[1] - lo[1]},dz=${hi[2] - lo[2]}`;
  const effekt = (x, y, z, partikel, klang) => `particle ${partikel} ${x} ${y} ${z} 6 3 6 0.02 200 force @a\nplaysound ${klang} master @a ${x} ${y} ${z} 4 1`;
  const titel = (a, u) => `title @a times 10 70 20\ntitle @a subtitle ${JSON.stringify({ text: u, color: 'white' })}\ntitle @a title ${JSON.stringify({ text: a, color: 'gold', bold: true })}`;
  const schritte = [[], [], [], []], komplett = [[], [], [], []];

  // Stufe 1: Insel in 8 Schichten von unten, dann Brücke in 8 Abschnitten von der Spark-Insel aus
  const s1 = I.stufen[0], brueckeSet = new Set(I.bruecke.map((p) => K(...p)));
  const insel = new Map([...s1].filter(([k]) => !brueckeSet.has(k))), br = new Map([...s1].filter(([k]) => brueckeSet.has(k)));
  const iy = [...insel.keys()].map((k) => +k.split(',')[1]), y0 = Math.min(...iy), y1 = Math.max(...iy), sch = Math.ceil((y1 - y0 + 1) / 8);
  for (let i = 0; i < 8; i++) {
    const p = struk(`s1_insel_${i}`, new Map([...insel].filter(([k]) => { const y = +k.split(',')[1]; return y >= y0 + i * sch && y < y0 + (i + 1) * sch; })));
    if (p) { schritte[0].push(`${p}\n${effekt(mx, y0 + i * sch, mz, 'minecraft:snowflake', 'minecraft:block.amethyst_block.chime')}`); komplett[0].push(p); }
  }
  const achse = I.brueckeVon[0] === I.brueckeBis[0] ? 2 : 0, von = I.brueckeVon[achse], bis = I.brueckeBis[achse], sg = Math.sign(bis - von);
  for (let i = 0; i < 8; i++) {
    const a = von + (bis - von) * i / 8, e = von + (bis - von) * (i + 1) / 8;
    const teil = new Map([...br].filter(([k]) => { const p = +k.split(',')[achse]; return (i === 0 || (p - a) * sg >= 0) && (i === 7 || (p - e) * sg < 0); }));
    const p = struk(`s1_bruecke_${i}`, teil);
    if (p) { const [px, py, pz] = [...teil.keys()][0].split(',').map(Number); schritte[0].push(`${p}\nplaysound minecraft:block.wood.place master @a ${px} ${py} ${pz} 3 0.8\nparticle minecraft:snowflake ${px} ${py + 1} ${pz} 2 1 2 0.02 40 force @a`); komplett[0].push(p); }
  }
  // Stufe 2: Wachstum (vor jedem Schritt das Laub im Baumbereich weg, der Stamm bleibt)
  const R = I.baumRadius, bb = [[mx - R, I.basis, mz - R], [mx + R, I.basis + I.hoehe + 2, mz + R]];
  // fertig (Wiederaufnahme): Endstand plus Höhlenluft für das Laub aller früheren Schritte, das im Endstand fehlt
  const baumEnde = new Map(I.wachstum[4]);
  for (const m of I.wachstum.slice(0, 4)) for (const [k, v] of m) if (v.includes('leaves') && !baumEnde.has(k)) baumEnde.set(k, 'minecraft:cave_air');
  const baumFertig = struk('s2_baum_fertig', baumEnde);
  I.wachstum.forEach((m, i) => { const p = struk(`s2_baum_${i}`, m); schritte[1].push(`${p}\n${effekt(mx, I.basis + Math.round(I.hoehe * (i + 1) / 6), mz, 'minecraft:happy_villager', 'minecraft:item.bone_meal.use')}`); if (i === 4) komplett[1].push(baumFertig); });
  // Stufe 3: Schmuck in 4 Höhenbändern von unten
  const s3 = I.stufen[2], h3 = [...s3.keys()].map((k) => +k.split(',')[1]), a3 = Math.min(...h3), e3 = Math.max(...h3), b3 = Math.ceil((e3 - a3 + 1) / 4);
  for (let i = 0; i < 4; i++) {
    const p = struk(`s3_schmuck_${i}`, new Map([...s3].filter(([k]) => { const y = +k.split(',')[1]; return y >= a3 + i * b3 && y < a3 + (i + 1) * b3; })));
    if (p) { schritte[2].push(`${p}\n${effekt(mx, a3 + i * b3 + 4, mz, 'minecraft:wax_on', 'minecraft:block.amethyst_block.resonate')}`); komplett[2].push(p); }
  }
  // Stufe 4: Kupferbirnen bandweise an (fill … replace), dann Kerzen, Laternen, Stern
  for (let y = I.basis; y <= I.basis + I.hoehe; y += 4) {
    const z = `fill ${mx - R} ${y} ${mz - R} ${mx + R} ${Math.min(y + 3, I.basis + I.hoehe)} ${mz + R} minecraft:waxed_copper_bulb[lit=true] replace minecraft:waxed_copper_bulb[lit=false]`;
    schritte[3].push(`${z}\nplaysound minecraft:block.copper_bulb.turn_on master @a ${mx} ${y} ${mz} 4 1.2`); komplett[3].push(z);
  }
  { const p = struk('s4_lichter', new Map([...I.stufen[3]].filter(([, v]) => !v.includes('copper_bulb')))); schritte[3].push(`${p}\n${effekt(...I.stern, 'minecraft:end_rod', 'minecraft:block.bell.resonate')}`); komplett[3].push(p); }

  // Licht je Stufe auf dem kumulierten Stand; fertig_N setzt die ganze Stufe (Ende des Effekts bzw. Wiederaufnahme nach Neustart)
  const kumul = new Map(), lichtZahl = [];
  for (let s = 0; s < 4; s++) {
    I.stufen[s].forEach((v, k) => kumul.set(k, v));
    const neue = lichter(kumul); neue.forEach((p) => kumul.set(K(...p), LICHTBLOCK));
    lichtZahl.push(neue.length);
    const p = struk(`s${s + 1}_licht`, new Map(neue.map((q) => [K(...q), LICHTBLOCK])));
    f[`stufe_${s + 1}/fertig`] = `# Stufe ${s + 1} vollständig setzen (Ende des Effekts bzw. Wiederaufnahme nach Neustart), dazu unsichtbares Licht gegen Monster\n${[...komplett[s], p].filter(Boolean).join('\n')}\nkill @e[type=item,${kasten}]\n`;
  }
  const NAMEN = ['Die Insel taucht auf', 'Der Baum wächst', 'Der Baum wird geschmückt', 'Heiligabend'];
  const TAKT = [30, 50, 40, 14]; // Ticks zwischen den Schritten
  for (let s = 0; s < 4; s++) {
    const n = s + 1;
    f[`stufe_${n}`] = `# Stufe ${n} „${NAMEN[s]}“ (ruft serverwahl auf, sobald die Wunschliste voll ist). Ein zweiter Aufruf macht nichts.
execute if score #stufe wi_mission matches ${n}.. run return fail
execute unless score #stufe wi_mission matches ${n - 1}.. run return fail
scoreboard players set #stufe wi_mission ${n}
scoreboard players set #laeuft wi_mission ${n}
forceload add ${fl}
schedule function ${NS}:stufe_${n}/start 40t
`;
    f[`stufe_${n}/start`] = `${titel('Weihnachtsinsel', `Stufe ${n}: ${NAMEN[s]}`)}\nplaysound minecraft:block.bell.use master @a ${mx} ${my} ${mz} 6 0.8\n${schritte[s].map((_, i) => `schedule function ${NS}:stufe_${n}/schritt_${i} ${20 + i * TAKT[s]}t`).join('\n')}\nschedule function ${NS}:stufe_${n}/ende ${40 + schritte[s].length * TAKT[s]}t\n`;
    schritte[s].forEach((z, i) => { f[`stufe_${n}/schritt_${i}`] = z + '\n'; });
    f[`stufe_${n}/ende`] = `function ${NS}:stufe_${n}/fertig\nscoreboard players set #laeuft wi_mission 0\n${n === 4 ? `function ${NS}:feier\n` : `forceload remove ${fl}\n`}`;
  }
  // Feier (direkt nach Stufe 4): Titel, Glocken, ~2 min Feuerwerk rund um die Insel und über dem Baum
  const ring = Array.from({ length: 24 }, (_, i) => { const w = i * 2 * Math.PI / 24; return [Math.round(mx + 30 * Math.cos(w)), my + 22 + (i % 3) * 6, Math.round(mz + 30 * Math.sin(w))]; });
  const FARBEN = [[16777215, 12245247], [16766720, 16777215], [13382451, 16766720], [11393254, 16777215], [3381555, 16711680]];
  const rakete = ([x, y, z], i) => `summon firework_rocket ${x} ${y} ${z} {LifeTime:${20 + (i % 3) * 6},FireworksItem:{id:"minecraft:firework_rocket",count:1,components:{"minecraft:fireworks":{flight_duration:1,explosions:[{shape:"${['large_ball', 'star', 'burst', 'small_ball'][i % 4]}",colors:[I;${FARBEN[i % 5].join(',')}],fade_colors:[I;8439039],has_twinkle:${i % 2 ? 'true' : 'false'},has_trail:true}]}}}}`;
  const zeilen = [];
  for (let n = 1; n <= 240; n++) zeilen.push(`execute if score #feuer wi_mission matches ${n} run ${rakete(n % 6 === 0 ? [mx + ((n * 7) % 9) - 4, I.basis + I.hoehe + 4, mz + ((n * 5) % 9) - 4] : ring[(n * 7) % 24], n)}`);
  f.feier = `# Feier am Ende von Stufe 4: Titel, Glocken, ~2 min Feuerwerk. Einzeln auslösbar (Test).\nforceload add ${fl}\nscoreboard players set #feuer wi_mission 0\n${titel('Frohe Weihnachten!', 'Die Weihnachtsinsel leuchtet – danke fürs Spenden!')}\nplaysound minecraft:block.bell.use master @a ${mx} ${my} ${mz} 8 0.7\nschedule function ${NS}:feier/schritt 20t\n`;
  f['feier/schritt'] = `scoreboard players add #feuer wi_mission 1\n${zeilen.join('\n')}\nexecute if score #feuer wi_mission matches 120 run playsound minecraft:block.bell.use master @a ${mx} ${my} ${mz} 8 1.2\nexecute if score #feuer wi_mission matches ..239 run schedule function ${NS}:feier/schritt 10t\nexecute if score #feuer wi_mission matches 240.. run forceload remove ${fl}\n`;
  // Vorbereiten: Spendenkiste und Tafel am Brückenkopf (Spark-Insel); den Text der Tafel schreibt serverwahl
  const [kx, ky, kz] = I.kiste, [tx, ty, tz] = I.tafel;
  const blickYaw = { nord: 0, sued: 180, ost: 90, west: 270 }[lage.richtung]; // Tafel schaut zum Spawn
  f.vorbereiten = `# Spendenkiste und Tafel am Brückenkopf auf der Spark-Insel (vor dem Missionsstart)
fill ${kx} ${ky} ${kz} ${kx} ${ky + 2} ${kz} minecraft:air
setblock ${kx} ${ky - 1} ${kz} minecraft:spruce_planks
setblock ${kx} ${ky} ${kz} minecraft:chest[facing=${{ nord: 'south', sued: 'north', ost: 'west', west: 'east' }[lage.richtung]}]
kill @e[type=text_display,tag=wi_tafel]
summon text_display ${tx + 0.5} ${ty + 0.5} ${tz + 0.5} {Tags:["wi_tafel"],Rotation:[${blickYaw}f,0f],billboard:"fixed",alignment:"center",line_width:260,background:1140850688,text:[${JSON.stringify({ text: 'Weihnachtsinsel\n', color: 'gold', bold: true })},${JSON.stringify({ text: 'Spende an der Kiste – gemeinsam\nlassen wir die Insel entstehen!', color: 'white' })}],transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[1.2f,1.2f,1.2f]}}
`;
  f.load = `scoreboard objectives add wi_mission dummy\nexecute unless score #stufe wi_mission matches 0.. run scoreboard players set #stufe wi_mission 0\nexecute if score #laeuft wi_mission matches 1.. run schedule function ${NS}:wiederaufnahme 100t\n`;
  f.wiederaufnahme = `# Neustart mitten in einem Effekt: Stufe vollständig setzen\nforceload add ${fl}\nschedule function ${NS}:wiederaufnahme2 40t\n`;
  f.wiederaufnahme2 = [1, 2, 3, 4].map((n) => `execute if score #laeuft wi_mission matches ${n} run function ${NS}:stufe_${n}/fertig`).join('\n') + `\nscoreboard players set #laeuft wi_mission 0\nforceload remove ${fl}\n`;
  f.zuruecksetzen = `# NUR TESTNETZ: Insel und Brücke entfernen, Stand auf 0\nforceload add ${fl}\nschedule function ${NS}:zuruecksetzen2 40t\n`;
  f.zuruecksetzen2 = `${fillsLuft(lo, hi).join('\n')}\nkill @e[type=item,${kasten}]\nscoreboard players set #stufe wi_mission 0\nscoreboard players set #laeuft wi_mission 0\nforceload remove ${fl}\nsay Weihnachtsinsel zurückgesetzt\n`;
  return { funktionen: f, strukturen, bereich: { lo, hi }, kiste: I.kiste, tafel: I.tafel, mitte: I.mitte, lichter: lichtZahl, insel: I, kumul };
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('spawn/weihnachtsinsel.mjs')) {
  if (process.argv[2] === '--vorschau') {
    const aus = process.argv[3]; mkdirSync(aus, { recursive: true });
    const { insel, bereich: { lo, hi } } = datapack();
    const kum = new Map(), K = (x, y, z) => `${x},${y},${z}`;
    for (let s = 0; s < 4; s++) {
      insel.stufen[s].forEach((v, k) => kum.set(k, v));
      lichter(kum).forEach((p) => kum.set(K(...p), LICHTBLOCK));
      const m = neu(hi[0] - lo[0] + 1, hi[1] - lo[1] + 1, hi[2] - lo[2] + 1, 3955);
      for (const [k, v] of kum) { const [x, y, z] = k.split(',').map(Number); if (x >= lo[0] && y >= lo[1] && z >= lo[2] && x <= hi[0] && y <= hi[1] && z <= hi[2]) setze(m, x - lo[0], y - lo[1], z - lo[2], v); }
      writeFileSync(join(aus, `stufe_${s + 1}.schem`), speichere(m));
    }
    writeFileSync(join(aus, 'bereich.json'), JSON.stringify({ lo, hi }));
    console.log(`Vorschau → ${aus}, Bereich ${lo.join('/')} … ${hi.join('/')}`);
  } else {
    const aus = process.argv[2] ?? join(REPO, 'spawn');
    const { funktionen, strukturen, bereich: { lo, hi }, kiste, tafel, lichter: l } = datapack();
    const dp = join(aus, 'datapack/weihnachtsinsel');
    rmSync(dp, { recursive: true, force: true });
    for (const [n, t] of Object.entries(funktionen)) { const p = join(dp, 'data/weihnachtsinsel/function', `${n}.mcfunction`); mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, t); }
    for (const [n, t] of Object.entries(strukturen)) { const p = join(dp, 'data/weihnachtsinsel/structure', `${n}.nbt`); mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, t); }
    const ft = join(dp, 'data/minecraft/tags/function'); mkdirSync(ft, { recursive: true });
    writeFileSync(join(ft, 'load.json'), '{ "values": ["weihnachtsinsel:load"] }\n');
    writeFileSync(join(dp, 'pack.mcmeta'), JSON.stringify({ pack: { description: 'Server-Mission Weihnachtsinsel (spawn/weihnachtsinsel.mjs) – dauerhaft', min_format: [121, 0], max_format: [121, 0] } }, null, 2) + '\n');
    console.log(`Datapack weihnachtsinsel → ${dp}: ${Object.keys(funktionen).length} Funktionen, ${Object.keys(strukturen).length} Strukturen, Bereich ${lo.join('/')} … ${hi.join('/')}, Kiste ${kiste.join('/')}, Tafel ${tafel.join('/')}, Lichter je Stufe ${l.join('/')}`);
  }
}
