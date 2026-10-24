// Entwurf „Weltenbaum“ (gewählt von Pascal 24.10.), dritte Fassung nach Pumis Baum als Inspiration (nur Prinzipien, nichts nachgebaut):
// breite, flache Krone aus gestaffelten Laubschirmen auf schräg auslaufenden Ästen, dunkles Laub (Fichte, festes Dunkelgrün auch im Pilzland),
// heller Turm am Stamm als Aufstieg und Maßstab, Wurzeln als Terrassenhügel mit Kerzenreihen, Kerzenteppich auf der Krone bei Nacht.
// Spawn oben auf dem höchsten Schirm unter freiem Himmel, Abflug über drei Wege an die Schirmkante.
// Aufruf: node spawn/entwuerfe/weltenbaum.mjs <ausgabe.schem>   (PFLICHTLICHT=1: jede begehbare Stelle am Baum ≥ 1 Blocklicht, nur ohne Pilzland nötig)
import { neu, setze, hole, LUFT, rauschen, zufall, schild, speichern, TAFELN } from './basis.mjs';

const W = 270, L = 270, H = 200, CX = 135, CZ = 135, G = 14; // G = Boden (lokal)
const S = G + 58;  // Stamm teilt sich
const D = G + 110; // Oberseite des höchsten Schirms = Spawnplatz
const m = neu(W, H, L, 0);
const drin = (x, y, z) => x >= 0 && y >= 0 && z >= 0 && x < W && y < H && z < L;
const leer = (x, y, z) => drin(x, y, z) && hole(m, x, y, z) === LUFT;
const RINDE = ['minecraft:dark_oak_wood[axis=y]', 'minecraft:dark_oak_wood[axis=y]', 'minecraft:spruce_wood[axis=y]', 'minecraft:dark_oak_wood[axis=y]'];
const rinde = (x, y, z) => (rauschen(x + z * 0.7, y * 0.5, 7, 21) > 0.74 ? 'minecraft:moss_block' : RINDE[Math.floor(rauschen(x * 0.5 + y, z * 0.5, 5, 22) * 3.99)]);
// Laub: Dunkeleiche (Biomfarbe), Fichte (festes Dunkelgrün), Azalee (fest, hell), etwas Blasse Eiche (fest, graugrün) – in Flecken gemischt
const LAUBARTEN = [[0.40, 'dark_oak_leaves'], [0.70, 'spruce_leaves'], [0.90, 'azalea_leaves'], [0.95, 'flowering_azalea_leaves'], [1.01, 'pale_oak_leaves']];
const laub = (x, y, z) => { const n = rauschen(x * 0.8, z * 0.8 + y, 7, 41); return `minecraft:${LAUBARTEN.find(([g]) => n < g)[1]}[distance=1,persistent=true,waterlogged=false]`; };
const kerze = (x, y, z) => `minecraft:candle[candles=${1 + Math.floor(zufall(x, y, z, 31) * 4)},lit=true,waterlogged=false]`;
const lichter = [];

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
// Gebogener Pfad von a nach b (quadratische Kurve mit Bogen nach oben/außen)
function bogen([ax, ay, az], [bx, by, bz], hub = 0, n = 120) {
  const mx = (ax + bx) / 2, my = (ay + by) / 2 + hub, mz = (az + bz) / 2, p = [];
  for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; p.push([u * u * ax + 2 * u * t * mx + t * t * bx, u * u * ay + 2 * u * t * my + t * t * by, u * u * az + 2 * u * t * mz + t * t * bz]); }
  return p;
}

