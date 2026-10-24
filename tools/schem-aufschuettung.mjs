// Baut die Aufschüttung des CA-Teams als saubere, natürliche Ebene nach: nur die Umrissform kommt aus der CA12-Welt (Biom Pilzland,
// Boden mindestens auf Meereshöhe), gefüllt wird gleichmäßig – Gras auf y 68, Erde darunter, Strand und sanfte Rampen zum Wasser
// und zu tieferem Gelände. Keine Wege, Fundamente oder Kanten von Spielerbauten. Höheres natürliches Gelände bleibt unberührt.
// Aufruf: node tools/schem-aufschuettung.mjs <ca12-welt> <26.3-welt, gleicher Seed, unverändert> <ausgabe: datapacks/aufschuettung>
// Danach in der Konsole: function aufschuettung:start   (lädt Kachel für Kachel, setzt Boden + Biom, meldet „Aufschüttung fertig“)
// Die Ausgabe enthält die Umrissform aus der CA12-Welt und gehört NICHT ins öffentliche Repo (nur lokal in die Welt).
import { readdirSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { leseChunk } from './schem-welt.mjs';
import { schreibeNbt, tag } from './nbt.mjs';

export const Y0 = 40, EBENE = 68, MEER = 62, STRAND = 64, KACHEL = 64;
const PILZ = 'minecraft:mushroom_fields';

// Kreisförmiges Ausdehnen/Abtragen einer Maske (Uint8Array w×h)
function morph(m, w, h, r, ausdehnen) {
  const o = new Uint8Array(m.length), off = [];
  for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) if (dx * dx + dz * dz <= r * r) off.push([dx, dz]);
  for (let z = 0; z < h; z++) for (let x = 0; x < w; x++) {
    let v = ausdehnen ? 0 : 1;
    for (const [dx, dz] of off) { const xx = x + dx, zz = z + dz; const n = xx < 0 || zz < 0 || xx >= w || zz >= h ? 0 : m[zz * w + xx]; if (ausdehnen ? n : !n) { v = ausdehnen ? 1 : 0; break; } }
    o[z * w + x] = v;
  }
  return o;
}
// Umriss glätten: kleine Buchten und Löcher schließen, dünne Stege und Vorsprünge (Stege, Brücken) entfernen
export function glaetten(m, w, h, schliessen = 4, oeffnen = 3) {
  const a = morph(morph(m, w, h, schliessen, true), w, h, schliessen, false);
  return morph(morph(a, w, h, oeffnen, false), w, h, oeffnen, true);
}

// Höhe je Landzelle: min(EBENE, Quelle + Abstand/2) über alle Quellen (Wasser = MEER, tieferes Nachbarland = dessen Höhe)
export function hoehen(land, quelle, w, h) {
  const d = new Float32Array(w * h).fill(Infinity), offen = [];
  for (let i = 0; i < w * h; i++) if (!land[i] && quelle[i] > -Infinity && quelle[i] < EBENE) { d[i] = quelle[i]; offen.push(i); }
  // einfache Dijkstra-Variante mit Eimern (Kosten 0,5 je Block, Diagonale 0,71)
  offen.sort((a, b) => d[a] - d[b]);
  const heap = [...offen]; const N8 = [[1, 0, 0.5], [-1, 0, 0.5], [0, 1, 0.5], [0, -1, 0.5], [1, 1, 0.71], [1, -1, 0.71], [-1, 1, 0.71], [-1, -1, 0.71]];
  const pq = new MinHeap(); for (const i of heap) pq.push(d[i], i);
  while (pq.size) { const [v, i] = pq.pop(); if (v > d[i]) continue; const x = i % w, z = (i / w) | 0;
    for (const [dx, dz, c] of N8) { const xx = x + dx, zz = z + dz; if (xx < 0 || zz < 0 || xx >= w || zz >= h) continue; const j = zz * w + xx; if (!land[j]) continue; const nv = v + c; if (nv < d[j] && nv < EBENE) { d[j] = nv; pq.push(nv, j); } } }
  const out = new Int16Array(w * h).fill(-999);
  for (let i = 0; i < w * h; i++) if (land[i]) out[i] = Math.floor(Math.min(EBENE, d[i]));
  return out;
}
class MinHeap { constructor() { this.a = []; } get size() { return this.a.length; }
  push(k, v) { const a = this.a; a.push([k, v]); let i = a.length - 1; while (i) { const p = (i - 1) >> 1; if (a[p][0] <= a[i][0]) break; [a[p], a[i]] = [a[i], a[p]]; i = p; } }
  pop() { const a = this.a, t = a[0], l = a.pop(); if (a.length) { a[0] = l; let i = 0; for (;;) { const L = 2 * i + 1, R = L + 1; let m = i; if (L < a.length && a[L][0] < a[m][0]) m = L; if (R < a.length && a[R][0] < a[m][0]) m = R; if (m === i) break; [a[m], a[i]] = [a[i], a[m]]; i = m; } } return t; } }

