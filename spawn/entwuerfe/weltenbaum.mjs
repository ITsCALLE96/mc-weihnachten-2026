// Entwurf „Weltenbaum“ (groß, gewählt von Pascal 24.10.): organischer Stamm aus gedrehten Strängen mit Furchen, Brettwurzeln als Bögen,
// verzweigte Hauptäste (Unteräste, Zweige), unregelmäßige Krone aus Laubwolken, Spawnplattform um den Stamm, begehbare Abflugäste,
// Ausleuchtung (Laternen, Leuchtbeeren, Pilzlicht, Froschlicht, Leuchtflechte, unsichtbare Lichtblöcke), Augenblüten als Deko.
// Aufruf: node spawn/entwuerfe/weltenbaum.mjs <ausgabe.schem>
import { neu, setze, hole, LUFT, rauschen, zufall, schild, speichern, TAFELN } from './basis.mjs';

const W = 240, L = 240, H = 262, CX = 120, CZ = 120, G = 14, D = G + 118; // G = Boden (lokal), D = Spawnplattform
const m = neu(W, H, L, 0);
const leer = (x, y, z) => x >= 0 && y >= 0 && z >= 0 && x < W && y < H && z < L && hole(m, x, y, z) === LUFT;
const RINDE = ['minecraft:dark_oak_wood[axis=y]', 'minecraft:dark_oak_wood[axis=y]', 'minecraft:spruce_wood[axis=y]', 'minecraft:oak_wood[axis=y]'];
const rinde = (x, y, z) => { const n = rauschen(x + z * 0.7, y * 0.5, 7, 21); return n > 0.72 ? 'minecraft:moss_block' : RINDE[Math.floor(rauschen(x * 0.5 + y, z * 0.5, 5, 22) * 3.99)]; };
const LAUB = ['minecraft:oak_leaves[distance=1,persistent=true,waterlogged=false]', 'minecraft:dark_oak_leaves[distance=1,persistent=true,waterlogged=false]', 'minecraft:oak_leaves[distance=1,persistent=true,waterlogged=false]', 'minecraft:flowering_azalea_leaves[distance=1,persistent=true,waterlogged=false]'];
const lichter = []; // Positionen unsichtbarer Lichtblöcke

// Kugel-Sweep entlang eines Pfads (organische Röhren für Wurzeln und Äste)
function roehre(pfad, r0, r1) {
  for (let i = 0; i < pfad.length; i++) {
    const [px, py, pz] = pfad[i], r = r0 + (r1 - r0) * i / Math.max(1, pfad.length - 1), R = Math.ceil(r);
    for (let dy = -R; dy <= R; dy++) for (let dz = -R; dz <= R; dz++) for (let dx = -R; dx <= R; dx++) {
      if (dx * dx + dy * dy + dz * dz > r * r) continue;
      const x = Math.round(px + dx), y = Math.round(py + dy), z = Math.round(pz + dz);
      if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= L) continue;
      setze(m, x, y, z, rinde(x, y, z));
    }
  }
}
// Pfad mit Krümmung: Start, Richtung (Azimut, Steigung), Länge, Schrittweite 0,6, sanftes Rauschen, optional Zug nach unten (Äste hängen)
function pfad(x, y, z, az, st, len, wackeln = 0.25, saat = 1, zugNachUnten = 0) {
  const p = []; let a = az, s = st;
  for (let t = 0; t <= len; t += 0.6) {
    p.push([x, y, z]);
    a += (rauschen(t, saat * 13, 9, saat) - 0.5) * wackeln * 0.3; s += (rauschen(t, saat * 17, 9, saat + 1) - 0.5) * wackeln * 0.2 - zugNachUnten * 0.004;
    x += Math.cos(a) * Math.cos(s) * 0.6; z += Math.sin(a) * Math.cos(s) * 0.6; y += Math.sin(s) * 0.6;
  }
  return p;
}

