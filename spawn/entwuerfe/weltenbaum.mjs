// Entwurf 2 „Weltenbaum“: Wurzeln am Boden, mächtiger Stamm, in der Krone eine runde Plattform als Spawnplatz,
// fünf begehbare Äste als Abflugstellen, Blätterdach im Ring (Himmel über dem Spawn frei), leuchtender Kern als Wahrzeichen.
// Aufruf: node spawn/entwuerfe/weltenbaum.mjs <ausgabe.schem>
import { neu, setze, hole, LUFT, rauschen, zufall, sicher, schild, speichern, TAFELN } from './basis.mjs';

const W = 104, L = 104, H = 132, CX = 52, CZ = 52, G = 8, D = G + 92; // G = Bodenhöhe (lokal), D = Plattform
const m = neu(W, H, L, 0);
const RINDE = 'minecraft:oak_wood[axis=y]', LAUB = 'minecraft:oak_leaves[distance=1,persistent=true,waterlogged=false]';
const kugel = (x, y, z, r, b, nurLuft = true) => { for (let dy = -r; dy <= r; dy++) for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) if (dx * dx + dy * dy + dz * dz <= r * r) { const X = Math.round(x + dx), Y = Math.round(y + dy), Z = Math.round(z + dz); if (X < 0 || Y < 0 || Z < 0 || X >= W || Y >= H || Z >= L) continue; if (!nurLuft || hole(m, X, Y, Z) === LUFT) setze(m, X, Y, Z, b); } };
const ast = (pfad, r0, r1, b) => pfad.forEach(([x, y, z], i) => kugel(x, y, z, r0 + (r1 - r0) * i / (pfad.length - 1), b, false));

// Stamm: unten breit ausgestellt, nach oben schlanker, leicht geschwungen
for (let y = G - 3; y <= D; y++) {
  const t = (y - G) / (D - G), rad = 9 - 3.5 * t + 6 * Math.pow(Math.max(0, 1 - t), 6);
  const ox = 2.2 * Math.sin(t * Math.PI * 1.2), oz = 1.5 * Math.sin(t * Math.PI * 0.8 + 1);
  for (let dz = -17; dz <= 17; dz++) for (let dx = -17; dx <= 17; dx++) {
    const r = Math.hypot(dx - ox, dz - oz) + 0.8 * rauschen(dx * 3 + y, dz * 3, 4, 5);
    if (r <= rad) sicher(m, CX + dx, y, CZ + dz, r > rad - 1.2 && zufall(dx, y, dz) > 0.86 ? 'minecraft:moss_block' : RINDE);
  }
}
// Wurzeln: sieben Stränge, wölben sich aus dem Boden und tauchen wieder ein
for (let i = 0; i < 7; i++) {
  const w = i * 2 * Math.PI / 7 + 0.4 * zufall(i, 0, 0), len = 30 + 10 * zufall(i, 1, 0), pfad = [];
  for (let s = 0; s <= 30; s++) { const f = s / 30, r = 8 + len * f; pfad.push([CX + r * Math.cos(w + 0.25 * Math.sin(f * 4)), G + 7 * Math.sin(Math.PI * Math.min(1, f * 1.15)) - 3 * f, CZ + r * Math.sin(w + 0.25 * Math.sin(f * 4))]); }
  ast(pfad, 3.6, 0.9, RINDE);
}
// Boden unter dem Baum (nur für die Vorschau sichtbar, im Spiel liegt das echte Gelände darunter): Moos um den Stamm
for (let dz = -14; dz <= 14; dz++) for (let dx = -14; dx <= 14; dx++) if (Math.hypot(dx, dz) < 13 && hole(m, CX + dx, G - 1, CZ + dz) === LUFT && zufall(dx, 9, dz) > 0.3) setze(m, CX + dx, G - 1, CZ + dz, 'minecraft:moss_block');

// Kronen-Plattform: Radius 19, Fichtenbretter, Rand aus Stämmen, Träger darunter
for (let dz = -20; dz <= 20; dz++) for (let dx = -20; dx <= 20; dx++) {
  const r = Math.hypot(dx, dz); if (r > 19.5) continue;
  setze(m, CX + dx, D, CZ + dz, r > 18.5 ? 'minecraft:stripped_spruce_log[axis=y]' : r < 3.5 ? 'minecraft:moss_block' : (Math.floor(r) % 5 === 0 ? 'minecraft:stripped_oak_wood[axis=y]' : 'minecraft:spruce_planks'));
}
for (let k = 0; k < 10; k++) { const w = k * Math.PI / 5; for (let r = 4; r <= 18; r++) { setze(m, Math.round(CX + r * Math.cos(w)), D - 1, Math.round(CZ + r * Math.sin(w)), 'minecraft:stripped_spruce_log[axis=x]'); if (r > 6) setze(m, Math.round(CX + r * Math.cos(w)), D - 1 - Math.floor((18 - r) / 4), Math.round(CZ + r * Math.sin(w)), RINDE); } }

