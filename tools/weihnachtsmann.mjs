// Eigener Weihnachtsmann-Skin (64×64, Spielerformat) für den Händler auf der Weihnachtsinsel, ganzjährig im Basis-Pack.
// Überarbeitet nach dem Mob-Zoo (28.10.): Stoff in drei Tonstufen mit Licht von vorne links und Falten, Fell mit Struktur,
// Gesicht mit Lichtpunkt in den Augen, Bart und Schnurrbart mit Volumen auf der Overlay-Ebene, Mütze, die nach hinten
// fällt, mit Bommel. Alles von Hand beschrieben, keine fremden Vorlagen.
import pngjs from 'pngjs';
import { zufall } from './winter.mjs';
import { quader, flaechen, rausch, setze } from './mobs.mjs';

const { PNG } = pngjs;
const ROT = { hell: [204, 42, 46], mittel: [176, 24, 32], dunkel: [128, 14, 24], tief: [92, 10, 18] };
const FELL = { hell: [252, 252, 250], mittel: [234, 236, 236], dunkel: [204, 208, 214], tief: [170, 176, 188] };
const HAUT = { hell: [244, 196, 166], mittel: [228, 172, 142], dunkel: [204, 142, 116] };
const WANGE = [226, 120, 112], NASE = [222, 140, 120], AUGE = [40, 44, 66], LICHT = [255, 255, 255], MUND = [140, 52, 56];
const LEDER = { hell: [70, 56, 50], mittel: [40, 32, 30], dunkel: [22, 18, 18] };
const GOLD = { hell: [255, 226, 120], mittel: [228, 182, 54], dunkel: [160, 112, 26] };

const Q = {
  kopf: quader(0, 0, 8, 8, 8), hut: quader(32, 0, 8, 8, 8), rumpf: quader(16, 16, 8, 12, 4), jacke: quader(16, 32, 8, 12, 4),
  armR: quader(40, 16, 4, 12, 4), aermelR: quader(40, 32, 4, 12, 4), armL: quader(32, 48, 4, 12, 4), aermelL: quader(48, 48, 4, 12, 4),
  beinR: quader(0, 16, 4, 12, 4), hoseR: quader(0, 32, 4, 12, 4), beinL: quader(16, 48, 4, 12, 4), hoseL: quader(0, 48, 4, 12, 4),
};
// Licht von vorne links oben: Seiten bekommen eine Tonverschiebung (−1 dunkler … +1 heller).
const LICHT_SEITE = { oben: 1, vorne: 0, links: 0, rechts: -1, hinten: -1, unten: -2 };
const ton = (palette, stufe) => palette[['tief', 'dunkel', 'mittel', 'hell'][Math.max(0, Math.min(3, stufe))]] ?? palette.dunkel;