// 1) Stamm: Kern mit Furchen plus sieben gedrehte Stränge
for (let y = G - 6; y <= D + 24; y++) {
  const t = Math.max(0, (y - G) / (D - G)), rc = 10 - 3.2 * Math.min(1, t) + 9 * Math.pow(Math.max(0, 1 - t), 5) - (y > D ? (y - D) * 0.12 : 0);
  const ox = 3 * Math.sin(t * 2.4), oz = 2.4 * Math.sin(t * 1.7 + 1);
  for (let dz = -24; dz <= 24; dz++) for (let dx = -24; dx <= 24; dx++) {
    const w = Math.atan2(dz - oz, dx - ox), r = Math.hypot(dx - ox, dz - oz);
    const furche = 1 + 0.1 * Math.sin(9 * w + y * 0.07) + 0.06 * Math.sin(4 * w - y * 0.03);
    if (r <= rc * furche) setze(m, CX + dx, y, CZ + dz, rinde(CX + dx, y, CZ + dz));
  }
}
for (let s = 0; s < 7; s++) {
  const p = []; const w0 = s * 2 * Math.PI / 7;
  for (let y = G - 2; y <= D + 18; y += 0.6) { const t = (y - G) / (D - G), w = w0 + t * 1.6, r = 8.5 - 2.5 * t + 6 * Math.pow(Math.max(0, 1 - t), 4); p.push([CX + 3 * Math.sin(t * 2.4) + r * Math.cos(w), y, CZ + 2.4 * Math.sin(t * 1.7 + 1) + r * Math.sin(w)]); }
  roehre(p, 4.2, 2.6);
}

// 2) Brettwurzeln: neun Wurzeln, laufen vom Stamm als Bögen hinaus und tauchen in den Boden
const WURZELBOEGEN = [];
for (let i = 0; i < 9; i++) {
  const w = i * 2 * Math.PI / 9 + 0.3 * (zufall(i, 0, 0) - 0.5), len = 50 + 22 * zufall(i, 1, 0), p = [];
  for (let s = 0; s <= 1; s += 0.008) {
    const r = 9 + len * s, bogen = 6 * Math.sin(Math.PI * Math.min(1, s * 1.6)) * (s < 0.62 ? 1 : 0.3);
    const y = G + 22 * Math.pow(1 - s, 2.2) + bogen - 4 * s;
    p.push([CX + r * Math.cos(w + 0.3 * Math.sin(s * 5 + i)), y, CZ + r * Math.sin(w + 0.3 * Math.sin(s * 5 + i))]);
  }
  roehre(p, 5.5, 1.2);
  WURZELBOEGEN.push(p[Math.floor(p.length * 0.45)]);
  for (let k = 0; k < 2; k++) { const st = p[Math.floor(p.length * (0.35 + 0.25 * k))]; roehre(pfad(st[0], st[1], st[2], w + (k ? 0.9 : -0.9), -0.15, 18 + 10 * zufall(i, k, 3), 0.4, i * 7 + k, 6), 2.2, 0.8); }
}

// 3) Spawnplattform: unregelmäßiger Ring um den Stamm, Bretter mit Balken, Geländer, Träger
const RP = (w) => 25 + 3 * Math.sin(3 * w + 0.5) + 2 * Math.sin(5 * w + 2);
const ABFLUG = [0.35, 1.95, 3.55, 5.0]; // Azimute der Abflugäste
const amAbflug = (w) => ABFLUG.some((a) => Math.abs(((w - a + 3 * Math.PI) % (2 * Math.PI)) - Math.PI) < 0.12);
for (let dz = -32; dz <= 32; dz++) for (let dx = -32; dx <= 32; dx++) {
  const w = Math.atan2(dz, dx), r = Math.hypot(dx, dz), x = CX + dx, z = CZ + dz;
  if (r > RP(w)) continue;
  if (hole(m, x, D, z) !== LUFT && r < 12) continue; // Stamm bleibt
  const balken = Math.abs(((w * 12 / Math.PI) % 1 + 1) % 1 - 0.5) < 0.08;
  setze(m, x, D, z, r > RP(w) - 1 ? 'minecraft:stripped_dark_oak_wood[axis=y]' : balken ? 'minecraft:stripped_oak_wood[axis=y]' : Math.round(r) === 18 && zufall(x, D, z) > 0.55 ? 'minecraft:verdant_froglight[axis=y]' : 'minecraft:spruce_planks');
  if (hole(m, x, D - 1, z) === LUFT && (balken || r > RP(w) - 1)) setze(m, x, D - 1, z, 'minecraft:stripped_dark_oak_wood[axis=y]');
  for (let y = D + 1; y <= D + 4; y++) if (hole(m, x, y, z) !== LUFT && r > 12) setze(m, x, y, z, LUFT); // Kopffreiheit
  if (r > RP(w) - 1 && !amAbflug(w)) {
    setze(m, x, D + 1, z, 'minecraft:dark_oak_fence[east=false,north=false,south=false,waterlogged=false,west=false]');
    if (zufall(x, 3, z) > 0.86) setze(m, x, D + 2, z, 'minecraft:lantern[hanging=false,waterlogged=false]');
  }
}
for (let k = 0; k < 12; k++) { const w = k * Math.PI / 6; roehre(pfad(CX + 9 * Math.cos(w), D - 18, CZ + 9 * Math.sin(w), w, 0.62, 22, 0.05, 50 + k), 1.6, 1.2); }

