// Entwurf „Weltenbaum“ (gewählt von Pascal 24.10.), vierte Fassung: Spawn unten im Baum.
// Etagenkrone nach Pumis Prinzipien (nichts nachgebaut): sieben flache Laubschirme auf schrägen Ästen, Augenblüten-Teppich oben, Laternen,
// heller Turm als Blickfang, Terrassenwurzeln. Neu: Spawn-Raum im ausgehöhlten Stammfuß (~25 Leute), vier Wurzelgänge nach außen, vor dem Start
// verschlossen (Eröffnungs-Event), Amethyst-Wendeltreppe mit Blasensäule im Stamm hinauf zum Kronenplatz. Keine Elytra, keine Sättigung.
// Aufruf: node spawn/entwuerfe/weltenbaum.mjs <ausgabe.schem>   (OFFEN=1: Ausgänge offen, nur für Vorschaubilder)
import { neu, setze, hole, LUFT, rauschen, zufall, schild, speichern, TAFELN } from './basis.mjs';

const W = 220, L = 220, H = 160, CX = 110, CZ = 110, G = 12; // G = Boden (lokal)
const S = G + 56;  // Stamm teilt sich
const D = G + 110; // Oberseite des höchsten Schirms = Kronenplatz
const F = 0.75;    // Kronengröße gegenüber der dritten Fassung (Ziel ~160 × 140)
const m = neu(W, H, L, 0);
const drin = (x, y, z) => x >= 0 && y >= 0 && z >= 0 && x < W && y < H && z < L;
const leer = (x, y, z) => drin(x, y, z) && hole(m, x, y, z) === LUFT;
const RINDE = ['minecraft:dark_oak_wood[axis=y]', 'minecraft:dark_oak_wood[axis=y]', 'minecraft:spruce_wood[axis=y]', 'minecraft:dark_oak_wood[axis=y]'];
const rinde = (x, y, z) => (rauschen(x + z * 0.7, y * 0.5, 7, 21) > 0.74 ? 'minecraft:moss_block' : RINDE[Math.floor(rauschen(x * 0.5 + y, z * 0.5, 5, 22) * 3.99)]);
const LAUBARTEN = [[0.40, 'dark_oak_leaves'], [0.70, 'spruce_leaves'], [0.90, 'azalea_leaves'], [0.95, 'flowering_azalea_leaves'], [1.01, 'pale_oak_leaves']];
const laub = (x, y, z) => { const n = rauschen(x * 0.8, z * 0.8 + y, 7, 41); return `minecraft:${LAUBARTEN.find(([g]) => n < g)[1]}[distance=1,persistent=true,waterlogged=false]`; };
const kerze = (x, y, z) => `minecraft:candle[candles=${1 + Math.floor(zufall(x, y, z, 31) * 4)},lit=true,waterlogged=false]`;
const ZAUN = 'minecraft:dark_oak_fence[east=false,north=false,south=false,waterlogged=false,west=false]';
const KETTE = 'minecraft:iron_chain[axis=y,waterlogged=false]', LATERNE_H = 'minecraft:lantern[hanging=true,waterlogged=false]', LATERNE = 'minecraft:lantern[hanging=false,waterlogged=false]';

function roehre(pfad, r0, r1) {
  for (let i = 0; i < pfad.length; i++) {
    const [px, py, pz] = pfad[i], r = r0 + (r1 - r0) * i / Math.max(1, pfad.length - 1), R = Math.ceil(r);
    for (let dy = -R; dy <= R; dy++) for (let dz = -R; dz <= R; dz++) for (let dx = -R; dx <= R; dx++) {
      if (dx * dx + dy * dy + dz * dz > r * r) continue;
      const x = Math.round(px + dx), y = Math.round(py + dy), z = Math.round(pz + dz);
      if (drin(x, y, z)) setze(m, x, y, z, rinde(x, y, z));
    }
  }
}
function bogen([ax, ay, az], [bx, by, bz], hub = 0, n = 120) {
  const mx = (ax + bx) / 2, my = (ay + by) / 2 + hub, mz = (az + bz) / 2, p = [];
  for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; p.push([u * u * ax + 2 * u * t * mx + t * t * bx, u * u * ay + 2 * u * t * my + t * t * by, u * u * az + 2 * u * t * mz + t * t * bz]); }
  return p;
}
const winkelAbstand = (a, b) => Math.abs(((a - b + 3 * Math.PI) % (2 * Math.PI)) - Math.PI);

