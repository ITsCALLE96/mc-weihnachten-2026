// Weihnachtliche Mob-Texturen für den Winterteil (Pascal 28.10.): Monster in weihnachtlichem, aber bösem
// Outfit am ganzen Körper (zerlumpter Wichtel, Eispanzer, Geschenk-Creeper, Krampus …), Tiere mit Mütze oder Schal.
// Gemalt wird auf die Vanilla-Texturen in den Quader-Flächen der Modelle; die Quader (texOffs, Maße) stammen
// aus den Modellklassen der 26.3-Client-Jar. Umriss bleibt, Grundfarbe bleibt erkennbar.
import { zufall } from './winter.mjs';

const ROT = [186, 28, 38];
const ROT_DRECKIG = [112, 30, 28];
const ROT_DUNKEL = [70, 16, 18];
const WEISS = [242, 244, 246];
const FELL_DRECKIG = [168, 160, 140];
const EIS = [196, 232, 248];
const EIS_MITTEL = [150, 204, 234];
const EIS_DUNKEL = [96, 150, 198];
const SILBER = [214, 220, 228];
const GOLD = [236, 196, 64];
const GOLD_DUNKEL = [170, 122, 30];
const KABEL = [24, 40, 24];

// Quader: texOffs [u, v] und Maße [w, h, d]; Seitenband = rechts, vorne, links, hinten nebeneinander.
export const quader = (u, v, w, h, d) => ({ u, v, w, h, d });
export function flaechen({ u, v, w, h, d }) {
  return {
    oben: [u + d, v, w, d], unten: [u + d + w, v, w, d],
    rechts: [u, v + d, d, h], vorne: [u + d, v + d, w, h], links: [u + d + w, v + d, d, h], hinten: [u + 2 * d + w, v + d, w, h],
  };
}
export const seiten = (q) => [q.u, q.v + q.d, 2 * q.d + 2 * q.w, q.h];
export const alles = (q) => [seiten(q), flaechen(q).oben];

const im = (png, x, y) => x >= 0 && y >= 0 && x < png.width && y < png.height;
export function setze(png, x, y, [r, g, b], a = 255) {
  if (!im(png, x, y)) return;
  png.data.set([r, g, b, a], (y * png.width + x) * 4);
}
const lies = (png, x, y) => [...png.data.slice((y * png.width + x) * 4, (y * png.width + x) * 4 + 4)];
const alpha = (png, x, y) => (im(png, x, y) ? png.data[(y * png.width + x) * 4 + 3] : 0);
export const rausch = (farbe, r, staerke = 14) => { const z = Math.round((r() - 0.5) * staerke); return farbe.map((c) => Math.max(0, Math.min(255, c + z))); };
export const misch = (a, b, t) => a.map((c, i) => Math.round(c * (1 - t) + b[i] * t));
export const hell = (c) => (c[0] * 0.3 + c[1] * 0.59 + c[2] * 0.11) / 255;

// Grundwerkzeug: fn(i, j, alt, r) für jedes Pixel eines Rechtecks → Farbe, [Farbe, alpha] oder null (bleibt).
export function male(png, [x0, y0, w, h], fn, { saat = 1, nurDeckend = true } = {}) {
  const r = zufall(saat);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const x = x0 + i, y = y0 + j;
    if (!im(png, x, y) || (nurDeckend && !alpha(png, x, y))) continue;
    const c = fn(i, j, lies(png, x, y), r);
    if (!c) continue;
    if (Array.isArray(c[0])) setze(png, x, y, c[0], c[1]); else setze(png, x, y, c);
  }
}
// Stoff mit Rauschen und Löchern (Loch = Original bleibt sichtbar).
const stoff = (farbe, { loch = 0, staerke = 16, schatten = 0 } = {}) => (i, j, alt, r) => (r() < loch ? null : rausch(misch(farbe, [0, 0, 0], schatten * (j % 3 === 2 ? 1 : 0)), r, staerke));
// Eispanzer-Platten: 3er-Raster mit hellen Kanten, Knochen/Untergrund schimmert leicht durch.
const eisplatten = (staerke = 0.75) => (i, j, alt, r) => {
  const kante = i % 3 === 0 || j % 3 === 0;
  return misch(alt.slice(0, 3), kante ? EIS_DUNKEL : r() < 0.2 ? WEISS : EIS, staerke);
};
// Eisrisse/Frostmuster: Zufallswege in Hellblau.
export function frostmuster(png, [x0, y0, w, h], { wege = 4, laenge = 14, farbe = EIS_MITTEL, saat = 9 } = {}) {
  const r = zufall(saat);
  for (let k = 0; k < wege; k++) {
    let x = Math.floor(r() * w), y = Math.floor(r() * h);
    for (let s = 0; s < laenge; s++) {
      if (alpha(png, x0 + x, y0 + y)) setze(png, x0 + x, y0 + y, s % 5 === 0 ? WEISS : farbe);
      const z = r();
      if (z < 0.4) x += r() < 0.5 ? 1 : -1; else if (z < 0.8) y += r() < 0.5 ? 1 : -1; else { x += 1; y += 1; }
      x = (x + w) % w; y = Math.max(0, Math.min(h - 1, y));
    }
  }
}

