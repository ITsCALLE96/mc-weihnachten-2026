// Entwurf „Weltenbaum“ (gewählt von Pascal 24.10.), fünfte Fassung nach Pascals Test auf dem Testserver (24.10. abends).
// Etagenkrone nach Pumis Prinzipien (nichts nachgebaut): flache Laubschirme auf schrägen Ästen, der oberste als geschlossene Kuppel mit kleinem
// Aussichtsdeck an der Spitze, Terrassenwurzeln. Spawn-Raum im ausgehöhlten Stammfuß (~25 Leute), Amethyst-Wendeltreppe mit Blasensäule bis ganz
// nach oben, ein großes Tor nach Norden, vor dem Start mit Rinde verschlossen (Eröffnungs-Event). Holz und Laub mit Farbverlauf von unten nach oben,
// gemischte Laternen (Eisen, Seelen, Kupfer in vier Stufen). Kein Turm, keine Elytra, keine Sättigung.
// Aufruf: node spawn/entwuerfe/weltenbaum.mjs <ausgabe.schem>   (OFFEN=1: Tor offen, nur für Vorschaubilder)
import { neu, setze, hole, LUFT, rauschen, zufall, schild, speichern, TAFELN } from './basis.mjs';

const W = 220, L = 220, H = 160, CX = 110, CZ = 110, G = 12; // G = Boden (lokal)
const S = G + 56;  // Stamm teilt sich
const D = G + 110; // Grundhöhe des obersten Schirms
const K = 15;      // Kuppelhöhe des obersten Schirms (die übrigen wölben sich halb so stark wie dick)
const A = D + K - 1; // Aussichtsdeck an der Spitze, Ende der Treppe
const F = 0.75;    // Kronengröße gegenüber der dritten Fassung (Ziel ~160 × 140)
const m = neu(W, H, L, 0);
const drin = (x, y, z) => x >= 0 && y >= 0 && z >= 0 && x < W && y < H && z < L;
const leer = (x, y, z) => drin(x, y, z) && hole(m, x, y, z) === LUFT;
const klemm = (v) => Math.max(0, Math.min(1, v));
const wahl = (liste, r) => { const s = liste.reduce((a, [, g]) => a + g, 0); let x = r * s; for (const [n, g] of liste) { if ((x -= g) < 0) return n; } return liste.at(-1)[0]; };
// Rinde in drei ruhigen Zonen mit je zwei verwandten Tönen (nach Pumis fast einheitlich dunklem Stamm):
//   Fuß (bis ~G+6): Mangrovenholz, Furchen aus matschigen Mangrovenwurzeln, am Boden Mangrovenwurzeln
//   Stamm: Dunkeleiche, Furchen aus Fichte (noch dunkler)
//   Krone (ab ~S+10): Dunkeleiche, Streifen aus entrindeter Dunkeleiche (heller, wie Lichtkanten entlang der Äste)
// Übergänge nur in schmalen Bändern mit geordnetem Dithering (Bayer 4×4). Furchen folgen dem Stamm bzw. dem Ast (siehe Aufrufer).
const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
const dither = (x, y, z, t) => t > (BAYER[y & 3][(x + z) & 3] + 0.5) / 16;
const rinde = (x, y, z, furche = false) => {
  if (!dither(x, y, z, klemm((y - (G + 3)) / 6))) return furche ? (y <= G + 1 ? 'minecraft:mangrove_roots[waterlogged=false]' : 'minecraft:muddy_mangrove_roots[axis=y]') : 'minecraft:mangrove_wood[axis=y]';
  if (!dither(x, y, z, klemm((y - (S + 10)) / 8))) return furche ? 'minecraft:spruce_wood[axis=y]' : 'minecraft:dark_oak_wood[axis=y]';
  return furche ? 'minecraft:stripped_dark_oak_wood[axis=y]' : 'minecraft:dark_oak_wood[axis=y]';
};
// Laub in Flecken mit Verlauf: unten dunkel, oben hell und blühend, einzelne Tupfer anderer Arten, selten gelbe/orange Pappel
const LAUB = [
  [0.35, [['dark_oak_leaves', 4], ['spruce_leaves', 3], ['mangrove_leaves', 2], ['jungle_leaves', 1]]],
  [0.7, [['oak_leaves', 3], ['dark_oak_leaves', 2], ['azalea_leaves', 2], ['jungle_leaves', 1], ['spruce_leaves', 1], ['birch_leaves', 1]]],
  [1.01, [['azalea_leaves', 3], ['flowering_azalea_leaves', 2], ['oak_leaves', 2], ['birch_leaves', 1], ['pale_oak_leaves', 1], ['cherry_leaves', 1]]],
];
const laub = (x, y, z) => {
  const t = klemm((y - (G + 60)) / 70 + (rauschen(x * 0.6, z * 0.6, 9, 42) - 0.5) * 0.35), band = LAUB.find(([g]) => t < g)[1];
  let art = wahl(band, rauschen(x * 0.9, z * 0.9 + y * 0.5, 5, 41));
  if (zufall(x, y, z, 43) > 0.88) art = wahl(band, zufall(x, y, z, 44));
  if (t > 0.35 && zufall(x, y, z, 45) > 0.985) art = zufall(x, y, z, 46) > 0.5 ? 'yellow_poplar_leaves' : 'orange_poplar_leaves';
  return `minecraft:${art}[distance=1,persistent=true,waterlogged=false]`;
};
const kerze = (x, y, z) => `minecraft:candle[candles=${1 + Math.floor(zufall(x, y, z, 31) * 4)},lit=true,waterlogged=false]`;
const ZAUN = 'minecraft:dark_oak_fence[east=false,north=false,south=false,waterlogged=false,west=false]';
// Laternen gemischt: Eisen, Seelen und gewachstes Kupfer in vier Stufen (oxidiert nicht weiter), Kette passend zur Laterne
const LATERNEN = [['lantern', 'iron_chain', 3], ['soul_lantern', 'iron_chain', 2], ['waxed_copper_lantern', 'waxed_copper_chain', 1],
  ['waxed_exposed_copper_lantern', 'waxed_exposed_copper_chain', 1], ['waxed_weathered_copper_lantern', 'waxed_weathered_copper_chain', 1], ['waxed_oxidized_copper_lantern', 'waxed_oxidized_copper_chain', 1]];