// 1) Stamm bis zur Teilung, darüber der Mittelstamm (trägt die Treppe) bis zum Kronenplatz
for (let y = G - 6; y <= D; y++) {
  const t = Math.max(0, (y - G) / (S - G));
  const rc = y <= S + 6 ? 13 - 3.5 * Math.min(1, t) + 11 * Math.pow(Math.max(0, 1 - t), 4) : 7.5;
  for (let dz = -26; dz <= 26; dz++) for (let dx = -26; dx <= 26; dx++) {
    const w = Math.atan2(dz, dx), r = Math.hypot(dx, dz);
    if (r <= rc * (1 + 0.1 * Math.sin(9 * w + y * 0.08) + 0.05 * Math.sin(4 * w - y * 0.03))) setze(m, CX + dx, y, CZ + dz, rinde(CX + dx, y, CZ + dz));
  }
}
for (let s = 0; s < 8; s++) {
  const p = [], w0 = s * 2 * Math.PI / 8;
  for (let y = G - 2; y <= S + 6; y += 0.6) { const t = (y - G) / (S - G), w = w0 + t * 1.4, r = 11 - 3 * t + 8 * Math.pow(Math.max(0, 1 - t), 3); p.push([CX + r * Math.cos(w), y, CZ + r * Math.sin(w)]); }
  roehre(p, 4.5, 3.2);
}

// 2) Laubschirme (Etagenkrone)
const SCHIRME = [
  { x: 4, z: -6, y: D, a: 70, b: 56, d: 14, oben: true }, { x: -62, z: 12, y: D - 14, a: 42, b: 34, d: 11 }, { x: 64, z: 24, y: D - 22, a: 44, b: 30, d: 11 },
  { x: -20, z: 62, y: D - 32, a: 32, b: 27, d: 9 }, { x: 18, z: -66, y: D - 8, a: 36, b: 27, d: 10 }, { x: 48, z: -36, y: D - 30, a: 28, b: 22, d: 8 }, { x: -42, z: -40, y: D - 24, a: 30, b: 24, d: 9 },
].map((s) => ({ ...s, x: Math.round(s.x * F), z: Math.round(s.z * F), a: Math.round(s.a * F), b: Math.round(s.b * F) }));
const PX = CX, PZ = CZ, PLATZ = 12; // Kronenplatz um den Treppenausgang
const istPlatz = (x, z) => Math.hypot(x - PX, z - PZ) <= PLATZ;
const OBERSEITE = [];
for (const [k, s] of SCHIRME.entries()) {
  const sx = CX + s.x, sz = CZ + s.z;
  for (let z = Math.floor(sz - s.b - 6); z <= sz + s.b + 6; z++) for (let x = Math.floor(sx - s.a - 6); x <= sx + s.a + 6; x++) {
    const w = Math.atan2(z - sz, x - sx), fr = 1 + 0.16 * (rauschen(Math.cos(w) * 20 + k * 50, Math.sin(w) * 20, 6, 60 + k) - 0.5) * 2;
    const q = Math.hypot((x - sx) / (s.a * fr), (z - sz) / (s.b * fr)); if (q > 1) continue;
    const welle = Math.round(5 * rauschen(x, z, 11, 70 + k) + 2 * rauschen(x, z, 4, 75 + k) - 3 - 3 * q * q);
    const top = s.oben && istPlatz(x, z) ? D - 1 : s.y + welle;
    const unten = top - Math.round(s.d * Math.pow(1 - q * q, 0.6) + 4 * rauschen(x, z, 5, 80 + k));
    for (let y = unten; y <= top; y++) if (drin(x, y, z) && hole(m, x, y, z) === LUFT) setze(m, x, y, z, laub(x, y, z));
    if (!(s.oben && istPlatz(x, z))) OBERSEITE.push([x, top, z]);
    const r = zufall(x, unten, z, 3);
    if (r > 0.9) { const n = 1 + Math.floor(zufall(x, 1, z, 4) * (q > 0.7 ? 7 : 4)); for (let i = 1; i <= n; i++) if (leer(x, unten - i, z)) setze(m, x, unten - i, z, laub(x, unten - i, z)); }
    else if (r > 0.87) { const n = 2 + Math.floor(zufall(x, 2, z, 5) * 6); for (let i = 1; i <= n && leer(x, unten - i, z); i++) setze(m, x, unten - i, z, i === n ? 'minecraft:cave_vines[age=25,berries=true]' : `minecraft:cave_vines_plant[berries=${zufall(x, i, z) > 0.5}]`); }
  }
}

