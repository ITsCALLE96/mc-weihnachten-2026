// Einfaches Modell für WorldEdit-Schematics: lesen (Sponge v2/v3), bearbeiten, schreiben (Sponge v2).
// Blöcke liegen als Text-Array (z.B. "minecraft:oak_stairs[facing=east]") in Reihenfolge x + z*W + y*W*L.
import { leseNbt, schreibeNbt, tag } from './nbt.mjs';

export const LUFT = 'minecraft:air';

export function neu(w, h, l, dataVersion) {
  return { w, h, l, dataVersion, bloecke: new Array(w * h * l).fill(LUFT), blockEntities: [] };
}

export const index = (m, x, y, z) => x + z * m.w + y * m.w * m.l;
export const hole = (m, x, y, z) => m.bloecke[index(m, x, y, z)];
export function setze(m, x, y, z, block) {
  if (x < 0 || y < 0 || z < 0 || x >= m.w || y >= m.h || z >= m.l) return;
  m.bloecke[index(m, x, y, z)] = block.includes(':') ? block : `minecraft:${block}`;
}

export function lade(datei) {
  let s = leseNbt(datei).value;
  if (s.Schematic) s = s.Schematic.value; // v3 hat eine Hülle
  const v3 = s.Version.value === 3;
  const bl = v3 ? s.Blocks.value : s;
  const palette = [];
  for (const [name, n] of Object.entries(bl.Palette.value)) palette[n.value] = name;
  const roh = (v3 ? bl.Data : bl.BlockData).value;
  const m = neu(s.Width.value, s.Height.value, s.Length.value, s.DataVersion.value);
  for (let p = 0, i = 0; p < roh.length; i++) {
    let v = 0, sh = 0, b;
    do { b = roh[p++]; v |= (b & 0x7f) << sh; sh += 7; } while (b & 0x80);
    m.bloecke[i] = palette[v];
  }
  const bes = (v3 ? bl.BlockEntities : s.BlockEntities)?.value.items ?? [];
  m.blockEntities = bes.map((be) => {
    const { Pos, Id, Data, ...rest } = be;
    return { pos: [...Pos.value], id: Id.value, daten: v3 ? (Data?.value ?? {}) : rest };
  });
  return m;
}

export function speichere(m) {
  const palette = new Map();
  const daten = [];
  for (const b of m.bloecke) {
    if (!palette.has(b)) palette.set(b, palette.size);
    let v = palette.get(b);
    while (v >= 0x80) { daten.push((v & 0x7f) | 0x80); v >>>= 7; }
    daten.push(v);
  }
  return schreibeNbt({
    name: 'Schematic', type: 'compound', value: {
      Version: tag('int', 2),
      DataVersion: tag('int', m.dataVersion),
      Width: tag('short', m.w),
      Height: tag('short', m.h),
      Length: tag('short', m.l),
      Offset: tag('intArray', [0, 0, 0]),
      PaletteMax: tag('int', palette.size),
      Palette: tag('compound', Object.fromEntries([...palette].map(([k, v]) => [k, tag('int', v)]))),
      BlockData: tag('byteArray', Buffer.from(daten)),
      BlockEntities: tag('list', {
        elem: 'compound',
        items: m.blockEntities.map((be) => ({ Pos: tag('intArray', be.pos), Id: tag('string', be.id), ...be.daten })),
      }),
      ...(m.entities?.length && {
        Entities: tag('list', {
          elem: 'compound',
          items: m.entities.map((e) => ({ Pos: tag('list', { elem: 'double', items: e.pos }), Id: tag('string', e.id), ...e.daten })),
        }),
      }),
    },
  });
}

// Kopiert `teil` mit Versatz in `ziel`; Luft überschreibt nichts.
export function einfuegen(ziel, teil, dx, dy, dz) {
  for (let y = 0; y < teil.h; y++) for (let z = 0; z < teil.l; z++) for (let x = 0; x < teil.w; x++) {
    const b = hole(teil, x, y, z);
    if (b !== LUFT) setze(ziel, x + dx, y + dy, z + dz, b);
  }
  for (const be of teil.blockEntities) ziel.blockEntities.push({ ...be, pos: [be.pos[0] + dx, be.pos[1] + dy, be.pos[2] + dz] });
}

// Ersetzt Blocknamen (Properties bleiben erhalten), z.B. { 'minecraft:red_nether_bricks': 'minecraft:polished_blackstone_bricks' }.
export function ersetze(m, tabelle) {
  m.bloecke = m.bloecke.map((b) => {
    const [name, props] = b.split('[');
    const neuName = tabelle[name];
    return neuName ? (props ? `${neuName}[${props}` : neuName) : b;
  });
}
