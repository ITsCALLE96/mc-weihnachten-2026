// Entwurf 1 „Felsinsel“: schwebende Felsinsel mit Kristallturm als Wahrzeichen, Wasserfall ins Leere, Abflugsteg nach Süden,
// Platz für ~25 Spieler, Erweiterungsfläche im Nordwesten. Aufruf: node spawn/entwuerfe/felsinsel.mjs <ausgabe.schem>
import { neu, setze, hole, LUFT, rauschen, zufall, sicher, schild, speichern, TAFELN } from './basis.mjs';

const W = 84, L = 84, H = 104, CX = 42, CZ = 42, T = 72; // T = Höhe der Oberfläche (lokal)
const m = neu(W, H, L, 0);
const R = (w) => 27 + 3 * Math.sin(3 * w + 1) + 2 * Math.sin(5 * w + 2) + 1.5 * Math.sin(7 * w);
const STEIN = ['minecraft:stone', 'minecraft:andesite', 'minecraft:tuff', 'minecraft:stone', 'minecraft:cobblestone', 'minecraft:andesite'];

// Felskörper: oben flach, unten ein unregelmäßiger, hängender Kegel
for (let z = 0; z < L; z++) for (let x = 0; x < W; x++) {
  const dx = x - CX, dz = z - CZ, r = Math.hypot(dx, dz), w = Math.atan2(dz, dx), rr = R(w);
  if (r > rr) continue;
  const k = r / rr;
  const tiefe = Math.round(50 * Math.pow(1 - k, 1.35) + 3 + 6 * rauschen(x, z, 6, 3) + (zufall(x, 0, z, 9) > 0.93 ? 6 * (1 - k) : 0));
  const oben = T - (k > 0.93 ? 1 : 0);
  for (let y = oben - tiefe; y <= oben; y++) {
    const d = oben - y;
    let b;
    if (d === 0) b = 'minecraft:grass_block[snowy=false]';
    else if (d <= 3) b = 'minecraft:dirt';
    else b = STEIN[Math.floor(rauschen(x + y * 3, z, 5, 11) * STEIN.length) % STEIN.length];
    if (y === oben - tiefe) b = zufall(x, y, z) > 0.5 ? 'minecraft:mossy_cobblestone' : 'minecraft:moss_block';
    sicher(m, x, y, z, b);
  }
  // Ranken und hängende Wurzeln an der Unterseite
  const unten = oben - tiefe - 1;
  if (k > 0.55 && zufall(x, 1, z) > 0.8) for (let y = unten; y > unten - 2 - Math.floor(zufall(x, 2, z) * 7); y--) sicher(m, x, y, z, 'minecraft:vine[east=false,north=true,south=false,up=false,west=false]');
  if (k < 0.55 && zufall(x, 3, z) > 0.94) for (let y = unten; y > unten - 3; y--) sicher(m, x, y, z, 'minecraft:hanging_roots');
}

// Platz in der Mitte (Radius 13): Steinziegel in Ringen
for (let z = 0; z < L; z++) for (let x = 0; x < W; x++) {
  const r = Math.hypot(x - CX, z - CZ);
  if (r <= 13) setze(m, x, T, z, r <= 4 ? 'minecraft:polished_deepslate' : Math.round(r) % 4 === 0 ? 'minecraft:chiseled_stone_bricks' : zufall(x, T, z) > 0.8 ? 'minecraft:mossy_stone_bricks' : 'minecraft:stone_bricks');
  else if (r <= 14) setze(m, x, T, z, 'minecraft:polished_andesite');
}

// Wahrzeichen: Kristallturm (Kalzit-Sockel, Amethyst-Spitze mit Leuchtkern), 30 Blöcke hoch
for (let y = 1; y <= 30; y++) {
  const rad = y <= 3 ? 3.5 : 2.6 * (1 - (y - 3) / 28) + 0.4;
  for (let dz = -4; dz <= 4; dz++) for (let dx = -4; dx <= 4; dx++) {
    const r = Math.hypot(dx, dz); if (r > rad) continue;
    let b = y <= 3 ? (r > 2.5 ? 'minecraft:calcite' : 'minecraft:polished_deepslate') : (r < 1 && y % 5 === 0 ? 'minecraft:sea_lantern' : zufall(dx, y, dz) > 0.75 ? 'minecraft:budding_amethyst' : 'minecraft:amethyst_block');
    setze(m, CX + dx, T + y, CZ + dz, b);
  }
}
setze(m, CX, T + 31, CZ, 'minecraft:end_rod[facing=up]');
for (const [dx, dz] of [[3, 0], [-3, 0], [0, 3], [0, -3]]) setze(m, CX + dx, T + 4, CZ + dz, `minecraft:amethyst_cluster[facing=up,waterlogged=false]`);