// 3) Äste: von der Teilung schräg nach außen unter jeden Schirm, dort Seitenäste
for (const [k, s] of SCHIRME.entries()) {
  if (k === 0) continue; // der oberste Schirm sitzt auf dem Mittelstamm
  const ziel = [CX + s.x * 0.75, s.y - s.d - 1, CZ + s.z * 0.75], start = [CX + 3 * Math.sign(s.x), S - 6 + k * 2, CZ + 3 * Math.sign(s.z)];
  roehre(bogen(start, ziel, 10), 5.5, 3);
  for (let j = 0; j < 5; j++) { const w = j * 2 * Math.PI / 5 + k; roehre(bogen(ziel, [CX + s.x + Math.cos(w) * s.a * 0.75, s.y - s.d * 0.6, CZ + s.z + Math.sin(w) * s.b * 0.75], 2, 80), 2.6, 1.1); }
}
for (let j = 0; j < 6; j++) { const w = j * Math.PI / 3 + 0.4, s = SCHIRME[0]; roehre(bogen([CX, D - 18, CZ], [CX + s.x + Math.cos(w) * s.a * 0.7, D - s.d * 0.6, CZ + s.z + Math.sin(w) * s.b * 0.7], 4, 80), 3.2, 1.3); }

// 4) Kronenplatz um den Treppenausgang: Holzdeck, Geländer mit drei Lücken zu Aussichtswegen an die Kante
const WEGE = [Math.PI * 0.78, Math.PI * 1.38, Math.PI * 1.98];
const amWeg = (w) => WEGE.some((a) => winkelAbstand(w, a) < 0.2);
for (let z = PZ - PLATZ - 1; z <= PZ + PLATZ + 1; z++) for (let x = PX - PLATZ - 1; x <= PX + PLATZ + 1; x++) {
  const r = Math.hypot(x - PX, z - PZ), w = Math.atan2(z - PZ, x - PX); if (r > PLATZ + 0.5) continue;
  for (let y = D; y <= D + 6; y++) setze(m, x, y, z, LUFT);
  const rand = r > PLATZ - 0.5;
  setze(m, x, D, z, rand ? 'minecraft:stripped_dark_oak_wood[axis=y]' : Math.abs(r - 8) < 0.6 ? (zufall(x, D, z) > 0.5 ? 'minecraft:verdant_froglight[axis=y]' : 'minecraft:stripped_spruce_wood[axis=y]') : 'minecraft:spruce_planks');
  if (rand && !amWeg(w)) { setze(m, x, D + 1, z, ZAUN); if (zufall(x, 5, z) > 0.75) setze(m, x, D + 2, z, LATERNE); }
}
for (const w of WEGE) for (let r = PLATZ; r <= 80; r++) {
  let ende = false;
  for (let s = -1; s <= 1; s++) {
    const x = Math.round(PX + r * Math.cos(w) - s * Math.sin(w)), z = Math.round(PZ + r * Math.sin(w) + s * Math.cos(w));
    let top = -1; for (let y = D + 6; y >= D - 12; y--) if (drin(x, y, z) && hole(m, x, y, z) !== LUFT) { top = y; break; }
    if (top < 0) { ende = true; continue; }
    for (let y = top; y >= D - 1; y--) setze(m, x, y, z, LUFT);
    setze(m, x, Math.min(top, D - 1), z, 'minecraft:stripped_spruce_wood[axis=y]');
  }
  if (ende) { setze(m, Math.round(PX + r * Math.cos(w)), D, Math.round(PZ + r * Math.sin(w)), LATERNE); break; }
}