// 1) Stamm: Kern mit Furchen und gedrehten Strängen, unten breit ausgestellt, bis zur Teilung
for (let y = G - 6; y <= S + 8; y++) {
  const t = Math.max(0, (y - G) / (S - G)), rc = 13 - 3.5 * Math.min(1, t) + 10 * Math.pow(Math.max(0, 1 - t), 4);
  const ox = 2 * Math.sin(t * 2), oz = 1.6 * Math.sin(t * 1.4 + 1);
  for (let dz = -26; dz <= 26; dz++) for (let dx = -26; dx <= 26; dx++) {
    const w = Math.atan2(dz - oz, dx - ox), r = Math.hypot(dx - ox, dz - oz);
    if (r <= rc * (1 + 0.1 * Math.sin(9 * w + y * 0.08) + 0.05 * Math.sin(4 * w - y * 0.03))) setze(m, CX + dx, y, CZ + dz, rinde(CX + dx, y, CZ + dz));
  }
}
for (let s = 0; s < 8; s++) {
  const p = [], w0 = s * 2 * Math.PI / 8;
  for (let y = G - 2; y <= S + 6; y += 0.6) { const t = (y - G) / (S - G), w = w0 + t * 1.4, r = 11 - 3 * t + 7 * Math.pow(Math.max(0, 1 - t), 3); p.push([CX + r * Math.cos(w), y, CZ + r * Math.sin(w)]); }
  roehre(p, 4.5, 3.2);
}

// 2) Laubschirme: flach und breit, Oberseite wellig, Unterseite gewölbt und zerfranst
const SCHIRME = [ // Mitte x/z (relativ), Oberseite y, Halbachsen, Dicke
  { x: 4, z: -6, y: D, a: 70, b: 56, d: 14, oben: true },
  { x: -62, z: 12, y: D - 14, a: 42, b: 34, d: 11 },
  { x: 64, z: 24, y: D - 22, a: 44, b: 30, d: 11 },
  { x: -20, z: 62, y: D - 32, a: 32, b: 27, d: 9 },
  { x: 18, z: -66, y: D - 8, a: 36, b: 27, d: 10 },
  { x: 48, z: -36, y: D - 30, a: 28, b: 22, d: 8 },
  { x: -42, z: -40, y: D - 24, a: 30, b: 24, d: 9 },
];
const PLATZ = 17; // Radius des Spawnplatzes auf dem obersten Schirm
const istPlatz = (x, z) => Math.hypot(x - (CX + SCHIRME[0].x), z - (CZ + SCHIRME[0].z)) <= PLATZ;
const OBERSEITE = []; // [x, y, z] der Laub-Oberseite (für Kerzen)
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
    // herabhängende Laubstränge und Leuchtbeeren an der Unterseite
    const r = zufall(x, unten, z, 3);
    if (r > 0.9) { const n = 1 + Math.floor(zufall(x, 1, z, 4) * (q > 0.7 ? 7 : 4)); for (let i = 1; i <= n; i++) if (leer(x, unten - i, z)) setze(m, x, unten - i, z, laub(x, unten - i, z)); }
    else if (r > 0.87) { const n = 2 + Math.floor(zufall(x, 2, z, 5) * 6); for (let i = 1; i <= n && leer(x, unten - i, z); i++) setze(m, x, unten - i, z, i === n ? 'minecraft:cave_vines[age=0,berries=true]' : `minecraft:cave_vines_plant[berries=${zufall(x, i, z) > 0.5}]`); }
  }
}

// 3) Äste: von der Teilung schräg nach außen unter jeden Schirm, dort Seitenäste zur Schirmkante
for (const [k, s] of SCHIRME.entries()) {
  const ziel = [CX + s.x * 0.75, s.y - s.d - 1, CZ + s.z * 0.75];
  const start = [CX + 3 * Math.sign(s.x), S - 6 + k * 2, CZ + 3 * Math.sign(s.z)];
  roehre(bogen(start, ziel, k === 0 ? 6 : 12), k === 0 ? 8 : 6.5, k === 0 ? 5 : 3.5);
  for (let j = 0; j < 5; j++) {
    const w = j * 2 * Math.PI / 5 + k, rr = 0.75;
    const end = [CX + s.x + Math.cos(w) * s.a * rr, s.y - s.d * 0.6, CZ + s.z + Math.sin(w) * s.b * rr];
    roehre(bogen(ziel, end, 2, 80), 3, 1.2);
  }
}

