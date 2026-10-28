// Server-Mission „Weihnachtsinsel“ (Pascal 28.10.): schwebende Insel östlich der Spark-Insel am Ende des Ostwegs, entsteht in 4 Stufen durch Spenden.
// Eigenes Design, prozedural, kein fremdes Material. Stufe 1 Insel + Brücke, 2 großer Baum (wächst in Schritten), 3 Schmuck, 4 Lichter an (Heiligabend).
// Jede Stufe enthält nur ihre eigenen bzw. geänderten Blöcke (place template setzt keine Luft), Stufe 4 tauscht Kupferbirnen auf lit=true.
// Aufruf (Vorschau): node spawn/weihnachtsinsel.mjs <ausgabeordner>  → stufe_1.schem … stufe_4.schem (jeweils kumulativ, für Renderbilder)
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { neu, setze, hole, LUFT, speichere } from '../tools/schem.mjs';
import { rauschen, zufall } from './entwuerfe/basis.mjs';

// Lage in Weltkoordinaten: Mitte am Ostweg der Spark-Insel (Spark-Mitte −1/47, Ostweg endet bei x 19, Laufhöhe 155).
// Weitere Inseln später am Ende der anderen Wege im gleichen Abstand (~80): West −81/47, Nord −1/−33, Süd −1/127.
export const LAGE = { x: 80, z: 47, oben: 154, radius: 24, bruecke: { von: 20, z: 47 } };
// Volumen: x 18…110, y 100…214, z 17…77
export const URSPRUNG = [18, 100, 17];
const W = 93, H = 115, L = 61;

const b = (n) => `minecraft:${n}`;
const LAUB = b('spruce_leaves[distance=7,persistent=true,waterlogged=false]');
const BIRNE = (an) => b(`waxed_copper_bulb[lit=${an},powered=false]`);

