// Liest eine Minecraft-Welt (Anvil, ab 1.18) und schneidet einen Bereich als WorldEdit-Schematic aus.
// Aufrufe:
//   node tools/schem-welt.mjs info <weltordner>
//   node tools/schem-welt.mjs umriss <weltordner> <x> <z> <radius> <minY>   – Kasten aller Nicht-Luft-Blöcke ab minY (schwebende Inseln)
//   node tools/schem-welt.mjs ausschneiden <weltordner> <x1> <y1> <z1> <x2> <y2> <z2> <ausgabe.schem>
// Nur lesen: die Welt wird nie verändert. Ausgabe enthält Blöcke, Block-Entities und Entities (Villager, Rüstungsständer, Rahmen).
import { readFileSync, existsSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { inflateSync, gunzipSync } from 'node:zlib';
import { leseNbt } from './nbt.mjs';
import { neu, setze, speichere, LUFT } from './schem.mjs';

const roh = (v) => (v && typeof v === 'object' && 'type' in v ? v.value : v);

// Klartext aus getypten NBT-Werten (für Ausgabe und Vergleiche).
export function klar(t) {
  if (t.type === 'compound') return Object.fromEntries(Object.entries(t.value).map(([k, v]) => [k, klar(v)]));
  if (t.type === 'list') return t.value.items.map((i) => klar({ type: t.value.elem, value: i }));
  if (t.type === 'long') return t.value.toString();
  return t.value;
}

export function weltInfo(ordner) {
  const d = leseNbt(readFileSync(join(ordner, 'level.dat'))).value.Data.value;
  const spawn = d.spawn ? klar(d.spawn) : { pos: [roh(d.SpawnX), roh(d.SpawnY), roh(d.SpawnZ)] };
  let seed = d.WorldGenSettings?.value.seed?.value ?? d.RandomSeed?.value;
  const wgs = join(ordner, 'data', 'minecraft', 'world_gen_settings.dat'); // neuere Versionen lagern das aus
  if (seed === undefined && existsSync(wgs)) {
    const w = leseNbt(readFileSync(wgs)).value;
    seed = (w.data?.value ?? w).seed?.value;
  }
  const dp = join(ordner, 'datapacks');
  return {
    name: roh(d.LevelName),
    version: roh(d.Version?.value.Name),
    dataVersion: roh(d.DataVersion),
    seed: seed?.toString(),
    spawn,
    datapacksAktiv: d.DataPacks ? klar(d.DataPacks).Enabled : [],
    datapackOrdner: existsSync(dp) ? readdirSync(dp) : [],
  };
}

// Ein Chunk aus einer Regionsdatei (null, wenn nicht erzeugt).
export function leseChunk(regionDatei, cx, cz) {
  if (!existsSync(regionDatei)) return null;
  const buf = readFileSync(regionDatei);
  const kopf = 4 * ((cx & 31) + (cz & 31) * 32);
  const sektor = buf.readUIntBE(kopf, 3);
  if (sektor === 0) return null;
  const start = sektor * 4096;
  const laenge = buf.readUInt32BE(start);
  const art = buf[start + 4];
  if (art & 0x80) throw new Error(`Chunk ${cx},${cz} liegt extern (.mcc) – nicht unterstützt`);
  const daten = buf.subarray(start + 5, start + 4 + laenge);
  const entpackt = { 1: gunzipSync, 2: inflateSync, 3: (b) => b }[art];
  if (!entpackt) throw new Error(`Kompression ${art} (z.B. LZ4) nicht unterstützt – Welt mit Standard-Kompression speichern`);
  return leseNbt(entpackt(daten)).value;
}

// Blocknamen einer Sektion (16³, Reihenfolge y*256 + z*16 + x).
export function sektionsBloecke(sektion) {
  const bs = sektion.block_states.value;
  const palette = bs.palette.value.items.map((p) => {
    // 26.x: Text ("minecraft:stone"), in gemischten Listen {"": Text}, mit Eigenschaften {id, properties}
    if (typeof p === 'string') return p;
    if (p['']) return p[''].value;
    const name = (p.Name ?? p.id).value, eig = p.Properties ?? p.properties;
    const props = eig ? Object.entries(eig.value).map(([k, v]) => `${k}=${v.value}`).sort() : [];
    return props.length ? `${name}[${props.join(',')}]` : name;
  });
  if (palette.length === 1 || !bs.data) return new Array(4096).fill(palette[0]);
  const bits = Math.max(4, Math.ceil(Math.log2(palette.length)));
  const proLong = Math.floor(64 / bits);
  const maske = (1n << BigInt(bits)) - 1n;
  const longs = bs.data.value;
  const aus = new Array(4096);
  for (let i = 0; i < 4096; i++) {
    const l = BigInt.asUintN(64, longs[Math.floor(i / proLong)]);
    aus[i] = palette[Number((l >> BigInt((i % proLong) * bits)) & maske)];
  }
  return aus;
}

// Ab 26.x liegt die Oberwelt unter dimensions/minecraft/overworld/, ältere Welten direkt im Ordner (Paper: world/).
function regionPfad(ordner, art, cx, cz) {
  const neu26 = join(ordner, 'dimensions', 'minecraft', 'overworld');
  return join(existsSync(neu26) ? neu26 : ordner, art, `r.${cx >> 5}.${cz >> 5}.mca`);
}

function chunkBloecke(ordner, cx, cz, cache) {
  const key = `${cx},${cz}`;
  if (!cache.has(key)) {
    const c = leseChunk(regionPfad(ordner, 'region', cx, cz), cx, cz);
    const sek = new Map();
    for (const s of c?.sections?.value.items ?? []) if (s.block_states) sek.set(s.Y.value, sektionsBloecke(s));
    cache.set(key, { chunk: c, sek });
  }
  return cache.get(key);
}

function blockBei(eintrag, x, y, z) {
  const s = eintrag.sek.get(Math.floor(y / 16));
  return s ? s[(y & 15) * 256 + (z & 15) * 16 + (x & 15)] : LUFT;
}

const istLuft = (b) => b === LUFT || b === 'minecraft:cave_air' || b === 'minecraft:void_air';

export function umriss(ordner, mx, mz, radius, minY) {
  const cache = new Map();
  let k = null;
  for (let cx = (mx - radius) >> 4; cx <= (mx + radius) >> 4; cx++) for (let cz = (mz - radius) >> 4; cz <= (mz + radius) >> 4; cz++) {
    const e = chunkBloecke(ordner, cx, cz, cache);
    for (const [sy, bl] of e.sek) {
      if (sy * 16 + 15 < minY) continue;
      for (let i = 0; i < 4096; i++) {
        if (istLuft(bl[i])) continue;
        const y = sy * 16 + (i >> 8);
        if (y < minY) continue;
        const x = cx * 16 + (i & 15), z = cz * 16 + ((i >> 4) & 15);
        if (!k) k = { min: [x, y, z], max: [x, y, z], bloecke: 0 };
        [x, y, z].forEach((v, a) => { k.min[a] = Math.min(k.min[a], v); k.max[a] = Math.max(k.max[a], v); });
        k.bloecke++;
      }
    }
    cache.delete(`${cx},${cz}`);
  }
  return k;
}

export function ausschneiden(ordner, a, b) {
  const min = a.map((v, i) => Math.min(v, b[i])), max = a.map((v, i) => Math.max(v, b[i]));
  const [w, h, l] = max.map((v, i) => v - min[i] + 1);
  const cache = new Map();
  let dataVersion = 0;
  const m = neu(w, h, l, 0);
  m.entities = [];
  for (let cx = min[0] >> 4; cx <= max[0] >> 4; cx++) for (let cz = min[2] >> 4; cz <= max[2] >> 4; cz++) {
    const e = chunkBloecke(ordner, cx, cz, cache);
    if (!e.chunk) continue;
    dataVersion ||= e.chunk.DataVersion?.value ?? 0;
    for (let x = Math.max(min[0], cx * 16); x <= Math.min(max[0], cx * 16 + 15); x++)
      for (let z = Math.max(min[2], cz * 16); z <= Math.min(max[2], cz * 16 + 15); z++)
        for (let y = min[1]; y <= max[1]; y++) setze(m, x - min[0], y - min[1], z - min[2], blockBei(e, x, y, z));
    for (const be of e.chunk.block_entities?.value.items ?? []) {
      const p = [be.x.value, be.y.value, be.z.value];
      if (p.some((v, i) => v < min[i] || v > max[i])) continue;
      const { x, y, z, id, keepPacked, ...daten } = be;
      m.blockEntities.push({ pos: p.map((v, i) => v - min[i]), id: id.value, daten });
    }
    const ent = leseChunk(regionPfad(ordner, 'entities', cx, cz), cx, cz);
    for (const en of ent?.Entities?.value.items ?? []) {
      const p = en.Pos.value.items;
      if (p.some((v, i) => v < min[i] || v >= max[i] + 1)) continue;
      const { Pos, id, UUID, ...daten } = en;
      m.entities.push({ pos: p.map((v, i) => v - min[i]), id: id.value, daten });
    }
    cache.delete(`${cx},${cz}`);
  }
  m.dataVersion = dataVersion;
  return m;
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('tools/schem-welt.mjs')) {
  const [befehl, ordner, ...z] = process.argv.slice(2);
  const n = z.map(Number);
  if (befehl === 'info') console.log(JSON.stringify(weltInfo(ordner), null, 2));
  else if (befehl === 'umriss') console.log(JSON.stringify(umriss(ordner, n[0], n[1], n[2], n[3])));
  else if (befehl === 'ausschneiden') {
    const m = ausschneiden(ordner, n.slice(0, 3), n.slice(3, 6));
    writeFileSync(z[6], speichere(m));
    console.log(`${z[6]}: ${m.w}×${m.h}×${m.l}, ${m.bloecke.filter((b) => !istLuft(b)).length} Blöcke, ${m.blockEntities.length} Block-Entities, ${m.entities.length} Entities`);
  } else console.log('Aufruf: info | umriss | ausschneiden – siehe Kopf der Datei');
}
