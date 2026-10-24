// Gekaufter Spawn „Hub/Spawn – Fantasy Village“ (LavaBuilds, BuiltByBit, Standard-EULA): aus der mitgelieferten Welt eine abfallfreie
// Schematic für place template machen. Die Kaufdateien und das Ergebnis bleiben lokal in spawn/quellen/fantasy-village/ (git-ignoriert,
// Weitergabe laut Lizenz verboten). Im Repo liegt nur dieses Skript.
// Aufruf: node --max-old-space-size=8000 spawn/fantasy-village.mjs <welt> <ausgabe.schem>
//   <welt> = „File for 1.21+/World/Fantasy Villages“ aus dem Kaufpaket (Welt statt Schematic: nur sie enthält Dorfbewohner, Rahmen,
//   Rüstungsständer und Anzeigen)
// Abfallfrei, weil place template jeden Block mit onPlace setzt:
//   - Laub wird persistent (Hinweis des Erbauers: sonst zerfällt es; randomTickSpeed 0 bräuchte man dann nicht dauerhaft)
//   - Wasser, Lava und wassergeflutete Blöcke mit Luft daneben oder darunter würden auslaufen und von der Insel bis zum Boden fließen:
//     in diese Luft kommt Barriere (unsichtbar)
//   - Fallblöcke (Sand, Kies, Betonpulver, Ambosse …) und Gerüste über Luft, Tropfstein ohne Halt: Barriere als Stütze
import { writeFileSync } from 'node:fs';
import { ausschneiden } from '../tools/schem-welt.mjs';
import { hole, setze, speichere, LUFT } from '../tools/schem.mjs';

// Kasten der Insel in der Kaufwelt (umriss: alle Nicht-Luft-Blöcke), 240 × 215 × 244
export const KASTEN = [[-150, -57, -158], [89, 157, 85]];

const FALL = /^minecraft:(sand|red_sand|gravel|suspicious_sand|suspicious_gravel|[a-z_]+_concrete_powder|anvil|chipped_anvil|damaged_anvil|dragon_egg|scaffolding)(\[|$)/;
const fluessig = (b) => /^minecraft:(water|lava|bubble_column)(\[|$)/.test(b) || /waterlogged=true/.test(b);

export function abfallfrei(m) {
  const n = { laub: 0, fluss: 0, fall: 0, tropfstein: 0 };
  const barriere = (x, y, z, art) => { if (x < 0 || y < 0 || z < 0 || x >= m.w || y >= m.h || z >= m.l || hole(m, x, y, z) !== LUFT) return; setze(m, x, y, z, 'minecraft:barrier'); n[art]++; };
  m.bloecke = m.bloecke.map((b) => (/_leaves\[/.test(b) && /persistent=false/.test(b) ? (n.laub++, b.replace('persistent=false', 'persistent=true')) : b));
  for (let y = 0; y < m.h; y++) for (let z = 0; z < m.l; z++) for (let x = 0; x < m.w; x++) {
    const b = hole(m, x, y, z);
    if (fluessig(b)) for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0, -1, 0]]) barriere(x + dx, y + dy, z + dz, 'fluss');
    else if (FALL.test(b)) barriere(x, y - 1, z, 'fall');
    else if (/^minecraft:pointed_dripstone/.test(b)) { if (/vertical_direction=up/.test(b)) barriere(x, y - 1, z, 'tropfstein'); else barriere(x, y + 1, z, 'tropfstein'); }
  }
  return n;
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('spawn/fantasy-village.mjs')) {
  const [welt, aus] = process.argv.slice(2);
  const m = ausschneiden(welt, ...KASTEN);
  const n = abfallfrei(m);
  writeFileSync(aus, speichere(m));
  console.log(`${aus}: ${m.w}×${m.h}×${m.l}, DataVersion ${m.dataVersion}, ${m.blockEntities.length} Block-Entities, ${m.entities.length} Entities; ` +
    `${n.laub} Laub persistent, Barriere: ${n.fluss} an Wasser/Lava, ${n.fall} unter Fallblöcken, ${n.tropfstein} an Tropfstein`);
}