// Mütze: Oberseite und obere Seitenreihen rot, darunter Fellrand. zerfetzt = ausgefranster Rand, Löcher, Dreck.
export function muetze(png, q, { reihen = 2, zerfetzt = false, rot = ROT, fell = WEISS, saat = 1 } = {}) {
  const r = zufall(saat);
  const [ox, oy, ow, oh] = flaechen(q).oben;
  for (let y = oy; y < oy + oh; y++) for (let x = ox; x < ox + ow; x++) {
    if (zerfetzt && r() < 0.1) continue;
    setze(png, x, y, rausch(zerfetzt && r() < 0.25 ? ROT_DRECKIG : rot, r));
  }
  for (let x = q.u; x < q.u + 2 * q.d + 2 * q.w; x++) {
    const tiefe = zerfetzt ? reihen - (r() < 0.35 ? 1 : 0) : reihen;
    for (let i = 0; i < tiefe; i++) {
      if (zerfetzt && r() < 0.08) continue;
      setze(png, x, q.v + q.d + i, rausch(zerfetzt && r() < 0.25 ? ROT_DRECKIG : rot, r));
    }
    if (!zerfetzt || r() > 0.25) setze(png, x, q.v + q.d + tiefe, rausch(zerfetzt ? FELL_DRECKIG : fell, r, 10));
  }
}

// Ring um die Seiten eines Quaders ab Reihe y, farbe(x, i, r) → Farbe oder null.
export function ring(png, q, y, reihen, farbe, saat = 2) {
  const r = zufall(saat);
  for (let x = q.u; x < q.u + 2 * q.d + 2 * q.w; x++) for (let i = 0; i < reihen; i++) {
    const c = farbe(x - q.u, i, r);
    if (c) setze(png, x, q.v + q.d + y + i, rausch(c, r, 10));
  }
}
const schalFarbe = (rot = ROT, akzent = WEISS) => (x, i) => (i === 1 && x % 4 < 2 ? akzent : rot);
export const zerfetzterSchal = (x, i, r) => (r() < 0.15 ? null : i === 0 ? ROT_DRECKIG : r() < 0.4 ? ROT_DUNKEL : ROT_DRECKIG);
export function schalEnde(png, q, y, laenge, { x = 1, rot = ROT, zerfetzt = false, saat = 3 } = {}) {
  const r = zufall(saat);
  const [vx, vy] = flaechen(q).vorne;
  for (let i = 0; i < laenge; i++) for (const dx of [0, 1]) {
    if (zerfetzt && i === laenge - 1 && r() < 0.5) continue;
    setze(png, vx + x + dx, vy + y + i, rausch(i % 3 === 2 && !zerfetzt ? WEISS : rot, r, 10));
  }
}
// Eiszapfen: hängen von Reihe y der Seiten nach unten, Kruste in Reihe y.
export function eiszapfen(png, q, y, { laenge = 3, saat = 4 } = {}) {
  const r = zufall(saat);
  for (let x = q.u; x < q.u + 2 * q.d + 2 * q.w; x++) {
    const y0 = q.v + q.d + y;
    if (!alpha(png, x, y0)) continue;
    setze(png, x, y0, rausch(EIS, r, 8));
    const l = r() < 0.5 ? 1 + Math.floor(r() * laenge) : 0;
    for (let i = 1; i <= l; i++) if (alpha(png, x, y0 + i)) setze(png, x, y0 + i, i === l ? EIS_DUNKEL : EIS);
  }
}
export function kruste(png, rect, dichte = 0.5, saat = 5) {
  male(png, rect, (i, j, alt, r) => (r() < dichte ? rausch(EIS, r, 10) : null), { saat });
}
export function lametta(png, [x0, y0, w, h], { faeden = 3, saat = 6 } = {}) {
  const r = zufall(saat);
  for (let f = 0; f < faeden; f++) {
    let x = Math.floor(r() * w); const farbe = r() < 0.5 ? SILBER : GOLD;
    for (let y = y0; y < y0 + h; y++) {
      x += r() < 0.5 ? 1 : r() < 0.5 ? -1 : 0;
      const xx = x0 + ((x % w) + w) % w;
      if (alpha(png, xx, y)) setze(png, xx, y, (y + f) % 3 ? farbe : WEISS);
    }
  }
}
// Schneeflocke (5×5) an Stelle x, y.
export function flocke(png, x, y, farbe = WEISS) {
  for (const [dx, dy] of [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1], [-2, -2], [2, -2], [-2, 2], [2, 2], [-2, 0], [2, 0], [0, -2], [0, 2]]) if (alpha(png, x + dx, y + dy)) setze(png, x + dx, y + dy, Math.abs(dx) + Math.abs(dy) > 2 ? EIS_MITTEL : farbe);
}
// Kette (graue Glieder) als Schärpe schräg über ein Rechteck.
function kette(png, [x0, y0, w, h]) {
  for (let i = 0; i < Math.max(w, h); i++) {
    const x = x0 + Math.round(i * (w - 1) / Math.max(w, h)), y = y0 + Math.round(i * (h - 1) / Math.max(w, h));
    setze(png, x, y, i % 2 ? [92, 96, 104] : [190, 194, 200]); setze(png, x + 1, y, i % 2 ? [168, 172, 180] : [92, 96, 104]);
  }
}

