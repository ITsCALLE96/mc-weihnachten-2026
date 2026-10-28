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
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
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
  // Laternenweg vom Brückenende zum Platz
  for (let x = westRand + 2; x <= CX - 11; x += 4) for (const dz of [-2, 2]) { set(0, x, T + 1, CZ + dz, b('spruce_fence')); set(0, x, T + 2, CZ + dz, b('lantern[hanging=false,waterlogged=false]')); }
  // kleine verschneite Fichten (Platz für die Details dazwischen)
  for (const [dist, w] of [[18, Math.PI - 0.45], [18, Math.PI + 0.45], [21, 0.35], [21, -0.35]]) {
    const tx = Math.round(CX + dist * Math.cos(w)), tz = Math.round(CZ + dist * Math.sin(w)), h = 7 + Math.floor(zufall(tx, 9, tz) * 3);
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

  // ---------- Details (Pascal 28.10.: „kleine Dinge, die zu Heiligabend dazugehören“), je einem Bauabschnitt zugeordnet ----------
  // teilKarte[s]: Block → Abschnitt (0-basiert); ents[s][k]: Entities des Abschnitts (Ost-Rahmen, werden mitgedreht)
  const teilKarte = [new Map(), new Map(), new Map(), new Map()], ents = [[], [], [], []].map(() => Array.from({ length: 10 }, () => []));
  const setT = (s, k, x, y, z, bl) => { set(s, x, y, z, bl); teilKarte[s].set(K(x, y, z), k); };
  const luftT = (s, k, x, y, z) => { if (get(x, y, z) !== LUFT) { weg(0, x, y, z); weg(s, x, y, z); teilKarte[s].delete(K(x, y, z)); } };
  const ent = (s, k, typ, x, y, z, yaw, nbt, tags = []) => ents[s][k].push({ typ, x, y, z, yaw, nbt, tags });
  const kreis = (dist, w) => [Math.round(CX + dist * Math.cos(w)), Math.round(CZ + dist * Math.sin(w))];
  // Iglu (Stufe 2, Abschnitt 1): Kuppel aus Schnee, Gang zum Platz, innen Teppich, Fässer mit Laternen; Platz für den Weihnachtsmann
  const IG = [CX + 18, CZ], IR = 4.5;
  for (let dx = -5; dx <= 5; dx++) for (let dz = -5; dz <= 5; dz++) for (let dy = 1; dy <= 5; dy++) {
    const d = Math.hypot(dx, dy - 0.5, dz), x = IG[0] + dx, z = IG[1] + dz, y = T + dy;
    if (d <= IR - 1) luftT(1, 0, x, y, z);
    else if (d <= IR) setT(1, 0, x, y, z, (dy === 3 && (Math.abs(dz) === 4 || Math.abs(dx) === 4) && (dx + dz) % 2 === 0) ? b('packed_ice') : b('snow_block'));
  }
  for (let x = IG[0] - 6; x <= IG[0] - 3; x++) for (let dz = -2; dz <= 2; dz++) for (let dy = 1; dy <= 4; dy++) {
    const wand = Math.abs(dz) === 2 || dy === 4;
    if (wand) setT(1, 0, x, T + dy, IG[1] + dz, b('snow_block')); else luftT(1, 0, x, T + dy, IG[1] + dz);
  }
  for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) if (Math.hypot(dx, dz) <= 3.2) setT(1, 0, IG[0] + dx, T + 1, IG[1] + dz, Math.hypot(dx, dz) < 1.6 ? b('red_carpet') : b('white_carpet'));
  for (const dz of [-3, 3]) { setT(1, 0, IG[0] + 1, T + 1, IG[1] + dz, b('barrel[facing=up,open=false]')); setT(1, 0, IG[0] + 1, T + 2, IG[1] + dz, b('lantern[hanging=false,waterlogged=false]')); }
  setT(1, 0, IG[0] + 3, T + 1, IG[1], b('spruce_stairs[facing=east,half=bottom,shape=straight,waterlogged=false]'));
  // Holzstapel mit Axt (Stufe 2, Abschnitt 2)
  { const [hx, hz] = kreis(19, -0.75 * Math.PI);
    for (let x = hx - 2; x <= hx + 1; x++) for (const dz of [0, 1]) for (const dy of [1, 2]) setT(1, 1, x, T + dy, hz + dz, b('spruce_log[axis=x]'));
    setT(1, 1, hx + 3, T + 1, hz + 2, b('stripped_spruce_log[axis=y]'));
    ent(1, 1, 'item_display', hx + 3.5, T + 2.25, hz + 2.5, 0, '{item:{id:"minecraft:iron_axe",count:1},transformation:{left_rotation:[0f,0f,0.38f,0.92f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[0.8f,0.8f,0.8f]}}'); }
  // Futterkrippe mit Heu unter kleinem Dach (Stufe 2, Abschnitt 4)
  { const [kx, kz] = kreis(19, 0.75 * Math.PI);
    for (const [dx, dz] of [[-2, -1], [2, -1], [-2, 1], [2, 1]]) for (const dy of [1, 2]) setT(1, 3, kx + dx, T + dy, kz + dz, b('spruce_fence'));
    for (let dx = -2; dx <= 2; dx++) for (let dz = -1; dz <= 1; dz++) setT(1, 3, kx + dx, T + 3, kz + dz, b('spruce_slab[type=bottom,waterlogged=false]'));
    for (let dx = -1; dx <= 1; dx++) { setT(1, 3, kx + dx, T + 1, kz, b('spruce_planks')); setT(1, 3, kx + dx, T + 2, kz, dx === 0 ? b('hay_block[axis=x]') : b('spruce_trapdoor[facing=north,half=bottom,open=false,powered=false,waterlogged=false]')); }
    setT(1, 3, kx + 2, T + 1, kz + 2, b('hay_block[axis=y]')); setT(1, 3, kx, T + 2, kz - 2, b('lantern[hanging=false,waterlogged=false]')); setT(1, 3, kx, T + 1, kz - 2, b('spruce_planks')); }
  // Schneemann mit Kürbiskopf als Anzeige-Block (kein echter Kürbis, sonst entsteht ein Schneegolem) (Stufe 2, Abschnitt 6)
  { const [sx, sz] = kreis(19, -0.2 * Math.PI);
    setT(1, 5, sx, T + 1, sz, b('snow_block')); setT(1, 5, sx, T + 2, sz, b('snow_block'));
    ent(1, 5, 'block_display', sx, T + 3, sz, 0, '{block_state:"minecraft:carved_pumpkin[facing=west]",transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0.1f,0f,0.1f],scale:[0.8f,0.8f,0.8f]}}'); }
  // Kakao-Stand mit gestreiftem Dach (Stufe 2, Abschnitt 8)
  { const [kx, kz] = kreis(18, -Math.PI / 2);
    for (let dx = -1; dx <= 1; dx++) { setT(1, 7, kx + dx, T + 1, kz + 1, b('spruce_planks')); setT(1, 7, kx + dx, T + 1, kz - 1, b('barrel[facing=up,open=false]')); }
    setT(1, 7, kx - 1, T + 2, kz + 1, b('cake[bites=0]')); setT(1, 7, kx, T + 2, kz + 1, b('lantern[hanging=false,waterlogged=false]')); setT(1, 7, kx + 1, T + 2, kz + 1, b('decorated_pot[cracked=false,facing=north,waterlogged=false]'));
    for (const dx of [-2, 2]) for (const dz of [-1, 1]) for (const dy of [1, 2, 3]) setT(1, 7, kx + dx, T + dy, kz + dz, b('spruce_fence'));
    for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) setT(1, 7, kx + dx, T + 4, kz + dz, (dx & 1) ? b('white_wool') : b('red_wool')); }
  // Schlitten voller Geschenke mit zwei Rentieren aus Blöcken (Stufe 3, Abschnitte 2 und 4)
  { const sx = CX - 8, sz = CZ + 16;
    for (let x = sx; x <= sx + 6; x++) for (const dz of [-1, 1]) setT(2, 1, x, T + 1, sz + dz, b('dark_oak_slab[type=bottom,waterlogged=false]'));
    for (const dz of [-1, 1]) setT(2, 1, sx + 7, T + 1, sz + dz, b('dark_oak_stairs[facing=west,half=bottom,shape=straight,waterlogged=false]'));
    for (let x = sx + 1; x <= sx + 5; x++) for (let dz = -1; dz <= 1; dz++) setT(2, 1, x, T + 2, sz + dz, b('red_concrete'));
    for (let dz = -1; dz <= 1; dz++) { setT(2, 1, sx + 6, T + 2, sz + dz, b('gold_block')); setT(2, 1, sx + 1, T + 3, sz + dz, b('red_concrete')); setT(2, 1, sx + 1, T + 4, sz + dz, b('gold_block')); }
    const gf = ['lime', 'light_blue', 'yellow', 'white', 'purple', 'orange'];
    for (let x = sx + 2; x <= sx + 5; x++) for (let dz = -1; dz <= 1; dz++) { const i = (x * 3 + dz) & 7; setT(2, 1, x, T + 3, sz + dz, b(`${gf[i % 6]}_concrete`)); if (i % 3 === 0) setT(2, 1, x, T + 4, sz + dz, b(`${gf[(i + 2) % 6]}_carpet`)); }
    for (const [x0, nase] of [[sx + 9, false], [sx + 14, true]]) {
      for (const x of [x0, x0 + 2]) setT(2, 3, x, T + 1, sz, b('dark_oak_fence'));
      for (let x = x0; x <= x0 + 2; x++) setT(2, 3, x, T + 2, sz, b('brown_terracotta'));
      setT(2, 3, x0 + 3, T + 3, sz, b('brown_terracotta')); setT(2, 3, x0 + 3, T + 4, sz, b('dead_bush'));
      setT(2, 3, x0 - 1, T + 2, sz, b('white_wool'));
      if (nase) setT(2, 3, x0 + 4, T + 3, sz, b('redstone_block'));
    } }
  // Geschenkberg am Stamm (Stufe 3, Abschnitt 6)
  { const gf = ['red', 'lime', 'light_blue', 'yellow', 'white', 'purple', 'orange', 'green'];
    for (let dx = 0; dx <= 2; dx++) for (let dz = -1; dz <= 1; dz++) { const i = (dx * 5 + dz + 9) & 7; setT(2, 5, CX + 4 + dx, T + 1, CZ + dz, b(`${gf[i]}_concrete`)); }
    for (let dx = 0; dx <= 1; dx++) for (let dz = -1; dz <= 0; dz++) setT(2, 5, CX + 4 + dx, T + 2, CZ + dz, b(`${gf[(dx + dz + 4) & 7]}_concrete`));
    setT(2, 5, CX + 4, T + 3, CZ, b('red_concrete')); setT(2, 5, CX + 4, T + 4, CZ, b('yellow_carpet')); setT(2, 5, CX + 6, T + 2, CZ + 1, b('white_carpet')); }
  // Jukebox-Ecke (Weihnachtsmusik: serverwahl legt die Platten nacheinander ein) (Stufe 3, Abschnitt 8)
  const JUKE = [CX + 11, T + 1, CZ + 3];
  setT(2, 7, ...JUKE, b('jukebox[has_record=false]'));
  setT(2, 7, JUKE[0], T + 1, JUKE[2] + 1, b('note_block[instrument=bell,note=12,powered=false]')); setT(2, 7, JUKE[0], T + 1, JUKE[2] - 1, b('note_block[instrument=chime,note=7,powered=false]'));
  setT(2, 7, JUKE[0] + 1, T + 1, JUKE[2], b('spruce_planks')); setT(2, 7, JUKE[0] + 1, T + 2, JUKE[2], b('lantern[hanging=false,waterlogged=false]'));
  // Schwebende Kerzen im Ring über dem Platzrand, leicht wippend; Flammen ab Stufe 4 (Stufe 3, Abschnitt 9); Licht als Lichtblock
  const kerzenFarben = ['white', 'red', 'yellow', 'white', 'red', 'light_blue'];
  for (let i = 0; i < 12; i++) {
    const w = i * Math.PI / 6 + Math.PI / 12, x = CX + 16.5 * Math.cos(w), z = CZ + 16.5 * Math.sin(w), y = T + 5 + (i % 3) * 0.6;
    ent(2, 8, 'block_display', x, y, z, 0, `{block_state:"minecraft:${kerzenFarben[i % 6]}_candle[candles=1,lit=true,waterlogged=false]",teleport_duration:30,transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[-0.8f,0f,-0.8f],scale:[1.6f,1.6f,1.6f]}}`, ['wi_kerze']);
    setT(2, 8, Math.floor(x), Math.floor(y), Math.floor(z), b('light[level=7,waterlogged=false]'));
  }
  // Allays als schwebende Helfer am Baum und am Iglu: ohne KI (fliegen nicht weg, sammeln nichts), unverwundbar, bleiben (Stufe 3, Abschnitt 10)
  const allayHand = ['red_candle', 'cookie', 'glow_berries', 'snowball', 'gold_nugget'];
  [[14.5, 0.5, 12], [14.5, 2.1, 18], [13.5, 3.7, 24], [12, 5.3, 30], [0, 0, 0]].forEach(([d, w, h], i) => {
    const [x, y, z] = i === 4 ? [IG[0] - 6.5, T + 4.2, IG[1] - 2.5] : [CX + d * Math.cos(w), T + h, CZ + d * Math.sin(w)];
    ent(2, 9, 'allay', x, y, z, (w * 180 / Math.PI + 90) % 360, `{NoAI:1b,Invulnerable:1b,Silent:1b,PersistenceRequired:1b,NoGravity:1b,CanPickUpLoot:0b,equipment:{mainhand:{id:"minecraft:${allayHand[i]}",count:1}}}`);
  });
  // Weihnachtsmann im Iglu (Mannequin mit eigenem Skin aus dem Basis-Pack, Handel macht serverwahl über die Interaction) – nach Stufe 4
  const WM = [IG[0] + 2.5, T + 1, IG[1] + 0.5];
  ent(3, 9, 'mannequin', ...WM, 90, '{CustomName:{text:"Weihnachtsmann",color:"red",bold:true},CustomNameVisible:1b,description:{text:"Händler · Rechtsklick",color:"gold"},immovable:1b,Invulnerable:1b,Silent:1b,PersistenceRequired:1b,profile:{texture:"weihnachten:entity/weihnachtsmann"}}', ['wi_weihnachtsmann']);
  ent(3, 9, 'interaction', ...WM, 0, '{width:0.9f,height:2f,response:1b}', ['wi_weihnachtsmann_klick']);

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
    teilKarte: teilKarte.map((m) => new Map([...m].map(([k, v]) => { const [x, y, z] = k.split(',').map(Number); return [K(...dp(x, y, z)), v]; }))),
    ents: ents.map((st) => st.map((liste) => liste.map((e) => { const [X, Z] = punkt(e.x, e.z); return { ...e, x: X, z: Z, yaw: (e.yaw + 90 * DREH[lage.richtung]) % 360, nbt: zustand(e.nbt) }; }))),
    jukebox: dp(...JUKE), weihnachtsmann: { pos: dp(...WM), yaw: (90 + 90 * DREH[lage.richtung]) % 360 },
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
  const effekt = (x, y, z, partikel, klang, n = 120) => `particle ${partikel} ${x} ${y} ${z} 4 2 4 0.02 ${n} force @a\nplaysound ${klang} master @a ${x} ${y} ${z} 3 1`;
  const titel = (a, u) => `title @a times 10 70 20\ntitle @a subtitle ${JSON.stringify({ text: u, color: 'white' })}\ntitle @a title ${JSON.stringify({ text: a, color: 'gold', bold: true })}`;
  const mitteVon = (m) => { const { lo: a, hi: e } = bereich(m); return [0, 1, 2].map((i) => Math.round((a[i] + e[i]) / 2)); };
  // block_state in 26.3: {id, properties} (als Text nur die ID ohne Eigenschaften)
  const zustandNbt = (nbt) => nbt.replace(/block_state:"([a-z:_]+)\[([^\]]*)\]"/, (_, id, p) => `block_state:{id:"${id}",properties:{${p.split(',').map((kv) => kv.replace(/=(.*)/, ':"$1"')).join(',')}}}`);
  const summon = (e, n) => `summon ${e.typ} ${e.x.toFixed(2)} ${e.y.toFixed(2)} ${e.z.toFixed(2)} ${zustandNbt(e.nbt).replace(/^\{/, `{Tags:${JSON.stringify(['wi_insel', `wi_e_${n}`, ...e.tags])},Rotation:[${e.yaw}f,0f],`)}`;

  // ---------- Bauabschnitte: je Stufe 10 (ruft serverwahl je 10 % Fortschritt auf) ----------
  // teile[s][k] = { bloecke: Map, befehle: [], ents: [], partikel, klang }
  const teile = [0, 1, 2, 3].map(() => Array.from({ length: 10 }, () => ({ bloecke: new Map(), befehle: [], ents: [] })));
  const brueckeSet = new Set(I.bruecke.map((p) => K(...p)));
  // Stufe 1: Insel in 6 Schichten von unten (die oberste mit Platz, Weg, Fichten, Laternen), dann die Brücke in 4 Stücken von der Spark-Insel aus
  const s1 = I.stufen[0], iy = [...s1.keys()].filter((k) => !brueckeSet.has(k)).map((k) => +k.split(',')[1]);
  const y0 = Math.min(...iy), T = lage.oben, sch = (T - y0) / 5;
  const achse = I.brueckeVon[0] === I.brueckeBis[0] ? 2 : 0, von = I.brueckeVon[achse], bis = I.brueckeBis[achse], sg = Math.sign(bis - von);
  for (const [k, v] of s1) {
    const p = k.split(',').map(Number);
    let t;
    if (brueckeSet.has(k)) t = 6 + Math.min(3, Math.max(0, Math.floor(((p[achse] - von) * sg) / (Math.abs(bis - von) + 1) * 4)));
    else t = p[1] >= T ? 5 : Math.min(4, Math.floor((p[1] - y0) / sch));
    teile[0][t].bloecke.set(k, v);
  }
  // Stufe 2: Details in 1, 2, 4, 6, 8; Baum wächst in 3, 5, 7, 9, 10
  const BAUM = [2, 4, 6, 8, 9];
  I.wachstum.forEach((m, i) => m.forEach((v, k) => teile[1][BAUM[i]].bloecke.set(k, v)));
  for (const [k, t] of I.teilKarte[1]) teile[1][t].bloecke.set(k, I.stufen[1].get(k));
  // Stufe 3: Schmuck in 4 Höhenbändern (1, 3, 5, 7), Details in 2, 4, 6, 8, Kerzen 9, Allays 10
  const s3 = new Map([...I.stufen[2]].filter(([k]) => !I.teilKarte[2].has(k)));
  const h3 = [...s3.keys()].map((k) => +k.split(',')[1]), a3 = Math.min(...h3), b3 = (Math.max(...h3) - a3 + 1) / 4;
  for (const [k, v] of s3) teile[2][[0, 2, 4, 6][Math.min(3, Math.floor((+k.split(',')[1] - a3) / b3))]].bloecke.set(k, v);
  for (const [k, t] of I.teilKarte[2]) teile[2][t].bloecke.set(k, I.stufen[2].get(k));
  // Entities
  I.ents.forEach((st, s) => st.forEach((liste, k) => teile[s][k].ents.push(...liste)));
  // Stufe 4: Kupferbirnen in 10 Bändern von unten an; im letzten Band Laternen, Kerzen und Stern
  const R = I.baumRadius, bandH = Math.ceil((I.hoehe + 1) / 10);
  for (let k = 0; k < 10; k++) {
    const y = I.basis + k * bandH;
    teile[3][k].befehle.push(`fill ${mx - R} ${y} ${mz - R} ${mx + R} ${Math.min(y + bandH - 1, I.basis + I.hoehe)} ${mz + R} minecraft:waxed_copper_bulb[lit=true] replace minecraft:waxed_copper_bulb[lit=false]`);
    teile[3][k].effektPos = [mx, y + 2, mz];
  }
  for (const [k, v] of I.stufen[3]) if (!v.includes('copper_bulb')) teile[3][9].bloecke.set(k, v);

  // Licht gegen Monster nach jedem Abschnitt (Reihenfolge wie im Spiel), neue Lichtblöcke gehören zum Abschnitt
  const kumul = new Map(), lichtZahl = [0, 0, 0, 0];
  for (let s = 0; s < 4; s++) for (let k = 0; k < 10; k++) {
    const t = teile[s][k];
    t.bloecke.forEach((v, key) => { if (v === 'minecraft:cave_air') kumul.delete(key); else kumul.set(key, v); });
    if (s === 3 && k < 9) continue; // Birnen an: nur heller
    if (s === 3) I.stufen[3].forEach((v, key) => kumul.set(key, v));
    const neue = lichter(kumul); neue.forEach((p) => { kumul.set(K(...p), LICHTBLOCK); t.bloecke.set(K(...p), LICHTBLOCK); });
    lichtZahl[s] += neue.length;
  }

  // Funktionen je Abschnitt: Merker, Chunks laden, 2 s später setzen (Strukturen, Befehle, Entities), kleiner Effekt
  const NAMEN = ['Die Insel taucht auf', 'Der Baum wächst', 'Der Baum wird geschmückt', 'Heiligabend'];
  const PARTIKEL = [['minecraft:snowflake', 'minecraft:block.amethyst_block.chime'], ['minecraft:happy_villager', 'minecraft:item.bone_meal.use'], ['minecraft:wax_on', 'minecraft:block.amethyst_block.resonate'], ['minecraft:end_rod', 'minecraft:block.copper_bulb.turn_on']];
  const alleSetzen = [[], [], [], []];
  for (let s = 0; s < 4; s++) for (let k = 0; k < 10; k++) {
    const n = s + 1, t = teile[s][k], name = `stufe_${n}_teil_${k + 1}`, e = `s${n}_${k + 1}`;
    const zeilen = [];
    const p = struk(`s${n}_teil_${k + 1}`, t.bloecke); if (p) zeilen.push(p);
    zeilen.push(...t.befehle);
    if (t.ents.length) zeilen.push(`kill @e[tag=wi_e_${e}]`, ...t.ents.map((x) => summon(x, e)));
    alleSetzen[s].push(...zeilen);
    const [ex, ey, ez] = t.effektPos ?? (t.bloecke.size ? mitteVon(t.bloecke) : [mx, my + 3, mz]);
    f[name] = `# Bauabschnitt ${k + 1}/10 der Stufe ${n} „${NAMEN[s]}“ (serverwahl je 10 % Fortschritt). Doppelaufruf macht nichts.
execute if score #t${n}_${k + 1} wi_mission matches 1 run return fail
execute unless score #stufe wi_mission matches ${n - 1}.. run return fail
forceload add ${fl}
schedule function ${NS}:${name}/setzen 40t
`;
    f[`${name}/setzen`] = `execute if score #t${n}_${k + 1} wi_mission matches 1 run return fail\n${zeilen.join('\n')}\n${effekt(ex, ey, ez, ...PARTIKEL[s])}\nkill @e[type=item,${kasten}]\nscoreboard players set #t${n}_${k + 1} wi_mission 1\nschedule function ${NS}:entladen 200t\n`;
  }
  // Abschluss je Stufe (serverwahl nach 100 %): fehlende Abschnitte setzen, Titel, Glocken, Funkeln über der Insel; Stufe 4 danach die Feier
  for (let s = 0; s < 4; s++) {
    const n = s + 1;
    f[`stufe_${n}`] = `# Abschluss der Stufe ${n} „${NAMEN[s]}“ (serverwahl nach 100 %, nach den Abschnitten). Ein zweiter Aufruf macht nichts.
execute if score #stufe wi_mission matches ${n}.. run return fail
execute unless score #stufe wi_mission matches ${n - 1}.. run return fail
scoreboard players set #stufe wi_mission ${n}
scoreboard players set #laeuft wi_mission ${n}
forceload add ${fl}
schedule function ${NS}:stufe_${n}/abschluss 40t
`;
    f[`stufe_${n}/fertig`] = `# Alle Abschnitte der Stufe ${n} setzen (Abschluss bzw. Wiederaufnahme nach Neustart)\n${alleSetzen[s].join('\n')}\n${Array.from({ length: 10 }, (_, k) => `scoreboard players set #t${n}_${k + 1} wi_mission 1`).join('\n')}\nkill @e[type=item,${kasten}]\n`;
    f[`stufe_${n}/abschluss`] = `function ${NS}:stufe_${n}/fertig\n${titel('Weihnachtsinsel', `Stufe ${n} geschafft: ${NAMEN[s]}`)}\nplaysound minecraft:block.bell.use master @a ${mx} ${my} ${mz} 6 0.8\nparticle minecraft:firework ${mx} ${my + 12} ${mz} 10 10 10 0.05 400 force @a\nparticle minecraft:snowflake ${mx} ${my + 6} ${mz} 14 6 14 0.02 400 force @a\nscoreboard players set #laeuft wi_mission 0\n${n === 4 ? `function ${NS}:feier\n` : `schedule function ${NS}:entladen 100t\n`}`;
  }
  f.entladen = `# Chunks wieder freigeben, wenn nichts mehr läuft\nexecute if score #laeuft wi_mission matches 1.. run return fail\nexecute if score #feuer wi_mission matches 1..239 run return fail\nforceload remove ${fl}\n`;
  // Feier: einmal (stufe_4 ruft sie, serverwahl 20 s später noch einmal zur Sicherheit); Test: feier_nochmal
  const ring = Array.from({ length: 24 }, (_, i) => { const w = i * 2 * Math.PI / 24; return [Math.round(mx + 30 * Math.cos(w)), my + 22 + (i % 3) * 6, Math.round(mz + 30 * Math.sin(w))]; });
  const FARBEN = [[16777215, 12245247], [16766720, 16777215], [13382451, 16766720], [11393254, 16777215], [3381555, 16711680]];
  const rakete = ([x, y, z], i) => `summon firework_rocket ${x} ${y} ${z} {LifeTime:${20 + (i % 3) * 6},FireworksItem:{id:"minecraft:firework_rocket",count:1,components:{"minecraft:fireworks":{flight_duration:1,explosions:[{shape:"${['large_ball', 'star', 'burst', 'small_ball'][i % 4]}",colors:[I;${FARBEN[i % 5].join(',')}],fade_colors:[I;8439039],has_twinkle:${i % 2 ? 'true' : 'false'},has_trail:true}]}}}}`;
  const zeilen = [];
  for (let n = 1; n <= 240; n++) zeilen.push(`execute if score #feuer wi_mission matches ${n} run ${rakete(n % 6 === 0 ? [mx + ((n * 7) % 9) - 4, I.basis + I.hoehe + 4, mz + ((n * 5) % 9) - 4] : ring[(n * 7) % 24], n)}`);
  f.feier_nochmal = `# Test: Feier erneut auslösen\nscoreboard players set #gefeiert wi_mission 0\nfunction ${NS}:feier\n`;
  f.feier = `# Feier am Ende von Stufe 4: Titel, Glocken, ~2 min Feuerwerk. Läuft nur einmal (#gefeiert), nur nach Stufe 4.\nexecute unless score #stufe wi_mission matches 4 run return fail\nexecute if score #gefeiert wi_mission matches 1 run return fail\nscoreboard players set #gefeiert wi_mission 1\nforceload add ${fl}\nscoreboard players set #feuer wi_mission 0\n${titel('Frohe Weihnachten!', 'Die Weihnachtsinsel leuchtet – danke fürs Spenden!')}\nplaysound minecraft:block.bell.use master @a ${mx} ${my} ${mz} 8 0.7\nschedule function ${NS}:feier/schritt 20t\n`;
  f['feier/schritt'] = `scoreboard players add #feuer wi_mission 1\n${zeilen.join('\n')}\nexecute if score #feuer wi_mission matches 120 run playsound minecraft:block.bell.use master @a ${mx} ${my} ${mz} 8 1.2\nexecute if score #feuer wi_mission matches ..239 run schedule function ${NS}:feier/schritt 10t\nexecute if score #feuer wi_mission matches 240.. run schedule function ${NS}:entladen 20t\n`;
  // Kerzen wippen (Teleport mit teleport_duration), Flammen ab Stufe 4 – nur für geladene Kerzen
  f.tick = `scoreboard players add #takt wi_mission 1
execute if score #takt wi_mission matches 60.. run scoreboard players set #takt wi_mission 0
execute if score #takt wi_mission matches 0 as @e[type=block_display,tag=wi_kerze,tag=!wi_oben] at @s run tp @s ~ ~0.2 ~
execute if score #takt wi_mission matches 0 run tag @e[type=block_display,tag=wi_kerze] add wi_oben
execute if score #takt wi_mission matches 30 as @e[type=block_display,tag=wi_kerze,tag=wi_oben] at @s run tp @s ~ ~-0.2 ~
execute if score #takt wi_mission matches 30 run tag @e[type=block_display,tag=wi_kerze] remove wi_oben
execute if score #stufe wi_mission matches 4.. if score #takt wi_mission matches 0..59 run scoreboard players operation #m wi_mission = #takt wi_mission
execute if score #stufe wi_mission matches 4.. run scoreboard players operation #m wi_mission %= #fuenf wi_mission
execute if score #stufe wi_mission matches 4.. if score #m wi_mission matches 0 as @e[type=block_display,tag=wi_kerze] at @s run particle minecraft:small_flame ~ ~0.72 ~ 0 0 0 0 1 normal
`;
  // Vorbereiten: Tafel am Brückenkopf (Spark-Insel); gespendet wird im Ender-Kisten-Menü, den Text der Tafel schreibt serverwahl
  const [tx, ty, tz] = I.tafel;
  const blickYaw = { nord: 0, sued: 180, ost: 90, west: 270 }[lage.richtung];
  f.vorbereiten = `# Tafel am Brückenkopf auf der Spark-Insel (vor dem Missionsstart); gespendet wird im Ender-Kisten-Menü
forceload add ${tx} ${tz}
schedule function ${NS}:vorbereiten2 20t
`;
  f.vorbereiten2 = `kill @e[type=text_display,tag=wi_tafel]
summon text_display ${tx + 0.5} ${ty + 0.5} ${tz + 0.5} {Tags:["wi_tafel"],Rotation:[${blickYaw}f,0f],billboard:"fixed",alignment:"center",line_width:260,background:1140850688,text:[${JSON.stringify({ text: 'Weihnachtsinsel\n', color: 'gold', bold: true })},${JSON.stringify({ text: 'Spende an der Ender-Kiste in der Mitte –\ngemeinsam lassen wir die Insel entstehen!', color: 'white' })}],transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[1.1f,1.1f,1.1f]}}
forceload remove ${tx} ${tz}
`;
  f.load = `scoreboard objectives add wi_mission dummy\nscoreboard players set #fuenf wi_mission 5\nexecute unless score #stufe wi_mission matches 0.. run scoreboard players set #stufe wi_mission 0\nexecute if score #laeuft wi_mission matches 1.. run schedule function ${NS}:wiederaufnahme 100t\n`;
  f.wiederaufnahme = `# Neustart mitten im Abschluss: Stufe vollständig setzen\nforceload add ${fl}\nschedule function ${NS}:wiederaufnahme2 40t\n`;
  f.wiederaufnahme2 = [1, 2, 3, 4].map((n) => `execute if score #laeuft wi_mission matches ${n} run function ${NS}:stufe_${n}/fertig`).join('\n') + `\nexecute if score #laeuft wi_mission matches 4 run function ${NS}:feier\nscoreboard players set #laeuft wi_mission 0\nschedule function ${NS}:entladen 100t\n`;
  f.zuruecksetzen = `# NUR TESTNETZ: Insel, Brücke und Entities entfernen, Stand auf 0\nforceload add ${fl}\nschedule function ${NS}:zuruecksetzen2 40t\n`;
  f.zuruecksetzen2 = `${fillsLuft(lo, hi).join('\n')}\nkill @e[tag=wi_insel]\nkill @e[type=item,${kasten}]\n${[1, 2, 3, 4].flatMap((n) => Array.from({ length: 10 }, (_, k) => `scoreboard players reset #t${n}_${k + 1} wi_mission`)).join('\n')}\nscoreboard players set #stufe wi_mission 0\nscoreboard players set #laeuft wi_mission 0\nscoreboard players set #gefeiert wi_mission 0\nscoreboard players set #feuer wi_mission 0\nforceload remove ${fl}\nsay Weihnachtsinsel zurückgesetzt\n`;
  return { funktionen: f, strukturen, bereich: { lo, hi }, tafel: I.tafel, mitte: I.mitte, lichter: lichtZahl, insel: I, kumul, teile, jukebox: I.jukebox, weihnachtsmann: I.weihnachtsmann };
}


