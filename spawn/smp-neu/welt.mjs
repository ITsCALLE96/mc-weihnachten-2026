// Hilfen für den SMP-Neuaufbau (spawn/smp-neu/README.md). Liest die Welt nur, Ausgaben gehen in die genannten Dateien.
//   node spawn/smp-neu/welt.mjs seed-sichern <welt> <datei>     – Seed in eine git-ignorierte Datei, ohne ihn auszugeben
//   node spawn/smp-neu/welt.mjs plan <welt> <lage.json>         – Versatz dx/dy/dz gegenüber der Bau-Lage, Bodenhöhe, Ausschlussgründe
//   node spawn/smp-neu/welt.mjs angleichen <welt> <lage.json> <datapack-ordner>
//                                                               – Funktionen insel:angleichen/* (Weltkoordinaten): Gelände unter und um die Insel angleichen
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { leseNbt } from '../../tools/nbt.mjs';
import { klar, ausschneiden } from '../../tools/schem-welt.mjs';
import { hole } from '../../tools/schem.mjs';

// Bau-Lage: alle Generatoren (standort-smp-spark.json, insel-*, weihnachtsinsel) rechnen mit dem Spawn bei 0/48 und dem Boden der Rückweg-Plattform auf y 66
export const BAU = { x: 0, z: 48, boden: 66 };
// Bereiche in Bau-Lage: Insel (Kreis um die Ovalmitte, Unterkante 89), Weihnachtsinsel (Kasten, Unterkante 100), Lichtung um die Rückweg-Plattform
export const BEREICHE = {
  insel: { x: -1, z: 47, r: 30, unterkante: 89 },
  weihnachtsinsel: { x1: -24, z1: -58, x2: 23, z2: 29, unterkante: 100 },
  lichtung: { r: 9, rand: 10 },
  abstand: 6, // so viel Luft bleibt mindestens zwischen Gelände und Inselunterkante
  hang: 1.5, // so steil steigt das Gelände außerhalb der Kappung wieder an (Blöcke je Block)
};
const R = 72; // ausgelesener Umkreis um den Spawn

export function seedLesen(welt) {
  for (const p of [['dimensions', 'minecraft', 'overworld', 'data', 'minecraft', 'world_gen_settings.dat'], ['data', 'minecraft', 'world_gen_settings.dat']]) {
    const f = join(welt, ...p);
    if (!existsSync(f)) continue;
    const w = leseNbt(readFileSync(f)).value;
    const s = (w.data?.value ?? w).seed?.value;
    if (s !== undefined) return s.toString();
  }
  const d = leseNbt(readFileSync(join(welt, 'level.dat'))).value.Data.value;
  const s = d.WorldGenSettings?.value.seed?.value ?? d.RandomSeed?.value;
  if (s === undefined) throw new Error('Seed nicht gefunden');
  return s.toString();
}

export function weltSpawn(welt) {
  const d = leseNbt(readFileSync(join(welt, 'level.dat'))).value.Data.value;
  if (d.spawn) return klar(d.spawn).pos;
  return [d.SpawnX.value, d.SpawnY.value, d.SpawnZ.value];
}

const name = (b) => (b ?? 'minecraft:air').split('[')[0];
const LUFT = /^minecraft:(cave_|void_)?air$/;
// kein Boden: Pflanzen, Bäume, Schnee-Lage, Pilze …
const PFLANZE = /(leaves|_log|_wood|vine|short_grass|tall_grass|fern|flower|bush|^minecraft:snow$|mushroom|sugar_cane|bamboo|kelp|seagrass|lily_pad|dandelion|poppy|tulip|orchid|allium|bluet|daisy|cornflower|lilac|rose|peony|sunflower|pumpkin|melon|cactus|azalea|moss_carpet|pale_hanging|leaf_litter|firefly|cocoa|berry|dripleaf|spore|propagule|roots$|wildflowers|torchflower|pitcher|cobweb|_carpet)/;
const WASSER = /^minecraft:(water|bubble_column)$/;