export function inselBloecke() {
  const { x: CX, z: CZ, oben: T, radius: R0 } = LAGE;
  const [ox, oy, oz] = URSPRUNG;
  const stufen = [new Map(), new Map(), new Map(), new Map()]; // je Stufe: "x,y,z" → Block (Weltkoordinaten)
  const welt = new Map(); // aktueller Stand (für Abfragen)
  const set = (s, x, y, z, bl) => { const k = `${x},${y},${z}`; stufen[s].set(k, bl); welt.set(k, bl); };
  const get = (x, y, z) => welt.get(`${x},${y},${z}`) ?? LUFT;
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
    // Eiszapfen unter der Insel
    if (t > 0.25 && zufall(x, 2, z, 8) < 0.06) { const l = 1 + Math.floor(zufall(x, 3, z) * 4); for (let i = 1; i <= l; i++) set(0, x, T - tiefe - i, z, i === l ? b('ice') : b('packed_ice')); }
    // Schneedecke: Schneeschicht auf Grasflecken (Laufhöhe bleibt)
    if (get(x, T, z) === b('grass_block[snowy=true]')) set(0, x, T + 1, z, b('snow[layers=1]'));
  }
  // Platz in der Mitte (Radius 9) aus Steinziegeln mit Ring aus poliertem Andesit, Weg zur Brücke
  for (let x = CX - 10; x <= CX + 10; x++) for (let z = CZ - 10; z <= CZ + 10; z++) {
    const d = r(x, z); if (d > 9.5) continue;
    set(0, x, T, z, d > 8.4 ? b('polished_andesite') : d < 2.2 ? b('spruce_planks') : zufall(x, 5, z) < 0.15 ? b('cracked_stone_bricks') : b('stone_bricks'));
    if (get(x, T + 1, z) !== LUFT) stufen[0].delete(`${x},${T + 1},${z}`), welt.delete(`${x},${T + 1},${z}`);
  }
  const westRand = Math.ceil(CX - rand(CX - R0, CZ));
  for (let x = westRand - 1; x <= CX - 9; x++) for (let dz = -1; dz <= 1; dz++) {
    set(0, x, T, CZ + dz, dz === 0 ? b('stone_bricks') : b('polished_andesite'));
    welt.delete(`${x},${T + 1},${CZ + dz}`); stufen[0].delete(`${x},${T + 1},${CZ + dz}`);
  }
  // kleine verschneite Fichten im Ring
  const tannen = [[14, 0.7], [16, 1.9], [15, 3.1], [17, 4.0], [14, 5.0], [16, 5.8]];
  for (const [dist, w] of tannen) {
    const tx = Math.round(CX + dist * Math.cos(w)), tz = Math.round(CZ + dist * Math.sin(w)), h = 7 + Math.floor(zufall(tx, 9, tz) * 3);
    for (let i = 1; i <= h; i++) set(0, tx, T + i, tz, b('spruce_log[axis=y]'));
    for (let i = 2; i <= h + 1; i++) { const rr = Math.max(0, Math.round((h + 1 - i) * 0.42 + ((i % 2) ? 0.6 : 0))); for (let dx = -rr; dx <= rr; dx++) for (let dz = -rr; dz <= rr; dz++) if (Math.abs(dx) + Math.abs(dz) <= rr + 0.5 && (dx || dz || i > h)) set(0, tx + dx, T + i, tz + dz, LAUB); }
  }
  // Bänke und Laternenpfosten am Platz (Laternen erst in Stufe 4 an: hier Pfosten mit Kette)
  const pfosten = [];
  for (let i = 0; i < 8; i++) { const w = i * Math.PI / 4 + Math.PI / 8; pfosten.push([Math.round(CX + 8.9 * Math.cos(w)), Math.round(CZ + 8.9 * Math.sin(w))]); }
  for (const [px, pz] of pfosten) { set(0, px, T + 1, pz, b('spruce_fence')); set(0, px, T + 2, pz, b('spruce_fence')); set(0, px, T + 3, pz, b('stripped_spruce_wood[axis=y]')); }

  // ---------- Stufe 1: Brücke vom Ostweg (x 20) bis an den Inselrand, 3 breit, leichter Bogen ----------
  const bx0 = LAGE.bruecke.von, bx1 = westRand + 1, bz = LAGE.bruecke.z;
  for (let x = bx0; x <= bx1; x++) {
    const f = (x - bx0) / (bx1 - bx0), hub = Math.round(Math.sin(f * Math.PI) * 3), y = T + hub;
    for (let dz = -2; dz <= 2; dz++) {
      const rand2 = Math.abs(dz) === 2;
      set(0, x, y, bz + dz, rand2 ? b('stripped_spruce_log[axis=x]') : b('spruce_planks'));
      if (!rand2) set(0, x, y - 1, bz + dz, b('spruce_slab[type=top,waterlogged=false]'));
      if (rand2) set(0, x, y + 1, bz + dz, (x - bx0) % 6 === 0 ? b('stripped_spruce_wood[axis=y]') : b('spruce_fence'));
      if (rand2 && (x - bx0) % 6 === 0) { set(0, x, y + 2, bz + dz, b('spruce_fence')); set(0, x, y - 1, bz + dz, b('chain[axis=y]')); set(0, x, y - 2, bz + dz, b('lantern[hanging=true]')); }
    }
    // Stufen an den Übergängen im Bogen: Schnee bleibt weg, Laufweg durchgehend (Höhenwechsel max. 1 je Block)
  }

  // ---------- Stufe 2: großer Weihnachtsbaum (Wachstum in 5 Schritten) ----------
  const BH = 42, BR = 13.5, basis = T + 1;
  const baum = (s) => { // Blöcke des Baums bei Größe s (0…1)
    const out = new Map(); const h = Math.round(BH * s), rmax = BR * s;
    for (let i = 0; i < Math.round(h * 0.85); i++) for (const [dx, dz] of i < h * 0.5 ? [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]] : [[0, 0]]) out.set(`${CX + dx},${basis + i},${CZ + dz}`, b('spruce_log[axis=y]'));
    const lagen = 7;
    for (let i = Math.round(h * 0.12); i <= h; i++) {
      const tt = i / h, lage = (tt * lagen) % 1; // Sägezahn: jede Lage unten breit, oben schmal
      const rr = rmax * (1 - tt) * (0.62 + 0.38 * (1 - lage)) + 0.6;
      for (let dx = -Math.ceil(rr); dx <= Math.ceil(rr); dx++) for (let dz = -Math.ceil(rr); dz <= Math.ceil(rr); dz++) {
        const dd = Math.hypot(dx, dz), w = Math.atan2(dz, dx);
        if (dd <= rr * (0.88 + 0.12 * Math.sin(w * 5 + i))) { const k = `${CX + dx},${basis + i},${CZ + dz}`; if (!out.has(k)) out.set(k, LAUB); }
      }
    }
    out.set(`${CX},${basis + h},${CZ}`, LAUB);
    return out;
  };
  const wachstum = [0.3, 0.5, 0.7, 0.85, 1].map(baum);
  for (const [k, v] of wachstum.at(-1)) { const [x, y, z] = k.split(',').map(Number); set(1, x, y, z, v); }
  // Schnee auf den Lagen (nur beim letzten Schritt)
  const schneeBaum = [];
  for (const [k, v] of wachstum.at(-1)) { if (v !== LAUB) continue; const [x, y, z] = k.split(',').map(Number); if (get(x, y + 1, z) === LUFT && zufall(x, y, z, 11) < 0.7) { set(1, x, y + 1, z, b('snow[layers=1]')); schneeBaum.push(`${x},${y + 1},${z}`); } }

  // ---------- Stufe 3: Schmuck ----------
  const aussen = []; // Laubblöcke an der Außenseite (Luft daneben nach außen)
  for (const [k, v] of wachstum.at(-1)) {
    if (v !== LAUB) continue; const [x, y, z] = k.split(',').map(Number);
    const dx = Math.sign(x - CX), dz = Math.sign(z - CZ);
    if ((dx && get(x + dx, y, z) === LUFT) || (dz && get(x, y, z + dz) === LUFT)) aussen.push([x, y, z]);
  }
  const hoeheB = (y) => (y - basis) / BH;
  // zwei Spiralen: Lichterkette (Kupferbirnen, aus) und Girlande (rote Wolle)
  for (const [x, y, z] of aussen) {
    const w = (winkel(x, z) + Math.PI) / (2 * Math.PI), u = hoeheB(y) * 3.2; // 3,2 Windungen
    const p1 = ((w - u) % 1 + 1) % 1, p2 = ((w - u + 0.5) % 1 + 1) % 1;
    if (p1 < 0.05) set(2, x, y, z, BIRNE(false));
    else if (p2 < 0.045) set(2, x, y, z, b('red_wool'));
    else if (zufall(x, y, z, 21) < 0.1) set(2, x, y, z, [b('gold_block'), b('red_wool'), b('white_wool'), b('light_blue_wool')][Math.floor(zufall(x, y, z, 22) * 4)]);
  }
  // Stern an der Spitze: fünfzackig, senkrecht (Blick von Westen), Gold, Mitte Glowstone (ab Stufe 4 zusätzlich Endstäbe)
  const st = basis + BH + 3;
  const FORM = ['....#....', '....#....', '...###...', '#########', '.#######.', '..#####..', '..##.##..', '.##...##.', '.#.....#.'];
  const sternPunkte = [];
  FORM.forEach((zeile, i) => [...zeile].forEach((c, j) => { if (c === '#') sternPunkte.push([j - 4, 4 - i]); }));
  for (const [dz, dy] of sternPunkte) set(2, CX, st + dy, CZ + dz, Math.abs(dz) + Math.abs(dy - 1) <= 1 ? b('glowstone') : b('gold_block'));
  for (let y = basis + BH; y < st - 1; y++) set(2, CX, y, CZ, b('gold_block'));
  // Geschenke unter dem Baum (Beton mit Teppich-Schleife), ein Ring zwischen Baum und Platzrand
  const farben = ['red', 'lime', 'light_blue', 'yellow', 'white', 'purple', 'orange', 'green'];
  for (let i = 0; i < 14; i++) {
    const w = i * 2 * Math.PI / 14 + 0.3, gx = Math.round(CX + 6.2 * Math.cos(w)), gz = Math.round(CZ + 6.2 * Math.sin(w));
    if (Math.abs(gz - CZ) <= 1 && gx < CX) continue; // Weg frei
    const f = farben[i % farben.length], gross = i % 3 === 0;
    set(2, gx, T + 1, gz, b(`${f}_concrete`)); set(2, gx, T + 2, gz, b(`${farben[(i + 3) % 8]}_carpet`));
    if (gross) { set(2, gx, T + 2, gz, b(`${f}_concrete`)); set(2, gx, T + 3, gz, b(`${farben[(i + 3) % 8]}_carpet`)); }
  }
  // Kerzen (aus) auf den Laternenpfosten-Köpfen
  for (const [px, pz] of pfosten) set(2, px, T + 4, pz, b('red_candle[candles=3,lit=false,waterlogged=false]'));

  // ---------- Stufe 4: Lichter an ----------
  for (const [k, v] of welt) if (v === BIRNE(false)) { const [x, y, z] = k.split(',').map(Number); set(3, x, y, z, BIRNE(true)); }
  for (const [px, pz] of pfosten) { set(3, px, T + 4, pz, b('red_candle[candles=3,lit=true,waterlogged=false]')); }
  for (const [px, pz] of pfosten) { const dx = Math.sign(CX - px), dz = Math.sign(CZ - pz); set(3, px + (Math.abs(px - CX) > Math.abs(pz - CZ) ? dx : 0), T + 3, pz + (Math.abs(px - CX) > Math.abs(pz - CZ) ? 0 : dz), b('lantern[hanging=false]')); }
  for (const [dz, dy] of [[0, 5], [5, 2], [-5, 2]]) set(3, CX, st + dy, CZ + dz, b(`end_rod[facing=${dy === 5 ? 'up' : dz > 0 ? 'south' : 'north'}]`));

  return { stufen, wachstum, schneeBaum, pfosten, stern: { y: st }, basis };
}

// Volumen einer oder mehrerer Stufen (kumulativ) für Vorschau und Strukturen
export function volumen(stufen, bis, nur = false) {
  const m = neu(W, H, L, 3955);
  const [ox, oy, oz] = URSPRUNG;
  for (let s = nur ? bis : 0; s <= bis; s++) for (const [k, v] of stufen[s]) {
    const [x, y, z] = k.split(',').map(Number), lx = x - ox, ly = y - oy, lz = z - oz;
    if (lx >= 0 && ly >= 0 && lz >= 0 && lx < W && ly < H && lz < L) setze(m, lx, ly, lz, v);
  }
  return m;
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('spawn/weihnachtsinsel.mjs')) {
  const aus = process.argv[2] ?? 'weihnachtsinsel-vorschau';
  mkdirSync(aus, { recursive: true });
  const { stufen } = inselBloecke();
  for (let s = 0; s < 4; s++) { writeFileSync(join(aus, `stufe_${s + 1}.schem`), speichere(volumen(stufen, s))); console.log(`Stufe ${s + 1}: ${stufen[s].size} Blöcke`); }
}
