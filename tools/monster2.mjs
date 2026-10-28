// Winterfassung Paket 2 (Pascal 28.10.): alle übrigen Monster. Gleiche Regeln wie mobs.mjs (Umriss und Grundfarbe
// bleiben erkennbar), Quader aus den 26.3-Modellklassen; wo das Layout unklar oder hochaufgelöst ist, wird die ganze Textur bemalt.
import { zufall } from './winter.mjs';
import { quader, flaechen, seiten, alles, male, setze, rausch, misch, hell, frostmuster, kruste, eiszapfen, ring, muetze, zerfetzterSchal, lametta, geschenkband, schneedecke, schneekante, frostverlauf, straehnen } from './mobs.mjs';

const ROT = [186, 28, 38], WEISS = [242, 244, 246], GOLD = [236, 196, 64], SILBER = [214, 220, 228];
const EIS = [196, 232, 248], EIS_MITTEL = [150, 204, 234], EIS_DUNKEL = [96, 150, 198], SCHWARZEIS = [40, 56, 80];
const KUGELN = [[200, 30, 40], GOLD, [50, 90, 210], SILBER, [40, 150, 70]];

const ganz = (p) => [0, 0, p.width, p.height];
// Eispanzer (wie Skelett in mobs.mjs) mit wählbarer Eisfarbe.
const eisplatten = (staerke, kante = EIS_DUNKEL, flaeche = EIS) => (i, j, alt, r) => misch(alt.slice(0, 3), i % 3 === 0 || j % 3 === 0 ? kante : r() < 0.2 ? WEISS : flaeche, staerke);
const zuckerstange = (i, j) => (Math.floor((i + j) / 2) % 2 ? ROT : WEISS);
const glitzer = (dichte) => { const n = Math.round(1 / dichte); return (i, j) => ((i * 37 + j * 91 + ((i * j) % 5)) % n === 0 ? ((i + j) % 2 ? GOLD : SILBER) : null); }; // festes Raster statt Zufall
// Christbaumkugeln (2×2) zufällig auf deckenden Pixeln.
function kugeln(p, rect, anzahl, saat) {
  const r = zufall(saat);
  for (let k = 0; k < anzahl; k++) {
    const x = rect[0] + Math.floor(r() * (rect[2] - 1)), y = rect[1] + Math.floor(r() * (rect[3] - 1)), c = KUGELN[k % KUGELN.length];
    for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) if (p.data[((y + dy) * p.width + x + dx) * 4 + 3]) setze(p, x + dx, y + dy, dx + dy === 0 ? misch(c, WEISS, 0.5) : c);
  }
}
// Krampus-Fell (wie Pillager) für Illager-Layouts.
const ILL = { kopf: quader(0, 0, 8, 10, 8), rumpf: quader(16, 20, 8, 12, 6), jacke: quader(0, 38, 8, 20, 6), arme: [quader(44, 22, 4, 8, 4), quader(40, 38, 8, 4, 4), quader(40, 46, 4, 12, 4)], bein: quader(0, 22, 4, 12, 4) };
function krampusRobe(p, toene, kragen, saat) {
  const fell = straehnen(toene);
  for (const q of [ILL.jacke, ILL.rumpf, ...ILL.arme, ILL.bein]) male(p, seiten(q), fell, { saat: saat + q.v });
  for (const q of [ILL.jacke, ILL.rumpf]) male(p, seiten(q), (i, j, alt, r) => (j < 2 ? rausch(kragen, r, 10) : null), { saat });
  const [vx, vy] = flaechen(ILL.jacke).vorne;
  for (let i = 0; i < 9; i++) { setze(p, vx + Math.round(i * 7 / 9), vy + 2 + i, i % 2 ? [92, 96, 104] : GOLD); }
  male(p, flaechen(ILL.kopf).oben, fell, { saat: saat + 3 });
}
const MENSCH = { kopf: quader(0, 0, 8, 8, 8), rumpf: quader(16, 16, 8, 12, 4), arm: quader(40, 16, 4, 12, 4), bein: quader(0, 16, 4, 12, 4) };
const PFERD_HALS = quader(0, 35, 4, 12, 7);

