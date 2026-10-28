// Weihnachtliche Ausstellungshalle für den Mob-Zoo der Testwelt (Pascal 28.10., Schnittstelle der Server-Session: server/zoo/, Commit d0105d6).
// Nur Hülle: Wände, Decke, Dach, Lichterketten, Eingänge, Deko außen. Innen bleibt frei (Mobs, Schilder, Glaswürfel der Server-Session).
// Aufruf: node spawn/zoo-halle.mjs → spawn/datapack/zoo-halle (alles absolut, idempotent). Seit 28.10. abends (Pascal: Zoo offen, keine Halle)
// hängt #zoo:halle an zoo_halle:abriss, der die Halle restlos entfernt; zoo_halle:bau bleibt nur noch von Hand aufrufbar.
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const X1 = 116, X2 = 244, BODEN = -60; // Boden der Server-Session: Quarz y −61, Mobs auf y −60
// Flügel: z-Grenzen (Wände genau darauf), Deckenhöhe, Eingang (5 breit, 4 hoch) in der Westwand ab z
export const FLUEGEL = [
  { name: 'Friedlich', z1: -103, z2: -28, decke: -53, tuer: -101 },
  { name: 'Feindlich', z1: -20, z2: 27, decke: -52, tuer: -18 },
  { name: 'Bosse', z1: 35, z2: 73, decke: -44, tuer: 37 },
];
const B = (n) => `minecraft:${n}`;