const KOPF = quader(0, 0, 8, 8, 8), HUT = quader(32, 0, 8, 8, 8), RUMPF = quader(16, 16, 8, 12, 4);
const ARM = quader(40, 16, 4, 12, 4), BEIN = quader(0, 16, 4, 12, 4), ARM_L = quader(32, 48, 4, 12, 4), BEIN_L = quader(16, 48, 4, 12, 4);
const ILL_KOPF = quader(0, 0, 8, 10, 8), ILL_HUT = quader(32, 0, 8, 10, 8), ILL_RUMPF = quader(16, 20, 8, 12, 6), ILL_JACKE = quader(0, 38, 8, 20, 6);
const ILL_ARME = [quader(44, 22, 4, 8, 4), quader(40, 38, 8, 4, 4), quader(40, 46, 4, 12, 4)], ILL_BEIN = quader(0, 22, 4, 12, 4);

// Zerlumpter Wichtel: grüne Tunika mit rotem Kragen, Gürtel mit Goldschnalle, rot-weiß geringelte Strümpfe, Zipfelmütze.
function wichtel(p, { tunika = [44, 96, 46], rot = ROT, weiss = WEISS, loch = 0.12, saat = 100, beine = [BEIN], arme = [ARM] } = {}) {
  male(p, seiten(RUMPF), (i, j, alt, r) => {
    if (r() < loch) return null;
    if (j < 2) return rausch(j ? weiss : rot, r, 12); // Kragen mit Fellrand
    if (j === 8) return (i % 24) >= 9 && (i % 24) <= 10 && i >= 4 && i < 12 ? GOLD : [38, 28, 22]; // Gürtel, Schnalle vorne
    if (j >= 10) return (i + j) % 3 === 0 ? null : rausch(rot, r, 12); // gezackter roter Saum
    return rausch(tunika, r, 18);
  }, { saat });
  male(p, flaechen(RUMPF).oben, stoff(tunika, { loch }), { saat: saat + 1 });
  for (const a of arme) male(p, seiten(a), (i, j, alt, r) => (j < 6 && r() > loch ? rausch(j === 5 ? weiss : tunika, r, 16) : null), { saat: saat + 2 });
  for (const b of beine) male(p, seiten(b), (i, j, alt, r) => {
    if (j >= 10) return rausch([46, 30, 22], r, 10); // Schuhe
    if (r() < loch) return rausch([40, 26, 22], r, 10); // Löcher im Strumpf
    return rausch(Math.floor(j / 2) % 2 ? weiss : rot, r, 14);
  }, { saat: saat + 3 });
  muetze(p, HUT, { reihen: 3, zerfetzt: true, rot, saat: saat + 4 });
}

