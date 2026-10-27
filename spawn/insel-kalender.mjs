// Winterkalender auf der Spawn-Insel (Pascal 27.10.): Wand mit 24 nummerierten Türchen, Türchen X ab Tag X, jeder Spieler einmal je Türchen
// (auch nachträglich), Belohnung direkt ins Inventar (give lässt bei vollem Inventar fallen).
// Aufruf: node spawn/insel-kalender.mjs [standort.json] [ausgabeordner]   → <ausgabe>/datapack/insel-kalender/ (Namensraum insel)
// Ganz aus Anzeige-Entities (Tag insel_kalender): kalender_an / kalender_aus bauen ihn rückstandslos auf und ab.
// Tag: #tag insel_kalender (0 = alles zu). Täglich function insel:kalender/naechster_tag (AMP-Aufgabe der Server-Session),
// zum Testen function insel:kalender/tag {tag:N}.
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const txt = (text, extra = {}) => JSON.stringify({ text, ...extra });
const ROT = 'left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f]';
const ZU = { color: 'gray' }, OFFEN = { color: 'gold', bold: true };

export function kalender(kal) {
  const { x: wx, y: wy, z: wz, spalten = 6, reihen = 4, reihenfolge, belohnungen } = kal;
  // Wand: Mitte x wx, Unterkante wy, Vorderseite bei z wz (zeigt nach Norden, −z, zum Spawn)
  const b = spalten + 0.6, h = reihen + 1.2, x0 = wx - b / 2;
  const block = (x, y, z, st, sx, sy, sz, extra = '') => `summon block_display ${x} ${y} ${z} {block_state:"${st}",transformation:{${ROT},translation:[0f,0f,0f],scale:[${sx}f,${sy}f,${sz}f]}${extra},Tags:["insel_kalender"]}`;
  const schrift = (x, y, z, text, gr, tags = []) => `summon text_display ${x} ${y} ${z} {text:${text},Rotation:[180f,0f],billboard:"fixed",background:0,shadow:1b,transformation:{${ROT},translation:[0f,0f,0f],scale:[${gr}f,${gr}f,${gr}f]},brightness:{sky:15,block:15},Tags:${JSON.stringify(['insel_kalender', ...tags])}}`;
  const an = [
    // Rückwand aus Fichtenbrettern, Rahmen aus entrindetem Holz, Schneekappe oben
    block(x0, wy, wz, 'minecraft:spruce_planks', b, h, 0.25),
    block(x0 - 0.15, wy, wz - 0.05, 'minecraft:stripped_spruce_log', 0.2, h, 0.35), block(x0 + b - 0.05, wy, wz - 0.05, 'minecraft:stripped_spruce_log', 0.2, h, 0.35),
    block(x0 - 0.15, wy + h - 0.1, wz - 0.05, 'minecraft:stripped_spruce_log', b + 0.3, 0.25, 0.35), block(x0 - 0.15, wy - 0.1, wz - 0.05, 'minecraft:stripped_spruce_log', b + 0.3, 0.2, 0.35),
    block(x0 - 0.25, wy + h + 0.15, wz - 0.15, 'minecraft:snow_block', b + 0.5, 0.18, 0.55),
    schrift(wx, wy + reihen + 0.35, wz - 0.06, `[${txt('Winterkalender', { color: 'white', bold: true })}]`, 1.4),
  ];
  const f = {};
  const tueren = [];
  for (let r = 0; r < reihen; r++) for (let s = 0; s < spalten; s++) {
    const i = r * spalten + s, n = reihenfolge[i];
    const cx = x0 + 0.3 + s + 0.5, cy = wy + 0.3 + (reihen - 1 - r) + 0.05, farbe = ['minecraft:red_concrete', 'minecraft:green_concrete', 'minecraft:white_concrete'][(r + s) % 3];
    tueren.push({ n, cx, cy });
    an.push(block(cx - 0.42, cy, wz - 0.06, farbe, 0.84, 0.84, 0.06),
      block(cx - 0.05, cy, wz - 0.07, 'minecraft:gold_block', 0.1, 0.84, 0.02),
      schrift(cx, cy + 0.22, wz - 0.08, txt(String(n), ZU), 1.6, [`insel_kal_n_${n}`]),
      `summon interaction ${cx} ${cy} ${wz - 0.35} {width:0.9f,height:0.88f,response:1b,Tags:["insel_kalender","insel_kal_klick","insel_kal_${n}"]}`);
  }
  const fl = `${Math.floor(x0)} ${Math.floor(wz) - 2} ${Math.ceil(x0 + b)} ${Math.ceil(wz) + 1}`;
  f.kalender_an = `# Winterkalender aufbauen (Konsole/AMP): Chunks laden, dann setzen\nforceload add ${fl}\nschedule function insel:kalender/an2 40t\n`;
  f['kalender/an2'] = `kill @e[tag=insel_kalender]\n${an.join('\n')}\nfunction insel:kalender/anzeigen\nforceload remove ${fl}\nsay Winterkalender steht\n`;
  f.kalender_aus = `# Winterkalender abbauen (geöffnete Türchen der Spieler bleiben gespeichert)\nforceload add ${fl}\nschedule function insel:kalender/aus2 40t\n`;
  f['kalender/aus2'] = `kill @e[tag=insel_kalender]\nforceload remove ${fl}\nsay Winterkalender abgebaut\n`;
  f['kalender/load'] = `scoreboard objectives add insel_kalender dummy\nexecute unless score #tag insel_kalender matches 0.. run scoreboard players set #tag insel_kalender 0\n`;
  f['kalender/tick'] = `# Klicks auf Türchen; alle 5 s die Zahlen nach dem Tag einfärben (nur wenn die Wand geladen ist)
execute as @e[type=interaction,tag=insel_kal_klick] if data entity @s interaction run function insel:kalender/klick
scoreboard players add #takt insel_kalender 1
execute if score #takt insel_kalender matches 100.. run function insel:kalender/anzeigen
`;
  f['kalender/anzeigen'] = 'scoreboard players set #takt insel_kalender 0\n' + tueren.map(({ n }) =>
    `execute if score #tag insel_kalender matches ${n}.. run data merge entity @e[type=text_display,tag=insel_kal_n_${n},limit=1] {text:${txt(String(n), OFFEN)}}\n` +
    `execute unless score #tag insel_kalender matches ${n}.. run data merge entity @e[type=text_display,tag=insel_kal_n_${n},limit=1] {text:${txt(String(n), ZU)}}`).join('\n') + '\n';
  f['kalender/klick'] = `# Als das Interaction-Entity: Türchen nach Tag, ausgeführt als der klickende Spieler\n${tueren.map(({ n }) => `execute if entity @s[tag=insel_kal_${n}] on target at @s run function insel:kalender/tuer_${n}`).join('\n')}\ndata remove entity @s interaction\n`;
  for (const { n, cx, cy } of tueren) {
    f[`kalender/tuer_${n}`] = `execute unless score #tag insel_kalender matches ${n}.. run return run tellraw @s ${txt(`Türchen ${n} öffnet am ${n}. Dezember.`, { color: 'gray' })}
execute if entity @s[tag=insel_kal_hat_${n}] run return run tellraw @s ${txt(`Türchen ${n} hast du schon geöffnet.`, { color: 'gray' })}
tag @s add insel_kal_hat_${n}
${(belohnungen[n - 1] ?? []).map((g) => `give @s ${g}`).join('\n')}
tellraw @s [${txt(`Türchen ${n} `, { color: 'gold', bold: true })},${txt('ist offen – frohe Weihnachtszeit!', { color: 'white' })}]
playsound minecraft:entity.player.levelup master @s ~ ~ ~ 0.8 1.6
particle minecraft:firework ${cx} ${cy + 0.45} ${wz - 0.3} 0.25 0.25 0.05 0.03 25 normal @s
`;
  }
  f['kalender/naechster_tag'] = `# Täglich 00:00 ab 01.12. (AMP-Aufgabe): nächstes Türchen freigeben\nscoreboard players add #tag insel_kalender 1\nexecute if score #tag insel_kalender matches 25.. run scoreboard players set #tag insel_kalender 24\nfunction insel:kalender/anzeigen\ntellraw @a [${txt('Winterkalender: ', { color: 'gold', bold: true })},${txt('Ein neues Türchen ist offen – am Spawn!', { color: 'white' })}]\n`;
  f['kalender/tag'] = `# Zum Testen bzw. Nachstellen: function insel:kalender/tag {tag:N}\n$scoreboard players set #tag insel_kalender $(tag)\nfunction insel:kalender/anzeigen\n`;
  return { funktionen: f };
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('spawn/insel-kalender.mjs')) {
  const [konfig = join(REPO, 'spawn/standort-smp-spark.json'), aus = join(REPO, 'spawn')] = process.argv.slice(2);
  const k = JSON.parse(readFileSync(konfig, 'utf8'));
  const { funktionen } = kalender(k.kalender);
  const dp = join(aus, 'datapack/insel-kalender');
  rmSync(dp, { recursive: true, force: true });
  for (const [n, t] of Object.entries(funktionen)) { const p = join(dp, 'data/insel/function', `${n}.mcfunction`); mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, t); }
  // eigene load/tick-Funktionen, über die Funktions-Tags mit denen von insel zusammengeführt
  const ft = join(dp, 'data/minecraft/tags/function'); mkdirSync(ft, { recursive: true });
  for (const [n, t] of [['load', 'kalender/load'], ['tick', 'kalender/tick']]) writeFileSync(join(ft, `${n}.json`), `{ "values": ["insel:${t}"] }\n`);
  writeFileSync(join(dp, 'pack.mcmeta'), JSON.stringify({ pack: { description: 'Winterkalender der Spawn-Insel (insel:kalender_an / kalender_aus)', min_format: [121, 0], max_format: [121, 0] } }, null, 2) + '\n');
  console.log(`Datapack insel-kalender → ${dp} (${Object.keys(funktionen).length} Funktionen)`);
}