// Höhenkarte um den Spawn: oberster Bodenblock je Spalte (Wasser zählt als Oberfläche, Pflanzen/Bäume nicht)
export function gelaende(welt, sx, sz) {
  const Y0 = -10, Y1 = 220, A = [sx - R, Y0, sz - R];
  const m = ausschneiden(welt, A, [sx + R, Y1, sz + R]);
  const N = 2 * R + 1, h = new Int16Array(N * N), top = [], unter = [], wasser = new Uint8Array(N * N), krone = new Int16Array(N * N);
  for (let i = 0; i < N; i++) for (let k = 0; k < N; k++) {
    let y = Y1, kr = Y0 - 1;
    for (; y >= Y0; y--) {
      const b = name(hole(m, i, y - Y0, k));
      if (LUFT.test(b)) continue;
      if (kr < Y0) kr = y;
      if (!PFLANZE.test(b)) break;
    }
    const j = k * N + i, b = name(hole(m, i, y - Y0, k));
    h[j] = y; krone[j] = kr; wasser[j] = WASSER.test(b) ? 1 : 0; top[j] = b; unter[j] = name(hole(m, i, y - 1 - Y0, k));
  }
  return { N, x0: sx - R, z0: sz - R, h, top, unter, wasser, krone, at: (x, z) => (z - (sz - R)) * N + (x - (sx - R)) };
}

const median = (a) => { const s = [...a].sort((p, q) => p - q); return s[Math.floor(s.length / 2)]; };

export function plan(welt) {
  const [x, , z] = weltSpawn(welt);
  const dx = x - BAU.x, dz = z - BAU.z;
  const g = gelaende(welt, x, z);
  const kern = [], nass = [];
  for (let i = -13; i <= 13; i++) for (let k = -13; k <= 13; k++) if (i * i + k * k <= 169) { const j = g.at(x + i, z + k); (g.wasser[j] ? nass : kern).push(g.h[j]); }
  const boden = kern.length ? median(kern) : 63;
  const gruende = [];
  if (nass.length > 0.6 * (kern.length + nass.length)) gruende.push(`Spawn größtenteils im Wasser (${nass.length} von ${kern.length + nass.length} Spalten um die Plattform)`);
  if (boden > 200) gruende.push(`Boden an der Plattform auf y ${boden}, zu hoch für die schwebende Insel`);
  const dy = boden - BAU.boden;
  return { dx, dy, dz, boden, weltSpawn: [x, boden + 1, z], spawn: [BAU.x + dx, 156 + dy, BAU.z + dz], ausschluss: gruende };
}

const glatt = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));

// Ziel-Höhe je Spalte: Lichtung eben auf boden mit weichem Übergang, unter Insel/Weihnachtsinsel gekappt (Abstand zur Unterkante), Kappung läuft schräg aus
export function zielHoehen(g, lage) {
  const { dx, dy, dz, boden } = lage, B = BEREICHE, L = B.lichtung;
  const px = BAU.x + dx, pz = BAU.z + dz, ix = B.insel.x + dx, iz = B.insel.z + dz, W = B.weihnachtsinsel;
  const kappeInsel = B.insel.unterkante + dy - B.abstand, kappeWi = W.unterkante + dy - B.abstand;
  const ziel = new Int16Array(g.N * g.N), kappen = new Float32Array(g.N * g.N);
  for (let i = 0; i < g.N; i++) for (let k = 0; k < g.N; k++) {
    const x = g.x0 + i, z = g.z0 + k, j = k * g.N + i, h = g.h[j];
    let t = h;
    const r = Math.hypot(x - px, z - pz);
    // auch über Wasser: die Lichtung läuft als Strand bis zur Wasserlinie aus (keine senkrechte Kante am Ufer)
    t = Math.round(boden + (h - boden) * glatt((r - L.r) / L.rand));
    // Kappung: innen fest, außen steigt die erlaubte Höhe mit „hang“ je Block Abstand
    const ri = Math.max(0, Math.hypot(x - ix, z - iz) - B.insel.r);
    const rw = Math.hypot(Math.max(W.x1 + dx - x, 0, x - (W.x2 + dx)), Math.max(W.z1 + dz - z, 0, z - (W.z2 + dz)));
    const kappe = Math.min(kappeInsel + ri * B.hang, kappeWi + rw * B.hang);
    if (t > kappe) t = Math.floor(kappe);
    ziel[j] = t; kappen[j] = kappe;
  }
  ziel.kappen = kappen;
  return ziel;
}

