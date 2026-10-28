// Winterfassung der Bosse und Geschosse (Pascal 28.10., Paket 1): Warden als Eiskönig mit Lichterketten-Leuchtflecken,
// Wither als Knecht Ruprecht mit Geschenk-Schädeln, Guardian mit Zuckerstangen-Stacheln, Frost-Drache mit
// Christbaumkugel-Feuerball, Shulker-Geschoss als Stern, Pfeile als Zuckerstangen. Quader aus den 26.3-Modellklassen.
import { zufall } from './winter.mjs';
import { quader, flaechen, seiten, alles, male, setze, rausch, misch, hell, frostmuster, kruste, eiszapfen, ring, zerfetzterSchal } from './mobs.mjs';

const ROT = [186, 28, 38], WEISS = [242, 244, 246], GOLD = [236, 196, 64], GOLD_DUNKEL = [170, 122, 30];
const EIS = [196, 232, 248], EIS_MITTEL = [150, 204, 234], EIS_DUNKEL = [96, 150, 198];
const LICHTER = [[236, 48, 48], [250, 210, 60], [70, 130, 250], [70, 220, 110]];

// Geschenkwürfel auf einen 8er-Quader (Wither-Schädel): Papier, Kreuzband, Schleife oben, böses Gesicht schimmert durch.
function geschenkwuerfel(p, q, papier, band, saat) {
  const f = flaechen(q);
  for (const rect of alles(q)) male(p, rect, (i, j, alt, r) => (hell(alt) > 0.55 ? null : rausch(misch(papier, alt.slice(0, 3), 0.25), r, 12)), { saat });
  for (const [x0, y0, w, h] of [f.vorne, f.hinten, f.rechts, f.links]) male(p, [x0 + 3, y0, 2, h], (i, j, alt, r) => rausch(band, r, 8));
  const [ox, oy] = f.oben;
  male(p, [ox, oy, 8, 8], (i, j, alt, r) => (i === 3 || i === 4 || j === 3 || j === 4 ? rausch(band, r, 8) : null));
  male(p, [ox + 1, oy + 1, 6, 6], (i, j) => ((i < 2 || i > 3) && (j < 2 || j > 3) && (i + j) % 2 === 0 ? band : null));
}

const WARDEN = { koerper: quader(0, 0, 18, 21, 11), kopf: quader(0, 32, 16, 16, 10), arme: [quader(44, 50, 8, 28, 8), quader(0, 58, 8, 28, 8)], beine: [quader(76, 48, 6, 13, 6), quader(76, 76, 6, 13, 6)] };
const WITHER = { schultern: quader(0, 16, 20, 3, 3), rippen: quader(0, 22, 3, 10, 3), kopf: quader(0, 0, 8, 8, 8), seitenkopf: quader(32, 0, 6, 6, 6), schaedel: quader(0, 35, 8, 8, 8) };
const GUARDIAN = { kopf: quader(0, 0, 12, 12, 16), stachel: [0, 0, 8, 11] };

function frostig(p, rects, saat, dichte = 0.18) {
  for (const rect of rects) {
    male(p, rect, (i, j, alt, r) => (r() < dichte ? misch(alt.slice(0, 3), r() < 0.3 ? WEISS : EIS, 0.75) : null), { saat });
    frostmuster(p, rect, { wege: Math.ceil(rect[2] * rect[3] / 90), laenge: 10, saat: saat + rect[0] + rect[1] });
  }
}