const laterneArt = (x, y, z) => { const s = LATERNEN.reduce((a, l) => a + l[2], 0); let r = zufall(x, y, z, 33) * s; return LATERNEN.find((l) => (r -= l[2]) < 0) ?? LATERNEN[0]; };
const laterne = (x, y, z, haengend = false) => `minecraft:${laterneArt(x, y, z)[0]}[hanging=${haengend},waterlogged=false]`;
// Kette mit Laterne: n Glieder ab yOben nach unten, darunter die Laterne
function haengeLaterne(x, yOben, z, n) {
  const [lat, kette] = laterneArt(x, yOben, z);
  for (let i = 0; i < n; i++) setze(m, x, yOben - i, z, `minecraft:${kette}[axis=y,waterlogged=false]`);
  setze(m, x, yOben - n, z, `minecraft:${lat}[hanging=true,waterlogged=false]`);
}

// Röhre entlang eines Pfads (Äste, Stränge, Wurzeln). Furchen laufen der Länge nach: Winkel um die Röhrenachse, 7 Rillen
function roehre(pfad, r0, r1) {
  for (let i = 0; i < pfad.length; i++) {
    const [px, py, pz] = pfad[i], r = r0 + (r1 - r0) * i / Math.max(1, pfad.length - 1), R = Math.ceil(r);
    const a = pfad[Math.max(0, i - 1)], b = pfad[Math.min(pfad.length - 1, i + 1)];
    let t = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]; const tl = Math.hypot(...t) || 1; t = t.map((v) => v / tl);
    let u = Math.abs(t[1]) > 0.9 ? [1, 0, 0] : [t[2], 0, -t[0]]; const ul = Math.hypot(...u); u = u.map((v) => v / ul);
    const v = [t[1] * u[2] - t[2] * u[1], t[2] * u[0] - t[0] * u[2], t[0] * u[1] - t[1] * u[0]];
    for (let dy = -R; dy <= R; dy++) for (let dz = -R; dz <= R; dz++) for (let dx = -R; dx <= R; dx++) {
      if (dx * dx + dy * dy + dz * dz > r * r) continue;
      const x = Math.round(px + dx), y = Math.round(py + dy), z = Math.round(pz + dz);
      const phi = Math.atan2(dx * v[0] + dy * v[1] + dz * v[2], dx * u[0] + dy * u[1] + dz * u[2]);
      if (drin(x, y, z)) setze(m, x, y, z, rinde(x, y, z, Math.sin(7 * phi + i * 0.015) < -0.55));
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
    if (r <= rc * (1 + 0.1 * Math.sin(9 * w + y * 0.08) + 0.05 * Math.sin(4 * w - y * 0.03))) setze(m, CX + dx, y, CZ + dz, rinde(CX + dx, y, CZ + dz, Math.sin(9 * w + y * 0.08) < -0.55)); // Furchen in den Tälern der Rippen
  }
}
for (let s = 0; s < 8; s++) {
  const p = [], w0 = s * 2 * Math.PI / 8;
  for (let y = G - 2; y <= S + 6; y += 0.6) { const t = (y - G) / (S - G), w = w0 + t * 1.4, r = 11 - 3 * t + 8 * Math.pow(Math.max(0, 1 - t), 3); p.push([CX + r * Math.cos(w), y, CZ + r * Math.sin(w)]); }
  roehre(p, 4.5, 3.2);
}