const BODEN_ERSATZ = (b) => (/grass_block|podzol|mycelium|dirt|moss_block|rooted/.test(b) ? 'minecraft:dirt' : /sand$/.test(b) ? b.replace('sand', 'sandstone').replace('red_sandstone', 'red_sandstone') : b);

export function angleichenBefehle(g, ziel) {
  const out = [];
  let tiefer = 0, hoeher = 0, baum = 0;
  for (let i = 0; i < g.N; i++) for (let k = 0; k < g.N; k++) {
    const j = k * g.N + i, h = g.h[j], t = ziel[j], x = g.x0 + i, z = g.z0 + k;
    // Bäume, die in die Insel ragen würden (Krone über der Kappung): ganze Spalte über dem Boden von Stamm und Laub räumen
    if (t === h && g.krone[j] > h && g.krone[j] >= ziel.kappen[j]) { baum++; for (const tag of ['#minecraft:logs', '#minecraft:leaves']) out.push(`fill ${x} ${h + 1} ${z} ${x} ${g.krone[j]} ${z} minecraft:air replace ${tag}`); continue; }
    if (t === h) continue;
    const nass = WASSER.test(g.top[j]);
    // aufgefülltes Wasser: knapp über der Wasserlinie Sand (Strand), höher Gras
    const oben = nass ? (t <= h + 2 ? 'minecraft:sand' : 'minecraft:grass_block') : g.top[j];
    const darunter = LUFT.test(g.unter[j]) || WASSER.test(g.unter[j]) ? 'minecraft:dirt' : g.unter[j];
    if (t < h) {
      tiefer++;
      // alles über dem neuen Boden weg (Gelände und Bäume darauf), neue Oberfläche wie vorher, darunter 3 Lagen wie vorher unter der Oberfläche
      out.push(`fill ${x} ${t + 1} ${z} ${x} ${Math.max(h, g.krone[j])} ${z} minecraft:air`);
      out.push(`setblock ${x} ${t} ${z} ${oben}`);
      out.push(`fill ${x} ${t - 3} ${z} ${x} ${t - 1} ${z} ${BODEN_ERSATZ(darunter) === 'minecraft:dirt' && /grass|podzol|mycelium/.test(oben) ? 'minecraft:dirt' : darunter} replace #minecraft:base_stone_overworld`);
    } else {
      hoeher++;
      // Senke auffüllen: Pflanzen und Wasser darüber werden ersetzt, Bäume auf der Spalte verschwinden
      if (g.krone[j] > h) out.push(`fill ${x} ${h + 1} ${z} ${x} ${g.krone[j]} ${z} minecraft:air`);
      // Wasser darunter bis 6 tief mit festem Block füllen, damit Sand nicht abrutscht
      if (nass) out.push(`fill ${x} ${h - 6} ${z} ${x} ${t - 1} ${z} ${oben === 'minecraft:sand' ? 'minecraft:sandstone' : 'minecraft:dirt'} replace #minecraft:replaceable`);
      else if (t - 1 > h) out.push(`fill ${x} ${h + 1} ${z} ${x} ${t - 1} ${z} ${/grass|podzol|mycelium/.test(oben) ? 'minecraft:dirt' : darunter}`);
      out.push(`setblock ${x} ${t} ${z} ${oben === 'minecraft:grass_block' || /dirt|podzol/.test(oben) ? oben : oben}`);
    }
  }
  return { befehle: out, tiefer, hoeher, baum };
}