export function weihnachtsmannSkin() {
  const p = new PNG({ width: 64, height: 64 });
  p.data.fill(0);
  const r = zufall(500);
  // fn(i, j, w, h, seite) → Farbe oder null; seite ∈ oben/unten/vorne/hinten/links/rechts
  const male = (q, fn, nur) => Object.entries(flaechen(q)).forEach(([seite, [x0, y0, w, h]]) => {
    if (nur && !nur.includes(seite)) return;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const c = fn(i, j, w, h, seite); if (c) setze(p, x0 + i, y0 + j, c); }
  });
  // Stoffe: Grundstufe 2 (mittel), Licht je Seite, Falten als dunklere Spalten, leichtes Rauschen.
  const stoff = (pal, { falten = [], grund = 2 } = {}) => (i, j, w, h, seite) => {
    let s = grund + LICHT_SEITE[seite];
    if (seite !== 'oben' && seite !== 'unten') { if (falten.includes(i)) s -= 1; if (j === h - 1) s -= 1; }
    return rausch(ton(pal, s), r, 5);
  };
  // Fell: Büschel-Struktur aus drei Tönen, unterste Reihe im Schatten.
  const fell = (i, j, w, h, seite) => {
    const s = LICHT_SEITE[seite] < 0 ? 1 : 2;
    if (j === h - 1 && h > 1) return rausch(ton(FELL, s - 1), r, 3);
    return rausch(ton(FELL, (i + 2 * j) % 5 === 0 ? s + 1 : (i * 3 + j) % 7 === 0 ? s - 1 : s), r, 3);
  };

  // ── Kopf (Grundebene): Gesicht, Haare/Bart an Seiten und Hinterkopf ──
  const GESICHT = [
    'WWWWWWWW',
    'WWWWWWWW',
    'wWWwwWWw',
    'HLAHHALH',
    'RHHNNHHR',
    'BMMnnMMB',
    'BmMOOMmB',
    'bBBBBBBb',
  ];
  const farbe = { W: FELL.hell, w: FELL.dunkel, H: HAUT.mittel, h: HAUT.dunkel, A: AUGE, L: LICHT, R: WANGE, N: NASE, n: HAUT.dunkel,
    M: FELL.hell, m: FELL.dunkel, O: MUND, B: FELL.mittel, b: FELL.dunkel };
  male(Q.kopf, (i, j, w, h, seite) => {
    if (seite === 'vorne') return farbe[GESICHT[j][i]];
    if (seite === 'oben') return fell(i, j, w, h, 'oben');
    if (seite === 'unten') return ton(FELL, 1);
    // Seiten: Haar hinten, vorne (Richtung Gesicht) Bart ab Reihe 4, Ohr an den Seiten
    if ((seite === 'rechts' || seite === 'links') && j === 4 && (seite === 'rechts' ? i === 5 : i === 2)) return HAUT.dunkel;
    return fell(i, j, w, h, seite);
  });

  // ── Hut-Ebene: Mütze (fällt nach hinten), Pelzkrempe, Bommel; Bart und Schnurrbart mit Volumen ──
  const KREMPE = 2;
  male(Q.hut, (i, j, w, h, seite) => {
    if (seite === 'unten') return null;
    if (seite === 'oben') return rausch(ton(ROT, j < 3 ? 3 : 2), r, 4); // vorne im Licht, nach hinten satter
    if (seite === 'hinten') { // Zipfel fällt hinten über die Krempe, verjüngt sich, Bommel unten
      const bx = i - 3.5, by = j - 6;
      const d = bx * bx + by * by;
      if (d <= 1.3) return ton(FELL, bx < 0 && by < 0 ? 3 : 2);
      if (d <= 3.3) return ton(FELL, by > 0 ? 0 : 1); // Bommel mit Schattenrand, hebt sich vom Haar ab
      if (j < KREMPE) return rausch(ton(ROT, 1), r, 4);
      if (j === 3 && i >= 1 && i <= 6) return rausch(ton(ROT, i === 1 || i === 6 ? 0 : 1), r, 4);
      if (j === 4 && i >= 2 && i <= 5) return rausch(ton(ROT, 0), r, 4);
      if (j === KREMPE) return fell(i, 0, w, 2, 'hinten');
      return null;
    }
    if (j < KREMPE) return rausch(ton(ROT, 2 + LICHT_SEITE[seite] - (j === 0 ? 0 : 1) + (seite === 'vorne' && (i === 2 || i === 5) ? -1 : 0)), r, 5);
    if (j === KREMPE) return fell(i, j, w, h, seite);
    if (seite === 'vorne') { // Schnurrbart und Bart als Volumen, Mund und Augen bleiben frei
      if (j === 5) return i === 0 || i === 7 ? fell(i, j, w, h, seite) : (i >= 1 && i <= 2) || (i >= 5 && i <= 6) ? ton(FELL, i === 1 || i === 6 ? 3 : 2) : null;
      if (j === 6) return i <= 1 || i >= 6 ? fell(i, j, w, h, seite) : null;
      if (j === 7) return fell(i, j, w, h, seite);
      return null;
    }
    if ((seite === 'rechts' && i >= 4) || (seite === 'links' && i <= 3)) return j >= 5 ? fell(i, j, w, h, seite) : null; // Bart an den Wangen
    return null;
  });

  // ── Rumpf: Mantel, Pelzleiste vorne, Gürtel mit Schnalle, Pelzsaum ──
  const GUERTEL = [7, 8];
  const mantel = (aussen) => (i, j, w, h, seite) => {
    if (seite === 'oben') return aussen ? null : rausch(ton(ROT, 3), r, 5);
    if (seite === 'unten') return aussen ? null : ton(ROT, 0);
    const vorne = seite === 'vorne';
    if (GUERTEL.includes(j)) {
      if (vorne && i >= 2 && i <= 5) { // Schnalle 4×2 mit dunklem Innenfeld
        const rand = i === 2 || i === 5 || j === 7 ? 'mittel' : 'dunkel';
        return (i === 3 || i === 4) && j === 8 ? LEDER.dunkel : i === 2 && j === 7 ? GOLD.hell : GOLD[rand];
      }
      return j === 7 ? LEDER.hell : LEDER.mittel;
    }
    if (j >= 10) return fell(i, j - 10, w, 2, seite); // Saum
    if (vorne && (i === 3 || i === 4)) return fell(i, j, w, 12, seite); // Pelzleiste
    if (aussen) return null;
    return stoff(ROT, { falten: vorne ? [1, 6] : seite === 'hinten' ? [3] : [] })(i, j, w, h, seite);
  };
  male(Q.rumpf, mantel(false));
  male(Q.jacke, mantel(true)); // Overlay: Pelz und Gürtel stehen plastisch vor

  // ── Arme: Ärmel rot, Pelzmanschette, Handschuhe ──
  const arm = (aussen) => (i, j, w, h, seite) => {
    if (seite === 'unten') return aussen ? null : LEDER.mittel;
    if (seite === 'oben') return aussen ? null : rausch(ton(ROT, 3), r, 5);
    if (j >= 10) return aussen ? null : (j === 10 && i === 1 ? LEDER.hell : ton(LEDER, j === 11 ? 1 : 2));
    if (j >= 8) return fell(i, j - 8, w, 2, seite);
    return aussen ? null : stoff(ROT, { falten: j % 4 === 3 ? [0, 1, 2, 3] : [] })(i, j, w, h, seite);
  };
  male(Q.armR, arm(false)); male(Q.armL, arm(false));
  male(Q.aermelR, arm(true)); male(Q.aermelL, arm(true));

  // ── Beine: Hose dunkelrot, Stiefel mit Fellkrempe und Glanzlicht ──
  const bein = (aussen) => (i, j, w, h, seite) => {
    if (seite === 'unten') return aussen ? null : LEDER.dunkel;
    if (seite === 'oben') return aussen ? null : ton(ROT, 1);
    if (j >= 9 || (j === 8 && seite === 'vorne')) {
      if (aussen) return j === 9 ? fell(i, 0, w, 1, seite) : null;
      if (j === 11) return LEDER.dunkel;
      return seite === 'vorne' && i === 1 && j === 10 ? LEDER.hell : LEDER.mittel;
    }
    if (aussen) return null;
    return stoff(ROT, { grund: 1, falten: [seite === 'vorne' ? 2 : 1] })(i, j, w, h, seite);
  };
  male(Q.beinR, bein(false)); male(Q.beinL, bein(false));
  male(Q.hoseR, bein(true)); male(Q.hoseL, bein(true));
  return p;
}

if (process.argv[1] && process.argv[1].endsWith('weihnachtsmann.mjs')) {
  const { writeFileSync } = await import('node:fs');
  writeFileSync(process.argv[2], PNG.sync.write(weihnachtsmannSkin()));
}