// ---------- Weihnachtsmann im Iglu: Händler das ganze Jahr (serverwahl: Handel, Dezember halber Preis) ----------
// Ware = alle Weihnachtsitems der Season (Kalender-Items aus standort-smp-spark.json, Christstollen, Weihnachtsplatten), Grundpreise in Smaragden
export function haendler(wm, jukebox) {
  const k = JSON.parse(readFileSync(join(REPO, 'spawn/standort-smp-spark.json'), 'utf8')).kalender;
  const LORE = /minecraft:lore=\[\{text:"Winterkalender 2026(?: – Tag \d+)?",italic:false,color:"aqua"\}\]/;
  const ware = (give) => { const m = give.match(/^(.*\]|[a-z:_]+) (\d+)$/); return { item: m[1].replace(LORE, 'minecraft:lore=[{text:"Vom Weihnachtsmann · Winter 2026",italic:false,color:"aqua"}]'), anzahl: +m[2] }; };
  // Preise je Kalendertag (Stückzahl der Ware in Klammern); Seltenes teurer
  const PREIS = { 1: [2, 16], 2: [2, 16], 3: [2], 4: [8], 5: [3, 16], 6: [3], 7: [4, 8], 8: [2], 9: [8], 10: [4], 11: [1, 16], 12: [4], 13: [4, 16], 14: [10], 15: [4], 16: [2], 17: [4], 18: [12], 19: [3], 20: [3, 16], 21: [4], 22: [8], 23: [5], 24: [32] };
  const liste = [];
  k.belohnungen.forEach((gaben, i) => {
    const [preis, anzahl] = PREIS[i + 1], w = ware(gaben[0]);
    const NAME = { 1: 'Lebkuchen', 12: 'Lichterkette', 18: 'Weihnachtsmütze' };
    liste.push({ name: NAME[i + 1] ?? (w.item.match(/item_name=\{text:"([^"]+)"/) ?? [, w.item])[1], ...w, anzahl: anzahl ?? 1, preis });
  });
  liste.push({ name: 'Christstollen', ...ware(k.zugabeItems.stollen.item + ' 1'), anzahl: 4, preis: 8 });
  for (const id of ['jingle_bells', 'we_wish', 'deck_the_halls', 'stille_nacht', 'zuckerfee', 'midnight_clear', 'holy_night', 'adeste', 'tannenbaum'])
    liste.push({ name: `Weihnachtsplatte (${id})`, item: `minecraft:music_disc_13[minecraft:jukebox_playable="weihnachten:platte_${id}",minecraft:item_model="weihnachten:platte_${id}",minecraft:item_name="Weihnachtsplatte",minecraft:lore=[{text:"Vom Weihnachtsmann · Winter 2026",italic:false,color:"aqua"}]]`, anzahl: 1, preis: 6 });
  return {
    grund: 'Weihnachtsmann im Iglu der Weihnachtsinsel (Pascal 28.10.): erscheint mit Stufe 4, Mannequin mit eigenem Skin (Basis-Pack, Modpack-Session), Handel über serverwahl (Interaction mit Tag wi_weihnachtsmann_klick), ganzes Jahr; Dezember halber Preis (aufrunden, mind. 1). Preise in Smaragden je Angebot (anzahl Stück)',
    mannequin: { tag: 'wi_weihnachtsmann', klick: 'wi_weihnachtsmann_klick', welt: 'world', x: +wm.pos[0].toFixed(2), y: wm.pos[1], z: +wm.pos[2].toFixed(2), yaw: wm.yaw, name: 'Weihnachtsmann', skin: 'weihnachten:entity/weihnachtsmann' },
    jukebox: { welt: 'world', x: jukebox[0], y: jukebox[1], z: jukebox[2], platten: 'weihnachten:platte_*', grund: 'serverwahl legt die 9 Weihnachtsplatten nacheinander ein (Länge aus den jukebox_song-Dateien); hörbar nur in der Nähe' },
    waehrung: 'minecraft:emerald', dezemberFaktor: 0.5, ware: liste,
  };
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
    const { funktionen, strukturen, bereich: { lo, hi }, tafel, lichter: l, jukebox, weihnachtsmann } = datapack();
    writeFileSync(join(REPO, 'spawn/weihnachtsmann.json'), JSON.stringify(haendler(weihnachtsmann, jukebox), null, 2) + '\n');
    const dp = join(aus, 'datapack/weihnachtsinsel');
    rmSync(dp, { recursive: true, force: true });
    for (const [n, t] of Object.entries(funktionen)) { const p = join(dp, 'data/weihnachtsinsel/function', `${n}.mcfunction`); mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, t); }
    for (const [n, t] of Object.entries(strukturen)) { const p = join(dp, 'data/weihnachtsinsel/structure', `${n}.nbt`); mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, t); }
    const ft = join(dp, 'data/minecraft/tags/function'); mkdirSync(ft, { recursive: true });
    writeFileSync(join(ft, 'load.json'), '{ "values": ["weihnachtsinsel:load"] }\n');
    writeFileSync(join(ft, 'tick.json'), '{ "values": ["weihnachtsinsel:tick"] }\n');
    writeFileSync(join(dp, 'pack.mcmeta'), JSON.stringify({ pack: { description: 'Server-Mission Weihnachtsinsel (spawn/weihnachtsinsel.mjs) – dauerhaft', min_format: [121, 0], max_format: [121, 0] } }, null, 2) + '\n');
    console.log(`Datapack weihnachtsinsel → ${dp}: ${Object.keys(funktionen).length} Funktionen, ${Object.keys(strukturen).length} Strukturen, Bereich ${lo.join('/')} … ${hi.join('/')}, Tafel ${tafel.join('/')}, Jukebox ${jukebox.join('/')}, Weihnachtsmann ${weihnachtsmann.pos.join('/')}, Lichter je Stufe ${l.join('/')}`);
  }
}