// Datei (relativ zu textures/entity) → Bemalung. Jungtiere haben eigene Modelle und bleiben unverändert.
export const MOBS = {
  'zombie/zombie': (p) => wichtel(p, { saat: 110 }),
  'zombie/husk': (p) => wichtel(p, { tunika: [120, 116, 70], rot: [156, 72, 52], weiss: [214, 198, 160], loch: 0.1, saat: 120 }),
  'zombie/drowned': (p) => {
    for (const q of [KOPF, RUMPF, ARM_L, BEIN_L, ARM, BEIN]) male(p, seiten(q), (i, j, alt, r) => (r() < 0.35 ? misch(alt.slice(0, 3), r() < 0.5 ? EIS : EIS_MITTEL, 0.75) : null), { saat: 130 + q.u });
    kruste(p, flaechen(KOPF).oben, 0.8, 131);
    for (const q of [ARM, ARM_L]) eiszapfen(p, q, 9, { laenge: 3, saat: 132 + q.u });
    ring(p, RUMPF, 0, 2, zerfetzterSchal, 133); schalEnde(p, RUMPF, 1, 7, { x: 5, rot: ROT_DRECKIG, zerfetzt: true, saat: 134 });
  },
  'zombie/drowned_outer_layer': (p) => {
    for (const q of [KOPF, RUMPF, ARM, BEIN, ARM_L, BEIN_L, HUT]) for (const rect of alles(q)) male(p, rect, (i, j, alt, r) => (r() < 0.45 ? misch(alt.slice(0, 3), r() < 0.3 ? WEISS : EIS, 0.8) : null), { saat: 135 + q.u + q.v });
  },
  'skeleton/skeleton': (p) => {
    for (const [q, s] of [[RUMPF, 0.8], [quader(40, 16, 2, 12, 2), 0.7], [quader(0, 16, 2, 12, 2), 0.7]]) male(p, seiten(q), eisplatten(s), { saat: 140 });
    male(p, flaechen(KOPF).oben, eisplatten(0.85), { saat: 141 });
    male(p, seiten(KOPF), (i, j, alt, r) => (j < 2 ? misch(alt.slice(0, 3), EIS, 0.8) : null)); // Eishelm-Rand, Gesicht bleibt
    eiszapfen(p, KOPF, 2, { laenge: 2, saat: 142 });
  },
  'skeleton/stray': (p) => {
    for (const q of [RUMPF, quader(40, 16, 2, 12, 2), quader(0, 16, 2, 12, 2)]) male(p, seiten(q), eisplatten(0.85), { saat: 150 });
    male(p, flaechen(KOPF).oben, eisplatten(0.9), { saat: 151 });
    eiszapfen(p, KOPF, 2, { laenge: 3, saat: 152 });
  },
  'skeleton/stray_overlay': (p) => {
    male(p, [0, 0, 64, 32], (i, j, alt, r) => misch(alt.slice(0, 3), r() < 0.15 ? WEISS : EIS_MITTEL, 0.55), { saat: 153 });
    ring(p, RUMPF, 0, 2, zerfetzterSchal, 154); schalEnde(p, RUMPF, 1, 7, { x: 5, rot: ROT_DRECKIG, zerfetzt: true, saat: 155 });
  },
  'creeper/creeper': (p) => {
    // Geschenk: grünes Papier mit Sternchen, rotes Band längs und quer, Schleife oben auf dem Kopf.
    for (const q of [KOPF, RUMPF, quader(0, 16, 4, 6, 4)]) male(p, seiten(q), (i, j, alt, r) => ((i * 7 + j * 3) % 11 === 0 ? (r() < 0.5 ? WEISS : GOLD) : null), { saat: 160 });
    const [vx, vy] = flaechen(RUMPF).vorne, [hx, hy] = flaechen(RUMPF).hinten;
    for (const x0 of [vx, hx]) male(p, [x0 + 3, vy, 2, 12], (i, j, alt, r) => rausch(j % 4 === 0 ? [214, 40, 50] : ROT, r, 10));
    ring(p, RUMPF, 5, 2, (x, i) => (i ? ROT : [214, 40, 50]), 161);
    const [ox, oy] = flaechen(KOPF).oben;
    male(p, [ox, oy, 8, 8], (i, j) => (i === 3 || i === 4 || j === 3 || j === 4 ? ROT : null));
    male(p, [ox + 1, oy + 1, 6, 6], (i, j) => ((i < 2 || i > 3) && (j < 2 || j > 3) && (i + j) % 2 === 0 ? GOLD : null));
    male(p, seiten(KOPF), (i, j) => ((i % 8 === 3 || i % 8 === 4) && j < 2 ? ROT : null)); // Band läuft über die Kopfkanten
  },
  'spider/spider': (p) => spinne(p, [34, 30, 40], 170),
  'spider/cave_spider': (p) => spinne(p, [20, 40, 52], 180),
  'enderman/enderman': (p) => {
    for (const [q, s] of [[KOPF, 190], [quader(32, 16, 8, 12, 4), 191], [quader(56, 0, 2, 30, 2), 192], [quader(0, 16, 8, 8, 8), 193]]) {
      for (const rect of alles(q)) frostmuster(p, rect, { wege: Math.ceil(rect[2] * rect[3] / 40), laenge: 12, saat: s + rect[0] });
    }
    kruste(p, flaechen(KOPF).oben, 0.4, 194);
  },
  'witch/witch': (p) => {
    // Frau Holle, aber böse: nachtblauer Kittel voller Federn und Reif, dunkler Hut mit Schnee, fahle Haut.
    const kittel = [48, 26, 66];
    for (const q of [ILL_JACKE, ILL_RUMPF, ...ILL_ARME, ILL_BEIN]) male(p, seiten(q), (i, j, alt, r) => (r() < 0.12 ? rausch(WEISS, r, 10) : r() < 0.1 ? EIS_MITTEL : rausch(kittel, r, 14)), { saat: 200 + q.v });
    for (const h of [quader(0, 64, 10, 2, 10), quader(0, 76, 7, 4, 7), quader(0, 87, 4, 4, 4), quader(0, 95, 1, 2, 1)]) male(p, [h.u, h.v, 2 * h.d + 2 * h.w, h.d + h.h], (i, j, alt, r) => rausch([18, 18, 30], r, 10), { saat: 210 + h.v });
    kruste(p, flaechen(quader(0, 64, 10, 2, 10)).oben, 0.7, 211); kruste(p, flaechen(quader(0, 76, 7, 4, 7)).oben, 0.6, 212);
    male(p, seiten(ILL_KOPF), (i, j, alt) => (j > 0 && hell(alt) > 0.35 ? misch(alt.slice(0, 3), [200, 214, 228], 0.35) : null));
    ring(p, ILL_JACKE, 17, 3, (x, i, r) => (r() < 0.25 ? null : i === 2 ? FELL_DRECKIG : WEISS), 213);
  },
  'illager/pillager': (p) => krampus(p, { saat: 220, umhang: [150, 24, 32], fell: [[86, 46, 30], [52, 30, 22], [70, 38, 26]] }),
  'illager/vindicator': (p) => krampus(p, { saat: 230, umhang: [36, 70, 60], fell: [[44, 44, 48], [20, 20, 24], [32, 32, 36]] }),
  'phantom/phantom': (p) => {
    for (const q of [quader(23, 12, 6, 2, 9), quader(16, 24, 13, 1, 9)]) {
      male(p, [q.u, q.v, 2 * q.d + 2 * q.w, q.d + q.h], (i, j, alt, r) => misch(alt.slice(0, 3), r() < 0.2 ? WEISS : EIS, 0.45 + 0.3 * (j / (q.d + q.h))), { saat: 240 + q.u });
      frostmuster(p, flaechen(q).oben, { wege: 3, laenge: 10, farbe: [70, 110, 170], saat: 241 + q.u });
      eiszapfen(p, q, q.h - 1, { laenge: 1, saat: 242 + q.u });
    }
    kruste(p, flaechen(quader(0, 8, 5, 3, 9)).oben, 0.5, 243);
  },
  'slime/slime': (p) => {
    const q = quader(0, 0, 8, 8, 8);
    for (const rect of alles(q)) male(p, rect, (i, j, alt, r) => ((i + j) % 4 === 0 ? [[60, 130, 50], alt[3]] : null)); // Geschenkpapier-Streifen
    geschenkband(p, q, 250);
  },
};