// 4) Hauptäste mit Unterästen und Zweigen; Spitzen sammeln für die Laubwolken
const SPITZEN = [];
function verzweigen(p0, az, st, len, r0, tiefe, saat) {
  const p = pfad(p0[0], p0[1], p0[2], az, st, len, 0.6, saat, tiefe === 0 ? 3 : 0);
  roehre(p, r0, Math.max(0.8, r0 * 0.45));
  if (tiefe >= 2) { SPITZEN.push(p[p.length - 1]); return; }
  const n = tiefe === 0 ? 3 : 2;
  for (let k = 0; k < n; k++) {
    const q = p[Math.floor(p.length * (0.45 + 0.45 * (k + 1) / (n + 1)))];
    verzweigen(q, az + (k % 2 ? 1 : -1) * (0.5 + 0.4 * zufall(saat, k, tiefe)), st + 0.15 - 0.2 * zufall(saat, k, 9), len * 0.55, Math.max(1, r0 * 0.5), tiefe + 1, saat * 3 + k);
  }
  SPITZEN.push(p[p.length - 1]);
}
// untere Etage: sieben breite, flache Hauptäste (tragen die Krone weit nach außen)
for (let k = 0; k < 7; k++) {
  const az = k * 2 * Math.PI / 7 + 0.25, h0 = D + 8 + 10 * zufall(k, 0, 1);
  verzweigen([CX + 5 * Math.cos(az), h0, CZ + 5 * Math.sin(az)], az, 0.28 + 0.2 * zufall(k, 1, 1), 64 + 16 * zufall(k, 2, 1), 5.6, 0, 100 + k);
}
// obere Etage: fünf steilere Äste und ein Leittrieb (füllen die Krone nach oben)
for (let k = 0; k < 5; k++) {
  const az = k * 2 * Math.PI / 5 + 0.9, h0 = D + 26 + 10 * zufall(k, 0, 2);
  verzweigen([CX + 3 * Math.cos(az), h0, CZ + 3 * Math.sin(az)], az, 0.65 + 0.25 * zufall(k, 1, 2), 42 + 12 * zufall(k, 2, 2), 4.2, 0, 200 + k);
}
verzweigen([CX + 2, D + 30, CZ + 1], 0.8, 1.3, 34, 3.8, 1, 999);

// 5) Abflugäste: fast waagrecht, oben begehbar (3 breit), Spitze frei
for (const az of ABFLUG) {
  const p = []; for (let r = 10; r <= 58; r += 0.6) p.push([CX + r * Math.cos(az + 0.1 * Math.sin(r / 9)), D - 3 + (r > 40 ? (r - 40) * 0.12 : 0), CZ + r * Math.sin(az + 0.1 * Math.sin(r / 9))]);
  roehre(p, 4.2, 2.2);
  for (let i = 0; i < p.length; i++) {
    const [px, , pz] = p[i], r = 10 + i * 0.6; if (r < RP(az) - 2) continue;
    for (let s = -1; s <= 1; s++) {
      const x = Math.round(px - s * Math.sin(az)), z = Math.round(pz + s * Math.cos(az));
      for (let y = D + 6; y >= D - 8; y--) if (hole(m, x, y, z) !== LUFT) { setze(m, x, y, z, 'minecraft:stripped_spruce_wood[axis=y]'); if (i % 8 === 0 && s === 0) lichter.push([x, y + 1, z]); break; }
    }
  }
  const e = p[p.length - 1]; setze(m, Math.round(e[0]), Math.round(e[1]) + 3, Math.round(e[2]), 'minecraft:lantern[hanging=false,waterlogged=false]');
}

