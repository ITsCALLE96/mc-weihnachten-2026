// Weihnachtsdeko für die Spark-Insel (Pascal 27.10.), an- und abschaltbar: function insel:deko_an / insel:deko_aus
// Aufruf: node spawn/insel-deko.mjs [standort.json] [ausgabeordner]   → <ausgabe>/datapack/insel-deko/ (eigenes Datapack, Namensraum insel)
// Liest die Insel aus der lokalen Quelle (struktur.quelle, git-ignoriert) und rechnet daraus nur Positionen.
// Rückbaubar: Schmuck, Lichter, Stern und Geschenke sind Anzeige-Entities mit Tag insel_deko (kill). Echte Blöcke nur dort, wo vorher Luft war:
// Schnee (eine Lage) auf allen Oberflächen und Laternen am Wegrand, Kerzen am Podest. deko_aus entfernt genau diese Blockarten an genau diesen
// Stellen (Schnee in Scheiben über die ganze Insel, die Insel selbst hat keinen Schnee).
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lade, hole, LUFT } from '../tools/schem.mjs';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const FARBEN = ['minecraft:red_concrete', 'minecraft:gold_block', 'minecraft:blue_concrete', 'minecraft:white_concrete', 'minecraft:red_concrete', 'minecraft:lime_concrete'];
const zufall = (x, y, z) => { let h = (x * 374761393 + y * 668265263 + z * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

export function deko(k, m) {
  const [ox, oy, oz] = k.struktur.ursprung, d = k.deko;
  const W = (x, y, z) => hole(m, x - ox, y - oy, z - oz) ?? LUFT;
  const luft = (b) => b === LUFT;
  const anzeige = (x, y, z, block, gr, extra = '') => `summon block_display ${x} ${y} ${z} {block_state:{Name:"${block}"},transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[${-gr / 2}f,${-gr / 2}f,${-gr / 2}f],scale:[${gr}f,${gr}f,${gr}f]},brightness:{sky:15,block:15},Tags:["insel_deko"]${extra}}`;
  const an = [], schnee = [], laternen = [], kerzen = [];
  const NB = [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0, 1, 0]];

  // Schmuckkugeln am Weihnachtsbaum, Lichterketten an den anderen Bäumen: Laub mit Luft auf einer Seite, Anzeige knapp davor
  for (const [bi, [tx, tz]] of d.baeume.entries()) {
    const gross = bi === d.weihnachtsbaum;
    let n = 0;
    for (let y = 160; y < oy + m.h; y++) for (let z = tz - 7; z <= tz + 7; z++) for (let x = tx - 7; x <= tx + 7; x++) {
      if (!/leaves/.test(W(x, y, z))) continue;
      const nb = NB.find(([dx, dy, dz]) => luft(W(x + dx, y + dy, z + dz)) && (dy === 0 ? Math.sign(dx) === Math.sign(x - tx) || Math.sign(dz) === Math.sign(z - tz) : false));
      if (!nb || zufall(x, y, z) > (gross ? 0.22 : 0.09)) continue;
      const [dx, , dz] = nb, px = x + 0.5 + dx * 0.62, pz = z + 0.5 + dz * 0.62;
      an.push(gross ? anzeige(px, y + 0.5, pz, FARBEN[n % FARBEN.length], 0.32) : anzeige(px, y + 0.5, pz, 'minecraft:ochre_froglight', 0.16));
      n++;
    }
    if (gross) {
      let top = 0; for (let y = oy + m.h - 1; y > 0 && !top; y--) if (/leaves|log/.test(W(tx, y, tz))) top = y;
      an.push(`summon item_display ${tx + 0.5} ${top + 1.6} ${tz + 0.5} {item:{id:"minecraft:nether_star",count:1},billboard:"vertical",transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[2.5f,2.5f,2.5f]},brightness:{sky:15,block:15},Tags:["insel_deko"]}`);
      // Geschenke unter dem Baum: Karton (Wolle) mit goldenem Band
      d.geschenke.forEach(([dx, dz, farbe, gr], i) => {
        const gx = tx + dx + 0.5, gz = tz + dz + 0.5; let gy = 0; for (let y = 175; y > 140 && !gy; y--) if (!luft(W(tx + dx, y, tz + dz)) && !/leaves|log/.test(W(tx + dx, y, tz + dz))) gy = y + 1;
        const r = (i * 37) % 90;
        an.push(`summon block_display ${gx} ${gy} ${gz} {block_state:{Name:"${farbe}"},transformation:{left_rotation:[0f,${Math.sin(r * Math.PI / 360).toFixed(3)}f,0f,${Math.cos(r * Math.PI / 360).toFixed(3)}f],right_rotation:[0f,0f,0f,1f],translation:[${-gr / 2}f,0f,${-gr / 2}f],scale:[${gr}f,${gr}f,${gr}f]},Tags:["insel_deko"]}`,
          `summon block_display ${gx} ${gy} ${gz} {block_state:{Name:"minecraft:gold_block"},transformation:{left_rotation:[0f,${Math.sin(r * Math.PI / 360).toFixed(3)}f,0f,${Math.cos(r * Math.PI / 360).toFixed(3)}f],right_rotation:[0f,0f,0f,1f],translation:[${-gr / 2 - 0.01}f,-0.01f,-0.06f],scale:[${gr + 0.02}f,${gr + 0.02}f,0.12f]},Tags:["insel_deko"]}`,
          `summon block_display ${gx} ${gy} ${gz} {block_state:{Name:"minecraft:gold_block"},transformation:{left_rotation:[0f,${Math.sin(r * Math.PI / 360).toFixed(3)}f,0f,${Math.cos(r * Math.PI / 360).toFixed(3)}f],right_rotation:[0f,0f,0f,1f],translation:[-0.06f,-0.01f,${-gr / 2 - 0.01}f],scale:[0.12f,${gr + 0.02}f,${gr + 0.02}f]},Tags:["insel_deko"]}`);
      });
    }
  }

  // Schnee: eine Lage auf jeder Oberfläche (Gras, Weg, Laub, Stein), nicht auf Podest, Wasser oder Pflanzen
  for (let z = oz; z < oz + m.l; z++) for (let x = ox; x < ox + m.w; x++) {
    for (let y = oy + m.h - 2; y >= 150; y--) {
      const b = W(x, y, z);
      if (luft(b)) continue;
      if (/short_grass|fern|bush|flower|leaf_litter|petals|vine|fence|wall|slab|stairs|trapdoor|water|quartz|deepslate|sign|lantern|chain/.test(b)) break;
      if (luft(W(x, y + 1, z)) && !(x === d.kiste[0] && y + 1 === d.kiste[1] && z === d.kiste[2])) schnee.push([x, y + 1, z]);
      break;
    }
  }
  // Schnee auch auf jeder Laubstufe der Fichten (nicht nur auf der obersten): Laub mit Luft darüber
  const schon = new Set(schnee.map((p) => p.join()));
  for (const [tx, tz] of d.baeume) for (let y = 160; y < oy + m.h - 1; y++) for (let z = tz - 7; z <= tz + 7; z++) for (let x = tx - 7; x <= tx + 7; x++)
    if (/leaves/.test(W(x, y, z)) && luft(W(x, y + 1, z)) && !schon.has([x, y + 1, z].join())) { schnee.push([x, y + 1, z]); schon.add([x, y + 1, z].join()); }
  // Laternen am Wegrand (Gras neben Weg, alle paar Blöcke) und Kerzen an den Podestecken
  const weg = (b) => /coarse_dirt|rooted_dirt|mud$|packed_mud|dirt_path/.test(b);
  for (let z = oz; z < oz + m.l; z++) for (let x = ox; x < ox + m.w; x++) {
    let y = 0; for (let yy = 170; yy >= 150 && !y; yy--) if (!luft(W(x, yy, z))) y = yy;
    if (!y || !/grass_block|moss_block/.test(W(x, y, z)) || !luft(W(x, y + 1, z))) continue;
    if (!NB.slice(0, 4).some(([dx, , dz]) => weg(W(x + dx, y, z + dz)))) continue;
    const dist = Math.hypot(x - d.kiste[0], z - d.kiste[2]);
    if (dist < 6 || (Math.round(dist) % d.laternenAbstand) !== 0 || zufall(x, y, z) > 0.5) continue;
    laternen.push([x, y + 1, z]);
  }
  for (const [x, y, z, farbe] of d.kerzen) kerzen.push([x, y, z, `minecraft:${farbe}_candle[candles=3,lit=true]`]);
  const schneeHier = new Set(laternen.map((p) => p.join())); const schneeOhne = schnee.filter((p) => !schneeHier.has(p.join()));

  const [x1, z1, x2, z2] = [ox, oz, ox + m.w - 1, oz + m.l - 1];
  const f = {};
  f.deko_an = `# Weihnachtsdeko an (Konsole/AMP): Chunks laden, dann setzen\nforceload add ${x1} ${z1} ${x2} ${z2}\nschedule function insel:deko_an2 60t\n`;
  f.deko_an2 = ['# Erst aufräumen (doppeltes Anschalten schadet nicht), dann Schnee, Laternen, Kerzen, Schmuck', 'function insel:deko_weg',
    ...schneeOhne.map(([x, y, z]) => `setblock ${x} ${y} ${z} minecraft:snow keep`),
    ...laternen.map(([x, y, z]) => `setblock ${x} ${y} ${z} minecraft:lantern keep`),
    ...kerzen.map(([x, y, z, b]) => `setblock ${x} ${y} ${z} ${b} keep`),
    ...an, `forceload remove ${x1} ${z1} ${x2} ${z2}`,
    `say Weihnachtsdeko an: ${an.length} Anzeigen, ${schneeOhne.length} Schnee, ${laternen.length} Laternen, ${kerzen.length} Kerzen`].join('\n') + '\n';
  f.deko_aus = `# Weihnachtsdeko aus (nach der Season)\nforceload add ${x1} ${z1} ${x2} ${z2}\nschedule function insel:deko_aus2 60t\n`;
  f.deko_aus2 = `function insel:deko_weg\nforceload remove ${x1} ${z1} ${x2} ${z2}\nsay Weihnachtsdeko aus\n`;
  f.deko_weg = ['# Alles entfernen, was deko_an gesetzt hat (Chunks müssen geladen sein)', `kill @e[tag=insel_deko]`,
    ...Array.from({ length: m.w }, (_, i) => `fill ${ox + i} 150 ${z1} ${ox + i} ${oy + m.h - 1} ${z2} minecraft:air replace minecraft:snow`),
    ...laternen.map(([x, y, z]) => `fill ${x} ${y} ${z} ${x} ${y} ${z} minecraft:air replace minecraft:lantern`),
    ...kerzen.map(([x, y, z]) => `fill ${x} ${y} ${z} ${x} ${y} ${z} minecraft:air replace #minecraft:candles`)].join('\n') + '\n';
  return { funktionen: f, zahlen: { anzeigen: an.length, schnee: schneeOhne.length, laternen: laternen.length, kerzen: kerzen.length }, schnee: schneeOhne, laternen, kerzen };
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('spawn/insel-deko.mjs')) {
  const [konfig = join(REPO, 'spawn/standort-smp-spark.json'), aus = join(REPO, 'spawn')] = process.argv.slice(2);
  const k = JSON.parse(readFileSync(konfig, 'utf8'));
  const m = lade(readFileSync(join(REPO, k.struktur.quelle)));
  const { funktionen, zahlen } = deko(k, m);
  const dp = join(aus, 'datapack/insel-deko'), fn = join(dp, 'data/insel/function');
  rmSync(dp, { recursive: true, force: true }); mkdirSync(fn, { recursive: true });
  for (const [n, t] of Object.entries(funktionen)) writeFileSync(join(fn, `${n}.mcfunction`), t);
  writeFileSync(join(dp, 'pack.mcmeta'), JSON.stringify({ pack: { description: 'Weihnachtsdeko der Spawn-Insel (insel:deko_an / insel:deko_aus)', min_format: [121, 0], max_format: [121, 0] } }, null, 2) + '\n');
  console.log(`Datapack insel-deko → ${dp}: ${JSON.stringify(zahlen)}`);
}