export const BOSSE = {
  'warden/warden': (p) => {
    kruste(p, flaechen(WARDEN.kopf).oben, 0.85, 300); kruste(p, flaechen(WARDEN.koerper).oben, 0.8, 301);
    eiszapfen(p, WARDEN.kopf, 15, { laenge: 3, saat: 302 }); eiszapfen(p, WARDEN.koerper, 0, { laenge: 4, saat: 303 });
    for (const a of WARDEN.arme) { kruste(p, flaechen(a).oben, 0.9, 304); eiszapfen(p, a, 0, { laenge: 3, saat: 305 + a.u }); }
    for (const t of [[52, 32, 16, 16], [58, 0, 16, 16]]) male(p, t, (i, j, alt) => misch(alt.slice(0, 3), EIS_MITTEL, 0.6)); // Fühler vereist
  },
  // Leuchtflecken werden zu bunten Lichterketten-Birnen (leuchten im Dunkeln wie im Original).
  'warden/warden_bioluminescent_layer': (p) => male(p, [0, 0, p.width, p.height], (i, j, alt) => [LICHTER[(Math.floor(i / 3) + Math.floor(j / 3)) % 4], alt[3]]),
  'warden/warden_pulsating_spots_1': (p) => male(p, [0, 0, p.width, p.height], (i, j, alt) => [LICHTER[(Math.floor(i / 4) + Math.floor(j / 4) + 1) % 4], alt[3]]),
  'warden/warden_pulsating_spots_2': (p) => male(p, [0, 0, p.width, p.height], (i, j, alt) => [LICHTER[(Math.floor(i / 4) + Math.floor(j / 4) + 2) % 4], alt[3]]),
  'warden/warden_heart': (p) => male(p, [0, 0, p.width, p.height], (i, j, alt) => [misch([220, 30, 40], [255, 120, 120], hell(alt)), alt[3]]),
  'wither/wither': (p) => wither(p, false, 310),
  'wither/wither_invulnerable': (p) => wither(p, true, 320),
  'guardian/guardian': (p) => guardian(p, false, 330),
  'guardian/guardian_elder': (p) => guardian(p, true, 340),
  'enderdragon/dragon': (p) => {
    // Reif auf den dunklen Schuppen, Eis auf den Rückenzacken; Augen (eigene Ebene) bleiben lila.
    male(p, [0, 0, p.width, p.height], (i, j, alt, r) => (hell(alt) < 0.3 && r() < 0.14 ? misch(alt.slice(0, 3), r() < 0.25 ? WEISS : EIS, 0.55) : null), { saat: 350 });
    male(p, [220, 53, 28, 18], (i, j, alt, r) => misch(alt.slice(0, 3), EIS, 0.7), { saat: 351 });
    for (const flugel of [[0, 88, 112, 56], [0, 144, 112, 56]]) frostmuster(p, flugel, { wege: 12, laenge: 22, farbe: [110, 160, 210], saat: 352 + flugel[1] });
  },
};

function wither(p, blau, saat) {
  const s = WITHER;
  frostig(p, [...alles(s.kopf), ...alles(s.seitenkopf), ...alles(s.rippen), seiten(s.schultern)], saat, 0.14);
  ring(p, s.schultern, 0, 2, zerfetzterSchal, saat + 1); // zerrissene rote Girlande über den Schultern
  // Geschoss: Geschenk statt Totenkopf. Normal rot mit Goldband, die gefährlichen blauen dunkelblau-schwarz mit Silberband.
  geschenkwuerfel(p, s.schaedel, blau ? [30, 44, 110] : [170, 26, 36], blau ? [200, 210, 225] : GOLD, saat + 2);
}

function guardian(p, elder, saat) {
  // Stacheln als Zuckerstangen (Stachel-Textur liegt allein oben links).
  male(p, GUARDIAN.stachel, (i, j) => (Math.floor((i + j) / 2) % 2 ? ROT : WEISS));
  const k = GUARDIAN.kopf;
  if (elder) frostig(p, alles(k), saat, 0.3);
  else frostig(p, alles(k), saat, 0.08);
  // Lichterkette als Band um den Körper
  const [x0, y0, w] = seiten(k);
  for (let x = 0; x < w; x++) { setze(p, x0 + x, y0 + 5 + (x % 6 < 3 ? 0 : 1), [24, 40, 24]); if (x % 3 === 1) setze(p, x0 + x, y0 + 6 + (x % 6 < 3 ? 0 : 1), LICHTER[(x / 3 | 0) % 4]); }
}