function spinne(p, koerper, saat) {
  const hinten = quader(0, 12, 10, 8, 12), hals = quader(0, 0, 6, 6, 6);
  for (const q of [hinten, hals]) for (const rect of alles(q)) male(p, rect, (i, j, alt) => misch(alt.slice(0, 3), koerper, 0.55));
  const [ox, oy] = flaechen(hinten).oben;
  for (const [x, y] of [[2, 3], [7, 3], [4, 7], [2, 10], [7, 9]]) flocke(p, ox + x, oy + y);
  const s = seiten(hinten);
  for (let k = 0; k < 6; k++) flocke(p, s[0] + 3 + k * 7, s[1] + 3 + (k % 2) * 2, EIS);
  lametta(p, flaechen(hinten).oben, { faeden: 3, saat });
  lametta(p, s, { faeden: 5, saat: saat + 1 });
}

// Krampus-Look: zottiges Fell (schwarzbraun) über Jacke, Armen und Beinen, Kette als Schärpe, roter bzw. dunkler Umhangrest.
function krampus(p, { saat, umhang, fell: toene }) {
  const fell = (i, j, alt, r) => rausch(r() < 0.3 ? toene[0] : r() < 0.5 ? toene[1] : toene[2], r, 8);
  for (const q of [ILL_JACKE, ILL_RUMPF, ...ILL_ARME, ILL_BEIN]) male(p, seiten(q), fell, { saat: saat + q.v });
  for (const q of [ILL_JACKE, ILL_RUMPF]) male(p, seiten(q), (i, j, alt, r) => (j < 2 ? rausch(umhang, r, 12) : null), { saat: saat + 1 });
  const [vx, vy] = flaechen(ILL_JACKE).vorne;
  kette(p, [vx, vy + 2, 8, 9]); kette(p, [flaechen(ILL_RUMPF).vorne[0], flaechen(ILL_RUMPF).vorne[1] + 1, 8, 8]);
  ring(p, ILL_JACKE, 18, 2, (x, i, r) => (r() < 0.4 ? null : [20, 14, 12]), saat + 2); // ausgefranste Zotteln
  male(p, flaechen(ILL_KOPF).oben, fell, { saat: saat + 3 });
  male(p, seiten(ILL_KOPF), (i, j, alt, r) => (j < 2 ? fell(i, j, alt, r) : null), { saat: saat + 4 });
}