// 2) Laubschirme (Etagenkrone); der oberste wölbt sich als geschlossene Kuppel bis zum Aussichtsdeck an der Spitze
const SCHIRME = [
  { x: 4, z: -6, y: D, a: 70, b: 56, d: 14, oben: true }, { x: -62, z: 12, y: D - 14, a: 42, b: 34, d: 11 }, { x: 64, z: 24, y: D - 22, a: 44, b: 30, d: 11 },
  { x: -20, z: 62, y: D - 32, a: 32, b: 27, d: 9 }, { x: 18, z: -66, y: D - 8, a: 36, b: 27, d: 10 }, { x: 48, z: -36, y: D - 30, a: 28, b: 22, d: 8 }, { x: -42, z: -40, y: D - 24, a: 30, b: 24, d: 9 },
].map((s) => ({ ...s, x: Math.round(s.x * F), z: Math.round(s.z * F), a: Math.round(s.a * F), b: Math.round(s.b * F) }));
const DECK = 7; // Radius des Aussichtsdecks um den Treppenausgang
const amDeck = (x, z) => Math.hypot(x - CX, z - CZ) <= DECK + 0.5;
const OBERSEITE = [];
for (const [k, s] of SCHIRME.entries()) {
  const sx = CX + s.x, sz = CZ + s.z;
  for (let z = Math.floor(sz - s.b - 6); z <= sz + s.b + 6; z++) for (let x = Math.floor(sx - s.a - 6); x <= sx + s.a + 6; x++) {
    const w = Math.atan2(z - sz, x - sx), fr = 1 + 0.16 * (rauschen(Math.cos(w) * 20 + k * 50, Math.sin(w) * 20, 6, 60 + k) - 0.5) * 2;
    const q = Math.hypot((x - sx) / (s.a * fr), (z - sz) / (s.b * fr)); if (q > 1) continue;
    const welle = Math.round(5 * rauschen(x, z, 11, 70 + k) + 2 * rauschen(x, z, 4, 75 + k) - 3 - 3 * q * q);
    const rd = Math.hypot(x - CX, z - CZ), kuppel = Math.round((s.oben ? K : s.d * 0.5) * Math.pow(Math.max(0, 1 - q * q), 0.8));
    const top = s.oben && amDeck(x, z) ? A - 1 : Math.min(s.y + welle + kuppel, s.oben ? A - 2 + Math.floor(Math.max(0, rd - DECK) / 2) : H - 2); // Deck sitzt obenauf
    const unten = top - kuppel - Math.round(s.d * Math.pow(1 - q * q, 0.6) + 4 * rauschen(x, z, 5, 80 + k));
    for (let y = unten; y <= top; y++) if (drin(x, y, z) && hole(m, x, y, z) === LUFT) setze(m, x, y, z, laub(x, y, z));
    if (!(s.oben && amDeck(x, z))) OBERSEITE.push([x, top, z]);
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

// 4) Spawn-Raum im Stammfuß: Kuppel Radius 11, Holzwände mit Amethyst-Adern, Boden aus Kalzit/Moos/dunklem Holz, Licht, Infotafeln
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
for (let k = 0; k < 6; k++) { const w = k * Math.PI / 3, x = Math.round(CX + 7 * Math.cos(w)), z = Math.round(CZ + 7 * Math.sin(w)); haengeLaterne(x, G + RH - 3, z, 3); }
for (let k = 0; k < 40; k++) { const w = k * 0.61, y = G + 2 + (k * 5) % 10, x = Math.round(CX + (RR - 0.3) * Math.cos(w)), z = Math.round(CZ + (RR - 0.3) * Math.sin(w)); if (leer(x, y, z)) setze(m, x, y, z, 'minecraft:amethyst_cluster[facing=up,waterlogged=false]'); }
const SP = [CX, G + 1, CZ + 7]; // Spawnpunkt, Blick nach Norden auf Treppe und Tor
TAFELN.forEach((t, i) => { const w = Math.PI * 0.35 + i * 0.3, x = Math.round(CX + (RR - 1) * Math.cos(w)), z = Math.round(CZ + (RR - 1) * Math.sin(w)); setze(m, x, G + 1, z, ZAUN); schild(m, x, G + 2, z, t, 8, 'dark_oak'); });

// 5) Wendeltreppe im Stamm bis aufs Deck, aus Halbstufen (Fichtenplatte, Fichtenbretter, jede vierte volle Stufe Amethyst): je 22,5° eine halbe
// Blockhöhe, man läuft ohne Springen hoch. Beginn im Südwesten des Kerns, damit vor den Türen unten frei ist. Kern 5 × 3: links Blasensäule
// nach oben (Seelensand), rechts Fallschacht nach unten mit 2 Blöcke tiefem Wasserbecken (Wasser fängt den Fall ab), lila Glas, zwei Türen
const ST0 = G + 1, ST1 = A; // vom Raumboden bis zum Aussichtsdeck
const KERN = (dx, dz) => Math.abs(dx) <= 2 && Math.abs(dz) <= 1;
const RING = (dx, dz) => !KERN(dx, dz) && Math.hypot(dx, dz) <= 4.6;
const HALB = 16, W0 = Math.PI * 0.75, KMAX = 2 * (A - G) - 1; // Halbstufen je Umdrehung, Startwinkel, letzte Stufe (Oberkante = Deck)
const stufeOben = (k) => G + 1 + (k + 1) / 2;
const stufeY = (k) => ((k + 1) % 2 === 0 ? G + (k + 1) / 2 : G + 1 + Math.floor((k + 1) / 2));
const stufeBlock = (k) => ((k + 1) % 2 ? 'minecraft:spruce_slab[type=bottom,waterlogged=false]' : (k + 1) % 8 === 0 ? 'minecraft:amethyst_block' : 'minecraft:spruce_planks');
const stufeJ = (dx, dz) => Math.floor((((Math.atan2(dz, dx) - W0) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)) / (2 * Math.PI) * HALB);
for (let y = G + RH - 3; y <= ST1 + 1; y++) for (let dz = -6; dz <= 6; dz++) for (let dx = -6; dx <= 6; dx++) {
  const r = Math.hypot(dx, dz), x = CX + dx, z = CZ + dz;
  if (r <= 4.6) setze(m, x, y, z, LUFT);
  else if (r <= 5.8 && y > G + RH && y < ST1) setze(m, x, y, z, rauschen(x * 1.7 + y, z * 1.7, 3, 101) > 0.7 ? 'minecraft:amethyst_block' : y % 9 === 0 && Math.abs(dx) < 1 ? 'minecraft:shroomlight' : rinde(x, y, z));
}
for (let dz = -5; dz <= 5; dz++) for (let dx = -5; dx <= 5; dx++) {
  if (!RING(dx, dz)) continue;
  for (let k = stufeJ(dx, dz); k <= KMAX; k += HALB) setze(m, CX + dx, stufeY(k), CZ + dz, stufeBlock(k));
}
const stufen = KMAX + 1;
for (let y = G; y <= ST1 - 1; y++) for (let dz = -1; dz <= 1; dz++) for (let dx = -2; dx <= 2; dx++) {
  const x = CX + dx, z = CZ + dz;
  if (dx === -1 && dz === 0) setze(m, x, y, z, y === G ? 'minecraft:soul_sand' : 'minecraft:bubble_column[drag=false]');
  else if (dx === 1 && dz === 0) setze(m, x, y, z, y <= G + 1 ? 'minecraft:water[level=0]' : LUFT);
  else if (y > G) setze(m, x, y, z, 'minecraft:purple_stained_glass');
}
for (const dx of [-1, 1]) { setze(m, CX + dx, G + 1, CZ + 1, 'minecraft:dark_oak_door[facing=north,half=lower,hinge=left,open=false,powered=false]'); setze(m, CX + dx, G + 2, CZ + 1, 'minecraft:dark_oak_door[facing=north,half=upper,hinge=left,open=false,powered=false]'); }

// 6) Aussichtsdeck an der Kuppelspitze: Holzdeck um den Schacht, offen über den letzten Halbstufen (Kopffreiheit), über Blasensäule und Fallschacht
for (let z = CZ - DECK - 1; z <= CZ + DECK + 1; z++) for (let x = CX - DECK - 1; x <= CX + DECK + 1; x++) {
  const dx = x - CX, dz = z - CZ, r = Math.hypot(dx, dz); if (r > DECK + 0.5) continue;
  for (let y = A + 1; y <= A + 6; y++) setze(m, x, y, z, LUFT);
  if (dz === 0 && Math.abs(dx) === 1) { setze(m, x, A, z, LUFT); continue; }
  if (RING(dx, dz)) { const j = stufeJ(dx, dz), k = j + HALB * Math.floor((KMAX - j) / HALB); if (stufeOben(k) > A - 2) { if (stufeY(k) !== A) setze(m, x, A, z, LUFT); continue; } }
  const rand = r > DECK - 0.5;
  setze(m, x, A, z, rand ? 'minecraft:stripped_dark_oak_wood[axis=y]' : Math.abs(r - 5.5) < 0.6 ? (zufall(x, A, z) > 0.5 ? 'minecraft:verdant_froglight[axis=y]' : 'minecraft:stripped_spruce_wood[axis=y]') : 'minecraft:spruce_planks');
  if (rand) { setze(m, x, A + 1, z, ZAUN); if (zufall(x, 5, z) > 0.7) setze(m, x, A + 2, z, laterne(x, A + 2, z)); }
}

// 7) Terrassenwurzeln: sieben Rücken in Zweierstufen (eine Lücke im Norden für das Tor), Gras/Moos/Podsol, Kerzenreihen auf den Stufenkanten
const RUECKEN = Array.from({ length: 7 }, (_, i) => ({ w: i * 2 * Math.PI / 7 - Math.PI / 14 + 0.3 * (zufall(i, 0, 1) - 0.5), len: 46 + 14 * zufall(i, 1, 1), hoehe: 14 + 5 * zufall(i, 2, 1) }));
const hoehe = new Int16Array(W * L).fill(-1);
for (let z = 0; z < L; z++) for (let x = 0; x < W; x++) {
  const dx = x - CX, dz = z - CZ, r = Math.hypot(dx, dz), w = Math.atan2(dz, dx); if (r > 80) continue;
  let h = 0;
  for (const R of RUECKEN) { if (r > R.len) continue; const quer = winkelAbstand(w, R.w) * r, br = 6 + 9 * (1 - r / R.len); h = Math.max(h, R.hoehe * (1 - r / R.len) * Math.exp(-(quer * quer) / (2 * br * br))); }
  h = Math.max(h, 9 * Math.exp(-(r * r) / (2 * 20 * 20)));
  if (h >= 1) hoehe[z * W + x] = Math.floor(h / 2) * 2;
}
const oberflaeche = (x, z) => { const n = rauschen(x, z, 5, 90); return n > 0.62 ? 'minecraft:moss_block' : n < 0.22 && zufall(x, 0, z, 89) > 0.4 ? 'minecraft:podzol[snowy=false]' : 'minecraft:grass_block[snowy=false]'; };
for (let z = 1; z < L - 1; z++) for (let x = 1; x < W - 1; x++) {
  const h = hoehe[z * W + x]; if (h < 0) continue;
  const innen = Math.hypot(x - CX, z - CZ) <= RR + 2.2; // Spawn-Raum samt Wand ist schon gebaut: dessen Luft nicht auffüllen
  for (let y = G - 4; y <= G + h; y++) if (hole(m, x, y, z) === LUFT && !(innen && y > G)) setze(m, x, y, z, y === G + h ? oberflaeche(x, z) : y > G + h - 3 ? (zufall(x, y, z, 91) > 0.8 ? 'minecraft:rooted_dirt' : 'minecraft:dirt') : 'minecraft:stone');
  const kante = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => hoehe[(z + b) * W + x + a] < h);
  if (kante && leer(x, G + h + 1, z) && zufall(x, h, z, 92) > 0.7) setze(m, x, G + h + 1, z, kerze(x, h, z));
  else if (leer(x, G + h + 1, z) && zufall(x, h, z, 93) > 0.92) setze(m, x, G + h + 1, z, zufall(x, h, z, 94) > 0.5 ? 'minecraft:open_eyeblossom' : zufall(x, h, z, 95) > 0.5 ? 'minecraft:fern' : 'minecraft:short_grass');
}
for (const R of RUECKEN) { const p = []; for (let s = 0; s <= 1; s += 0.01) { const r = 8 + R.len * s; p.push([CX + r * Math.cos(R.w), G + R.hoehe * (1 - (r - 8) / R.len) + 1 - 3 * s, CZ + r * Math.sin(R.w)]); } roehre(p, 3.2, 1); }

// 8) Ein großes Tor nach Norden (−z): innen als Bogen aus heller Blasseiche mit Amethyst geschmückt, davor Laternen. Gang gerade durch Stamm und
// Terrassen ins Freie. Vor dem Start mit Rinde (Dunkeleichenholz) verschlossen, dahinter Barriere; die Eröffnung öffnet Reihe für Reihe von unten
const TOR = [3, 3, 3, 3, 3, 3, 2, 1]; // halbe Breite je Reihe ab G+1 → Bogen 7 breit, 8 hoch
const TZ1 = CZ - RR, TZ0 = TZ1 - 1;  // Rinde (2 dick) in der Innenwand
const TBZ = TZ0 - 1;                 // Barriere dahinter
const reihe = (i) => ({ x1: CX - TOR[i], x2: CX + TOR[i], y: G + 1 + i });
let mund = null;
for (let z = TZ1; z >= 0; z--) {
  let frei = true;
  TOR.forEach((_, i) => { const { x1, x2, y } = reihe(i); for (let x = x1; x <= x2; x++) { if (z < TBZ && hole(m, x, y, z) !== LUFT) frei = false; setze(m, x, y, z, LUFT); } });
  for (let x = CX - 3; x <= CX + 3; x++) setze(m, x, G, z, Math.abs(x - CX) <= 1 ? 'minecraft:moss_block' : 'minecraft:stripped_dark_oak_wood[axis=y]');
  if ((CZ - z) % 6 === 0 && z < TBZ && hole(m, CX, G + 9, z) !== LUFT) haengeLaterne(CX, G + 8, z, 1);
  if (frei && z < CZ - 30) { mund = z; break; }
}
const BOGEN = 'minecraft:stripped_pale_oak_wood[axis=y]';
for (const z of [TZ1 + 1, TZ1 + 2]) {
  for (let y = G + 1; y <= G + 6; y++) for (const x of [CX - 4, CX + 4]) setze(m, x, y, z, y % 3 === 0 ? 'minecraft:amethyst_block' : BOGEN);
  [[G + 7, 4], [G + 8, 3], [G + 9, 2], [G + 9, 1], [G + 9, 0]].forEach(([y, d]) => { setze(m, CX - d, y, z, BOGEN); setze(m, CX + d, y, z, BOGEN); });
  setze(m, CX, G + 10, z, 'minecraft:amethyst_block');
}
for (const x of [CX - 5, CX + 5]) setze(m, x, G + 1, TZ1 + 2, laterne(x, G + 1, TZ1 + 2));
const AUSGAENGE = TOR.map((_, i) => { const { x1, x2, y } = reihe(i); return { wurzeln: [x1, y, TZ0, x2, y, TZ1], barriere: [x1, y, TBZ, x2, y, TBZ], block: 'minecraft:dark_oak_wood[axis=y]' }; });
if (!process.env.OFFEN) for (const a of AUSGAENGE) {
  const [x1, y, z1, x2, , z2] = a.wurzeln; for (let x = x1; x <= x2; x++) for (let z = z1; z <= z2; z++) setze(m, x, y, z, a.block);
  for (let x = x1; x <= x2; x++) setze(m, x, y, TBZ, 'minecraft:barrier[waterlogged=false]');
}

// 9) Kronenoberseite: Moosflecken mit einzelnen Augenblüten (Nachteffekt, kein echtes Licht), wenige Kerzen; Laternen an Ketten unter den Schirmen
let augen = 0;
for (const [x, y, z] of OBERSEITE) {
  if (!leer(x, y + 1, z) || hole(m, x, y, z) === LUFT) continue;
  if (rauschen(x, z, 7, 96) > 0.42) { setze(m, x, y, z, 'minecraft:moss_block'); const r = zufall(x, y, z, 97); if (r > 0.88) { setze(m, x, y + 1, z, 'minecraft:open_eyeblossom'); augen++; } else if (r > 0.8) setze(m, x, y + 1, z, 'minecraft:moss_carpet'); }
  else if (zufall(x, y, z, 95) > 0.985) setze(m, x, y + 1, z, kerze(x, y, z));
}
for (const s of SCHIRME) for (let j = 0; j < 14; j++) {
  const w = j * Math.PI / 7 + s.x, x = Math.round(CX + s.x + Math.cos(w) * s.a * 0.5), z = Math.round(CZ + s.z + Math.sin(w) * s.b * 0.5);
  for (let y = s.y; y > G; y--) if (drin(x, y, z) && hole(m, x, y, z) !== LUFT && leer(x, y - 1, z)) { haengeLaterne(x, y - 1, z, 4); break; }
}

// Moos gezielt statt verstreut: in großen Flecken oben auf den Ästen (Holz mit Luft darüber) und in senkrechten Streifen an der Nordseite des
// unteren Stamms (Wetterseite). Nur auf Rinde, nicht im Spawn-Raum
const HOLZ = /^minecraft:(dark_oak_wood|spruce_wood|stripped_dark_oak_wood|mangrove_wood)/;
for (let y = G + 2; y < H - 1; y++) for (let z = 1; z < L - 1; z++) for (let x = 1; x < W - 1; x++) {
  const b = hole(m, x, y, z); if (!HOLZ.test(b) || Math.hypot(x - CX, z - CZ) <= 5.8) continue;
  if (y > S + 4 && Math.hypot(x - CX, z - CZ) > 12 && hole(m, x, y + 1, z) === LUFT && rauschen(x * 0.5, z * 0.5, 9, 77) > 0.52) setze(m, x, y, z, 'minecraft:moss_block');
  else if (y < G + 40 && hole(m, x, y, z - 1) === LUFT && rauschen(x * 0.35, y * 0.12, 6, 78) > 0.64) setze(m, x, y, z, 'minecraft:moss_block');
}

// Treppe Stufe für Stufe prüfen: jede Halbstufe liegt richtig, darüber 2 Blöcke frei, die letzte schließt bündig ans Deck an
function pruefeTreppe(hol, ox = 0, oy = 0, oz = 0) {
  const fehler = [], frei = (b) => b === LUFT || b === 'minecraft:cave_air' || /^minecraft:(air|light|lantern|.*_lantern)/.test(b);
  for (let k = 0; k <= KMAX; k++) {
    const w = W0 + ((k % HALB) + 0.5) / HALB * 2 * Math.PI, x = Math.round(CX + 3.4 * Math.cos(w)), z = Math.round(CZ + 3.4 * Math.sin(w)), y = stufeY(k);
    const b = hol(x + ox, y + oy, z + oz), soll = stufeBlock(k).replace(/\[.*/, '');
    if (!b.startsWith(soll)) fehler.push(`Stufe ${k}: ${x}/${y}/${z} ist ${b}, erwartet ${soll}`);
    for (const h of [1, 2]) { const c = hol(x + ox, y + h + oy, z + oz); if (!frei(c)) fehler.push(`Stufe ${k}: kein Platz über ${x}/${y}/${z} (+${h}: ${c})`); }
  }
  return fehler;
}
const treppenFehler = pruefeTreppe((x, y, z) => hole(m, x, y, z));
if (treppenFehler.length) { console.error(treppenFehler.slice(0, 10).join('\n')); throw new Error(`Treppe: ${treppenFehler.length} Fehler`); }

// 10) Halt prüfen: Pflanzen, Kerzen, stehende und hängende Laternen, Kristalle und Leuchtbeeren ohne passenden Untergrund entfernen,
// sonst fallen sie beim Setzen als Gegenstände ab (Pascals Test 24.10.)
const BODEN_PFLANZE = /^minecraft:(grass_block|dirt|coarse_dirt|podzol|rooted_dirt|moss_block|pale_moss_block|mud|mycelium|muddy_mangrove_roots)/;
const PFLANZE = /^minecraft:(open_eyeblossom|closed_eyeblossom|short_grass|fern|wildflowers|moss_carpet)/;
const STEHT = /^minecraft:(candle|amethyst_cluster\[facing=up|[a-z_]*lantern\[hanging=false)/;
const HAENGT = /^minecraft:([a-z_]*lantern\[hanging=true|cave_vines)/;
const traegt = (b) => b !== LUFT && !PFLANZE.test(b) && !STEHT.test(b) && !/lantern|cave_vines|candle|cluster|door|sign|bubble/.test(b);
for (let runde = 0, weg = 1; weg && runde < 5; runde++) {
  weg = 0;
  for (let y = 1; y < H - 1; y++) for (let z = 0; z < L; z++) for (let x = 0; x < W; x++) {
    const b = hole(m, x, y, z); if (b === LUFT) continue;
    const unten = hole(m, x, y - 1, z), oben = hole(m, x, y + 1, z);
    const ok = PFLANZE.test(b) ? (b.startsWith('minecraft:moss_carpet') ? traegt(unten) : BODEN_PFLANZE.test(unten)) : STEHT.test(b) ? traegt(unten) : HAENGT.test(b) ? oben !== LUFT && !/lantern/.test(oben) : true;
    if (!ok) { setze(m, x, y, z, LUFT); weg++; }
  }
}

// Hohlräume als Höhlenluft: place template lässt normale Luft weg, Höhlenluft räumt dort natürliches Gelände (Erde, Gras, Bäume) frei.
// Spawn-Raum, Treppenschacht, Torgang und 4 Blöcke vor dem Tor
const HOHL = 'minecraft:cave_air';
const hohl = (x, y, z) => { if (drin(x, y, z) && y > G && hole(m, x, y, z) === LUFT) setze(m, x, y, z, HOHL); };
for (let y = G + 1; y <= ST1 + 1; y++) for (let dz = -RR; dz <= RR; dz++) for (let dx = -RR; dx <= RR; dx++) {
  if (Math.hypot(dx, dz) <= (y <= G + RH + 2 ? RR : 4.6)) hohl(CX + dx, y, CZ + dz);
}
for (let z = TZ1; z >= (mund ?? TZ1) - 4; z--) TOR.forEach((_, i) => { const { x1, x2, y } = reihe(i); for (let x = x1; x <= x2; x++) hohl(x, y, z); });

// Statistik für Leistung und Größe
let ax0 = W, ax1 = 0, az0 = L, az1 = 0, ay1 = 0, nichtLuft = 0, nLaub = 0, kerzen = 0, laternen = 0;
for (let i = 0; i < m.bloecke.length; i++) { const b = m.bloecke[i]; if (b === LUFT || b === HOHL) continue; nichtLuft++; if (b.includes('leaves')) nLaub++; if (b.startsWith('minecraft:candle')) kerzen++; if (b.includes('lantern')) laternen++; const x = i % W, z = ((i / W) | 0) % L, y = (i / (W * L)) | 0; if (x < ax0) ax0 = x; if (x > ax1) ax1 = x; if (z < az0) az0 = z; if (z > az1) az1 = z; if (y > ay1) ay1 = y; }
speichern(m, process.argv[2], {
  name: 'Weltenbaum (Spawn unten im Stamm)', spawn: SP, blick: [180, 0], boden: G, kronenplatz: A,
  spawnRaum: { mitte: [CX, G + 1, CZ], radius: RR, hoehe: RH }, treppe: { stufen, von: ST0, bis: ST1, halb: HALB, startwinkel: W0, letzte: KMAX }, blasensaeule: [CX, G, CZ],
  tor: { mitte: [CX, G + 1, TZ1], mund, abstand: 4 }, ausgaenge: AUSGAENGE,
  oval: { x: Math.round((ax0 + ax1) / 2), z: Math.round((az0 + az1) / 2), a: Math.ceil((ax1 - ax0) / 2), b: Math.ceil((az1 - az0) / 2) },
  pilzland: { x: Math.round((ax0 + ax1) / 2), z: Math.round((az0 + az1) / 2), a: Math.ceil((ax1 - ax0) / 2) + 30, b: Math.ceil((az1 - az0) / 2) + 30 },
  ausdehnung: { x: ax1 - ax0 + 1, z: az1 - az0 + 1, hoeheUeberBoden: ay1 - G },
  leistung: { bloecke: nichtLuft, laub: nLaub, kerzen, laternen, augenblueten: augen },
});
console.log(`Weltenbaum: Ausdehnung ${ax1 - ax0 + 1} × ${az1 - az0 + 1}, Höhe über Boden ${ay1 - G}, Blöcke ${nichtLuft} (Laub ${nLaub}), Kerzen ${kerzen}, Laternen ${laternen}, Augenblüten ${augen}, Treppenstufen ${stufen}, Tor-Mund z ${mund}`);