// Fünf Äste als Abflugstellen: vom Rand aus begehbar (flache Oberseite), am Ende leicht hängend mit Laub
const ASTW = [0.3, 1.55, 2.8, 4.05, 5.3];
const LUECKEN = [];
for (const w of ASTW) {
  const pfad = []; for (let s = 0; s <= 24; s++) { const r = 8 + s; pfad.push([CX + r * Math.cos(w), D - 2 - (s > 16 ? (s - 16) * 0.5 : 0), CZ + r * Math.sin(w)]); }
  ast(pfad, 2.4, 1.3, RINDE);
  for (let r = 19; r <= 30; r++) { const x = Math.round(CX + r * Math.cos(w)), z = Math.round(CZ + r * Math.sin(w)); setze(m, x, D, z, 'minecraft:stripped_oak_wood[axis=y]'); for (const s of [-1, 1]) { const x2 = Math.round(x - s * Math.sin(w)), z2 = Math.round(z + s * Math.cos(w)); setze(m, x2, D, z2, 'minecraft:stripped_oak_wood[axis=y]'); } }
  kugel(CX + 33 * Math.cos(w), D - 4, CZ + 33 * Math.sin(w), 4, LAUB);
  setze(m, Math.round(CX + 29 * Math.cos(w)), D + 1, Math.round(CZ + 29 * Math.sin(w)), 'minecraft:lantern[hanging=false,waterlogged=false]');
  LUECKEN.push(w);
}
// Geländer auf dem Rand, mit Lücken zu den Ästen
for (let k = 0; k < 360; k++) {
  const w = k * Math.PI / 180, x = Math.round(CX + 19 * Math.cos(w)), z = Math.round(CZ + 19 * Math.sin(w));
  if (LUECKEN.some((a) => Math.abs(((w - a + 3 * Math.PI) % (2 * Math.PI)) - Math.PI) < 0.14)) continue;
  if (hole(m, x, D + 1, z) === LUFT) setze(m, x, D + 1, z, 'minecraft:spruce_fence[east=false,north=false,south=false,waterlogged=false,west=false]');
}
// Blätterdach im Ring über dem äußeren Rand (Himmel über der Mitte bleibt frei), hängende Laternen
for (let k = 0; k < 14; k++) { const w = k * 2 * Math.PI / 14 + 0.2, r = 23 + 4 * zufall(k, 3, 0); kugel(CX + r * Math.cos(w), D + 12 + 3 * zufall(k, 4, 0), CZ + r * Math.sin(w), 8 + Math.round(2 * zufall(k, 5, 0)), zufall(k, 6, 0) > 0.6 ? 'minecraft:flowering_azalea_leaves[distance=1,persistent=true,waterlogged=false]' : LAUB); }
for (let k = 0; k < 14; k++) { const w = k * 2 * Math.PI / 14 + 0.2, r = 20, x = Math.round(CX + r * Math.cos(w)), z = Math.round(CZ + r * Math.sin(w)); for (let y = D + 7; y > 0; y--) if (hole(m, x, y, z) !== LUFT) { for (let yy = y - 1; yy > D + 3 && yy > y - 4; yy--) setze(m, x, yy, z, 'minecraft:iron_chain[axis=y,waterlogged=false]'); setze(m, x, D + 3, z, 'minecraft:lantern[hanging=true,waterlogged=false]'); break; } }
// Äste vom Stamm hinauf ins Blätterdach
for (const w of [0.95, 2.2, 3.45, 4.7, 5.95]) { const pfad = []; for (let s = 0; s <= 16; s++) { const f = s / 16; pfad.push([CX + (11 + 10 * f) * Math.cos(w), D + 1 + 10 * Math.sin(f * Math.PI / 2), CZ + (11 + 10 * f) * Math.sin(w)]); } ast(pfad, 1.1, 0.6, RINDE); }

// Wahrzeichen: leuchtender Kern auf dem Stammende (Pilzlicht, Moos, Azaleen)
for (let y = 1; y <= 5; y++) kugel(CX, D + y, CZ, y <= 2 ? 2 : y === 3 ? 1.5 : 1, y <= 4 ? 'minecraft:shroomlight' : 'minecraft:flowering_azalea_leaves[distance=1,persistent=true,waterlogged=false]', false);
for (const [dx, dz] of [[3, 0], [-3, 0], [0, 3], [0, -3]]) setze(m, CX + dx, D + 1, CZ + dz, 'minecraft:flowering_azalea');

// Infotafeln neben dem Spawn (Blick nach Westen auf den Kern)
TAFELN.forEach((t, i) => { setze(m, CX + 9, D + 1, CZ + 6 + i * 2, 'minecraft:spruce_fence[east=false,north=false,south=false,waterlogged=false,west=false]'); schild(m, CX + 9, D + 2, CZ + 6 + i * 2, t, 4); });

speichern(m, process.argv[2], {
  name: 'Weltenbaum', spawn: [CX, D + 1, CZ + 10], blick: [180, 0], wahrzeichen: [CX, D, CZ], boden: G,
  obenBereich: { von: [CX - 22, D - 4, CZ - 22], bis: [CX + 22, D + 25, CZ + 22] },
  oval: { x: CX, z: CZ, a: 40, b: 40 }, abflug: 'Äste in fünf Richtungen', erweiterung: 'äußerer Ring der Plattform, Äste ausbaubar',
});
console.log('Weltenbaum', m.w, m.h, m.l);