// 5) Spawn-Raum im Stammfuß: Kuppel Radius 11, Holzwände mit Amethyst-Adern, Boden aus Kalzit/Moos/dunklem Holz, Licht, Infotafeln
const RR = 11, RH = 15;
for (let y = G + 1; y <= G + RH + 2; y++) for (let dz = -RR - 3; dz <= RR + 3; dz++) for (let dx = -RR - 3; dx <= RR + 3; dx++) {
  const r = Math.hypot(dx, dz), h = y - G - 1, rr = h < 9 ? RR : RR * Math.sqrt(Math.max(0, 1 - ((h - 9) / (RH - 8)) ** 2));
  const x = CX + dx, z = CZ + dz;
  if (r <= rr) { setze(m, x, y, z, LUFT); continue; }
  if (r <= rr + 2.2) setze(m, x, y, z, rauschen(x * 1.7 + y, z * 1.7 - y, 3, 99) > 0.68 ? (zufall(x, y, z, 98) > 0.8 ? 'minecraft:budding_amethyst' : 'minecraft:amethyst_block') : 'minecraft:stripped_dark_oak_wood[axis=y]');
}
for (let dz = -RR; dz <= RR; dz++) for (let dx = -RR; dx <= RR; dx++) {
  const r = Math.hypot(dx, dz); if (r > RR) continue;
  setze(m, CX + dx, G, CZ + dz, r < 3 ? 'minecraft:moss_block' : Math.abs(r - 6) < 0.7 ? 'minecraft:amethyst_block' : Math.round(Math.atan2(dz, dx) * 8 / Math.PI) % 2 ? 'minecraft:calcite' : 'minecraft:stripped_dark_oak_wood[axis=y]');
}
for (let k = 0; k < 8; k++) { const w = k * Math.PI / 4 + 0.2, x = Math.round(CX + (RR - 0.5) * Math.cos(w)), z = Math.round(CZ + (RR - 0.5) * Math.sin(w)); setze(m, x, G + 4, z, 'minecraft:shroomlight'); setze(m, Math.round(CX + (RR - 1.5) * Math.cos(w)), G + 1, Math.round(CZ + (RR - 1.5) * Math.sin(w)), 'minecraft:open_eyeblossom'); setze(m, Math.round(CX + (RR - 1.5) * Math.cos(w)), G, Math.round(CZ + (RR - 1.5) * Math.sin(w)), 'minecraft:moss_block'); }
for (let k = 0; k < 6; k++) { const w = k * Math.PI / 3, x = Math.round(CX + 7 * Math.cos(w)), z = Math.round(CZ + 7 * Math.sin(w)); for (let i = 1; i <= 3; i++) setze(m, x, G + RH - 2 - i, z, KETTE); setze(m, x, G + RH - 6, z, LATERNE_H); }
for (let k = 0; k < 40; k++) { const w = k * 0.61, y = G + 2 + (k * 5) % 10, x = Math.round(CX + (RR - 0.3) * Math.cos(w)), z = Math.round(CZ + (RR - 0.3) * Math.sin(w)); if (leer(x, y, z)) setze(m, x, y, z, 'minecraft:amethyst_cluster[facing=up,waterlogged=false]'); }
const SP = [CX, G + 1, CZ + 7]; // Spawnpunkt, Blick nach Norden auf die Treppe
TAFELN.forEach((t, i) => { const w = Math.PI * 0.35 + i * 0.3, x = Math.round(CX + (RR - 1) * Math.cos(w)), z = Math.round(CZ + (RR - 1) * Math.sin(w)); setze(m, x, G + 1, z, ZAUN); schild(m, x, G + 2, z, t, 8, 'dark_oak'); });