// Blocksäule von Y0 bis Oberkante y (Index 0 = Y0): Strand aus Sand/Sandstein, sonst Gras, 3 Erde, Stein
export function saeule(y) {
  const n = y - Y0 + 1, s = [];
  for (let i = 0; i < n; i++) { const t = n - 1 - i; // Tiefe unter der Oberkante
    if (y <= STRAND) s.push(t < 3 ? 'minecraft:sand' : t < 6 ? 'minecraft:sandstone' : 'minecraft:stone');
    else s.push(t === 0 ? 'minecraft:grass_block[snowy=false]' : t < 4 ? 'minecraft:dirt' : 'minecraft:stone'); }
  return s;
}

const zustand = (b) => { const m = b.match(/^([^[]+)(?:\[(.*)\])?$/); return { Name: tag('string', m[1]), ...(m[2] && { Properties: tag('compound', Object.fromEntries(m[2].split(',').map((p) => p.split('=')).map(([k, v]) => [k, tag('string', v)]))) }) }; };
export function kachelStruktur(spalten, hoeheMax) { // spalten: Map "dx,dz" → Oberkante y
  const palette = new Map(), bloecke = [];
  for (const [k, y] of spalten) { const [dx, dz] = k.split(',').map(Number);
    saeule(y).forEach((b, dy) => { if (!palette.has(b)) palette.set(b, palette.size); bloecke.push({ pos: tag('list', { elem: 'int', items: [dx, dy, dz] }), state: tag('int', palette.get(b)) }); }); }
  return schreibeNbt({ name: '', type: 'compound', value: {
    DataVersion: tag('int', 3955), // altes Palettenformat {Name, Properties}: mit 26.x-DataVersion würden die Einträge zu Luft, so wandelt Minecraft sie beim Laden um
    size: tag('list', { elem: 'int', items: [KACHEL, hoeheMax - Y0 + 1, KACHEL] }),
    palette: tag('list', { elem: 'compound', items: [...palette.keys()].map(zustand) }),
    blocks: tag('list', { elem: 'compound', items: bloecke }),
    entities: tag('list', { elem: 'compound', items: [] }),
  } });
}

// Funktionskette je Kachel: Chunks laden, warten bis alle 16 wirklich geladen sind (eine frische Welt erzeugt sie erst), dann einsetzen.
// Ein festes Warten reicht nicht: place template scheitert in Funktionen still, wenn ein Chunk noch fehlt.
export function schreibeKette(fn, i, anzahl, xa, za, bio) {
  const xb = xa + KACHEL - 1, zb = za + KACHEL - 1, geladen = [];
  for (let dz = 8; dz < KACHEL; dz += 16) for (let dx = 8; dx < KACHEL; dx += 16) geladen.push(`if loaded ${xa + dx} ${Y0} ${za + dz}`);
  writeFileSync(join(fn, `k${i}_a.mcfunction`), `forceload add ${xa} ${za} ${xb} ${zb}\nschedule function aufschuettung:k${i}_b 20t\n`);
  writeFileSync(join(fn, `k${i}_b.mcfunction`), [`execute store success score #geladen aufschuettung ${geladen.join(' ')}`,
    `execute if score #geladen aufschuettung matches 1 run function aufschuettung:k${i}_c`,
    `execute unless score #geladen aufschuettung matches 1 run schedule function aufschuettung:k${i}_b 20t`].join('\n') + '\n');
  writeFileSync(join(fn, `k${i}_c.mcfunction`), [`place template aufschuettung:k${i} ${xa} ${Y0} ${za}`, ...bio, `forceload remove ${xa} ${za} ${xb} ${zb}`,
    i + 1 < anzahl ? `schedule function aufschuettung:k${i + 1}_a 2t` : 'say Aufschüttung fertig'].join('\n') + '\n');
}

// Höhenkarten (MOTION_BLOCKING_NO_LEAVES, OCEAN_FLOOR) und optional das Biom auf Meereshöhe aller Chunks einer Welt
function hm(longs) { const out = new Int16Array(256); for (let i = 0; i < 256; i++) { const l = BigInt.asUintN(64, longs[Math.floor(i / 7)]); out[i] = Number((l >> BigInt((i % 7) * 9)) & 511n) - 64; } return out; }
function biomeZellen(sek) { const bs = sek?.biomes?.value; if (!bs) return null; const pal = bs.palette.value.items.map((p) => (typeof p === 'string' ? p : p[''] ? p[''].value : (p.Name ?? p.id).value));
  const out = []; for (let z = 0; z < 4; z++) for (let x = 0; x < 4; x++) { let b = pal[0]; if (pal.length > 1 && bs.data) { const bits = Math.ceil(Math.log2(pal.length)), per = Math.floor(64 / bits), idx = 48 + z * 4 + x; const l = BigInt.asUintN(64, bs.data.value[Math.floor(idx / per)]); b = pal[Number((l >> BigInt((idx % per) * bits)) & ((1n << BigInt(bits)) - 1n))]; } out.push(b); } return out; }
export function leseKarte(welt, mitBiom) {
  const dir = existsSync(join(welt, 'dimensions/minecraft/overworld/region')) ? join(welt, 'dimensions/minecraft/overworld/region') : join(welt, 'region');
  const chunks = new Map();
  for (const f of readdirSync(dir)) { const [, rx, rz] = f.match(/r\.(-?\d+)\.(-?\d+)\.mca/).map(Number);
    for (let i = 0; i < 1024; i++) { const cx = rx * 32 + (i & 31), cz = rz * 32 + (i >> 5); let c; try { c = leseChunk(join(dir, f), cx, cz); } catch { continue; }
      const H = c?.Heightmaps?.value; if (!H?.OCEAN_FLOOR || !(H.MOTION_BLOCKING_NO_LEAVES ?? H.MOTION_BLOCKING)) continue;
      const e = { oben: hm((H.MOTION_BLOCKING_NO_LEAVES ?? H.MOTION_BLOCKING).value), boden: hm(H.OCEAN_FLOOR.value) };
      if (mitBiom) e.biom = biomeZellen(c.sections.value.items.find((s) => s.Y.value === 3));
      chunks.set(`${cx},${cz}`, e); } }
  return chunks;
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('tools/schem-aufschuettung.mjs')) {
  const [ca12, w263, aus] = process.argv.slice(2);
  const A = leseKarte(ca12, true), B = leseKarte(w263, false);
  // Umriss aus CA12: Pilzland-Zellen, deren Boden (ohne Wasser) mindestens auf Meereshöhe liegt
  let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity;
  for (const [k, e] of A) { if (!e.biom?.includes(PILZ)) continue; const [cx, cz] = k.split(',').map(Number); x0 = Math.min(x0, cx * 16); z0 = Math.min(z0, cz * 16); x1 = Math.max(x1, cx * 16 + 15); z1 = Math.max(z1, cz * 16 + 15); }
  x0 -= 16; z0 -= 16; x1 += 16; z1 += 16;
  const w = x1 - x0 + 1, h = z1 - z0 + 1, roh = new Uint8Array(w * h), quelle = new Float32Array(w * h).fill(-Infinity), h26 = new Int16Array(w * h).fill(-999);
  for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
    const i = (z - z0) * w + (x - x0), k = `${x >> 4},${z >> 4}`, j = (z & 15) * 16 + (x & 15);
    const a = A.get(k); if (a?.biom?.[((z & 15) >> 2) * 4 + ((x & 15) >> 2)] === PILZ && a.boden[j] - 1 >= MEER + 1) roh[i] = 1;
    const b = B.get(k); if (!b) continue; const top = b.oben[j] - 1; h26[i] = top;
    quelle[i] = b.boden[j] < b.oben[j] ? MEER : top; // Wasser oben → Meereshöhe, sonst Geländehöhe
  }
  const land = glaetten(roh, w, h);
  const H = hoehen(land, quelle, w, h);
  const kacheln = new Map(); let n = 0, hmax = Y0;
  for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
    const i = (z - z0) * w + (x - x0); const y = H[i]; if (y < MEER) continue;
    if (h26[i] >= y && quelle[i] !== MEER) continue; // natürliches Gelände ist schon so hoch – nicht anfassen
    const kx = Math.floor(x / KACHEL), kz = Math.floor(z / KACHEL), k = `${kx},${kz}`;
    if (!kacheln.has(k)) kacheln.set(k, { spalten: new Map(), biom: new Set() });
    kacheln.get(k).spalten.set(`${x - kx * KACHEL},${z - kz * KACHEL}`, y); kacheln.get(k).biom.add(`${x >> 2},${z >> 2}`); n++; hmax = Math.max(hmax, y);
  }
  const fn = join(aus, 'data/aufschuettung/function'), st = join(aus, 'data/aufschuettung/structure');
  mkdirSync(fn, { recursive: true }); mkdirSync(st, { recursive: true });
  writeFileSync(join(aus, 'pack.mcmeta'), JSON.stringify({ pack: { description: 'Aufschüttung nach CA12-Umriss (nur lokal, nicht im Repo)', min_format: [121, 0], max_format: [121, 0] } }, null, 2));
  const liste = [...kacheln.keys()].sort();
  liste.forEach((k, i) => {
    const [kx, kz] = k.split(',').map(Number), xa = kx * KACHEL, za = kz * KACHEL, xb = xa + KACHEL - 1, zb = za + KACHEL - 1;
    writeFileSync(join(st, `k${i}.nbt`), kachelStruktur(kacheln.get(k).spalten, hmax));
    const zellen = [...kacheln.get(k).biom].map((s) => s.split(',').map(Number)).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
    const bio = []; for (let j = 0; j < zellen.length;) { let e = j; while (e + 1 < zellen.length && zellen[e + 1][1] === zellen[j][1] && zellen[e + 1][0] === zellen[e][0] + 1 && e - j < 15) e++; bio.push(`fillbiome ${zellen[j][0] * 4} 32 ${zellen[j][1] * 4} ${zellen[e][0] * 4 + 3} 159 ${zellen[j][1] * 4 + 3} minecraft:mushroom_fields`); j = e + 1; }
    schreibeKette(fn, i, liste.length, xa, za, bio);
  });
  writeFileSync(join(fn, 'start.mcfunction'), `scoreboard objectives add aufschuettung dummy\nsay Aufschüttung startet: ${liste.length} Kacheln\nschedule function aufschuettung:k0_a 1t\n`);
  console.log(`Umriss ${roh.reduce((s, v) => s + v, 0)} → geglättet ${land.reduce((s, v) => s + v, 0)} Zellen, ${n} Spalten gefüllt, ${liste.length} Kacheln, höchste Oberkante ${hmax} → ${aus}`);
}