export const MONSTER2 = {
  'blaze/blaze': (p) => { male(p, [0, 16, 8, 10], zuckerstange); kruste(p, flaechen(MENSCH.kopf).oben, 0.25, 400); },
  'skeleton/bogged': (p) => { for (const q of [MENSCH.rumpf, quader(40, 16, 2, 12, 2), quader(0, 16, 2, 12, 2)]) frostverlauf(p, seiten(q), { staerke: 0.55, farbe: [150, 210, 190] }); schneedecke(p, MENSCH.kopf, { saat: 401 }); schneekante(p, MENSCH.kopf, { reihen: 1, tropfen: 2, saat: 402 }); },
  'skeleton/bogged_overlay': (p) => male(p, ganz(p), (i, j, alt) => misch(alt.slice(0, 3), EIS_MITTEL, 0.35)),
  'skeleton/parched': (p) => { for (const q of [MENSCH.rumpf, quader(40, 16, 2, 12, 2), quader(0, 16, 2, 12, 2)]) frostverlauf(p, seiten(q), { staerke: 0.5, farbe: [230, 236, 240] }); schneedecke(p, MENSCH.kopf, { saat: 404 }); schneekante(p, MENSCH.kopf, { reihen: 1, tropfen: 2, saat: 405 }); },
  'skeleton/wither_skeleton': (p) => { for (const q of [MENSCH.rumpf, quader(40, 16, 2, 12, 2), quader(0, 16, 2, 12, 2)]) frostverlauf(p, seiten(q), { staerke: 0.55, farbe: SCHWARZEIS }); schneedecke(p, MENSCH.kopf, { saat: 405 }); schneekante(p, MENSCH.kopf, { reihen: 1, tropfen: 2, saat: 406 }); },
  'breeze/breeze': (p) => { schneedecke(p, quader(0, 0, 8, 8, 8), { saat: 410 }); schneekante(p, quader(0, 0, 8, 8, 8), { reihen: 1, tropfen: 2, saat: 412 }); },
  'breeze/breeze_wind': (p) => male(p, ganz(p), (i, j, alt) => [misch(alt.slice(0, 3), EIS, 0.35), alt[3]]), // Schneesturm
  'creaking/creaking': (p) => { kugeln(p, ganz(p), 60, 412); lametta(p, ganz(p), { faeden: 6, saat: 413 }); },
  'endermite/endermite': (p) => male(p, ganz(p), glitzer(0.15), { saat: 414 }),
  'silverfish/silverfish': (p) => male(p, ganz(p), glitzer(0.18), { saat: 415 }),
  'illager/evoker': (p) => krampusRobe(p, [[64, 20, 22], [30, 12, 14], [46, 16, 18]], [20, 20, 24], 420),
  'illager/illusioner': (p) => krampusRobe(p, [[30, 36, 70], [16, 18, 36], [22, 26, 52]], [150, 24, 32], 425),
  'illager/vex': (p) => vex(p, 430), 'illager/vex_charging': (p) => vex(p, 431),
  'illager/ravager': (p) => {
    const rumpf = quader(0, 55, 14, 16, 20);
    ring(p, rumpf, 3, 2, (x, i) => (i ? [120, 20, 26] : ROT), 440); // Geschirr
    const [x0, y0, w] = seiten(rumpf);
    for (let x = 2; x < w; x += 5) for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) setze(p, x0 + x + dx, y0 + 5 + dy, dx + dy ? GOLD : [255, 240, 160]); // Schellen
    kruste(p, flaechen(rumpf).oben, 0.45, 441);
  },
  'ghast/ghast': (p) => ghast(p, 450), 'ghast/ghast_shooting': (p) => ghast(p, 450),
  'hoglin/hoglin': (p) => { const k = quader(1, 1, 16, 14, 26); ring(p, k, 3, 2, (x, i) => (i ? [120, 20, 26] : ROT), 460); kugeln(p, seiten(k), 6, 461); kruste(p, [90, 33, 38, 29], 0.3, 462); },
  'hoglin/zoglin': (p) => { const k = quader(1, 1, 16, 14, 26), kopf = quader(61, 1, 14, 6, 19); frostverlauf(p, seiten(k), { staerke: 0.5 }); for (const q of [k, kopf]) { schneedecke(p, q, { saat: 463 + q.u }); schneekante(p, q, { reihen: 1, tropfen: 3, saat: 464 + q.u }); } },
  'slime/magmacube': (p) => male(p, ganz(p), (i, j, alt, r) => (j % 8 === 3 ? (r() < 0.8 ? GOLD : [255, 240, 160]) : null)), // glühende Christbaumkugel mit Goldringen
  'piglin/piglin': (p) => { lametta(p, seiten(MENSCH.rumpf), { faeden: 4, saat: 470 }); ring(p, MENSCH.rumpf, 0, 2, (x, i) => (i && x % 4 < 2 ? [40, 130, 60] : ROT), 471); },
  'piglin/piglin_brute': (p) => { const fell = (i, j, alt, r) => rausch(r() < 0.4 ? [40, 26, 20] : [24, 16, 14], r, 8); for (const q of [MENSCH.rumpf, quader(16, 32, 8, 12, 4)]) male(p, seiten(q), fell, { saat: 472 }); ring(p, MENSCH.rumpf, 0, 2, zerfetzterSchal, 473); },
  'piglin/zombified_piglin': (p) => { muetze(p, quader(0, 0, 10, 8, 8), { reihen: 2, zerfetzt: true, saat: 474 }); ring(p, MENSCH.rumpf, 0, 2, zerfetzterSchal, 475); kruste(p, seiten(MENSCH.rumpf), 0.15, 476); },
  'horse/horse_skeleton': (p) => { const k = quader(0, 32, 10, 10, 22); frostverlauf(p, seiten(k), { staerke: 0.5 }); schneedecke(p, k, { saat: 480 }); schneekante(p, k, { reihen: 1, tropfen: 2, saat: 484 }); ring(p, PFERD_HALS, 9, 2, zerfetzterSchal, 481); },
  'horse/horse_zombie': (p) => { const k = quader(0, 32, 10, 10, 22); ring(p, PFERD_HALS, 9, 2, zerfetzterSchal, 482); schneedecke(p, k, { saat: 483 }); schneekante(p, k, { reihen: 1, tropfen: 2, saat: 485 }); },
  'sulfur_cube/sulfur_cube_outer': (p) => geschenkband(p, quader(0, 0, 18, 18, 18), 490),
  'sulfur_cube/sulfur_cube_outer_small': (p) => male(p, ganz(p), (i, j, alt) => ((i % 16 === 7 || i % 16 === 8 || j % 16 === 7 || j % 16 === 8) ? [[150, 20, 30], Math.max(alt[3], 200)] : null)),
  'nautilus/zombie_nautilus': (p) => { const q = quader(0, 0, 14, 10, 16); schneedecke(p, q, { saat: 495 }); schneekante(p, q, { reihen: 1, tropfen: 2, saat: 496 }); frostverlauf(p, seiten(q), { staerke: 0.35 }); },
};