// 6) Wendeltreppe aus Amethyst und Kalzit im Stamm, Mitte: Blasensäule (Aufzug) hinter lila Glas, Tür unten
const ST0 = G + 1, ST1 = D; // vom Raumboden bis zum Kronenplatz
for (let y = G + RH - 3; y <= ST1 + 1; y++) for (let dz = -6; dz <= 6; dz++) for (let dx = -6; dx <= 6; dx++) {
  const r = Math.hypot(dx, dz), x = CX + dx, z = CZ + dz;
  if (r <= 4.6) setze(m, x, y, z, LUFT);
  else if (r <= 5.8 && y > G + RH) setze(m, x, y, z, rauschen(x * 1.7 + y, z * 1.7, 3, 101) > 0.7 ? 'minecraft:amethyst_block' : y % 9 === 0 && Math.abs(dx) < 1 ? 'minecraft:shroomlight' : 'minecraft:stripped_dark_oak_wood[axis=y]');
}
let stufen = 0;
for (let s = 0; ST0 + s <= ST1 - 1; s++) {
  const w0 = s * Math.PI / 4, y = ST0 + s; stufen++;
  for (let dz = -5; dz <= 5; dz++) for (let dx = -5; dx <= 5; dx++) {
    const r = Math.hypot(dx, dz), w = Math.atan2(dz, dx); if (r < 2.4 || r > 4.6) continue;
    if (winkelAbstand(w, w0 + Math.PI / 8) <= Math.PI / 8 + 0.02) setze(m, CX + dx, y, CZ + dz, s % 4 === 0 ? 'minecraft:calcite' : 'minecraft:amethyst_block');
  }
}
for (let y = G; y <= ST1 + 1; y++) for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
  const x = CX + dx, z = CZ + dz;
  if (dx === 0 && dz === 0) setze(m, x, y, z, y === G ? 'minecraft:soul_sand' : y <= ST1 - 1 ? 'minecraft:bubble_column[drag=false]' : LUFT);
  else if (y > G && y <= ST1 - 1) setze(m, x, y, z, 'minecraft:purple_stained_glass');
}
setze(m, CX, G + 1, CZ + 1, 'minecraft:dark_oak_door[facing=north,half=lower,hinge=left,open=false,powered=false]'); setze(m, CX, G + 2, CZ + 1, 'minecraft:dark_oak_door[facing=north,half=upper,hinge=left,open=false,powered=false]');

// 7) Turm am Stamm (Blickfang, Maßstab): Kalzit, dunkle Prismarin-Bänder, Fenster, Leuchtkern, Amethyst-Dach
const TX = CX + 2, TZ = CZ + 19, TR = 4;
for (let y = G - 2; y <= D + 4; y++) for (let dz = -TR - 1; dz <= TR + 1; dz++) for (let dx = -TR - 1; dx <= TR + 1; dx++) {
  const r = Math.hypot(dx, dz), x = TX + dx, z = TZ + dz; if (r > TR + 0.4) continue;
  if (r < TR - 1.2) { setze(m, x, y, z, y % 7 === 0 && r < 1 ? 'minecraft:sea_lantern' : LUFT); continue; }
  const fenster = (y - G) % 8 >= 3 && (y - G) % 8 <= 5 && (Math.abs(dx) <= 1 || Math.abs(dz) <= 1);
  setze(m, x, y, z, fenster ? 'minecraft:light_blue_stained_glass_pane[east=false,north=false,south=false,waterlogged=false,west=false]' : (y - G) % 16 === 0 ? 'minecraft:dark_prismarine' : (y - G) % 16 === 1 ? 'minecraft:prismarine_bricks' : 'minecraft:calcite');
}
for (let y = D + 5; y <= D + 14; y++) { const rad = TR + 0.6 - (y - D - 5) * 0.55; for (let dz = -TR - 1; dz <= TR + 1; dz++) for (let dx = -TR - 1; dx <= TR + 1; dx++) if (Math.hypot(dx, dz) <= rad) setze(m, TX + dx, y, TZ + dz, (y + dx + dz) % 3 ? 'minecraft:amethyst_block' : 'minecraft:purple_stained_glass'); }
setze(m, TX, D + 15, TZ, 'minecraft:end_rod[facing=up]');

