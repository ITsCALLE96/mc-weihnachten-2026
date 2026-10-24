// Berechnet unsichtbare Lichtblöcke (minecraft:light) unter einer schwebenden Insel, damit dort keine Monster erscheinen.
// Aufruf: node tools/schem-licht.mjs <weltordner> <x1> <z1> <x2> <z2> <inselUnterkante> [schritt=6] > lichter.mcfunction
// Je Rasterspalte zwei Lichter: auf dem Boden bzw. der Wasseroberfläche unter der Insel und direkt unter der Inselunterseite.
// Die Welt muss die Insel schon enthalten (oder eine Testwelt mit gleichem Seed sein). Ausgabe: setblock-Befehle für ein Datapack.
import { ausschneiden } from './schem-welt.mjs';
import { hole } from './schem.mjs';

const luft = (b) => /:(air|cave_air|void_air)$/.test(b);
const LICHT = 'minecraft:light[level=15]';

export function lichter(m, ursprung, inselUnterkante, schritt = 6) {
  const [x0, y0, z0] = ursprung;
  const aus = [];
  for (let z = 0; z < m.l; z += schritt) for (let x = 0; x < m.w; x += schritt) {
    const unter = inselUnterkante - y0;
    // Boden: erste Luft über festem Block oder Wasser, unterhalb der Insel
    for (let y = 1; y < Math.min(unter, m.h); y++) {
      if (luft(hole(m, x, y, z)) && !luft(hole(m, x, y - 1, z))) { aus.push([x + x0, y + y0, z + z0]); break; }
    }
    // Inselunterseite: unterster Inselblock in der Spalte, Licht direkt darunter
    for (let y = Math.max(unter, 1); y < m.h; y++) {
      if (!luft(hole(m, x, y, z))) { if (luft(hole(m, x, y - 1, z))) aus.push([x + x0, y - 1 + y0, z + z0]); break; }
    }
  }
  return aus.map(([x, y, z]) => `setblock ${x} ${y} ${z} ${LICHT} keep`);
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('tools/schem-licht.mjs')) {
  const [welt, ...z] = process.argv.slice(2);
  const [x1, z1, x2, z2, unterkante, schritt = 6] = z.map(Number);
  const y0 = 40;
  const m = ausschneiden(welt, [x1, y0, z1], [x2, 319, z2]);
  console.log(lichter(m, [Math.min(x1, x2), y0, Math.min(z1, z2)], unterkante, schritt).join('\n'));
}
