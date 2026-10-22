// Baut den Polarexpress: eigene Personenwagen (generiert) hinter einer Dampflok-Schematic.
// Aufruf: node tools/zug.mjs <lok.schem> <ausgabe.schem> [wagen=4] [--rot]
// Die Lok muss in +x fahren (Tender bei kleinem x) und ein 11 breites Gleisbett haben (Gleis z=2..8).
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { lade, speichere, neu, setze, hole, einfuegen, ersetze } from './schem.mjs';

export const WAGEN_LAENGE = 24;

// Polarexpress-Lok ist schwarz: Nether-Rot und Karmesin werden zu Schwarzstein und Schwarzeiche.
export const SCHWARZ = {
  'minecraft:red_nether_bricks': 'minecraft:polished_blackstone_bricks',
  'minecraft:red_nether_brick_slab': 'minecraft:polished_blackstone_brick_slab',
  'minecraft:red_nether_brick_stairs': 'minecraft:polished_blackstone_brick_stairs',
  'minecraft:crimson_planks': 'minecraft:dark_oak_planks',
  'minecraft:crimson_trapdoor': 'minecraft:dark_oak_trapdoor',
  'minecraft:crimson_stairs': 'minecraft:dark_oak_stairs',
  'minecraft:crimson_slab': 'minecraft:dark_oak_slab',
  'minecraft:crimson_door': 'minecraft:dark_oak_door',
  'minecraft:stripped_crimson_stem': 'minecraft:stripped_dark_oak_log',
};

const WAND = 'mangrove_planks';
const SOCKEL = 'dark_oak_planks';
const ZIERLEISTE = 'stripped_birch_log[axis=x]';
const DACH = 'deepslate_tiles';
const DACH_OBEN = 'deepslate_tile_slab[type=bottom,waterlogged=false]';
const FENSTER = 'glass_pane[east=true,north=false,south=false,waterlogged=false,west=true]';
const stufe = (richtung) => `spruce_stairs[facing=${richtung},half=bottom,shape=straight,waterlogged=false]`;
const tuer = (richtung, haelfte) => `spruce_door[facing=${richtung},half=${haelfte},hinge=left,open=false,powered=false]`;

// Ein Personenwagen; `bett(x)` liefert das Gleisbett (y0–1) für Spalte x als { z: block }-Listen.
export function wagen(dataVersion, bett) {
  const n = WAGEN_LAENGE;
  const m = neu(n, 12, 11, dataVersion);
  for (let x = 0; x < n; x++) {
    for (const [y, z, b] of bett(x)) setze(m, x, y, z, b);
  }
  // Übergang zum Nachbarwagen: Bodenplatte und Faltenbalg mit Durchgang in z=5
  for (const x of [0, n - 1]) {
    for (let z = 4; z <= 6; z++) setze(m, x, 3, z, 'polished_blackstone_bricks');
    for (let y = 4; y <= 7; y++) for (const z of [4, 6]) setze(m, x, y, z, 'black_wool');
    setze(m, x, 7, 5, 'black_wool');
  }
  const ende = n - 2;
  for (let x = 1; x <= ende; x++) {
    const stirn = x === 1 || x === ende;
    // Drehgestelle
    if ((x >= 3 && x <= 5) || (x >= n - 6 && x <= n - 4)) for (const z of [3, 7]) setze(m, x, 2, z, 'blackstone');
    for (let z = 2; z <= 8; z++) setze(m, x, 3, z, 'polished_blackstone_bricks');
    for (let z = 2; z <= 8; z++) setze(m, x, 10, z, DACH);
    for (let z = 3; z <= 7; z++) setze(m, x, 11, z, DACH_OBEN);
    for (let y = 4; y <= 9; y++) {
      const wand = y === 4 ? SOCKEL : y === 8 ? ZIERLEISTE : WAND;
      const fensterReihe = (y === 6 || y === 7) && !stirn && x >= 3 && (x - 3) % 4 !== 3;
      for (const z of [2, 8]) setze(m, x, y, z, fensterReihe ? FENSTER : wand);
      if (stirn) {
        for (let z = 3; z <= 7; z++) setze(m, x, y, z, z === 5 && y <= 6 ? 'air' : wand);
      }
    }
    if (stirn) continue;
    // Seitentüren gleich hinter der Stirnwand
    if (x === 2 || x === ende - 1) {
      setze(m, x, 4, 2, tuer('south', 'lower')); setze(m, x, 5, 2, tuer('south', 'upper'));
      setze(m, x, 4, 8, tuer('north', 'lower')); setze(m, x, 5, 8, tuer('north', 'upper'));
    }
    // Innen: roter Teppich im Gang, Sitzgruppen je Fensterfeld, Laternen unter dem Dach
    setze(m, x, 4, 5, 'red_carpet');
    const feld = (x - 3) % 4;
    if (x >= 7 && x <= ende - 3 && (feld === 0 || feld === 2)) {
      for (const z of [3, 4, 6, 7]) setze(m, x, 4, z, stufe(feld === 0 ? 'west' : 'east'));
    }
    if (feld === 1) setze(m, x, 9, 5, 'lantern[hanging=true,waterlogged=false]');
  }
  return m;
}

export function baueZug(lok, anzahl, schwarz = true) {
  if (schwarz) ersetze(lok, SCHWARZ);
  const breiteWagen = anzahl * WAGEN_LAENGE;
  const zug = neu(breiteWagen + lok.w, lok.h, lok.l, lok.dataVersion);
  // Gleisbett der Lok (Spalten 2 und 3) wird unter den Wagen fortgesetzt
  const bett = (x) => {
    const quelle = 2 + (x % 2);
    const teile = [];
    for (let y = 0; y <= 1; y++) for (let z = 0; z < lok.l; z++) teile.push([y, z, hole(lok, quelle, y, z)]);
    return teile;
  };
  for (let i = 0; i < anzahl; i++) einfuegen(zug, wagen(lok.dataVersion, (x) => bett(x + i * WAGEN_LAENGE)), i * WAGEN_LAENGE, 0, 0);
  // Lücke zwischen letztem Wagen und Tender schließen (Lok-Spalten 0–1 haben kein Gleis)
  for (let x = 0; x <= 1; x++) for (const [y, z, b] of bett(breiteWagen + x)) setze(zug, breiteWagen + x, y, z, b);
  einfuegen(zug, lok, breiteWagen, 0, 0);
  return zug;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const [ein, aus, anzahl = '4'] = args;
  if (!ein || !aus) { console.error('Aufruf: node tools/zug.mjs <lok.schem> <ausgabe.schem> [wagen=4] [--rot]'); process.exit(1); }
  const zug = baueZug(lade(readFileSync(ein)), Number(anzahl), !process.argv.includes('--rot'));
  writeFileSync(aus, speichere(zug));
  console.log(`${aus} geschrieben (${zug.w}×${zug.h}×${zug.l})`);
}