// 8) Terrassenwurzeln: sieben Rücken in Zweierstufen, Moos/Gras, Kerzenreihen auf den Stufenkanten
const RUECKEN = Array.from({ length: 7 }, (_, i) => ({ w: i * 2 * Math.PI / 7 + 0.4 * (zufall(i, 0, 1) - 0.5), len: 46 + 14 * zufall(i, 1, 1), hoehe: 14 + 5 * zufall(i, 2, 1) }));
const hoehe = new Int16Array(W * L).fill(-1);
for (let z = 0; z < L; z++) for (let x = 0; x < W; x++) {
  const dx = x - CX, dz = z - CZ, r = Math.hypot(dx, dz), w = Math.atan2(dz, dx); if (r > 80) continue;
  let h = 0;
  for (const R of RUECKEN) { if (r > R.len) continue; const quer = winkelAbstand(w, R.w) * r, br = 6 + 9 * (1 - r / R.len); h = Math.max(h, R.hoehe * (1 - r / R.len) * Math.exp(-(quer * quer) / (2 * br * br))); }
  h = Math.max(h, 9 * Math.exp(-(r * r) / (2 * 20 * 20)));
  if (h >= 1) hoehe[z * W + x] = Math.floor(h / 2) * 2;
}
for (let z = 1; z < L - 1; z++) for (let x = 1; x < W - 1; x++) {
  const h = hoehe[z * W + x]; if (h < 0) continue;
  // Spawn-Raum (samt Wand) und Turm sind schon gebaut: deren Luft nicht auffüllen
  const innen = Math.hypot(x - CX, z - CZ) <= RR + 2.2 || Math.hypot(x - TX, z - TZ) <= TR + 0.4;
  for (let y = G - 4; y <= G + h; y++) if (hole(m, x, y, z) === LUFT && !(innen && y > G)) setze(m, x, y, z, y === G + h ? (rauschen(x, z, 5, 90) > 0.55 ? 'minecraft:moss_block' : 'minecraft:grass_block[snowy=false]') : y > G + h - 3 ? (zufall(x, y, z, 91) > 0.8 ? 'minecraft:rooted_dirt' : 'minecraft:dirt') : 'minecraft:stone');
  const kante = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => hoehe[(z + b) * W + x + a] < h);
  if (kante && leer(x, G + h + 1, z) && zufall(x, h, z, 92) > 0.7) setze(m, x, G + h + 1, z, kerze(x, h, z));
  else if (leer(x, G + h + 1, z) && zufall(x, h, z, 93) > 0.92) setze(m, x, G + h + 1, z, zufall(x, h, z, 94) > 0.4 ? 'minecraft:open_eyeblossom' : 'minecraft:short_grass');
}
for (const R of RUECKEN) { const p = []; for (let s = 0; s <= 1; s += 0.01) { const r = 8 + R.len * s; p.push([CX + r * Math.cos(R.w), G + R.hoehe * (1 - (r - 8) / R.len) + 1 - 3 * s, CZ + r * Math.sin(R.w)]); } roehre(p, 3.2, 1); }

