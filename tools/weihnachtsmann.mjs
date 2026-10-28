// Eigener Weihnachtsmann-Skin (64×64, Spielerformat) für den Händler auf der Weihnachtsinsel, ganzjährig im Basis-Pack.
// Alles von Hand beschrieben: Gesicht mit Bart, rote Jacke mit Pelzbesatz, Gürtel mit Goldschnalle, Stiefel, Mütze mit Bommel.
import pngjs from 'pngjs';
import { zufall } from './winter.mjs';
import { quader, flaechen, seiten, male, rausch, setze } from './mobs.mjs';

const { PNG } = pngjs;
const ROT = [178, 26, 34], ROT_SCHATTEN = [138, 18, 26], PELZ = [244, 244, 240], PELZ_SCHATTEN = [214, 216, 214];
const HAUT = [232, 178, 148], WANGE = [222, 132, 120], AUGE = [46, 52, 74], BART = [250, 250, 248], BART_SCHATTEN = [222, 224, 226];
const GUERTEL = [32, 26, 24], GOLD = [236, 196, 64], STIEFEL = [36, 28, 26], HANDSCHUH = [40, 34, 32];

const Q = {
  kopf: quader(0, 0, 8, 8, 8), hut: quader(32, 0, 8, 8, 8), rumpf: quader(16, 16, 8, 12, 4), jacke: quader(16, 32, 8, 12, 4),
  armR: quader(40, 16, 4, 12, 4), aermelR: quader(40, 32, 4, 12, 4), armL: quader(32, 48, 4, 12, 4), aermelL: quader(48, 48, 4, 12, 4),
  beinR: quader(0, 16, 4, 12, 4), hoseR: quader(0, 32, 4, 12, 4), beinL: quader(16, 48, 4, 12, 4), hoseL: quader(0, 48, 4, 12, 4),
};
const alle = (q) => [seiten(q), flaechen(q).oben, flaechen(q).unten];

export function weihnachtsmannSkin() {
  const p = new PNG({ width: 64, height: 64 });
  p.data.fill(0);
  const r = zufall(500);
  const fuelle = (q, fn) => alle(q).forEach(([x0, y0, w, h], k) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const c = fn(i, j, k); if (c) setze(p, x0 + i, y0 + j, c); } }); // k: 0 Seiten, 1 oben, 2 unten
  // Kopf: Haut, Haare/Bart weiß, Gesicht vorne
  fuelle(Q.kopf, (i, j, k) => (k || j < 2 ? rausch(PELZ, r, 6) : rausch(BART_SCHATTEN, r, 8)));
  const [vx, vy] = flaechen(Q.kopf).vorne;
  const gesicht = [
    'HHHHHHHH', 'HHHHHHHH', 'HAAHHAAH', 'HHHWWHHH', 'BHWBBWHB', 'BBBMMBBB', 'BBBBBBBB', 'SBBBBBBS'];
  const farbe = { H: HAUT, A: AUGE, W: WANGE, B: BART, M: [150, 60, 60], S: BART_SCHATTEN };
  gesicht.forEach((zeile, j) => [...zeile].forEach((c, i) => setze(p, vx + i, vy + j, c === 'H' && j < 2 ? PELZ_SCHATTEN : farbe[c])));
  // Augenbrauen weiß
  for (const i of [1, 2, 5, 6]) setze(p, vx + i, vy + 1, PELZ);
  // Mütze in der Hut-Ebene: oben rot, Pelzrand unten, Bommel hinten
  fuelle(Q.hut, (i, j, k) => (k === 1 ? rausch(ROT, r, 10) : k === 2 ? null : j < 2 ? rausch(ROT, r, 10) : j === 2 ? rausch(PELZ, r, 6) : null));
  const [hx, hy] = flaechen(Q.hut).hinten;
  for (const [dx, dy] of [[3, 3], [4, 3], [3, 4], [4, 4]]) setze(p, hx + dx, hy + dy, PELZ);
  // Rumpf und Jacke: rot, Pelzleiste vorne mittig, Gürtel mit Schnalle, Saum unten
  const jacke = (q, aussen) => fuelle(q, (i, j, k) => {
    if (k) return aussen ? null : rausch(ROT, r, 8);
    if (j === 7 || j === 8) return i >= 7 && i <= 8 ? GOLD : GUERTEL; // vorne liegt bei i 4..11
    if (j >= 10) return rausch(PELZ, r, 6);
    if (i >= 7 && i <= 8) return rausch(PELZ, r, 6);
    return aussen ? null : rausch(j % 4 === 3 ? ROT_SCHATTEN : ROT, r, 8);
  });
  jacke(Q.rumpf, false); jacke(Q.jacke, true);
  // Arme: rot mit Pelzmanschette, schwarze Handschuhe
  for (const q of [Q.armR, Q.armL]) fuelle(q, (i, j, k) => (k === 1 ? rausch(ROT, r, 8) : k === 2 ? HANDSCHUH : j >= 10 ? HANDSCHUH : j >= 8 ? rausch(PELZ, r, 6) : rausch(ROT, r, 8)));
  // Beine: rote Hose, schwarze Stiefel mit Pelzkrempe
  for (const q of [Q.beinR, Q.beinL]) fuelle(q, (i, j, k) => (k === 1 ? rausch(ROT_SCHATTEN, r, 8) : k === 2 ? STIEFEL : j >= 9 ? STIEFEL : j === 8 ? PELZ : rausch(ROT_SCHATTEN, r, 8)));
  return p;
}

if (process.argv[1] && process.argv[1].endsWith('weihnachtsmann.mjs')) {
  const { writeFileSync } = await import('node:fs');
  writeFileSync(process.argv[2], PNG.sync.write(weihnachtsmannSkin()));
}