// 4) Spawnplatz oben: Holzdeck (Fichte, Balkenring, Froschlicht), Geländer mit drei Lücken für die Abflugwege, Infotafeln
const PX = CX + SCHIRME[0].x, PZ = CZ + SCHIRME[0].z;
const WEGE = [Math.PI * 0.78, Math.PI * 1.38, Math.PI * 1.98]; // Südwest, Nordwest, Ost (nicht über den Turm im Süden)
const amWeg = (w) => WEGE.some((a) => Math.abs(((w - a + 3 * Math.PI) % (2 * Math.PI)) - Math.PI) < 0.16);
for (let z = PZ - PLATZ - 1; z <= PZ + PLATZ + 1; z++) for (let x = PX - PLATZ - 1; x <= PX + PLATZ + 1; x++) {
  const r = Math.hypot(x - PX, z - PZ), w = Math.atan2(z - PZ, x - PX); if (r > PLATZ + 0.5) continue;
  for (let y = D; y <= D + 6; y++) if (hole(m, x, y, z) !== LUFT) setze(m, x, y, z, LUFT);
  const ring = Math.abs(r - 11) < 0.6, rand = r > PLATZ - 0.5;
  setze(m, x, D, z, rand ? 'minecraft:stripped_dark_oak_wood[axis=y]' : ring ? (zufall(x, D, z) > 0.5 ? 'minecraft:verdant_froglight[axis=y]' : 'minecraft:stripped_spruce_wood[axis=y]') : r < 3 ? 'minecraft:moss_block' : 'minecraft:spruce_planks');
  if (rand && !amWeg(w)) { setze(m, x, D + 1, z, 'minecraft:dark_oak_fence[east=false,north=false,south=false,waterlogged=false,west=false]'); if (zufall(x, 5, z) > 0.8) setze(m, x, D + 2, z, 'minecraft:lantern[hanging=false,waterlogged=false]'); }
}
for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [-1, 0], [0, -1]]) setze(m, PX + dx, D + 1, PZ + dz, dx || dz ? 'minecraft:open_eyeblossom' : 'minecraft:flowering_azalea');
const SP = [PX, D + 1, PZ + 7];
TAFELN.forEach((t, i) => { setze(m, PX - 4 + i * 4, D + 1, PZ - 6, 'minecraft:dark_oak_fence[east=false,north=false,south=false,waterlogged=false,west=false]'); schild(m, PX - 4 + i * 4, D + 2, PZ - 6, t, 0, 'dark_oak'); });
// Abflugwege: 3 breit über die Schirm-Oberseite bis über die Kante hinaus
for (const w of WEGE) for (let r = PLATZ; r <= 90; r++) {
  let ende = false;
  for (let s = -1; s <= 1; s++) {
    const x = Math.round(PX + r * Math.cos(w) - s * Math.sin(w)), z = Math.round(PZ + r * Math.sin(w) + s * Math.cos(w));
    let top = -1; for (let y = D + 6; y >= D - 12; y--) if (drin(x, y, z) && hole(m, x, y, z) !== LUFT) { top = y; break; }
    if (top < 0) { ende = true; continue; }
    for (let y = top; y >= D - 1; y--) setze(m, x, y, z, LUFT);
    setze(m, x, Math.min(top, D - 1), z, 'minecraft:stripped_spruce_wood[axis=y]');
    if (s === 0 && r % 10 === 0) lichter.push([x, Math.min(top, D - 1) + 1, z]);
  }
  if (ende) { const x = Math.round(PX + r * Math.cos(w)), z = Math.round(PZ + r * Math.sin(w)); setze(m, x, D - 1, z, 'minecraft:stripped_spruce_wood[axis=y]'); setze(m, x, D, z, 'minecraft:lantern[hanging=false,waterlogged=false]'); break; }
}