// Geschenkband (Slime-Mimic): Kreuzband über alle Flächen, Schleife oben.
export function geschenkband(png, q, saat = 8) {
  const r = zufall(saat);
  const f = flaechen(q);
  const band = [150, 20, 30];
  for (const [x0, y0, w, h] of [f.vorne, f.hinten, f.rechts, f.links]) {
    const m = x0 + Math.floor(w / 2) - 1;
    for (let y = y0; y < y0 + h; y++) { setze(png, m - 1, y, GOLD_DUNKEL, 230); for (const x of [m, m + 1]) setze(png, x, y, rausch(band, r, 10), 235); setze(png, m + 2, y, GOLD_DUNKEL, 230); }
  }
  const [ox, oy, ow, oh] = f.oben;
  for (let i = 0; i < ow; i++) for (const d of [Math.floor(oh / 2) - 1, Math.floor(oh / 2)]) {
    setze(png, ox + i, oy + d, rausch(band, r, 10), 235); setze(png, ox + d, oy + i, rausch(band, r, 10), 235);
  }
}

const SCHAF_KOPF = quader(0, 0, 6, 6, 8), HUHN_KOPF = quader(0, 0, 4, 6, 3), WOLF_KOPF = quader(0, 0, 6, 6, 4);
const KATZE_KOPF = quader(0, 0, 5, 4, 5), FUCHS_KOPF = quader(1, 5, 8, 6, 6), PFERD_HALS = quader(0, 35, 4, 12, 7), LAMA_HALS = quader(0, 14, 8, 18, 6);
const tierMuetze = (q, reihen, saat) => (p) => muetze(p, q, { reihen, saat });
const tierSchal = (q, y, saat) => (p) => ring(p, q, y, 2, schalFarbe(), saat);

export const TIERE = {
  'sheep/sheep': tierMuetze(SCHAF_KOPF, 1, 41),
  'sheep/sheep_wool': tierMuetze(quader(0, 0, 6, 6, 6), 1, 42),
  ...Object.fromEntries(['cold', 'temperate', 'warm'].map((v, i) => [`chicken/chicken_${v}`, tierMuetze(HUHN_KOPF, 1, 43 + i)])),
  ...Object.fromEntries(['black', 'brown', 'chestnut', 'creamy', 'darkbrown', 'gray', 'white'].map((v, i) => [`horse/horse_${v}`, tierSchal(PFERD_HALS, 9, 50 + i)])),
  'horse/donkey': tierSchal(PFERD_HALS, 9, 57),
  'horse/mule': tierSchal(PFERD_HALS, 9, 58),
  ...Object.fromEntries(['', '_ashen', '_black', '_chestnut', '_rusty', '_snowy', '_spotted', '_striped', '_woods'].flatMap((v, i) =>
    ['', '_tame', '_angry'].map((z, j) => [`wolf/wolf${v}${z}`, tierMuetze(WOLF_KOPF, 1, 60 + i * 3 + j)]))),
  ...Object.fromEntries(['all_black', 'black', 'british_shorthair', 'calico', 'jellie', 'persian', 'ragdoll', 'red', 'siamese', 'tabby', 'white'].map((v, i) => [`cat/cat_${v}`, tierMuetze(KATZE_KOPF, 1, 90 + i)])),
  ...Object.fromEntries(['fox', 'fox_sleep', 'fox_snow', 'fox_snow_sleep'].map((v, i) => [`fox/${v}`, tierMuetze(FUCHS_KOPF, 1, 101 + i)])),
  ...Object.fromEntries(['brown', 'creamy', 'gray', 'white'].map((v, i) => [`llama/llama_${v}`, tierSchal(LAMA_HALS, 12, 105 + i)])),
};