// Teich und Bach nach Osten, Wasserfall über die Kante ins Leere
let ost = CX; while (ost < W - 2 && hole(m, ost + 1, T - 1, CZ) !== LUFT) ost++; // Rand liegt einen Block tiefer
for (let x = CX + 15; x <= ost + 1; x++) for (let dz = -2; dz <= 2; dz++) {
  const pond = x <= CX + 19, z = CZ + dz;
  if (!pond && Math.abs(dz) > 1) continue;
  if (x === ost + 1) { if (Math.abs(dz) <= 1) setze(m, x, T, z, 'minecraft:water[level=0]'); continue; } // über die Kante hinaus: Quelle fällt
  if (hole(m, x, T, z) === LUFT) continue;
  setze(m, x, T, z, 'minecraft:water[level=0]');
  if (pond) setze(m, x, T - 1, z, 'minecraft:water[level=0]');
  for (const s of [-1, 1]) if (hole(m, x, T, z + s * (pond ? 3 : 2)) !== LUFT && hole(m, x, T, z + s * (pond ? 3 : 2)).includes('grass')) setze(m, x, T, z + s * (pond ? 3 : 2), 'minecraft:mossy_cobblestone');
}

// Abflugsteg nach Süden: 5 breit, bis 7 Blöcke über die Kante, Geländer ohne Spitze
let kante = CZ; while (kante < L - 1 && hole(m, CX, T, kante + 1) !== LUFT) kante++;
for (let z = CZ + 14; z <= kante + 7 && z < L; z++) for (let dx = -2; dx <= 2; dx++) {
  setze(m, CX + dx, T, z, Math.abs(dx) === 2 ? 'minecraft:polished_andesite' : 'minecraft:stone_bricks');
  if (z > kante) setze(m, CX + dx, T - 1, z, 'minecraft:stone_brick_slab[type=top,waterlogged=false]');
  if (Math.abs(dx) === 2 && z > kante && z < kante + 6) setze(m, CX + dx, T + 1, z, 'minecraft:stone_brick_wall[east=none,north=low,south=low,up=true,waterlogged=false,west=none]');
}
setze(m, CX - 2, T + 2, kante + 5, 'minecraft:lantern[hanging=false,waterlogged=false]'); setze(m, CX + 2, T + 2, kante + 5, 'minecraft:lantern[hanging=false,waterlogged=false]');

// Ein paar Bäume am Nordrand, Gras und Blumen
for (const [dx, dz] of [[-14, -16], [6, -20], [16, -12], [-20, 4]]) {
  const x = CX + dx, z = CZ + dz; if (hole(m, x, T, z) === LUFT) continue;
  for (let y = 1; y <= 5; y++) setze(m, x, T + y, z, 'minecraft:oak_log[axis=y]');
  for (let ly = 4; ly <= 7; ly++) for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) if (Math.abs(a) + Math.abs(b) + (ly - 5) <= 3 && hole(m, x + a, T + ly, z + b) === LUFT) setze(m, x + a, T + ly, z + b, 'minecraft:azalea_leaves[distance=1,persistent=true,waterlogged=false]');
}
for (let z = 0; z < L; z++) for (let x = 0; x < W; x++) if (hole(m, x, T, z).includes('grass_block') && hole(m, x, T + 1, z) === LUFT && zufall(x, 5, z) > 0.86) setze(m, x, T + 1, z, zufall(x, 6, z) > 0.85 ? 'minecraft:cornflower' : 'minecraft:short_grass');

// Infotafeln neben dem Spawn (Blick nach Osten)
TAFELN.forEach((t, i) => { setze(m, CX - 6, T + 1, CZ + 8 + i * 2, 'minecraft:spruce_fence[east=false,north=false,south=false,waterlogged=false,west=false]'); schild(m, CX - 6, T + 2, CZ + 8 + i * 2, t, 12); });

speichern(m, process.argv[2], {
  name: 'Felsinsel', spawn: [CX, T + 1, CZ + 10], blick: [180, 0], wahrzeichen: [CX, T, CZ],
  obenBereich: { von: [CX - 32, T - 6, CZ - 32], bis: [CX + 32, T + 40, CZ + 40] },
  oval: { x: CX, z: CZ, a: 34, b: 38 }, unterkante: T - 56, abflug: [CX, T, kante + 7], erweiterung: 'Nordwest-Viertel (Grasfläche)',
});
console.log('Felsinsel', m.w, m.h, m.l, 'Steg-Kante z', kante);