// 5) Turm am Stamm (Süden): Kalzit mit dunklen Prismarin-Bändern, Fenster, Leuchtkern, Amethyst-Dach – Aufstieg und Maßstab
const TX = CX + 3, TZ = CZ + 21, TR = 5;
for (let y = G - 2; y <= D + 5; y++) for (let dz = -TR - 1; dz <= TR + 1; dz++) for (let dx = -TR - 1; dx <= TR + 1; dx++) {
  const r = Math.hypot(dx, dz), x = TX + dx, z = TZ + dz; if (r > TR + 0.4) continue;
  if (r < TR - 1.2) { setze(m, x, y, z, y % 7 === 0 && r < 1 ? 'minecraft:sea_lantern' : LUFT); continue; }
  const fenster = (y - G) % 8 >= 3 && (y - G) % 8 <= 5 && (Math.abs(dx) <= 1 || Math.abs(dz) <= 1);
  setze(m, x, y, z, fenster ? 'minecraft:light_blue_stained_glass_pane[east=false,north=false,south=false,waterlogged=false,west=false]' : (y - G) % 16 === 0 ? 'minecraft:dark_prismarine' : (y - G) % 16 === 1 ? 'minecraft:prismarine_bricks' : 'minecraft:calcite');
}
for (let y = D + 6; y <= D + 16; y++) { const rad = TR + 0.6 - (y - D - 6) * 0.56; for (let dz = -TR - 1; dz <= TR + 1; dz++) for (let dx = -TR - 1; dx <= TR + 1; dx++) if (Math.hypot(dx, dz) <= rad) setze(m, TX + dx, y, TZ + dz, (y + dx + dz) % 3 ? 'minecraft:amethyst_block' : 'minecraft:purple_stained_glass'); }
setze(m, TX, D + 17, TZ, 'minecraft:end_rod[facing=up]');
for (let y = G; y <= D + 1; y++) for (const dx of [-1, 0, 1]) setze(m, TX + dx, y, TZ + TR, y <= G + 2 || y >= D && y <= D + 2 ? LUFT : hole(m, TX + dx, y, TZ + TR)); // Türen unten und oben

// 6) Wurzeln als Terrassenhügel: Rücken in sieben Richtungen, in Stufen von 2 Blöcken, Moos und Gras, Kerzenreihen auf den Stufenkanten
const RUECKEN = Array.from({ length: 7 }, (_, i) => ({ w: i * 2 * Math.PI / 7 + 0.4 * (zufall(i, 0, 1) - 0.5), len: 52 + 18 * zufall(i, 1, 1), hoehe: 16 + 6 * zufall(i, 2, 1) }));
const hoehe = new Int16Array(W * L).fill(-1);
for (let z = 0; z < L; z++) for (let x = 0; x < W; x++) {
  const dx = x - CX, dz = z - CZ, r = Math.hypot(dx, dz), w = Math.atan2(dz, dx); if (r > 95) continue;
  let h = 0;
  for (const R of RUECKEN) {
    const dw = Math.abs(((w - R.w + 3 * Math.PI) % (2 * Math.PI)) - Math.PI), quer = dw * r, breite = 7 + 10 * (1 - r / R.len);
    if (r > R.len) continue;
    h = Math.max(h, R.hoehe * (1 - r / R.len) * Math.exp(-(quer * quer) / (2 * breite * breite)));
  }
  h = Math.max(h, 10 * Math.exp(-(r * r) / (2 * 22 * 22))); // Sockel um den Stamm
  if (h < 1) continue;
  hoehe[z * W + x] = Math.floor(h / 2) * 2; // Terrassen
}
for (let z = 1; z < L - 1; z++) for (let x = 1; x < W - 1; x++) {
  const h = hoehe[z * W + x]; if (h < 0) continue;
  for (let y = G - 4; y <= G + h; y++) if (hole(m, x, y, z) === LUFT) setze(m, x, y, z, y === G + h ? (rauschen(x, z, 5, 90) > 0.55 ? 'minecraft:moss_block' : 'minecraft:grass_block[snowy=false]') : y > G + h - 3 ? (zufall(x, y, z, 91) > 0.8 ? 'minecraft:rooted_dirt' : 'minecraft:dirt') : 'minecraft:stone');
  const kante = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => hoehe[(z + b) * W + x + a] < h);
  if (kante && leer(x, G + h + 1, z) && zufall(x, h, z, 92) > 0.7) setze(m, x, G + h + 1, z, kerze(x, h, z));
  else if (leer(x, G + h + 1, z) && zufall(x, h, z, 93) > 0.93) setze(m, x, G + h + 1, z, zufall(x, h, z, 94) > 0.5 ? 'minecraft:open_eyeblossom' : 'minecraft:short_grass');
}
// Wurzelstränge über die Rücken (Holz bricht aus den Terrassen)
for (const R of RUECKEN) { const p = []; for (let s = 0; s <= 1; s += 0.01) { const r = 8 + R.len * s; const hh = R.hoehe * (1 - (r - 8) / R.len); p.push([CX + r * Math.cos(R.w), G + hh + 1 - 3 * s, CZ + r * Math.sin(R.w)]); } roehre(p, 3.2, 1); }

