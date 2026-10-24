// Wandelt eine WorldEdit-Schematic in eine Vanilla-Struktur (.nbt) um, die sich ohne Spieler von der Konsole setzen lässt:
//   place template <namespace>:<name> <x> <y> <z>   (untere Nordwest-Ecke)
// Aufruf: node tools/schem-struktur.mjs <eingabe.schem> <ausgabe.nbt>
// Die Datei gehört in ein Datapack unter data/<namespace>/structure/<name>.nbt. Luft wird weggelassen (überschreibt nichts),
// die DataVersion bleibt, Minecraft wandelt ältere Blöcke und Schilder beim Laden selbst um.
import { readFileSync, writeFileSync } from 'node:fs';
import { schreibeNbt, tag } from './nbt.mjs';
import { lade, hole, LUFT } from './schem.mjs';

// "minecraft:chest[facing=north]" → { Name, Properties }
function zustand(block) {
  const m = block.match(/^([^[]+)(?:\[(.*)\])?$/);
  const props = m[2] ? Object.fromEntries(m[2].split(',').map((p) => p.split('=')).map(([k, v]) => [k, tag('string', v)])) : null;
  return { Name: tag('string', m[1]), ...(props && { Properties: tag('compound', props) }) };
}

export function struktur(m) {
  const palette = new Map();
  const be = new Map(m.blockEntities.map((b) => [b.pos.join(','), b]));
  const bloecke = [];
  for (let y = 0; y < m.h; y++) for (let z = 0; z < m.l; z++) for (let x = 0; x < m.w; x++) {
    const b = hole(m, x, y, z);
    if (b === LUFT) continue;
    if (!palette.has(b)) palette.set(b, palette.size);
    const e = be.get(`${x},${y},${z}`);
    bloecke.push({
      pos: tag('list', { elem: 'int', items: [x, y, z] }),
      state: tag('int', palette.get(b)),
      ...(e && { nbt: tag('compound', { id: tag('string', e.id), ...e.daten }) }),
    });
  }
  return schreibeNbt({
    name: '', type: 'compound', value: {
      DataVersion: tag('int', m.dataVersion),
      size: tag('list', { elem: 'int', items: [m.w, m.h, m.l] }),
      palette: tag('list', { elem: 'compound', items: [...palette.keys()].map(zustand) }),
      blocks: tag('list', { elem: 'compound', items: bloecke }),
      entities: tag('list', { elem: 'compound', items: [] }),
    },
  });
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('tools/schem-struktur.mjs')) {
  const [ein, aus] = process.argv.slice(2);
  const m = lade(readFileSync(ein));
  writeFileSync(aus, struktur(m));
  console.log(`${aus}: ${m.w}×${m.h}×${m.l}, ${m.bloecke.filter((b) => b !== LUFT).length} Blöcke, ${m.blockEntities.length} Block-Entities`);
}