export function fluegel({ z1, z2, decke, tuer }) {
  const c = [], fill = (a, b, bl) => c.push(`fill ${a.join(' ')} ${b.join(' ')} ${B(bl)}`), set = (p, bl) => c.push(`setblock ${p.join(' ')} ${B(bl)}`);
  const wand = (a, b) => fill(a, b, 'spruce_planks');
  const oben = decke - 1, hoch = decke - BODEN;
  // Wände: Sockel Fichte (2 Reihen), Fensterband aus Glas, bei hohen Hallen (Bosse) zwei Bänder mit Brüstung dazwischen, oben Balken; Pfosten alle 8
  const flaechen = [[[X1, z1], [X2, z1], 'x'], [[X1, z2], [X2, z2], 'x'], [[X1, z1], [X1, z2], 'z'], [[X2, z1], [X2, z2], 'z']];
  for (const [[ax, az], [bx, bz], achse] of flaechen) {
    wand([ax, BODEN, az], [bx, oben, bz]);
    const baender = hoch > 10 ? [[BODEN + 2, BODEN + 6], [BODEN + 8, oben - 2]] : [[BODEN + 2, oben - 2]];
    for (const [y1, y2] of baender) fill([ax, y1, az], [bx, y2, bz], 'glass');
    fill([ax, oben, az], [bx, oben, bz], `stripped_spruce_log[axis=${achse}]`);
    if (achse === 'x') for (let x = ax; x <= bx; x += 8) fill([x, BODEN, az], [x, oben - 1, az], 'stripped_spruce_log[axis=y]');
    else for (let z = az; z <= bz; z += 8) fill([ax, BODEN, z], [ax, oben - 1, z], 'stripped_spruce_log[axis=y]');
  }
  for (const [x, z] of [[X1, z1], [X1, z2], [X2, z1], [X2, z2]]) fill([x, BODEN, z], [x, oben, z], 'stripped_spruce_log[axis=y]');
  // Decke mit Froschlichtern alle 4 Blöcke, darunter unsichtbares Licht (nur in Luft, Schilder der Server-Session bleiben)
  fill([X1, decke, z1], [X2, decke, z2], 'spruce_planks');
  for (let x = X1 + 3; x < X2; x += 4) for (let z = z1 + 3; z < z2; z += 4) set([x, decke, z], 'ochre_froglight');
  for (let x = X1 + 1; x < X2; x += 4) c.push(`fill ${x} ${oben} ${z1 + 1} ${x} ${oben} ${z2 - 1} ${B('light[level=15]')} replace minecraft:air`);
  // hohe Halle (Bosse): zweite Lichtebene auf halber Höhe, ebenfalls nur in Luft
  if (hoch > 10) for (let x = X1 + 3; x < X2; x += 6) for (let z = z1 + 3; z < z2; z += 6) c.push(`fill ${x} ${BODEN + 7} ${z} ${x} ${BODEN + 7} ${z} ${B('light[level=15]')} replace minecraft:air`);
  // Dach: Schneeblöcke (schmelzen nicht), Rand mit Fichtengirlande, rote Schleifen und Laternen
  fill([X1, decke + 1, z1], [X2, decke + 1, z2], 'snow_block');
  for (const [[ax, az], [bx, bz]] of flaechen) fill([ax, decke + 1, az], [bx, decke + 1, bz], 'spruce_leaves[persistent=true]');
  for (let x = X1 + 4; x < X2; x += 8) for (const z of [z1, z2]) { set([x, decke + 1, z], 'red_wool'); set([x + 4, decke + 2, z], 'lantern'); }
  for (let z = z1 + 4; z < z2; z += 8) for (const x of [X1, X2]) { set([x, decke + 1, z], 'red_wool'); set([x, decke + 2, z + 4 < z2 ? z + 4 : z], 'lantern'); }
  // Lichterkette an der Traufe: jede dritte Deckenkante eine Kupferbirne (wechselnde Patina = wechselnde Farbe), leuchtet ohne Strom dauerhaft
  const birnen = ['waxed_copper_bulb', 'waxed_exposed_copper_bulb', 'waxed_weathered_copper_bulb', 'waxed_oxidized_copper_bulb'];
  let n = 0;
  for (let x = X1 + 1; x < X2; x += 3) for (const z of [z1, z2]) set([x, decke, z], `${birnen[n++ % 4]}[lit=true]`);
  for (let z = z1 + 1; z < z2; z += 3) for (const x of [X1, X2]) set([x, decke, z], `${birnen[n++ % 4]}[lit=true]`);
  // Schaugiebel an West- und Ostseite (Weihnachtsmarkt-Halle): Stufengiebel 1:2 aus Fichte mit Schneekanten, Kupferbirnen an der Kante, oben ein Stern
  const breite = z2 - z1, stufen = Math.floor(breite / 4);
  for (const x of [X1, X2]) {
    for (let k = 0; k < stufen; k++) {
      const y = decke + 2 + k, a = z1 + 2 * k + 1, b = z2 - 2 * k - 1; if (a > b) break;
      fill([x, y, a], [x, y, b], k % 4 === 3 ? 'stripped_spruce_log[axis=z]' : 'spruce_planks');
      for (const z of [a, b]) set([x, y + 1, z], 'snow_block');
      if (k % 2 === 0) for (const z of [a, b]) set([x, y, z], 'waxed_copper_bulb[lit=true]');
    }
    const mz = Math.round((z1 + z2) / 2), sy = decke + 2 + stufen;
    for (const [dy, dz] of [[0, 0], [1, 0], [2, 0], [1, -1], [1, 1]]) set([x, sy + dy, mz + dz], 'gold_block');
    set([x, sy + 1, mz], 'glowstone');
    // runde Rosette (Fenster) mit Kranz in der Giebelmitte
    const ry = decke + 2 + Math.floor(stufen / 3);
    for (let dz = -2; dz <= 2; dz++) for (let dy = -2; dy <= 2; dy++) { const r = Math.hypot(dz, dy); if (r <= 2.3) set([x, ry + dy, mz + dz], r > 1.5 ? 'spruce_leaves[persistent=true]' : 'yellow_stained_glass'); }
    set([x, ry - 2, mz], 'red_wool');
  }
  // Eingang (Westwand): Öffnung, Rahmen, Vordach mit Laternen, Kranz darüber, beidseits ein geschmücktes Bäumchen
  fill([X1, BODEN, tuer], [X1, BODEN + 3, tuer + 4], 'air');
  fill([X1 - 1, BODEN, tuer - 1], [X1 - 1, BODEN + 4, tuer - 1], 'stripped_spruce_log[axis=y]');
  fill([X1 - 1, BODEN, tuer + 5], [X1 - 1, BODEN + 4, tuer + 5], 'stripped_spruce_log[axis=y]');
  fill([X1 - 2, BODEN + 4, tuer - 1], [X1 - 1, BODEN + 4, tuer + 5], 'spruce_slab[type=bottom]');
  fill([X1 - 2, BODEN + 5, tuer - 1], [X1 - 1, BODEN + 5, tuer + 5], 'snow[layers=2]');
  for (const z of [tuer, tuer + 4]) set([X1 - 2, BODEN + 3, z], 'lantern[hanging=true]');
  const kz = tuer + 2, ky = Math.min(BODEN + 6, oben - 1);
  for (const [dy, dz] of [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]]) set([X1 - 1, ky + dy, kz + dz], 'spruce_leaves[persistent=true]');
  set([X1 - 1, ky - 1, kz], 'red_wool');
  for (const z of [tuer - 3, tuer + 7]) {
    const x = X1 - 5;
    fill([x, BODEN, z], [x, BODEN + 1, z], 'spruce_log');
    for (const [y, r] of [[BODEN + 2, 1], [BODEN + 3, 1], [BODEN + 4, 0]]) fill([x - r, y, z - r], [x + r, y, z + r], 'spruce_leaves[persistent=true]');
    set([x, BODEN + 5, z], 'gold_block');
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) set([x + dx, BODEN + 2, z + dz], 'red_wool');
    set([x + 1, BODEN + 3, z], 'waxed_copper_bulb[lit=true]'); set([x - 1, BODEN + 3, z], 'waxed_exposed_copper_bulb[lit=true]');
  }
  return c;
}