// 9) Vier Wurzelgänge vom Spawn-Raum nach außen (zwischen den Rücken, nicht zum Turm), 3 breit, 4 hoch, Laternen; Ausgang am Hang
const AUSGAENGE = [], GANG = [];
const freieWinkel = []; for (let i = 0; i < 7; i++) { const a = RUECKEN[i].w, b = RUECKEN[(i + 1) % 7].w + (i === 6 ? 2 * Math.PI : 0); freieWinkel.push((a + b) / 2); }
const kandidaten = freieWinkel.filter((w) => winkelAbstand(w, Math.PI / 2) > 0.6).sort((a, b) => a - b);
const gewaehlt = kandidaten.length <= 4 ? kandidaten : [0, 1, 2, 3].map((i) => kandidaten[Math.round(i * kandidaten.length / 4)]);
for (const w of gewaehlt) {
  const ux = Math.cos(w), uz = Math.sin(w); let mund = null;
  for (let r = RR - 1; r <= 75; r++) {
    let frei = true;
    for (let q = -1; q <= 1; q++) for (let y = G + 1; y <= G + 4; y++) { const x = Math.round(CX + r * ux - q * uz), z = Math.round(CZ + r * uz + q * ux); if (!drin(x, y, z)) continue; if (hole(m, x, y, z) !== LUFT) frei = false; setze(m, x, y, z, LUFT); }
    for (let q = -1; q <= 1; q++) { const x = Math.round(CX + r * ux - q * uz), z = Math.round(CZ + r * uz + q * ux); setze(m, x, G, z, q === 0 ? 'minecraft:moss_block' : 'minecraft:stripped_dark_oak_wood[axis=y]'); }
    if (r % 7 === 0) { const x = Math.round(CX + r * ux), z = Math.round(CZ + r * uz); if (leer(x, G + 5, z) === false) setze(m, x, G + 4, z, LATERNE_H); }
    if (frei && r > RR + 6) { mund = r; break; }
  }
  if (!mund) continue;
  // Verschluss am äußeren Ende: außen Mangrovenwurzeln (sichtbar), dahinter Barriere (Sicherheit)
  const box = (r) => { const pts = []; for (let q = -1; q <= 1; q++) for (let y = G + 1; y <= G + 4; y++) pts.push([Math.round(CX + r * ux - q * uz), y, Math.round(CZ + r * uz + q * ux)]); const xs = pts.map((p) => p[0]), zs = pts.map((p) => p[2]); return [Math.min(...xs), G + 1, Math.min(...zs), Math.max(...xs), G + 4, Math.max(...zs)]; };
  AUSGAENGE.push({ wurzeln: box(mund - 2), barriere: box(mund - 3), aussen: [Math.round(CX + (mund + 3) * ux), G + 1, Math.round(CZ + (mund + 3) * uz)] });
  for (let r = RR - 1; r <= mund + 4; r++) for (let q = -1; q <= 1; q++) for (let y = G + 1; y <= G + 4; y++) GANG.push([Math.round(CX + r * ux - q * uz), y, Math.round(CZ + r * uz + q * ux)]);
}
if (!process.env.OFFEN) for (const a of AUSGAENGE) {
  const [x1, y1, z1, x2, y2, z2] = a.wurzeln; for (let x = x1; x <= x2; x++) for (let y = y1; y <= y2; y++) for (let z = z1; z <= z2; z++) setze(m, x, y, z, 'minecraft:mangrove_roots[waterlogged=false]');
  const [b1, c1, d1, b2, c2, d2] = a.barriere; for (let x = b1; x <= b2; x++) for (let y = c1; y <= c2; y++) for (let z = d1; z <= d2; z++) setze(m, x, y, z, 'minecraft:barrier[waterlogged=false]');
}

// 10) Kronenoberseite: Moosflecken mit Augenblüten (Nachteffekt, kein echtes Licht), wenige Kerzen; Laternen an Ketten unter den Schirmen
let augen = 0;
for (const [x, y, z] of OBERSEITE) {
  if (!leer(x, y + 1, z) || hole(m, x, y, z) === LUFT) continue;
  if (rauschen(x, z, 7, 96) > 0.42) { setze(m, x, y, z, 'minecraft:moss_block'); const r = zufall(x, y, z, 97); if (r > 0.55) { setze(m, x, y + 1, z, 'minecraft:open_eyeblossom'); augen++; } else if (r > 0.45) setze(m, x, y + 1, z, 'minecraft:moss_carpet'); }
  else if (zufall(x, y, z, 95) > 0.985) setze(m, x, y + 1, z, kerze(x, y, z));
}
for (const s of SCHIRME) for (let j = 0; j < 14; j++) {
  const w = j * Math.PI / 7 + s.x, x = Math.round(CX + s.x + Math.cos(w) * s.a * 0.5), z = Math.round(CZ + s.z + Math.sin(w) * s.b * 0.5);
  for (let y = s.y; y > G; y--) if (drin(x, y, z) && hole(m, x, y, z) !== LUFT && leer(x, y - 1, z)) { for (let i = 1; i <= 4; i++) setze(m, x, y - i, z, KETTE); setze(m, x, y - 5, z, LATERNE_H); break; }
}

