// Erzeugt server-icon.png (64×64, Pflichtgröße für Minecraft): Tannenbaum mit Stern, Schnee, Nachthimmel.
// Platzhalter, bis der Servername feststeht. Aufruf aus dem Repo-Wurzelordner: node server/icon/erzeuge-icon.js
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const N = 64;
const png = new PNG({ width: N, height: N });
const set = (x, y, [r, g, b]) => {
  if (x < 0 || y < 0 || x >= N || y >= N) return;
  const i = (y * N + x) * 4;
  png.data[i] = r; png.data[i + 1] = g; png.data[i + 2] = b; png.data[i + 3] = 255;
};

// Nachthimmel: Verlauf dunkelblau → blau
for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
  const t = y / (N - 1);
  set(x, y, [Math.round(10 + 20 * t), Math.round(18 + 40 * t), Math.round(48 + 70 * t)]);
}

// Schneeboden mit leichter Welle
for (let x = 0; x < N; x++) {
  const top = 54 + Math.round(Math.sin(x / 6) * 1.5);
  for (let y = top; y < N; y++) set(x, y, y === top ? [255, 255, 255] : [222, 236, 248]);
}

// Stamm
for (let y = 50; y < 56; y++) for (let x = 29; x < 35; x++) set(x, y, (x === 29 ? [92, 52, 24] : [122, 72, 34]));

// Baum: drei Stufen, rechte Hälfte etwas dunkler (Licht von links)
const stufen = [[12, 26, 12], [22, 38, 18], [32, 50, 24]]; // [oben, unten, halbe Breite unten]
for (const [y0, y1, hb] of stufen) for (let y = y0; y < y1; y++) {
  const w = Math.round(((y - y0 + 1) / (y1 - y0)) * hb);
  for (let x = 32 - w; x < 32 + w; x++) set(x, y, x < 32 ? [46, 160, 72] : [30, 120, 54]);
  // Schneekante unten an jeder Stufe
  if (y === y1 - 1) for (let x = 32 - w; x < 32 + w; x += 2) set(x, y, [235, 245, 255]);
}

// Kugeln
const kugeln = [[27, 22, [230, 50, 50]], [36, 24, [250, 200, 60]], [24, 33, [70, 150, 255]], [38, 34, [230, 50, 50]],
  [31, 30, [250, 200, 60]], [20, 45, [250, 200, 60]], [28, 42, [230, 50, 50]], [43, 46, [70, 150, 255]], [35, 44, [250, 200, 60]]];
for (const [x, y, c] of kugeln) { set(x, y, c); set(x + 1, y, c); set(x, y + 1, c); set(x + 1, y + 1, c); }

// Stern
const gold = [255, 214, 60];
for (let d = -4; d <= 4; d++) { set(32 + d, 8, gold); set(31 + d, 8, gold); }
for (let d = -4; d <= 4; d++) { set(32, 8 + d, gold); set(31, 8 + d, gold); }
for (let d = -2; d <= 2; d++) { set(32 + d, 8 + d, gold); set(31 - d, 8 + d, gold); }

// Schneeflocken (fest verteilt, damit das Bild reproduzierbar bleibt)
const flocken = [[5, 6], [14, 3], [50, 5], [58, 12], [8, 20], [55, 26], [4, 36], [60, 40], [12, 48], [48, 18], [20, 12], [44, 9], [52, 34], [9, 28]];
for (const [x, y] of flocken) { set(x, y, [255, 255, 255]); set(x + 1, y, [200, 220, 245]); set(x, y + 1, [200, 220, 245]); }

fs.writeFileSync(path.join(__dirname, 'server-icon.png'), PNG.sync.write(png));
console.log('server-icon.png geschrieben');
