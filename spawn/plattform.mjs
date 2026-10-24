// Rückweg-Plattform im Stil der Insel (Entwurf, Pascal 24.10. „ja gefällt mir“): runde Scheibe, Radius 4, Mitte (64, 62, 29) unter dem Kristall-Anhänger
// Aufruf: node spawn/plattform.mjs <testwelt> <ausgabe.mcfunction> <vorschau.schem> x <ecke1 x,y,z> <ecke2 x,y,z>  → danach tools/vorschau.mjs für das Bild
import { writeFileSync } from 'node:fs';
import { ausschneiden } from 'file:///C:/Users/pasca/source/repos/mc-weihnachten-2026/tools/schem-welt.mjs';
import { setze, hole, speichere } from 'file:///C:/Users/pasca/source/repos/mc-weihnachten-2026/tools/schem.mjs';
const [welt, ausFn, ausSchem] = process.argv.slice(2);
const M = [64, 62, 29];
const teile = []; // [dx, dy, dz, block]
for (let dx = -4; dx <= 4; dx++) for (let dz = -4; dz <= 4; dz++) {
  const r = Math.hypot(dx, dz);
  if (r > 4.5) continue;
  let b;
  if (r === 0) b = 'minecraft:pearlescent_froglight';                    // leuchtende Mitte wie im Anhänger
  else if (r <= 1) b = 'minecraft:amethyst_block';                        // Amethyst-Kreuz
  else if (r <= 2.3) b = Math.abs(dx) === Math.abs(dz) ? 'minecraft:black_concrete' : 'minecraft:purple_concrete'; // Anhänger-Farben, schwarze Diagonalen
  else if (r <= 3.5) b = 'minecraft:polished_andesite';                   // Boden wie die Inselwege
  else b = (dx * 3 + dz) % 2 ? 'minecraft:mossy_stone_bricks' : 'minecraft:stone_bricks'; // Rand wie die Inselkante
  teile.push([dx, 0, dz, b]);
  if (r > 3.5) teile.push([dx, -1, dz, 'minecraft:stone_brick_stairs[facing=' + (Math.abs(dx) > Math.abs(dz) ? (dx > 0 ? 'west' : 'east') : (dz > 0 ? 'north' : 'south')) + ',half=top]']);
}
// Vier Kristallsäulen auf den Diagonalen: Amethyst, Endstab oben (wie die Kristalle unter der Kuppel)
for (const [dx, dz] of [[3, 3], [-3, 3], [3, -3], [-3, -3]]) {
  teile.push([dx, 0, dz, 'minecraft:crying_obsidian'], [dx, 1, dz, 'minecraft:amethyst_block'], [dx, 2, dz, 'minecraft:amethyst_block'], [dx, 3, dz, 'minecraft:end_rod[facing=up]']);
}
// Laternen auf dem Rand an den vier Seiten (Einstiege bleiben frei daneben)
for (const [dx, dz] of [[4, 0], [-4, 0], [0, 4], [0, -4]]) teile.push([dx, 1, dz, 'minecraft:mossy_stone_brick_wall'], [dx, 2, dz, 'minecraft:lantern']);
const zeilen = teile.map(([dx, dy, dz, b]) => `setblock ${M[0] + dx} ${M[1] + dy} ${M[2] + dz} ${b}`);
writeFileSync(ausFn, '# Rückweg-Plattform unter der Inselmitte (Mitte 64/62/29, Radius 4), erzeugt aus einem Entwurf im Stil der Insel\n' + zeilen.join('\n') + '\n');
// Vorschau: Gelände + Anhänger aus der Testwelt, Wasser als helles Glas sichtbar, Plattform eingesetzt
const A = (process.argv[6] || "52,56,17").split(",").map(Number), B = (process.argv[7] || "76,90,41").split(",").map(Number);
const m = ausschneiden(welt, A, B);
for (let i = 0; i < m.bloecke.length; i++) { const b = m.bloecke[i]; if (b.includes('water') || b === 'minecraft:seagrass' || b.includes('kelp')) m.bloecke[i] = 'minecraft:light_blue_stained_glass'; if (b.startsWith('minecraft:light[') || b === 'minecraft:light') m.bloecke[i] = 'minecraft:air'; }
for (let x = 72; x <= 76; x++) for (let z = 20; z <= 24; z++) if (x >= A[0] && x <= B[0] && z >= A[2] && z <= B[2]) setze(m, x - A[0], 62 - A[1], z - A[2], 'minecraft:light_blue_stained_glass'); // alte Plattform ausblenden
for (const [dx, dy, dz, b] of teile) setze(m, M[0] + dx - A[0], M[1] + dy - A[1], M[2] + dz - A[2], b);
m.blockEntities = []; m.entities = [];
writeFileSync(ausSchem, speichere(m));
console.log(teile.length, 'Blöcke');