function vex(p, saat) {
  male(p, [16, 14, 16, 13], (i, j, alt) => (j === 0 || i === 0 ? GOLD : misch(alt.slice(0, 3), WEISS, 0.6))); // Flügel weiß mit Goldkante
  male(p, [0, 10, 10, 12], (i, j, alt, r) => misch(alt.slice(0, 3), [60, 20, 30], 0.5), { saat }); // dunkles Gewand
}
function ghast(p, saat) {
  // 128×64 = doppelte Auflösung des 64×32-Modells: Körper (0,0) 16×16×16 → Seiten ab y 32, Oberseite (32,0).
  kruste(p, [32, 0, 32, 32], 0.55, saat);
  for (let x = 0; x < 128; x++) { const l = 2 + Math.round((Math.sin(x * 1.3) * 0.5 + 0.5) * 5); for (let j = 0; j < l; j++) setze(p, x, 63 - j, j === l - 1 ? EIS_DUNKEL : j > l - 3 ? EIS_MITTEL : EIS); } // vereiste Unterkante mit Zapfen
  male(p, [0, 34, 128, 4], (i, j) => (j < 2 ? ROT : (i % 8 < 4 ? WEISS : ROT))); // rot-weißes Band um den Kopf
}

// EMF-Zusätze Paket 2 (Teilnamen nach OptiFine, Pivot = absolute Lage im Modellraum)
const zipfelB = (b, y, rot = 'rot', weiss = 'weiss') => [[[-b / 2 - 0.6, y - 1, -b / 2 - 0.6], [b + 1.2, 1.6, b + 1.2], weiss], [[-b / 2, y - 3, -b / 2 + 0.4], [b, 2, b], rot],
  [[-b * 0.375, y - 5, -b * 0.375 + 1.6], [b * 0.75, 2, b * 0.75], rot], [[-b / 4, y - 7, -b / 4 + 3], [b / 2, 2, b / 2], rot], [[-1.6, y - 10, b / 4], [3.2, 2.8, 3.2], weiss]];