// 6) Laubwolken an den Spitzen (geräuschgeformt), mit Pilzlicht innen; über Plattform und Abflugästen bleibt Kopffreiheit
for (const [k, [sx, sy, sz]] of SPITZEN.entries()) {
  const R = 7 + 5 * zufall(k, 7, 7);
  for (let dy = -R; dy <= R; dy++) for (let dz = -R - 2; dz <= R + 2; dz++) for (let dx = -R - 2; dx <= R + 2; dx++) {
    const x = Math.round(sx + dx), y = Math.round(sy + dy * 0.75), z = Math.round(sz + dz);
    if (!leer(x, y, z)) continue;
    const n = rauschen(x * 1.3 + y, z * 1.3 - y, 4, 31 + (k % 5));
    if ((dx * dx + dy * dy + dz * dz) / (R * R) > 0.55 + 0.6 * n) continue;
    const rr = Math.hypot(x - CX, z - CZ), ww = Math.atan2(z - CZ, x - CX);
    if (y < D + 14 && rr < RP(ww) + 16) continue; // freie Sicht und Kopffreiheit rund um die Plattform
    if (y < D + 12 && rr < 64 && ABFLUG.some((a) => Math.abs(((ww - a + 3 * Math.PI) % (2 * Math.PI)) - Math.PI) * rr < 7)) continue; // Abflugäste frei
    setze(m, x, y, z, zufall(x, y, z) > 0.985 ? 'minecraft:shroomlight' : LAUB[Math.floor(rauschen(x, z, 9, 40 + k) * 3.99)]);
  }
}

// 7) Hängendes: Leuchtbeeren und Ranken unter dem Laub, Laternen an Ketten unter den Ästen, Leuchtflechte am Stamm
for (let z = 1; z < L - 1; z++) for (let x = 1; x < W - 1; x++) for (let y = H - 2; y > G; y--) {
  const b = hole(m, x, y, z); if (b === LUFT) continue;
  if (b.includes('leaves') && hole(m, x, y - 1, z) === LUFT) {
    const r = zufall(x, y, z, 3);
    if (r > 0.93) { const n = 2 + Math.floor(zufall(x, y, z, 4) * 9); for (let i = 1; i <= n && hole(m, x, y - i, z) === LUFT && y - i > D + 2; i++) setze(m, x, y - i, z, i === n ? `minecraft:cave_vines[age=0,berries=${zufall(x, i, z) > 0.4}]` : `minecraft:cave_vines_plant[berries=${zufall(x, i, z) > 0.5}]`); }
    else if (r > 0.86) { const n = 1 + Math.floor(zufall(x, y, z, 5) * 6); for (let i = 1; i <= n && hole(m, x, y - i, z) === LUFT; i++) setze(m, x, y - i, z, 'minecraft:vine[east=false,north=true,south=false,up=false,west=false]'); }
  } else if (b.includes('_wood') && hole(m, x, y - 1, z) === LUFT && y > D + 6 && zufall(x, y, z, 6) > 0.99) {
    for (let i = 1; i <= 3; i++) setze(m, x, y - i, z, 'minecraft:iron_chain[axis=y,waterlogged=false]'); setze(m, x, y - 4, z, 'minecraft:lantern[hanging=true,waterlogged=false]');
  }
  break;
}
for (let y = G; y <= D + 20; y++) for (let dz = -26; dz <= 26; dz++) for (let dx = -26; dx <= 26; dx++) {
  const x = CX + dx, z = CZ + dz; if (!hole(m, x, y, z).includes('_wood')) continue;
  for (const [ax, az2, f] of [[1, 0, 'west'], [-1, 0, 'east'], [0, 1, 'north'], [0, -1, 'south']]) if (leer(x + ax, y, z + az2) && zufall(x, y, z, 8) > 0.985) setze(m, x + ax, y, z + az2, `minecraft:glow_lichen[down=false,east=${f === 'east'},north=${f === 'north'},south=${f === 'south'},up=false,waterlogged=false,west=${f === 'west'}]`);
}

// 8) Am Spawn: Froschlicht-Kranz und Moos mit Augenblüten (nachts offen, nur Deko – kein echtes Licht) um den Stamm, Infotafeln
for (let dz = -15; dz <= 15; dz++) for (let dx = -15; dx <= 15; dx++) {
  const r = Math.hypot(dx, dz), x = CX + dx, z = CZ + dz;
  if (r < 11 || r > 14 || hole(m, x, D, z) === LUFT || hole(m, x, D + 1, z) !== LUFT) continue;
  setze(m, x, D, z, r < 12 ? 'minecraft:pearlescent_froglight[axis=y]' : 'minecraft:moss_block');
  if (r >= 12 && zufall(x, D, z) > 0.45) setze(m, x, D + 1, z, zufall(x, 1, z) > 0.5 ? 'minecraft:open_eyeblossom' : 'minecraft:moss_carpet');
}
const SP = [CX, D + 1, CZ + 17];
TAFELN.forEach((t, i) => { setze(m, CX - 6 + i * 3, D + 1, CZ + 21, 'minecraft:dark_oak_fence[east=false,north=false,south=false,waterlogged=false,west=false]'); schild(m, CX - 6 + i * 3, D + 2, CZ + 21, t, 8, 'dark_oak'); });