// Geschosse und Sprites, die direkt als Bild vorliegen.
export const GESCHOSSE = {
  'shulker/spark': (p) => male(p, [0, 0, p.width, p.height], (i, j, alt) => [hell(alt) < 0.6 ? GOLD_DUNKEL : misch(GOLD, [255, 250, 200], hell(alt) - 0.6), alt[3]]),
  'projectiles/arrow': (p) => zuckerpfeil(p), 'projectiles/arrow_tipped': (p) => zuckerpfeil(p), 'projectiles/arrow_spectral': (p) => zuckerpfeil(p, GOLD),
  // Drachen-Feuerball als große Christbaumkugel mit Glanz (16×16, wird groß als Fläche gezeigt).
  'enderdragon/dragon_fireball': (p) => {
    p.data.fill(0);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const dx = x - 7.5, dy = y - 8.5, d = Math.sqrt(dx * dx + dy * dy);
      if (y < 3 && Math.abs(dx) < 1.6) { setze(p, x, y, y === 0 ? GOLD_DUNKEL : GOLD); continue; } // Kappe mit Öse
      if (d > 6.3) continue;
      const glanz = (dx + 2.2) ** 2 + (dy + 2.2) ** 2 < 2.2;
      const basis = misch([150, 40, 190], [60, 10, 90], Math.min(1, d / 6.3));
      setze(p, x, y, glanz ? [255, 240, 255] : Math.abs(dy) < 0.8 ? GOLD : basis);
    }
  },
};
function zuckerpfeil(p, spitze = null) {
  // Schaft rot-weiß gestreift, Federn grün; nur die farbigen Holz-/Federpixel werden ersetzt.
  male(p, [0, 0, p.width, p.height], (i, j, alt) => {
    const [r, g, b] = alt;
    if (r > b + 25 && hell(alt) > 0.2 && hell(alt) < 0.7) return (i + j) % 4 < 2 ? ROT : WEISS; // Holz
    if (hell(alt) > 0.75) return [60, 160, 70]; // Federn
    if (spitze && hell(alt) > 0.5) return spitze;
    return null;
  });
}

// Ghast-Feuerball und kleiner Feuerball sind Item-Sprites (Feuerkugel); im Flug bzw. am Boden glühende Kugel.
export function gluehkugel(PNG) {
  const p = new PNG({ width: 16, height: 16 }); p.data.fill(0);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const dx = x - 7.5, dy = y - 8, d = Math.sqrt(dx * dx + dy * dy);
    if (y < 3 && Math.abs(dx) < 1.6) { setze(p, x, y, GOLD); continue; }
    if (d > 6) continue;
    setze(p, x, y, (dx + 2) ** 2 + (dy + 2) ** 2 < 2 ? [255, 255, 220] : misch([255, 200, 60], [220, 60, 20], d / 6));
  }
  return p;
}

// EMF-Zusätze der Bosse (gleiche Palette wie mobs.mjs). Pivot = absolute Lage des Teils im Modellraum.
const krone = (y, b) => [[-b / 2 - 0.6, y, -b / 2 - 0.6], [b + 1.2, 1.2, b + 1.2], 'eis_dunkel'];
const zacken = (y, b) => [-b / 2, -b / 4, 0, b / 4, b / 2 - 1].map((x, i) => [[x, y - 2 - (i % 2), -b / 2 - 0.4], [1, 2 + (i % 2), 1], i % 2 ? 'eis' : 'eis_dunkel']);
const hoernchen = (y) => [-1, 1].flatMap((s) => [[[s * 3.5 - 0.75, y - 1.5, -0.75], [1.5, 2, 1.5], 'horn'], [[s * 4.5 - 0.5, y - 3.5, -0.5], [1, 2, 1], 'horn'], [[s * 4.6 - 0.4, y - 4.5, -0.4], [0.8, 1, 0.8], 'hornspitze']]);
export const BOSS_EMF = {
  warden: { head: { pivot: [0, -10, 0], quader: [krone(-17, 16), ...zacken(-17, 16), ...zacken(-19, 12)] } },
  wither: { head1: { pivot: [0, 0, 0], quader: hoernchen(-4) } }, // OptiFine-Name des Mittelkopfs
  elder_guardian: { body: { pivot: [0, 0, 0], quader: [krone(7, 12), ...zacken(7, 12)] } }, // „body“ = Vanilla-Teil head
};