// 7) Kronenoberseite: Moosflecken mit Augenblüten (öffnen sich nachts, die emissive Mitte „funkelt“ – Pumis Nachteffekt; kein echtes Licht,
//    in 26.3 gemessen), dazwischen wenige Kerzen als warme Akzente. Augenblüten brauchen Moos/Erde/Gras (Tag supports_vegetation), kein Laub.
let augen = 0;
for (const [x, y, z] of OBERSEITE) {
  if (!leer(x, y + 1, z) || hole(m, x, y, z) === LUFT) continue;
  if (rauschen(x, z, 7, 96) > 0.42) { setze(m, x, y, z, 'minecraft:moss_block'); const r = zufall(x, y, z, 97); if (r > 0.55) { setze(m, x, y + 1, z, 'minecraft:open_eyeblossom'); augen++; } else if (r > 0.45) setze(m, x, y + 1, z, 'minecraft:moss_carpet'); }
  else if (zufall(x, y, z, 95) > 0.985) setze(m, x, y + 1, z, kerze(x, y, z));
}
// Laternen an Ketten unter den Schirmen und entlang der Äste
for (const s of SCHIRME) for (let j = 0; j < 18; j++) {
  const w = j * Math.PI / 5 + s.x, x = Math.round(CX + s.x + Math.cos(w) * s.a * 0.5), z = Math.round(CZ + s.z + Math.sin(w) * s.b * 0.5);
  for (let y = s.y; y > G; y--) if (drin(x, y, z) && hole(m, x, y, z) !== LUFT && leer(x, y - 1, z)) { for (let i = 1; i <= 4; i++) setze(m, x, y - i, z, 'minecraft:iron_chain[axis=y,waterlogged=false]'); setze(m, x, y - 5, z, 'minecraft:lantern[hanging=true,waterlogged=false]'); break; }
}

// 7b) Blütenlaternen (Idee von Pumi: aus Pflanzen wachsende „Blütenblätter“ mit Laterne vorne): Holzstiel, Azaleen-Blatt, Laterne darunter –
//     am Rand des Spawnplatzes und entlang der Abflugwege
function bluetenlaterne(x, y, z, w) {
  const fx = Math.round(Math.cos(w)), fz = Math.round(Math.sin(w));
  for (let i = 1; i <= 3; i++) if (leer(x, y + i, z)) setze(m, x, y + i, z, 'minecraft:dark_oak_fence[east=false,north=false,south=false,waterlogged=false,west=false]');
  for (const [a, b] of [[0, 0], [fx, fz], [-fz, fx], [fz, -fx]]) if (leer(x + a, y + 4, z + b)) setze(m, x + a, y + 4, z + b, 'minecraft:flowering_azalea_leaves[distance=1,persistent=true,waterlogged=false]');
  if (leer(x + 2 * fx, y + 4, z + 2 * fz)) setze(m, x + 2 * fx, y + 4, z + 2 * fz, 'minecraft:azalea_leaves[distance=1,persistent=true,waterlogged=false]');
  if (leer(x + fx, y + 3, z + fz)) setze(m, x + fx, y + 3, z + fz, 'minecraft:lantern[hanging=true,waterlogged=false]');
}
for (let k = 0; k < 10; k++) { const w = k * Math.PI / 5 + 0.3; if (amWeg(w)) continue; bluetenlaterne(Math.round(PX + (PLATZ - 2) * Math.cos(w)), D, Math.round(PZ + (PLATZ - 2) * Math.sin(w)), w); }
for (const w of WEGE) for (let r = PLATZ + 8; r <= 70; r += 9) { const x = Math.round(PX + r * Math.cos(w) - 2 * Math.sin(w)), z = Math.round(PZ + r * Math.sin(w) + 2 * Math.cos(w)); let y = -1; for (let yy = D + 4; yy >= D - 12; yy--) if (drin(x, yy, z) && hole(m, x, yy, z) !== LUFT) { y = yy; break; } if (y > 0) bluetenlaterne(x, y, z, w + Math.PI / 2); }