// 8b) Sichtbares Licht an den Wurzeln: Laterne auf jedem Wurzelbogen, Leuchtbeeren darunter, Moos und Augenblüten auf den Wurzelrücken
for (const [i, e] of WURZELBOEGEN.entries()) {
  const x = Math.round(e[0]), z = Math.round(e[2]); let top = -1;
  for (let y = H - 2; y > G - 4; y--) if (hole(m, x, y, z) !== LUFT) { top = y; break; }
  if (top < 0) continue;
  setze(m, x, top + 1, z, 'minecraft:lantern[hanging=false,waterlogged=false]');
  let unten = -1; for (let y = top - 1; y > G - 4; y--) if (hole(m, x, y, z) === LUFT) { unten = y; break; }
  if (unten > G + 1) for (let k = 0; k < 3; k++) for (let j = 0; j < 2 + k; j++) { const xx = x + (k - 1) * 2; if (hole(m, xx, unten - j, z) === LUFT && hole(m, xx, unten - j + 1, z) !== LUFT || j > 0 && hole(m, xx, unten - j, z) === LUFT) setze(m, xx, unten - j, z, `minecraft:cave_vines${j === 1 + k ? '' : '_plant'}[${j === 1 + k ? 'age=0,' : ''}berries=true]`); }
}
for (let z = 0; z < L; z++) for (let x = 0; x < W; x++) {
  const r = Math.hypot(x - CX, z - CZ); if (r < 14 || r > 85) continue;
  for (let y = G + 26; y >= G - 2; y--) { const b = hole(m, x, y, z); if (b === LUFT) continue;
    if (b.includes('_wood') && hole(m, x, y + 1, z) === LUFT && rauschen(x, z, 6, 77) > 0.62) { setze(m, x, y, z, 'minecraft:moss_block'); if (zufall(x, y, z, 12) > 0.6) setze(m, x, y + 1, z, zufall(x, y, z, 13) > 0.55 ? 'minecraft:open_eyeblossom' : 'minecraft:moss_carpet'); }
    break; }
}

// 9) Unsichtbare Lichter: Plattform im Raster 5, Wurzelbögen, unter den Zweigspitzen
for (let dz = -30; dz <= 30; dz += 5) for (let dx = -30; dx <= 30; dx += 5) { const x = CX + dx, z = CZ + dz; if (hole(m, x, D, z) !== LUFT && hole(m, x, D + 1, z) === LUFT) lichter.push([x, D + 1, z]); }
for (const e of WURZELBOEGEN) lichter.push([Math.round(e[0]), Math.round(e[1]) + 6, Math.round(e[2])]);
for (const [k, s] of SPITZEN.entries()) if (k % 2 === 0) { const x = Math.round(s[0]), z = Math.round(s[2]); for (let y = Math.round(s[1]) - 1; y > G; y--) if (hole(m, x, y, z) === LUFT) { lichter.push([x, y, z]); break; } }
let nL = 0; for (const [x, y, z] of lichter) if (leer(x, y, z)) { setze(m, x, y, z, 'minecraft:light[level=15,waterlogged=false]'); nL++; }

