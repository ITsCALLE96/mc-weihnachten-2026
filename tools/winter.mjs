// Winter-Look für rp-v5: Frost auf Gras und Laub, blasse Farbkarten, Dorfbewohner mit Mütze und Schal,
// Kühe und Schweine mit Schal. Alles per Regel auf Vanilla-Texturen, keine fremden Bilder.
// Abschaltbar: texturen.mjs schreibt diese Dateien nur, wenn WINTER nicht auf 0 steht.
import pngjs from 'pngjs';

const { PNG } = pngjs;

const ROT = [186, 28, 38];
const ROT_DUNKEL = [140, 18, 28];
const WEISS = [242, 244, 246];
const FELL = [214, 220, 226];

// Fester Zufall, damit jeder Build dieselben Pixel liefert.
export function zufall(saat) {
  let s = saat >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}

function setze(png, x, y, [r, g, b], a = 255) {
  const i = (y * png.width + x) * 4;
  png.data[i] = r; png.data[i + 1] = g; png.data[i + 2] = b; png.data[i + 3] = a;
}

// Reif auf der Blockoberseite: lose Eiskristalle, ungefärbt über der getönten Grasfläche.
export function frostOben(dichte = 0.3, saat = 7) {
  const png = new PNG({ width: 16, height: 16 });
  png.data.fill(0);
  const r = zufall(saat);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const z = r();
    if (z < dichte) setze(png, x, y, z < dichte / 3 ? WEISS : FELL, z < dichte / 2 ? 255 : 200);
  }
  return png;
}

// Reifkante oben an den Seiten: zwei volle Reihen, darunter ausfransend.
export function frostSeite(saat = 11) {
  const png = new PNG({ width: 16, height: 16 });
  png.data.fill(0);
  const r = zufall(saat);
  for (let x = 0; x < 16; x++) {
    const tiefe = 1 + Math.floor(r() * 3);
    for (let y = 0; y < tiefe; y++) setze(png, x, y, y === 0 ? WEISS : FELL, y && y === tiefe - 1 ? 200 : 255);
  }
  return png;
}

// Farbkarte winterlich: halb entsättigt, Richtung kaltes Hellgrau gezogen.
export function winterFarbkarte(daten, anteil = 0.5) {
  const ziel = [214, 226, 228];
  for (let i = 0; i < daten.length; i += 4) {
    const grau = (daten[i] + daten[i + 1] + daten[i + 2]) / 3;
    for (let k = 0; k < 3; k++) {
      const entsaettigt = daten[i + k] + (grau - daten[i + k]) * 0.4;
      daten[i + k] = Math.round(entsaettigt + (ziel[k] - entsaettigt) * anteil);
    }
  }
}

// Dorfbewohner (64×64): Hut-Ebene ab x=32, Kopf 8×10×8. Mütze = Oberseite rot mit Bommel,
// an allen vier Seiten zwei Reihen Rot und eine Reihe Fell. Darunter bleibt alles (Brillen, Kapuzen).
export function weihnachtsmuetze(png) {
  for (let x = 40; x < 48; x++) for (let y = 0; y < 8; y++) setze(png, x, y, (x + y) % 5 === 0 ? ROT_DUNKEL : ROT);
  for (const [x, y] of [[43, 3], [44, 3], [43, 4], [44, 4]]) setze(png, x, y, WEISS);
  for (let x = 32; x < 64; x++) {
    setze(png, x, 8, ROT);
    setze(png, x, 9, x % 3 === 0 ? ROT_DUNKEL : ROT);
    setze(png, x, 10, x % 2 ? WEISS : FELL);
  }
  // Hutkrempe (Bauer, Fischer, Schäfer) weg, sonst steht ein Strohhut unter der Mütze.
  for (let y = 47; y < 64; y++) for (let x = 30; x < 64; x++) setze(png, x, y, [0, 0, 0], 0);
}

// Schal: oberste zwei Reihen des Mantels (x 0–27, y 44–45) und des Körpers (x 16–43, y 26–27), rot-weiß geringelt.
export function weihnachtsschal(png) {
  for (const [x0, x1, y0] of [[0, 28, 44], [16, 44, 26]]) {
    for (let x = x0; x < x1; x++) {
      setze(png, x, y0, ROT);
      setze(png, x, y0 + 1, Math.floor(x / 2) % 2 ? WEISS : ROT);
    }
  }
}

// Tierschal am Halsende des liegenden Körperquaders: erste zwei Reihen der vier Seitenflächen.
// Kuh: Körper ab (18,4), 12×18×10 → Seiten y 14, x 18–61. Schwein: ab (28,8), 10×16×8 → y 16, x 28–63.
export const TIER_SCHAL = { kuh: { y: 14, x0: 18, x1: 62 }, schwein: { y: 16, x0: 28, x1: 64 } };
export function tierschal(png, { y, x0, x1 }) {
  for (let x = x0; x < x1; x++) {
    setze(png, x, y, ROT);
    setze(png, x, y + 1, Math.floor(x / 2) % 2 ? WEISS : ROT);
  }
}
