// Wandelt eine Litematica-Datei (.litematic) in eine WorldEdit-Schematic (Sponge v2, .schem) um.
// Aufruf: node tools/schematic.mjs <eingabe.litematic> <ausgabe.schem>
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { leseNbt, schreibeNbt, tag } from './nbt.mjs';

function blockName(eintrag) {
  const props = eintrag.Properties?.value;
  if (!props) return eintrag.Name.value;
  const teile = Object.keys(props).sort().map((k) => `${k}=${props[k].value}`);
  return `${eintrag.Name.value}[${teile.join(',')}]`;
}

// Litematica packt Paletten-Indizes mit fester Bitbreite, Werte dürfen über zwei Longs reichen.
function entpacke(longs, bits, anzahl) {
  const maske = (1n << BigInt(bits)) - 1n;
  const u = longs.map((l) => BigInt.asUintN(64, l));
  const werte = new Array(anzahl);
  for (let i = 0; i < anzahl; i++) {
    const start = i * bits;
    const a = start >> 6;
    const versatz = BigInt(start & 63);
    let v = u[a] >> versatz;
    if ((start & 63) + bits > 64) v |= u[a + 1] << (64n - versatz);
    werte[i] = Number(v & maske);
  }
  return werte;
}

function varint(zahl, ziel) {
  while (zahl >= 0x80) { ziel.push((zahl & 0x7f) | 0x80); zahl >>>= 7; }
  ziel.push(zahl);
}

export function litematicZuSchem(datei) {
  const wurzel = leseNbt(datei).value;
  const regionen = Object.values(wurzel.Regions.value);
  if (regionen.length !== 1) throw new Error(`Nur Litematics mit genau einer Region werden unterstützt (gefunden: ${regionen.length})`);
  const r = regionen[0].value;
  // Negative Größen heißen nur „in Gegenrichtung aufgezogen“ – die Daten liegen trotzdem ab 0.
  const [w, h, l] = ['x', 'y', 'z'].map((k) => Math.abs(r.Size.value[k].value));

  const palette = r.BlockStatePalette.value.items;
  const bits = Math.max(2, Math.ceil(Math.log2(palette.length)));
  const indizes = entpacke(r.BlockStates.value, bits, w * h * l);

  // Litematica-Reihenfolge (y, z, x) entspricht der Sponge-Reihenfolge x + z*W + y*W*L.
  const daten = [];
  for (const i of indizes) varint(i, daten);

  const blockEntities = r.TileEntities.value.items.map((te) => {
    const { x, y, z, id, ...rest } = te;
    return { Pos: tag('intArray', [x.value, y.value, z.value]), Id: id, ...rest };
  });

  return schreibeNbt({
    name: 'Schematic', type: 'compound', value: {
      Version: tag('int', 2),
      DataVersion: wurzel.MinecraftDataVersion,
      Width: tag('short', w),
      Height: tag('short', h),
      Length: tag('short', l),
      Offset: tag('intArray', [0, 0, 0]),
      PaletteMax: tag('int', palette.length),
      Palette: tag('compound', Object.fromEntries(palette.map((p, i) => [blockName(p), tag('int', i)]))),
      BlockData: tag('byteArray', Buffer.from(daten)),
      BlockEntities: tag('list', { elem: 'compound', items: blockEntities }),
    },
  });
}

// Liest den Block an (x, y, z) aus einer gelesenen Sponge-v2-Schematic – für Tests und Stichproben.
export function blockAus(schem, x, y, z) {
  const ziel = x + z * schem.Width.value + y * schem.Width.value * schem.Length.value;
  const roh = schem.BlockData.value;
  let p = 0;
  for (let i = 0; ; i++) {
    let v = 0, s = 0, b;
    do { b = roh[p++]; v |= (b & 0x7f) << s; s += 7; } while (b & 0x80);
    if (i === ziel) return Object.entries(schem.Palette.value).find(([, n]) => n.value === v)[0];
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [ein, aus] = process.argv.slice(2);
  if (!ein || !aus) { console.error('Aufruf: node tools/schematic.mjs <eingabe.litematic> <ausgabe.schem>'); process.exit(1); }
  writeFileSync(aus, litematicZuSchem(readFileSync(ein)));
  console.log(`${aus} geschrieben`);
}
