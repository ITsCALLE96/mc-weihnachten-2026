// Berechnet unsichtbare Lichtblöcke (minecraft:light) unter einer schwebenden Insel, damit dort keine Monster erscheinen.
// Aufruf: node tools/schem-licht.mjs <weltordner> <x1> <z1> <x2> <z2> <inselUnterkante> [schritt=6] [oval cx,cz,a,b] [nurBoden] > lichter.mcfunction
// Je Rasterspalte ein Licht auf dem Boden bzw. der Wasseroberfläche unter der Insel, ohne „nurBoden“ zusätzlich eins direkt unter der
// Inselunterseite. Mit „oval“ nur Spalten in der Ellipse um (cx, cz) mit Halbachsen a (x) und b (z), z.B. Insel-Umriss plus Rand.
// Die Welt muss die Insel schon enthalten (oder eine Testwelt mit gleichem Seed sein). Ausgabe: setblock-Befehle für ein Datapack.
import { ausschneiden } from './schem-welt.mjs';
import { hole } from './schem.mjs';

const luft = (b) => /:(air|cave_air|void_air)$/.test(b) || /^minecraft:light(\[|$)/.test(b); // schon gesetzte Lichter zählen als Luft
const LICHT = 'minecraft:light[level=15]';

export const imOval = ([cx, cz, a, b], x, z) => ((x - cx) / a) ** 2 + ((z - cz) / b) ** 2 <= 1;

export function lichter(m, ursprung, inselUnterkante, schritt = 6, { oval = null, nurBoden = false } = {}) {
  const [x0, y0, z0] = ursprung;
  const aus = [];
  for (let z = 0; z < m.l; z += schritt) for (let x = 0; x < m.w; x += schritt) {
    if (oval && !imOval(oval, x + x0, z + z0)) continue;
    const unter = inselUnterkante - y0;
    // Boden: erste Luft über festem Block oder Wasser, unterhalb der Insel
    for (let y = 1; y < Math.min(unter, m.h); y++) {
      if (luft(hole(m, x, y, z)) && !luft(hole(m, x, y - 1, z))) { aus.push([x + x0, y + y0, z + z0]); break; }
    }
    if (nurBoden) continue;
    // Inselunterseite: unterster Inselblock in der Spalte, Licht direkt darunter
    for (let y = Math.max(unter, 1); y < m.h; y++) {
      if (!luft(hole(m, x, y, z))) { if (luft(hole(m, x, y - 1, z))) aus.push([x + x0, y - 1 + y0, z + z0]); break; }
    }
  }
  return aus.map(([x, y, z]) => `setblock ${x} ${y} ${z} ${LICHT} keep`);
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('tools/schem-licht.mjs')) {
  const [welt, ...z] = process.argv.slice(2);
  const [x1, z1, x2, z2, unterkante, schritt = 6] = z.slice(0, 6).map(Number);
  const oval = z[6] && z[6] !== 'nurBoden' ? z[6].split(',').map(Number) : null;
  const y0 = 40;
  const m = ausschneiden(welt, [x1, y0, z1], [x2, 319, z2]);
  console.log(lichter(m, [Math.min(x1, x2), y0, Math.min(z1, z2)], unterkante, schritt, { oval, nurBoden: z.includes('nurBoden') }).join('\n'));
}
