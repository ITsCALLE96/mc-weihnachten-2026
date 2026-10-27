// Wandelt eine WorldEdit-Schematic in eine Vanilla-Struktur (.nbt) um, die sich ohne Spieler von der Konsole setzen lässt:
//   place template <namespace>:<name> <x> <y> <z>   (untere Nordwest-Ecke)
// Aufruf: node tools/schem-struktur.mjs <eingabe.schem> <ausgabe.nbt> [kachelgröße]
// Die Datei gehört in ein Datapack unter data/<namespace>/structure/<name>.nbt. Luft wird weggelassen (überschreibt nichts),
// die DataVersion bleibt, Minecraft wandelt ältere Blöcke und Schilder beim Laden selbst um.
import { readFileSync, writeFileSync } from 'node:fs';
import { schreibeNbt, tag } from './nbt.mjs';
import { lade, hole, neu, setze, LUFT } from './schem.mjs';

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
      // Höchstens 3955: Mit der aktuellen 26.3-DataVersion (5023) und dieser {Name, Properties}-Palette setzt place template nur Luft
      // (Spark-Insel 27.10.); bei 3955 wandelt Minecraft die Palette selbst um, das klappt auch mit 26.3-Blöcken
      DataVersion: tag('int', Math.min(m.dataVersion, 3955)),
      size: tag('list', { elem: 'int', items: [m.w, m.h, m.l] }),
      palette: tag('list', { elem: 'compound', items: [...palette.keys()].map(zustand) }),
      blocks: tag('list', { elem: 'compound', items: bloecke }),
      // Entities (Dorfbewohner, Rahmen, Rüstungsständer …) ohne UUID; place template setzt sie relativ zur Ecke
      entities: tag('list', { elem: 'compound', items: (m.entities ?? []).map((e) => ({
        pos: tag('list', { elem: 'double', items: e.pos }),
        blockPos: tag('list', { elem: 'int', items: e.pos.map(Math.floor) }),
        nbt: tag('compound', { id: tag('string', e.id), ...e.daten }),
      })) }),
    },
  });
}

// Große Bauten (Millionen Blöcke) in Kacheln k × k (volle Höhe) zerlegen: je Kachel eine eigene Struktur, sonst reicht der Speicher
// nicht. Kachel i/j beginnt bei x = i·k, z = j·k; Block-Entities und Entities wandern mit, Positionen relativ zur Kachel.
export function* kacheln(m, k) {
  for (let j = 0; j * k < m.l; j++) for (let i = 0; i * k < m.w; i++) {
    const x0 = i * k, z0 = j * k, w = Math.min(k, m.w - x0), l = Math.min(k, m.l - z0);
    const t = neu(w, m.h, l, m.dataVersion);
    for (let y = 0; y < m.h; y++) for (let z = 0; z < l; z++) for (let x = 0; x < w; x++) setze(t, x, y, z, hole(m, x0 + x, y, z0 + z));
    const drin = (p) => p[0] >= x0 && p[0] < x0 + w && p[2] >= z0 && p[2] < z0 + l;
    t.blockEntities = m.blockEntities.filter((b) => drin(b.pos)).map((b) => ({ ...b, pos: [b.pos[0] - x0, b.pos[1], b.pos[2] - z0] }));
    t.entities = (m.entities ?? []).filter((e) => drin(e.pos.map(Math.floor))).map((e) => ({ ...e, pos: [e.pos[0] - x0, e.pos[1], e.pos[2] - z0] }));
    yield { i, j, teil: t };
  }
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('tools/schem-struktur.mjs')) {
  // Aufruf mit Kachelgröße: schreibt <ausgabe ohne .nbt>_<i>_<j>.nbt
  const [ein, aus, kachel] = process.argv.slice(2);
  const m = lade(readFileSync(ein));
  if (kachel) {
    let n = 0;
    for (const { i, j, teil } of kacheln(m, +kachel)) { writeFileSync(aus.replace(/\.nbt$/, `_${i}_${j}.nbt`), struktur(teil)); n++; }
    console.log(`${aus.replace(/\.nbt$/, '_*.nbt')}: ${n} Kacheln à ${kachel}, ${m.w}×${m.h}×${m.l}, ${m.bloecke.filter((b) => b !== LUFT).length} Blöcke, ${m.blockEntities.length} Block-Entities, ${m.entities?.length ?? 0} Entities`);
  } else {
    writeFileSync(aus, struktur(m));
    console.log(`${aus}: ${m.w}×${m.h}×${m.l}, ${m.bloecke.filter((b) => b !== LUFT).length} Blöcke, ${m.blockEntities.length} Block-Entities, ${m.entities?.length ?? 0} Entities`);
  }
}
