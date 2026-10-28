// Winterkalender auf der Spawn-Insel (Pascal 27.10.): Wand mit 24 nummerierten Türchen, Türchen X ab Tag X, jeder Spieler einmal je Türchen
// (auch nachträglich), Belohnung direkt ins Inventar (give lässt bei vollem Inventar fallen).
// Aufruf: node spawn/insel-kalender.mjs [standort.json] [ausgabeordner]   → <ausgabe>/datapack/insel-kalender/ (Namensraum insel)
// Ganz aus Anzeige-Entities (Tag insel_kalender): kalender_an / kalender_aus bauen ihn rückstandslos auf und ab.
// Tag: #tag insel_kalender (0 = alles zu), setzt das Plugin serverwahl jede Minute aus dem Datum (Europe/Berlin); ohne Plugin täglich
// function insel:kalender/naechster_tag,
// zum Testen function insel:kalender/tag {tag:N} (mit serverwahl stattdessen kalender.fester-tag in dessen Config).
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
  f['kalender/load'] = `scoreboard objectives add insel_kalender dummy\nexecute unless score #tag insel_kalender matches 0.. run scoreboard players set #tag insel_kalender 0\nexecute unless score #zuletzt insel_kalender matches 0.. run scoreboard players operation #zuletzt insel_kalender = #tag insel_kalender\n`;
  f['kalender/tick'] = `# Klicks auf Türchen; alle 5 s die Zahlen nach dem Tag einfärben (nur wenn die Wand geladen ist)
execute as @e[type=interaction,tag=insel_kal_klick] if data entity @s interaction run function insel:kalender/klick
scoreboard players add #takt insel_kalender 1
execute if score #takt insel_kalender matches 100.. run function insel:kalender/anzeigen
# Tageswechsel (serverwahl setzt #tag jede Minute aus dem Datum): neues Türchen ankündigen
execute unless score #tag insel_kalender = #zuletzt insel_kalender run function insel:kalender/neuer_tag
`;
  f['kalender/neuer_tag'] = `execute if score #tag insel_kalender > #zuletzt insel_kalender if score #tag insel_kalender matches 1..24 run tellraw @a [${txt('Winterkalender: ', { color: 'gold', bold: true })},${txt('Ein neues Türchen ist offen – am Spawn!', { color: 'white' })}]
scoreboard players operation #zuletzt insel_kalender = #tag insel_kalender
function insel:kalender/anzeigen
`;
  f['kalender/anzeigen'] = 'scoreboard players set #takt insel_kalender 0\n' + tueren.map(({ n }) =>
    `execute if score #tag insel_kalender matches ${n}.. run data merge entity @e[type=text_display,tag=insel_kal_n_${n},limit=1] {text:${txt(String(n), OFFEN)}}\n` +
    `execute unless score #tag insel_kalender matches ${n}.. run data merge entity @e[type=text_display,tag=insel_kal_n_${n},limit=1] {text:${txt(String(n), ZU)}}`).join('\n') + '\n';
  f['kalender/klick'] = `# Als das Interaction-Entity: Türchen nach Tag, ausgeführt als der klickende Spieler\n${tueren.map(({ n }) => `execute if entity @s[tag=insel_kal_${n}] on target at @s run function insel:kalender/tuer_${n}`).join('\n')}\ndata remove entity @s interaction\n`;
  // Kurze Gebrauchshinweise in der Lore (Pascal 27.10.): Übersetzungsschlüssel mit deutschem fallback, grau und kursiv, hinter der Kalenderzeile
  const hinweis = (g, arten = []) => {
    const zeilen = arten.flatMap((art) => kal.hinweisTexte[art]).map(([schl, de]) => `{translate:"${schl}",fallback:"${de}",color:"gray",italic:true}`);
    return zeilen.length ? g.replace(/(Winterkalender 2026(?: – Tag \d+)?",italic:false,color:"aqua"\})/, `$1,${zeilen.join(',')}`) : g;
  };
  // Steigerung (Pascal 28.10.): Zugabe je Woche, gemeinsame Lore ohne Tag, damit sie über die Tage stapelt
  const gaben = (n) => [
    ...(belohnungen[n - 1] ?? []).map((g) => hinweis(g, kal.hinweise?.[n - 1])),
    ...(kal.zugaben?.[n - 1] ?? []).map(([name, anzahl]) => `${hinweis(kal.zugabeItems[name].item, kal.zugabeItems[name].hinweise)} ${anzahl}`),
  ];
  for (const { n, cx, cy } of tueren) {
    f[`kalender/tuer_${n}`] = `execute unless score #tag insel_kalender matches ${n}.. run return run tellraw @s ${txt(`Türchen ${n} öffnet am ${n}. Dezember.`, { color: 'gray' })}
execute if entity @s[tag=insel_kal_hat_${n}] run return run tellraw @s ${txt(`Türchen ${n} hast du schon geöffnet.`, { color: 'gray' })}
tag @s add insel_kal_hat_${n}
${gaben(n).map((g) => `give @s ${g}`).join('\n')}
tellraw @s [${txt(`Türchen ${n} `, { color: 'gold', bold: true })},${txt('ist offen – frohe Weihnachtszeit!', { color: 'white' })}]
playsound minecraft:entity.player.levelup master @s ~ ~ ~ 0.8 1.6
particle minecraft:firework ${cx} ${cy + 0.45} ${wz - 0.3} 0.25 0.25 0.05 0.03 25 normal @s
`;
  }
  f['kalender/naechster_tag'] = `# Täglich 00:00 ab 01.12. (AMP-Aufgabe): nächstes Türchen freigeben\nscoreboard players add #tag insel_kalender 1\nexecute if score #tag insel_kalender matches 25.. run scoreboard players set #tag insel_kalender 24\nfunction insel:kalender/anzeigen\ntellraw @a [${txt('Winterkalender: ', { color: 'gold', bold: true })},${txt('Ein neues Türchen ist offen – am Spawn!', { color: 'white' })}]\n`;
  f['kalender/tag'] = `# Zum Testen bzw. Nachstellen: function insel:kalender/tag {tag:N}\n$scoreboard players set #tag insel_kalender $(tag)\nfunction insel:kalender/anzeigen\n`;
  // Weitere Datapack-Dateien: Frierschutz für alle Kopfteile (Papier mit equippable, Pascal 28.10.), auspackbares Geschenk
  const dateien = { 'data/minecraft/tags/item/freeze_immune_wearables.json': JSON.stringify({ values: ['minecraft:paper'] }, null, 2) + '\n' };
  if (kal.geschenk) {
    dateien['data/insel/advancement/kalender/geschenk.json'] = JSON.stringify({
      criteria: { auspacken: { trigger: 'minecraft:consume_item', conditions: { item: { items: 'minecraft:paper', predicates: { 'minecraft:custom_data': '{winterkalender:"geschenk"}' } } } } },
      rewards: { function: 'insel:kalender/geschenk' },
    }, null, 2) + '\n';
    // Zufall per random statt Beutetabelle mit Gruppen (Format in 26.3 geändert); nur ein Item-Tag (z. B. Musikplatten) braucht eine Beutetabelle,
    // Format wie die Creeper-Tabelle aus 26.3: Tag-Eintrag mit items:"#…"
    const geben = ([id, anzahl], i) => {
      if (!id.startsWith('#')) return `give @s ${id} ${anzahl}`;
      dateien[`data/insel/loot_table/kalender/geschenk_${i}.json`] = JSON.stringify({ type: 'minecraft:command', pools: [{ rolls: 1, entries: [{ type: 'minecraft:tag', expand: true, items: id }] }] }, null, 2) + '\n';
      return `loot give @s loot insel:kalender/geschenk_${i}`;
    };
    const gew = kal.geschenk.gewinne;
    f['kalender/geschenk'] = `# Geschenk aus Türchen 19 ausgepackt (Fortschritt insel:kalender/geschenk): ein Zufallsgewinn
advancement revoke @s only insel:kalender/geschenk
execute store result score #geschenk insel_kalender run random value 1..${gew.length}
${gew.flatMap((g, i) => g.map((e) => `execute if score #geschenk insel_kalender matches ${i + 1} run ${geben(e, i + 1)}`)).join('\n')}
playsound minecraft:entity.player.levelup master @s ~ ~ ~ 0.6 1.8
particle minecraft:happy_villager ~ ~1.2 ~ 0.4 0.4 0.4 0 15 normal @s
tellraw @s ${txt('Frohe Weihnachten! Dein Geschenk ist ausgepackt.', { color: 'gold' })}
`;
  }
  return { funktionen: f, dateien };
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('spawn/insel-kalender.mjs')) {
  const [konfig = join(REPO, 'spawn/standort-smp-spark.json'), aus = join(REPO, 'spawn')] = process.argv.slice(2);
  const k = JSON.parse(readFileSync(konfig, 'utf8'));
  const { funktionen, dateien } = kalender(k.kalender);
  const dp = join(aus, 'datapack/insel-kalender');
  rmSync(dp, { recursive: true, force: true });
  for (const [n, t] of Object.entries(funktionen)) { const p = join(dp, 'data/insel/function', `${n}.mcfunction`); mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, t); }
  for (const [n, t] of Object.entries(dateien)) { const p = join(dp, n); mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, t); }
  // eigene load/tick-Funktionen, über die Funktions-Tags mit denen von insel zusammengeführt
  const ft = join(dp, 'data/minecraft/tags/function'); mkdirSync(ft, { recursive: true });
  for (const [n, t] of [['load', 'kalender/load'], ['tick', 'kalender/tick']]) writeFileSync(join(ft, `${n}.json`), `{ "values": ["insel:${t}"] }\n`);
  writeFileSync(join(dp, 'pack.mcmeta'), JSON.stringify({ pack: { description: 'Winterkalender der Spawn-Insel (insel:kalender_an / kalender_aus)', min_format: [121, 0], max_format: [121, 0] } }, null, 2) + '\n');
  console.log(`Datapack insel-kalender → ${dp} (${Object.keys(funktionen).length} Funktionen)`);
}
