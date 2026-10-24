// Übernimmt die Aufschüttung des CA-Teams aus der CA12-Welt (Biom Pilzland) als reinen Boden in eine neue Welt.
// Aufruf: node tools/schem-aufschuettung.mjs <ca12-weltordner> <ausgabe: datapacks/aufschuettung>
// Danach in der Konsole: function aufschuettung:start   (lädt Kachel für Kachel, setzt Boden + Biom, meldet „Aufschüttung fertig“)
// Je Spalte mit Biom Pilzland: Boden von y 40 bis zur Oberfläche (nur Erde, Gras, Sand, Stein, Wasser …), Reste von Bauten unter der
// Oberfläche werden Erde, die Oberfläche Gras, darüber bis y 90 Luft bzw. Wasser bis y 62. Spielerbauten fallen so weg.
// Die Ausgabe enthält Geländedaten aus der CA12-Welt und gehört NICHT ins öffentliche Repo (nur lokal in die Welt).
import { readdirSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { leseChunk, sektionsBloecke } from './schem-welt.mjs';
import { schreibeNbt, tag } from './nbt.mjs';

export const Y0 = 40, Y1 = 90, MEER = 62, KACHEL = 64;
const PILZ = 'minecraft:mushroom_fields';
const NATUR = /^minecraft:(dirt|grass_block|coarse_dirt|rooted_dirt|podzol|mycelium|sand|sandstone|red_sand|gravel|clay|stone|andesite|diorite|granite|tuff|deepslate|calcite|water|seagrass|tall_seagrass|kelp|kelp_plant)(\[|$)/;
const OBERFLAECHE_GRAS = /^minecraft:(dirt|coarse_dirt|rooted_dirt|podzol|mycelium|gravel|clay)(\[|$)/;

// Bodenspalte (Index 0 = y Y0) aus einer Spalte Blocknamen ab y Y0; null, wenn keine Oberfläche gefunden
export function bodenSpalte(spalte) {
  let s = -1;
  for (let i = Math.min(spalte.length - 1, Y1 - Y0); i >= 3; i--) {
    if (NATUR.test(spalte[i]) && [1, 2, 3].every((d) => NATUR.test(spalte[i - d]))) { s = i; break; }
  }
  if (s < 0) return null;
  const aus = [];
  for (let i = 0; i <= Y1 - Y0; i++) {
    let b;
    if (i <= s) { b = NATUR.test(spalte[i]) ? spalte[i] : 'minecraft:dirt'; if (i === s && OBERFLAECHE_GRAS.test(b)) b = 'minecraft:grass_block[snowy=false]'; }
    else b = i + Y0 <= MEER ? 'minecraft:water[level=0]' : 'minecraft:air';
    aus.push(b);
  }
  return aus;
}

function biomZelle(sek, x, z) { // Biom der Zelle (4×4) in der obersten Viertel-Lage der Sektion
  const bs = sek?.biomes?.value; if (!bs) return null;
  const pal = bs.palette.value.items.map((p) => (typeof p === 'string' ? p : p[''] ? p[''].value : (p.Name ?? p.id).value));
  if (pal.length === 1 || !bs.data) return pal[0];
  const bits = Math.ceil(Math.log2(pal.length)), per = Math.floor(64 / bits), idx = 3 * 16 + (z >> 2) * 4 + (x >> 2);
  const l = BigInt.asUintN(64, bs.data.value[Math.floor(idx / per)]);
  return pal[Number((l >> BigInt((idx % per) * bits)) & ((1n << BigInt(bits)) - 1n))];
}

const zustand = (b) => { const m = b.match(/^([^[]+)(?:\[(.*)\])?$/); return { Name: tag('string', m[1]), ...(m[2] && { Properties: tag('compound', Object.fromEntries(m[2].split(',').map((p) => p.split('=')).map(([k, v]) => [k, tag('string', v)]))) }) }; };

export function kachelStruktur(spalten, dataVersion) { // spalten: Map "dx,dz" → Bodenspalte
  const palette = new Map(), bloecke = [];
  for (const [k, sp] of spalten) {
    const [dx, dz] = k.split(',').map(Number);
    sp.forEach((b, dy) => { if (!palette.has(b)) palette.set(b, palette.size); bloecke.push({ pos: tag('list', { elem: 'int', items: [dx, dy, dz] }), state: tag('int', palette.get(b)) }); });
  }
  return schreibeNbt({ name: '', type: 'compound', value: {
    DataVersion: tag('int', dataVersion),
    size: tag('list', { elem: 'int', items: [KACHEL, Y1 - Y0 + 1, KACHEL] }),
    palette: tag('list', { elem: 'compound', items: [...palette.keys()].map(zustand) }),
    blocks: tag('list', { elem: 'compound', items: bloecke }),
    entities: tag('list', { elem: 'compound', items: [] }),
  } });
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('tools/schem-aufschuettung.mjs')) {
  const [welt, aus] = process.argv.slice(2);
  const dir = existsSync(join(welt, 'dimensions/minecraft/overworld/region')) ? join(welt, 'dimensions/minecraft/overworld/region') : join(welt, 'region');
  const kacheln = new Map(); // "kx,kz" → { spalten: Map, biom: Set "x,z" (4er-Zellen) }
  let dataVersion = 0, n = 0;
  for (const f of readdirSync(dir)) {
    const [, rx, rz] = f.match(/r\.(-?\d+)\.(-?\d+)\.mca/).map(Number);
    for (let i = 0; i < 1024; i++) {
      const cx = rx * 32 + (i & 31), cz = rz * 32 + (i >> 5);
      let c; try { c = leseChunk(join(dir, f), cx, cz); } catch { continue; }
      if (!c?.sections) continue;
      const sek = new Map(c.sections.value.items.map((s) => [s.Y.value, s]));
      const b3 = sek.get(3); let hatPilz = false;
      for (let z = 0; z < 16 && !hatPilz; z += 4) for (let x = 0; x < 16; x += 4) if (biomZelle(b3, x, z) === PILZ) { hatPilz = true; break; }
      if (!hatPilz) continue;
      dataVersion ||= c.DataVersion?.value ?? 0;
      const bl = new Map(); for (let y = 2; y <= 5; y++) { const s = sek.get(y); if (s?.block_states) bl.set(y, sektionsBloecke(s)); }
      for (let z = 0; z < 16; z++) for (let x = 0; x < 16; x++) {
        if (biomZelle(b3, x, z) !== PILZ) continue;
        const spalte = [];
        for (let y = Y0; y <= Y1; y++) { const s = bl.get(Math.floor(y / 16)); spalte.push(s ? s[(y & 15) * 256 + z * 16 + x] : 'minecraft:air'); }
        const boden = bodenSpalte(spalte); if (!boden) continue;
        const wx = cx * 16 + x, wz = cz * 16 + z, kx = Math.floor(wx / KACHEL), kz = Math.floor(wz / KACHEL), k = `${kx},${kz}`;
        if (!kacheln.has(k)) kacheln.set(k, { spalten: new Map(), biom: new Set() });
        const kk = kacheln.get(k); kk.spalten.set(`${wx - kx * KACHEL},${wz - kz * KACHEL}`, boden); kk.biom.add(`${wx >> 2},${wz >> 2}`); n++;
      }
    }
  }
  const fn = join(aus, 'data/aufschuettung/function'), st = join(aus, 'data/aufschuettung/structure');
  mkdirSync(fn, { recursive: true }); mkdirSync(st, { recursive: true });
  writeFileSync(join(aus, 'pack.mcmeta'), JSON.stringify({ pack: { description: 'CA12-Aufschüttung (nur lokal, nicht im Repo)', min_format: [121, 0], max_format: [121, 0] } }, null, 2));
  const liste = [...kacheln.keys()].sort();
  liste.forEach((k, i) => {
    const [kx, kz] = k.split(',').map(Number), x1 = kx * KACHEL, z1 = kz * KACHEL, x2 = x1 + KACHEL - 1, z2 = z1 + KACHEL - 1;
    writeFileSync(join(st, `k${i}.nbt`), kachelStruktur(kacheln.get(k).spalten, dataVersion));
    // Biom in 4er-Zellen, zu Zeilen zusammengefasst (fillbiome-Grenze 32768 Zellen-Blöcke: 4 × Länge × 128)
    const zellen = [...kacheln.get(k).biom].map((s) => s.split(',').map(Number)).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
    const bio = []; for (let j = 0; j < zellen.length;) { let e = j; while (e + 1 < zellen.length && zellen[e + 1][1] === zellen[j][1] && zellen[e + 1][0] === zellen[e][0] + 1 && e - j < 15) e++; bio.push(`fillbiome ${zellen[j][0] * 4} 32 ${zellen[j][1] * 4} ${zellen[e][0] * 4 + 3} 159 ${zellen[j][1] * 4 + 3} minecraft:mushroom_fields`); j = e + 1; }
    writeFileSync(join(fn, `k${i}_a.mcfunction`), `forceload add ${x1} ${z1} ${x2} ${z2}\nschedule function aufschuettung:k${i}_b 40t\n`);
    writeFileSync(join(fn, `k${i}_b.mcfunction`), [`place template aufschuettung:k${i} ${x1} ${Y0} ${z1}`, ...bio, `forceload remove ${x1} ${z1} ${x2} ${z2}`,
      i + 1 < liste.length ? `schedule function aufschuettung:k${i + 1}_a 2t` : 'say Aufschüttung fertig'].join('\n') + '\n');
  });
  writeFileSync(join(fn, 'start.mcfunction'), `say Aufschüttung startet: ${liste.length} Kacheln\nschedule function aufschuettung:k0_a 1t\n`);
  console.log(`${n} Spalten in ${liste.length} Kacheln → ${aus}`);
}