// ── Ebene 2: 3D-Zusätze für Entity Model Features (nur Modpack) ─────────────────────────────────────
// OptiFine-CEM (.jem) mit attach: true – die Quader hängen an Vanilla-Teilen, alles andere bleibt Vanilla.
// Quader im Minecraft-Modellraum relativ zum Teil-Pivot (y nach unten, vorne = −z), umgerechnet in JEM-Koordinaten
// (y nach oben, Boden = 0, x gespiegelt). Farben aus einer kleinen Palette; „leuchtend“ kommt zusätzlich in die _e-Palette (ETF).
export const EMF_FARBEN = {
  rot: [196, 30, 42], weiss: [240, 242, 246], gruen: [60, 110, 50], gold: [232, 182, 46], eis: [200, 232, 248], eis_dunkel: [130, 184, 222],
  dunkel: [32, 28, 40], horn: [58, 52, 50], hornspitze: [20, 18, 18], glut: [255, 200, 60], sandrot: [156, 72, 52], sandweiss: [214, 198, 160],
  braun: [110, 76, 44], nase: [255, 36, 36],
};
export const EMF_LEUCHTEND = ['glut', 'eis', 'nase'];
const zipfel = (rot, weiss) => [[[-4.6, -9, -4.6], [9.2, 1.6, 9.2], weiss], [[-4, -11, -3.6], [8, 2, 8], rot], [[-3, -13, -2.2], [6, 2, 6], rot],
  [[-2, -15, -0.6], [4, 2, 4], rot], [[-1.2, -16.5, 1.2], [2.4, 1.5, 2.4], rot], [[-1.6, -19, 2], [3.2, 2.8, 3.2], weiss]];
const hoerner = [-1, 1].flatMap((s) => [[[s * 4.5 - 1, -11, -1], [2, 2, 2], 'horn'], [[s * 6 - 0.75, -13, -0.6], [1.5, 2.2, 1.5], 'horn'],
  [[s * 7 - 0.5, -15, 0], [1, 2.2, 1], 'horn'], [[s * 6.6 - 0.4, -16.4, 0.6], [0.8, 1.4, 0.8], 'hornspitze']]);
const geweih = [-1, 1].flatMap((s) => [[[s * 2.5 - 0.5, -12, -0.5], [1, 4, 1], 'dunkel'], [[s > 0 ? 2.5 : -6, -12, -0.5], [3.5, 1, 1], 'dunkel'],
  [[s * 6 - 0.5, -15.5, -0.5], [1, 3.5, 1], 'dunkel'], [[s * 4 - 0.5, -14.5, -0.5], [1, 2.5, 1], 'dunkel'],
  [[s * 6 - 0.5, -16.5, -0.5], [1, 1, 1], 'eis'], [[s * 2.5 - 0.5, -13, -0.5], [1, 1, 1], 'eis']]);
const eiskrone = [[-3.5, -3.5], [-1, -3.8], [1.5, -3.5], [2.5, 0], [-3.5, 0]].map(([x, z], i) => [[x, -10.5, z], [1, 2.5, 1], i % 2 ? 'eis' : 'eis_dunkel']);
const schulterEis = [[[-6, -1, -1.5], [3, 2, 3], 'eis'], [[-5.5, -3.5, -0.5], [1, 2.5, 1], 'eis_dunkel'], [[3, -1, -1.5], [3, 2, 3], 'eis'], [[4.5, -3.5, -0.5], [1, 2.5, 1], 'eis_dunkel']];
const kristalle = [[-3, -2], [1.5, -3], [-1, 1], [2.5, 2], [-3.5, 3.5]].map(([x, z], i) => [[x, -6, z], [1.5, 2.5, 1.5], i % 2 ? 'eis' : 'eis_dunkel']);
const schleife = (y) => [[[-1, y, -1], [2, 1.5, 2], 'gold'], [[-4.5, y - 1, -1], [3.5, 2.5, 2], 'rot'], [[1, y - 1, -1], [3.5, 2.5, 2], 'rot']];