// 7c) Herzkammer im Stamm (Idee von Pumi: Stamm innen aus Amethyst, offen sichtbar): hohler Raum am Fuß, mit Amethyst ausgekleidet,
//     schwebende Balken, Amethyst-Kristalle, Eingänge von den Terrassen (Norden und Osten)
for (let y = G + 1; y <= G + 26; y++) for (let dz = -9; dz <= 9; dz++) for (let dx = -9; dx <= 9; dx++) {
  const r = Math.hypot(dx, dz), x = CX + dx, z = CZ + dz, rr = 7 - Math.max(0, (y - G - 18) * 0.6);
  if (r > rr + 1.2) continue;
  if (r <= rr) setze(m, x, y, z, y === G + 1 ? (r < 2 ? 'minecraft:moss_block' : 'minecraft:calcite') : LUFT);
  else setze(m, x, y, z, zufall(x, y, z, 98) > 0.85 ? 'minecraft:budding_amethyst' : 'minecraft:amethyst_block');
}
for (const [a, b] of [[0, -1], [1, 0]]) for (let s = 6; s <= 30; s++) for (let q = -1; q <= 1; q++) for (let y = G + 2; y <= G + 5; y++) { const x = CX + a * s + q * b, z = CZ + b * s + q * a; if (drin(x, y, z) && (hole(m, x, y, z).includes('wood') || hole(m, x, y, z).includes('moss') || hole(m, x, y, z).includes('dirt') || hole(m, x, y, z).includes('stone') || hole(m, x, y, z).includes('grass') || hole(m, x, y, z).includes('amethyst'))) setze(m, x, y, z, LUFT); }
for (const [y, w] of [[G + 9, 0.4], [G + 14, 1.6], [G + 19, 2.6]]) for (let s = -6; s <= 6; s++) setze(m, Math.round(CX + s * Math.cos(w)), y, Math.round(CZ + s * Math.sin(w)), `minecraft:stripped_dark_oak_log[axis=${Math.abs(Math.cos(w)) > 0.7 ? 'x' : 'z'}]`);
for (let k = 0; k < 40; k++) { const w = k * 0.61, y = G + 3 + (k * 7) % 20, x = Math.round(CX + 6 * Math.cos(w)), z = Math.round(CZ + 6 * Math.sin(w)); if (leer(x, y, z)) setze(m, x, y, z, 'minecraft:amethyst_cluster[facing=up,waterlogged=false]'); }
for (let i = 1; i <= 6; i++) setze(m, CX, G + 26 - i, CZ, i < 6 ? 'minecraft:iron_chain[axis=y,waterlogged=false]' : 'minecraft:lantern[hanging=true,waterlogged=false]');

// 8) Unsichtbare Lichter für Orientierung auf dem Spawnplatz
for (let dz = -15; dz <= 15; dz += 6) for (let dx = -15; dx <= 15; dx += 6) if (Math.hypot(dx, dz) < PLATZ - 1 && leer(PX + dx, D + 1, PZ + dz)) lichter.push([PX + dx, D + 1, PZ + dz]);
let nL = 0; for (const [x, y, z] of lichter) if (leer(x, y, z)) { setze(m, x, y, z, 'minecraft:light[level=15,waterlogged=false]'); nL++; }