// Bäume, deren Stamm durch das Angleichen fehlt: Laub und Stämme über der neuen Oberfläche im Ring um die geänderten Spalten (4 Blöcke) räumen
export function baumReste(g, ziel) {
  const geaendert = (i, k) => { if (i < 0 || k < 0 || i >= g.N || k >= g.N) return false; const j = k * g.N + i; return ziel[j] !== g.h[j] || (g.krone[j] > g.h[j] && g.krone[j] >= ziel.kappen[j]); };
  const out = [];
  for (let i = 0; i < g.N; i++) for (let k = 0; k < g.N; k++) {
    const j = k * g.N + i;
    if (geaendert(i, k) || g.krone[j] <= g.h[j]) continue;
    let nah = false;
    for (let a = -4; a <= 4 && !nah; a++) for (let b = -4; b <= 4 && !nah; b++) nah = geaendert(i + a, k + b);
    if (!nah) continue;
    const x = g.x0 + i, z = g.z0 + k;
    for (const tag of ['#minecraft:logs', '#minecraft:leaves']) out.push(`fill ${x} ${g.h[j] + 1} ${z} ${x} ${g.krone[j]} ${z} minecraft:air replace ${tag}`);
  }
  return out;
}

export function angleichenDatapack(welt, lage, ordner) {
  const [sx, , sz] = [BAU.x + lage.dx, 0, BAU.z + lage.dz];
  const g = gelaende(welt, sx, sz);
  const ziel = zielHoehen(g, lage);
  const { befehle, tiefer, hoeher, baum } = angleichenBefehle(g, ziel);
  const alle = [...befehle, ...baumReste(g, ziel)];
  const fn = join(ordner, 'data', 'insel', 'function', 'angleichen');
  rmSync(fn, { recursive: true, force: true }); mkdirSync(fn, { recursive: true });
  const STUECK = 6000, teile = Math.max(1, Math.ceil(alle.length / STUECK));
  const fl = `${g.x0} ${g.z0} ${g.x0 + g.N - 1} ${g.z0 + g.N - 1}`;
  writeFileSync(join(fn, 'start.mcfunction'), `# Gelände unter und um die Insel angleichen (spawn/smp-neu/welt.mjs angleichen): ${tiefer} Spalten tiefer, ${hoeher} höher\nforceload add ${fl}\nschedule function insel:angleichen/pruefen 20t\n`);
  writeFileSync(join(fn, 'pruefen.mcfunction'), `execute unless loaded ${g.x0} 0 ${g.z0} run return run schedule function insel:angleichen/pruefen 20t\nexecute unless loaded ${g.x0 + g.N - 1} 0 ${g.z0 + g.N - 1} run return run schedule function insel:angleichen/pruefen 20t\nfunction insel:angleichen/teil_1\n`);
  for (let t = 1; t <= teile; t++) {
    const weiter = t < teile ? `schedule function insel:angleichen/teil_${t + 1} 2t\n` : `forceload remove ${fl}\nsay Gelaende angeglichen\n`;
    writeFileSync(join(fn, `teil_${t}.mcfunction`), alle.slice((t - 1) * STUECK, t * STUECK).join('\n') + '\n' + weiter);
  }
  return { tiefer, hoeher, baum, befehle: alle.length, teile };
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('spawn/smp-neu/welt.mjs')) {
  const [cmd, welt, datei, ordner] = process.argv.slice(2);
  if (cmd === 'seed-sichern') {
    writeFileSync(datei, seedLesen(welt) + '\n');
    console.log(`Seed gesichert nach ${datei} (nicht angezeigt)`);
  } else if (cmd === 'plan') {
    const p = plan(welt);
    writeFileSync(datei, JSON.stringify(p, null, 2) + '\n');
    console.log(JSON.stringify(p));
    if (p.ausschluss.length) process.exit(3);
  } else if (cmd === 'angleichen') {
    console.log(JSON.stringify(angleichenDatapack(welt, JSON.parse(readFileSync(datei, 'utf8')), ordner)));
  } else { console.error('Befehle: seed-sichern, plan, angleichen'); process.exit(1); }
}