// Modell (Dateiname der .jem) → Teil → { pivot (Minecraft-Modellraum), quader: [von, maße, farbe] }
export const EMF = {
  zombie: { head: { pivot: [0, 0, 0], quader: [...zipfel('rot', 'weiss'), [[-5, -6, -0.5], [1, 3, 1], 'gruen'], [[4, -6, -0.5], [1, 3, 1], 'gruen']] } },
  husk: { head: { pivot: [0, 0, 0], quader: zipfel('sandrot', 'sandweiss') } },
  drowned: { head: { pivot: [0, 0, 0], quader: [-3.5, -1.5, 0.5, 2.5].map((x, i) => [[x, 0, -4.4], [0.8, 2.5 - (i % 2), 0.8], i % 2 ? 'eis' : 'eis_dunkel']) } },
  skeleton: { head: { pivot: [0, 0, 0], quader: eiskrone }, body: { pivot: [0, 0, 0], quader: schulterEis } },
  stray: { head: { pivot: [0, 0, 0], quader: eiskrone }, body: { pivot: [0, 0, 0], quader: schulterEis } },
  creeper: { head: { pivot: [0, 6, 0], quader: [...schleife(-9.5), [[2.2, -12.5, 2.2], [0.7, 4.5, 0.7], 'dunkel'], [[2, -13.6, 2], [1.1, 1.1, 1.1], 'glut']] } },
  spider: { body: { pivot: [0, 15, 9], quader: kristalle } },
  cave_spider: { body: { pivot: [0, 15, 9], quader: kristalle } },
  enderman: { head: { pivot: [0, -14, 0], quader: geweih } },
  witch: { head: { pivot: [0, 0, 0], quader: [...[[-4.8, -4.8], [-2, -5.2], [1.5, -5.2], [4.4, -4.6], [4.6, 0], [-5.2, 1]].map(([x, z]) => [[x, -8.2, z], [0.7, 2.2, 0.7], 'eis']), [[-1.5, -18.5, -1], [4, 0.8, 4], 'weiss']] } },
  pillager: { head: { pivot: [0, 0, 0], quader: hoerner } },
  vindicator: { head: { pivot: [0, 0, 0], quader: hoerner } },
  phantom: { body: { pivot: [0, 0, 0], quader: [[-2, -6], [0, -3], [-1.5, 0]].map(([x, z], i) => [[x, 1, z], [0.8, 2.5 - (i % 2), 0.8], i % 2 ? 'eis' : 'eis_dunkel']) } },
  slime_outer: { body: { pivot: [0, 0, 0], quader: [...schleife(14.5), [[-2.2, 15.5, -4.4], [1, 3, 0.4], 'rot'], [[1.2, 15.5, -4.4], [1, 3, 0.4], 'rot']] } },
};

const PALETTE = Object.keys(EMF_FARBEN);
export const EMF_TEXTUR = 'textures/entity/weihnachten/emf_palette.png';
export function emfPalette(nurLeuchtend = false, PNG) {
  const png = new PNG({ width: 16, height: 16 });
  png.data.fill(0);
  PALETTE.forEach((n, i) => { if (!nurLeuchtend || EMF_LEUCHTEND.includes(n)) png.data.set([...EMF_FARBEN[n], 255], i * 4); });
  return png;
}
export function jem(teile) {
  const r = (v) => Math.round(v * 1000) / 1000;
  return {
    credit: 'Weihnachtsprojekt 2026 – eigene Zusätze (tools/mobs.mjs)',
    models: Object.entries(teile).map(([teil, { pivot: [px, py, pz], quader }]) => ({
      // invertAxis „xy“ ist Pflicht: EMF spiegelt y (und x) nur mit dieser Angabe zurück in den Modellraum
      // (EMFPartData/EMFBoxData.prepare) – ohne sie hingen alle Mützen gespiegelt unter dem Kinn (Mob-Zoo 28.10.).
      part: teil, id: `weihnachten_${teil}`, attach: true, invertAxis: 'xy', texture: EMF_TEXTUR, textureSize: [16, 16],
      translate: [0, r(-(24 - py)), r(-pz)].map((v, i) => (i === 0 ? r(px) : v)),
      boxes: quader.map(([[x, y, z], [w, h, d], farbe]) => {
        const i = PALETTE.indexOf(farbe); if (i < 0) throw new Error(`EMF-Farbe ${farbe}`);
        const uv = [i % 16, Math.floor(i / 16), i % 16 + 1, Math.floor(i / 16) + 1];
        return {
          coordinates: [r(-(px + x + w)), r(24 - (py + y + h)), r(pz + z), w, h, d],
          uvNorth: uv, uvEast: uv, uvSouth: uv, uvWest: uv, uvUp: uv, uvDown: uv,
        };
      }),
    })),
  };
}

// ETF-Zufallsvarianten (optifine/random/entity/…<n>.png): zweite Fassung für Abwechslung.
export const VARIANTEN = {
  'zombie/zombie2': ['zombie/zombie', (p) => wichtel(p, { tunika: [150, 30, 36], rot: [40, 110, 50], saat: 115 })],
  'creeper/creeper2': ['creeper/creeper', (p) => { MOBS['creeper/creeper'](p); male(p, seiten(RUMPF), (i, j, alt) => (alt[0] > 150 && alt[1] < 80 ? GOLD : null)); male(p, flaechen(KOPF).oben, (i, j, alt) => (alt[0] > 150 && alt[1] < 80 ? GOLD : null)); }],
};