// 9) Ausleuchtung prüfen (Blocklicht wie im Spiel); mit PFLICHTLICHT=1 dunkle begehbare Stellen schließen (nur ohne Pilzland nötig)
const DURCHLAESSIG = /^minecraft:(air|light|lantern|iron_chain|vine|cave_vines|cave_vines_plant|candle|open_eyeblossom|closed_eyeblossom|moss_carpet|short_grass|amethyst_cluster|.*_fence|.*_sign|.*_pane|flowering_azalea|azalea)(\[|$)/;
const LICHTQ = [[/^minecraft:light\[.*level=(\d+)/, null], [/^minecraft:(lantern|shroomlight|sea_lantern)/, 15], [/froglight/, 15], [/^minecraft:cave_vines.*berries=true/, 14], [/^minecraft:end_rod/, 14], [/^minecraft:candle\[candles=(\d).*lit=true/, 'kerze']];
const WL = W * L, hell = new Uint8Array(W * H * L), idx = (x, y, z) => x + z * W + y * WL;
function ausbreiten(q) {
  for (let k = 0; k < q.length; k++) {
    const i = q[k], l = hell[i]; if (l <= 1) continue;
    const x = i % W, z = ((i / W) | 0) % L, y = (i / WL) | 0;
    for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
      const X = x + dx, Y = y + dy, Z = z + dz; if (!drin(X, Y, Z)) continue;
      const b = hole(m, X, Y, Z), lb = b.includes('leaves'); if (!lb && !DURCHLAESSIG.test(b)) continue;
      const j = idx(X, Y, Z), nl = l - (lb ? 2 : 1); if (nl > hell[j]) { hell[j] = nl; q.push(j); }
    }
  }
}
const quellen = [];
for (let y = 0; y < H; y++) for (let z = 0; z < L; z++) for (let x = 0; x < W; x++) { const b = hole(m, x, y, z); if (b === LUFT) continue; for (const [re, l] of LICHTQ) { const mm = b.match(re); if (mm) { hell[idx(x, y, z)] = l === 'kerze' ? 3 * +mm[1] : l ?? +mm[1]; quellen.push(idx(x, y, z)); break; } } }
ausbreiten(quellen);
let nachgesetzt = 0, dunkel = 0;
for (let y = G + 1; y < H - 3; y++) for (let z = 0; z < L; z++) for (let x = 0; x < W; x++) {
  const b = hole(m, x, y, z); if (b === LUFT || b.includes('leaves') || DURCHLAESSIG.test(b)) continue;
  if (hole(m, x, y + 1, z) !== LUFT || hole(m, x, y + 2, z) !== LUFT || hell[idx(x, y + 1, z)] > 0) continue;
  dunkel++; if (!process.env.PFLICHTLICHT) continue;
  setze(m, x, y + 1, z, 'minecraft:light[level=12,waterlogged=false]'); hell[idx(x, y + 1, z)] = 12; ausbreiten([idx(x, y + 1, z)]); nachgesetzt++;
}
nL += nachgesetzt;

let ax0 = W, ax1 = 0, az0 = L, az1 = 0, kerzen = 0;
for (let i = 0; i < m.bloecke.length; i++) { const b = m.bloecke[i]; if (b === LUFT) continue; if (b.startsWith('minecraft:candle')) kerzen++; const x = i % W, z = ((i / W) | 0) % L; if (x < ax0) ax0 = x; if (x > ax1) ax1 = x; if (z < az0) az0 = z; if (z > az1) az1 = z; }
speichern(m, process.argv[2], {
  name: 'Weltenbaum (Etagenkrone)', spawn: SP, blick: [0, 0], boden: G, plattformHoehe: D, turm: [TX, G, TZ],
  obenBereich: { von: [PX - PLATZ - 2, D - 3, PZ - PLATZ - 2], bis: [PX + PLATZ + 2, D + 12, PZ + PLATZ + 2] },
  oval: { x: Math.round((ax0 + ax1) / 2), z: Math.round((az0 + az1) / 2), a: Math.ceil((ax1 - ax0) / 2), b: Math.ceil((az1 - az0) / 2) },
  pilzland: { x: Math.round((ax0 + ax1) / 2), z: Math.round((az0 + az1) / 2), a: Math.ceil((ax1 - ax0) / 2) + 30, b: Math.ceil((az1 - az0) / 2) + 30 },
  abflug: 'drei Wege vom Spawnplatz über die Schirmkante (Südwest, Nordwest, Ost)', erweiterung: 'weitere Schirme und Plattformen, Terrassen am Fuß, Turm innen',
  lichtbloecke: nL, kerzen, augenblueten: augen, dunkleStellenOhnePilzland: dunkel,
});
console.log(`Weltenbaum ${W}×${H}×${L}, Ausdehnung x ${ax0}–${ax1}, z ${az0}–${az1}, Kerzen ${kerzen}, Augenblüten ${augen}, Lichtblöcke ${nL}, dunkle Stellen ohne Pilzland ${dunkel}`);