// 10) Ausleuchtung prüfen und schließen: Blocklicht wie im Spiel ausbreiten; jede begehbare Fläche am Baum (fester Block, kein Laub,
//     zwei Blöcke Luft darüber, oberhalb des Bodens) mit Blocklicht 0 bekommt einen unsichtbaren Lichtblock (Stufe 12), bis keine mehr übrig ist.
const DURCHLAESSIG = /^minecraft:(air|light|lantern|iron_chain|vine|cave_vines|cave_vines_plant|glow_lichen|open_eyeblossom|closed_eyeblossom|moss_carpet|short_grass|.*_fence|.*_sign|flowering_azalea|azalea)(\[|$)/;
const LICHTQ = [[/^minecraft:light\[.*level=(\d+)/, null], [/^minecraft:(lantern|shroomlight)/, 15], [/froglight/, 15], [/^minecraft:cave_vines.*berries=true/, 14], [/^minecraft:glow_lichen/, 7]];
const WL = W * L, hell = new Uint8Array(W * H * L);
const idx = (x, y, z) => x + z * W + y * WL;
function ausbreiten(start) {
  const q = start.slice();
  for (let k = 0; k < q.length; k++) {
    const i = q[k], l = hell[i]; if (l <= 1) continue;
    const x = i % W, z = ((i / W) | 0) % L, y = (i / WL) | 0;
    for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
      const X = x + dx, Y = y + dy, Z = z + dz; if (X < 0 || Y < 0 || Z < 0 || X >= W || Y >= H || Z >= L) continue;
      const b = hole(m, X, Y, Z), laub = b.includes('leaves'); if (!laub && !DURCHLAESSIG.test(b)) continue;
      const j = idx(X, Y, Z), nl = l - (laub ? 2 : 1); if (nl > hell[j]) { hell[j] = nl; q.push(j); }
    }
  }
}
const quellen = [];
for (let y = 0; y < H; y++) for (let z = 0; z < L; z++) for (let x = 0; x < W; x++) { const b = hole(m, x, y, z); if (b === LUFT) continue; for (const [re, l] of LICHTQ) { const mm = b.match(re); if (mm) { hell[idx(x, y, z)] = l ?? +mm[1]; quellen.push(idx(x, y, z)); break; } } }
ausbreiten(quellen);
// Pflicht-Ausleuchtung nur ohne Pilzland nötig (Pascal 24.10.: Pilzland um den Baum, Licht ist dann Stimmung). Aufruf mit PFLICHTLICHT=1.
let nachgesetzt = 0, dunkel = 0;
for (let y = G + 1; y < H - 3; y++) for (let z = 0; z < L; z++) for (let x = 0; x < W; x++) {
  const b = hole(m, x, y, z); if (b === LUFT || b.includes('leaves') || DURCHLAESSIG.test(b)) continue;
  if (hole(m, x, y + 1, z) !== LUFT || hole(m, x, y + 2, z) !== LUFT || hell[idx(x, y + 1, z)] > 0) continue;
  dunkel++;
  if (!process.env.PFLICHTLICHT) continue;
  setze(m, x, y + 1, z, 'minecraft:light[level=12,waterlogged=false]'); hell[idx(x, y + 1, z)] = 12; ausbreiten([idx(x, y + 1, z)]); nachgesetzt++;
}
nL += nachgesetzt;
console.log(`Ausleuchtung: ${dunkel} dunkle begehbare Stellen am Baum${process.env.PFLICHTLICHT ? `, ${nachgesetzt} Lichtblöcke nachgesetzt` : ' (Pilzland verhindert Monster, mit PFLICHTLICHT=1 schließen)'}`);

// Ausdehnung (für Oval und Pilzland)
let ax0 = W, ax1 = 0, az0 = L, az1 = 0;
for (let i = 0; i < m.bloecke.length; i++) { if (m.bloecke[i] === LUFT) continue; const x = i % W, z = ((i / W) | 0) % L; if (x < ax0) ax0 = x; if (x > ax1) ax1 = x; if (z < az0) az0 = z; if (z > az1) az1 = z; }
const RAND = 30;

speichern(m, process.argv[2], {
  name: 'Weltenbaum (groß)', spawn: SP, blick: [0, 0], boden: G, plattformHoehe: D,
  obenBereich: { von: [CX - 32, D - 4, CZ - 32], bis: [CX + 32, D + 30, CZ + 32] },
  oval: { x: CX, z: CZ, a: 110, b: 80 }, // Krone reicht nach Osten bis ~106, nach Norden/Süden ~72 Blöcke vom Stamm
  pilzland: { x: Math.round((ax0 + ax1) / 2), z: Math.round((az0 + az1) / 2), a: Math.ceil((ax1 - ax0) / 2) + RAND, b: Math.ceil((az1 - az0) / 2) + RAND }, // Baum + 30 Rand
  abflug: 'vier begehbare Äste (Azimut 20°, 112°, 203°, 286°)',
  erweiterung: 'äußerer Plattformring, Abflugäste, Wurzelbögen am Boden; später weitere Plattformen in der Krone',
  lichtbloecke: nL, spitzen: SPITZEN.length, dunkleStellenOhnePilzland: dunkel,
});
console.log('Weltenbaum', m.w, m.h, m.l, 'Spitzen', SPITZEN.length, 'Lichtblöcke', nL);