const hoerner = (y) => [-1, 1].flatMap((s) => [[[s * 4.5 - 1, y - 3, -1], [2, 2, 2], 'horn'], [[s * 6 - 0.75, y - 5, -0.6], [1.5, 2.2, 1.5], 'horn'], [[s * 7 - 0.5, y - 7, 0], [1, 2.2, 1], 'horn'], [[s * 6.6 - 0.4, y - 8.4, 0.6], [0.8, 1.4, 0.8], 'hornspitze']]);
const geweih = (x, y, z, g = 1) => [-1, 1].flatMap((s) => [[[s * x - 0.5 * g, y - 5 * g, z], [g, 5 * g, g], 'dunkel'], [[s > 0 ? x : -x - 4 * g, y - 5 * g, z], [4 * g, g, g], 'dunkel'],
  [[s * (x + 3 * g) - 0.5 * g, y - 9 * g, z], [g, 4 * g, g], 'dunkel'], [[s * (x + 1.5 * g) - 0.5 * g, y - 8 * g, z], [g, 3 * g, g], 'dunkel']]);
const eiskrone = (y, b) => [[-b / 2 + 0.5, -b / 2 + 0.5], [-1, -b / 2 + 0.2], [b / 2 - 2.5, -b / 2 + 0.5], [b / 2 - 1.5, 0], [-b / 2 + 0.5, 0]].map(([x, z], i) => [[x, y - 2.5, z], [1, 2.5, 1], i % 2 ? 'eis' : 'eis_dunkel']);
export const MONSTER2_EMF = {
  blaze: { head: { pivot: [0, 0, 0], quader: zipfelB(8, -4) } },
  bogged: { head: { pivot: [0, 0, 0], quader: eiskrone(-8, 8) } },
  parched: { head: { pivot: [0, 0, 0], quader: eiskrone(-8, 8) } },
  wither_skeleton: { head: { pivot: [0, 0, 0], quader: eiskrone(-8, 8).map(([v, m]) => [v, m, 'dunkel']) } },
  evoker: { head: { pivot: [0, 0, 0], quader: hoerner(-8) } },
  illusioner: { head: { pivot: [0, 0, 0], quader: hoerner(-8) } },
  ghast: { body: { pivot: [0, 17.6, 0], quader: zipfelB(16, -8) } },
  hoglin: { head: { pivot: [0, 2, -12], quader: [...geweih(3, -3, -6), [[-1.5, -1, -20], [3, 2, 1.2], 'rot']] } },
  zoglin: { head: { pivot: [0, 2, -12], quader: geweih(3, -3, -6).map(([v, m], i) => [v, m, i % 2 ? 'eis' : 'eis_dunkel']) } },
  piglin: { head: { pivot: [0, 0, 0], quader: zipfelB(10, -8) } },
  piglin_brute: { head: { pivot: [0, 0, 0], quader: hoerner(-8) } },
  zombified_piglin: { head: { pivot: [0, 0, 0], quader: zipfelB(10, -8, 'rot', 'sandweiss') } },
  ravager: { head: { pivot: [0, 9, -11.5], quader: [...geweih(4, -20, -6, 1.6), [[-2.2, -4, -18.8], [4.4, 3, 1.2], 'rot']] } },
  vex: { head: { pivot: [0, 17.5, 0], quader: [[[-2.5, -6.8, -2.5], [5, 0.6, 0.8], 'gold'], [[-2.5, -6.8, 1.7], [5, 0.6, 0.8], 'gold'], [[-2.5, -6.8, -2.5], [0.8, 0.6, 5], 'gold'], [[1.7, -6.8, -2.5], [0.8, 0.6, 5], 'gold']] } },
};

// Shulker (alle 17 Farben): Schale als Geschenk mit Goldband längs über alle Seiten und Kreuz auf dem Deckel.
function shulkerGeschenk(p) {
  for (const q of [quader(0, 0, 16, 12, 16), quader(0, 28, 16, 8, 16)]) {
    const f = flaechen(q);
    for (const [x0, y0, w, h] of [f.vorne, f.hinten, f.rechts, f.links]) male(p, [x0 + 7, y0, 2, h], (i, j, alt, r) => rausch(GOLD, r, 10));
  }
  const [ox, oy] = flaechen(quader(0, 0, 16, 12, 16)).oben;
  male(p, [ox, oy, 16, 16], (i, j, alt, r) => (i === 7 || i === 8 || j === 7 || j === 8 ? rausch(GOLD, r, 10) : null));
}
for (const farbe of ['', '_black', '_blue', '_brown', '_cyan', '_gray', '_green', '_light_blue', '_light_gray', '_lime', '_magenta', '_orange', '_pink', '_purple', '_red', '_white', '_yellow']) MONSTER2[`shulker/shulker${farbe}`] = shulkerGeschenk;