export function datapack() {
  const NS = 'zoo_halle', f = {};
  const zMin = Math.min(...FLUEGEL.map((w) => w.z1)) - 8, zMax = Math.max(...FLUEGEL.map((w) => w.z2)) + 2;
  const laden = `forceload add ${X1 - 8} ${zMin} ${X2 + 1} ${zMax}`;
  f.bau = `# Testwelt: weihnachtliche Ausstellungshalle um die drei Zoo-Flügel (Hülle, innen frei), von #zoo:halle nach dem Zoo-Aufbau gerufen; idempotent\n${laden}\nschedule function ${NS}:bau2 40t\n`;
  f.bau2 = FLUEGEL.flatMap((w) => [`# Flügel ${w.name} (z ${w.z1}…${w.z2}, Decke y ${w.decke})`, ...fluegel(w)]).join('\n') + `\nschedule function ${NS}:entladen 200t\n`;
  // erst nach dem Aufbau der Server-Session entladen (forceload zählt nicht mit)
  f.entladen = laden.replace('forceload add', 'forceload remove') + '\n';
  // Abriss (Pascal 28.10. abends: Zoo offen, keine Halle): jeden Kasten, den bau2 setzt, wieder zu Luft; Licht nur dort, wo es steht
  const leer = (z) => (z.includes(' replace ') ? z.replace(/minecraft:light\[level=15\] replace minecraft:air$/, 'minecraft:air replace minecraft:light')
    : z.startsWith('setblock') ? z.replace(/^(setblock \S+ \S+ \S+) .*$/, '$1 minecraft:air') : z.replace(/^(fill \S+ \S+ \S+ \S+ \S+ \S+) .*$/, '$1 minecraft:air'));
  f.abriss = `# Testwelt: Ausstellungshalle restlos abreißen (alles, was bau setzt), von #zoo:halle nach dem Zoo-Aufbau gerufen; idempotent\n${laden}\nschedule function ${NS}:abriss2 40t\n`;
  f.abriss2 = FLUEGEL.flatMap((w) => fluegel(w).map(leer)).join('\n') + `\nschedule function ${NS}:entladen 200t\n`;
  const dateien = Object.fromEntries(Object.entries(f).map(([n, t]) => [`data/${NS}/function/${n}.mcfunction`, t]));
  dateien['data/zoo/tags/function/halle.json'] = JSON.stringify({ values: [`${NS}:abriss`] }) + '\n';
  dateien['pack.mcmeta'] = JSON.stringify({ pack: { description: 'Zoo-Ausstellungshalle (Spawn & Welt, spawn/zoo-halle.mjs) – nur Testwelt', min_format: [121, 0], max_format: [121, 0] } }, null, 2) + '\n';
  return dateien;
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('spawn/zoo-halle.mjs')) {
  const dp = join(REPO, 'spawn/datapack/zoo-halle'), d = datapack();
  rmSync(dp, { recursive: true, force: true });
  for (const [n, t] of Object.entries(d)) { const p = join(dp, n); mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, t); }
  console.log(`Zoo-Halle → ${dp}: ${d['data/zoo_halle/function/bau2.mcfunction'].split('\n').length} Befehle`);
}