// Hohlräume als Höhlenluft: place template lässt normale Luft weg, Höhlenluft räumt dort natürliches Gelände (Erde, Gras, Bäume) frei.
// Spawn-Raum, Treppenschacht, Turm innen, Wurzelgänge und 4 Blöcke vor jedem Ausgang
const HOHL = 'minecraft:cave_air';
const hohl = (x, y, z) => { if (drin(x, y, z) && y > G && hole(m, x, y, z) === LUFT) setze(m, x, y, z, HOHL); };
for (let y = G + 1; y <= ST1 + 1; y++) for (let dz = -RR; dz <= RR; dz++) for (let dx = -RR; dx <= RR; dx++) {
  if (Math.hypot(dx, dz) <= (y <= G + RH + 2 ? RR : 4.6)) hohl(CX + dx, y, CZ + dz);
}
for (let y = G + 1; y <= D + 4; y++) for (let dz = -TR; dz <= TR; dz++) for (let dx = -TR; dx <= TR; dx++) if (Math.hypot(dx, dz) < TR - 1.2) hohl(TX + dx, y, TZ + dz);
for (const [x, y, z] of GANG) hohl(x, y, z);

// Statistik für Leistung und Größe
let ax0 = W, ax1 = 0, az0 = L, az1 = 0, ay1 = 0, nichtLuft = 0, nLaub = 0, kerzen = 0;
for (let i = 0; i < m.bloecke.length; i++) { const b = m.bloecke[i]; if (b === LUFT || b === HOHL) continue; nichtLuft++; if (b.includes('leaves')) nLaub++; if (b.startsWith('minecraft:candle')) kerzen++; const x = i % W, z = ((i / W) | 0) % L, y = (i / (W * L)) | 0; if (x < ax0) ax0 = x; if (x > ax1) ax1 = x; if (z < az0) az0 = z; if (z > az1) az1 = z; if (y > ay1) ay1 = y; }
const krone = [0, 0, W, 0]; for (let i = 0; i < m.bloecke.length; i++) if (m.bloecke[i].includes('leaves')) { const x = i % W, z = ((i / W) | 0) % L; krone[0] = Math.min(krone[0] || x, x); }
speichern(m, process.argv[2], {
  name: 'Weltenbaum (Spawn unten im Stamm)', spawn: SP, blick: [180, 0], boden: G, kronenplatz: D, turm: [TX, G, TZ],
  spawnRaum: { mitte: [CX, G + 1, CZ], radius: RR, hoehe: RH }, treppe: { stufen, von: ST0, bis: ST1 }, blasensaeule: [CX, G, CZ],
  ausgaenge: AUSGAENGE,
  oval: { x: Math.round((ax0 + ax1) / 2), z: Math.round((az0 + az1) / 2), a: Math.ceil((ax1 - ax0) / 2), b: Math.ceil((az1 - az0) / 2) },
  pilzland: { x: Math.round((ax0 + ax1) / 2), z: Math.round((az0 + az1) / 2), a: Math.ceil((ax1 - ax0) / 2) + 30, b: Math.ceil((az1 - az0) / 2) + 30 },
  ausdehnung: { x: ax1 - ax0 + 1, z: az1 - az0 + 1, hoeheUeberBoden: ay1 - G },
  leistung: { bloecke: nichtLuft, laub: nLaub, kerzen, augenblueten: augen },
});
console.log(`Weltenbaum: Ausdehnung ${ax1 - ax0 + 1} × ${az1 - az0 + 1}, Höhe über Boden ${ay1 - G}, Blöcke ${nichtLuft} (Laub ${nLaub}), Kerzen ${kerzen}, Augenblüten ${augen}, Treppenstufen ${stufen}, Ausgänge ${AUSGAENGE.length}`);
