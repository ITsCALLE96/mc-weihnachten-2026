// Testwelt-Archiv (Pascal 28.10.): die Bauten von Spawn & Welt für Pascals begehbares Bauarchiv der Server-Session (server/testwelt/README.md).
// Schnittstelle: Funktions-Tags #archiv:saal/<name> (die Testwelt ruft sie beim Aufbau positioned am Ursprung auf), jede Funktion idempotent.
//   node spawn/archiv.mjs                              → spawn/datapack/archiv-spawn (eigene Bauten, ins Repo):
//        weihnachtsinsel: eine Insel an der SMP-Stelle (Nordweg, TIEF tiefer) mit Schaltern auf der Spark-Insel (leer, Stufe 1–4); deko: Galerie aller Items
//   node spawn/archiv.mjs fremd <datapacks-ordner>     → <ordner>/archiv-fremd, insel-deko, insel-kalender (fremde Bauten nur aus spawn/quellen,
//        NIE ins Repo; Ziel z. B. testnetz/testwelt/world/datapacks): spark (Spark-Insel mit Plattform, Deko, Kalenderwand), hub (ganzer Hub)
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { neu, setze, lade } from '../tools/schem.mjs';
import { struktur, kacheln } from '../tools/schem-struktur.mjs';
import { datapack } from './weihnachtsinsel.mjs';
import { dateien } from './standort.mjs';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
// Deko-Galerie (61 × 17 um den Ursprung): seit 28.10. abends südlich der Spark-Insel an der Hub-Kante (Layout der Server-Session), vorher 0/−60/150
const DEKO = [-30, -60, 88], DEKO_ALT = [0, -60, 150];
const mcmeta = (b) => JSON.stringify({ pack: { description: b, min_format: [121, 0], max_format: [121, 0] } }, null, 2) + '\n';
const schreibe = (dp, dateien) => { for (const [n, t] of Object.entries(dateien)) { const p = join(dp, n); mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, t); } };
const tag = (name, fn) => [`data/archiv/tags/function/saal/${name}.json`, JSON.stringify({ values: [fn] }) + '\n'];
const fn = (ns, n, t) => [`data/${ns}/function/${n}.mcfunction`, t];

// Block-Map (Weltkoordinaten) → Struktur (Ecke)
function ausMap(m, versatz = [0, 0, 0]) {
  let lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (const k of m.keys()) { const p = k.split(',').map(Number); for (let i = 0; i < 3; i++) { lo[i] = Math.min(lo[i], p[i]); hi[i] = Math.max(hi[i], p[i]); } }
  const s = neu(hi[0] - lo[0] + 1, hi[1] - lo[1] + 1, hi[2] - lo[2] + 1, 3955);
  for (const [k, v] of m) { const [x, y, z] = k.split(',').map(Number); setze(s, x - lo[0], y - lo[1], z - lo[2], v); }
  return { nbt: struktur(s), ecke: lo.map((v, i) => v + versatz[i]), groesse: [s.w, s.h, s.l] };
}
// give-Text „id[komp=wert,…]“ → Item-NBT {id,count,components:{…}} (für Rahmen, Rüstungsständer, Anzeigen)
export function itemNbt(give, anzahl = 1) {
  const m = give.match(/^([a-z0-9_:]+)(?:\[(.*)\])?$/s); const teile = []; let tiefe = 0, akt = '', inStr = false;
  for (const c of m[2] ?? '') {
    if (c === '"' && akt.at(-1) !== '\\') inStr = !inStr;
    if (!inStr && '[{'.includes(c)) tiefe++; if (!inStr && ']}'.includes(c)) tiefe--;
    if (c === ',' && tiefe === 0 && !inStr) { teile.push(akt); akt = ''; } else akt += c;
  }
  if (akt) teile.push(akt);
  const komp = teile.map((t) => t.startsWith('!') ? `"${t.slice(1).startsWith('minecraft:') ? '!' + t.slice(1) : '!minecraft:' + t.slice(1)}":{}` : (([k, ...v]) => `"${k.includes(':') ? k : 'minecraft:' + k}":${v.join('=')}`)(t.split('=')));
  return `{id:"${m[1]}",count:${anzahl}${komp.length ? `,components:{${komp.join(',')}}` : ''}}`;
}

// ---------- Höhe in der Testwelt (Pascal 28.10.: Inseln sollen bequem erreichbar sein) ----------
// Alles von Spark- und Weihnachtsinsel liegt in der Testwelt TIEF Blöcke tiefer als im SMP: die Spitze der Spark-Insel (SMP y 92) steht auf dem
// Gras der Flachwelt (y −60), Laufhöhe auf Insel und Brücke y 3…5. Tiefer geht nicht, darunter endet die Welt (−64); so bleiben beide Inseln vollständig.
export const TIEF = -152;
// Ganzer Hub in der Testwelt: Kasten in der Hub-Welt (Umriss 28.10.) und Nordwest-Ecke unten in der Testwelt (Layout: Server-Session)
export const HUB = { von: [-150, 80, -158], bis: [89, 294, 85], ecke: [-300, -60, -120] };
const zahl = (t, dy) => (/^-?\d+(\.\d+)?$/.test(t) ? String(Math.round((+t + dy) * 1e6) / 1e6) : t);
// Ein Befehl mit absoluten Koordinaten → derselbe Befehl dy Blöcke höher/tiefer (setblock, fill, summon, place template, particle, positioned, y= in Selektoren)
export function verschiebeY(zeile, dy) {
  if (/^\s*(#|$)/.test(zeile)) return zeile;
  const sel = (s) => s.replace(/([[,]y=)(-?\d+(?:\.\d+)?)/g, (_, a, n) => a + zahl(n, dy));
  if (zeile.startsWith('execute ')) {
    const i = zeile.indexOf(' run ');
    const kopf = sel(i < 0 ? zeile : zeile.slice(0, i)).replace(/positioned (\S+) (\S+) (\S+)/g, (_, x, y, z) => `positioned ${x} ${zahl(y, dy)} ${z}`);
    return i < 0 ? kopf : `${kopf} run ${verschiebeY(zeile.slice(i + 5), dy)}`;
  }
  const t = zeile.split(' '), y = (...pos) => { for (const p of pos) if (t[p] !== undefined) t[p] = zahl(t[p], dy); };
  if (t[0] === 'setblock') y(2);
  else if (t[0] === 'fill' || t[0] === 'clone') y(2, 5);
  else if (t[0] === 'summon' || t[0] === 'particle') y(3);
  else if (t[0] === 'playsound') y(5);
  else if (t[0] === 'place' && t[1] === 'template') y(4);
  else if (t[0] === 'data' && t[2] === 'block') y(4);
  return sel(t.join(' '));
}

// ---------- eigene Bauten: archiv-spawn ----------
export const STUFEN = ['Leer (vor der Mission)', 'Die Insel taucht auf', 'Der Baum wächst', 'Der Baum wird geschmückt', 'Heiligabend (fertig)'];
// Schalter auf der Spark-Insel am Brückenanfang (Pascal 28.10., zweiter Rundgang): freie Fläche x 3…8, z 31…36, Laufhöhe SMP 155 → TIEF
export const SCHALTER = { x: 3.5, z: 33.5, y: 155 + TIEF };
// Treppenturm (bis 28.10. abends, Pascal fliegt im Kreativ): Kasten zum Abräumen, inkl. Steg zur Brücke
const TURM_ALT = [2, -60, -3, 9, 9, 3];

export function archivSpawn() {
  const d = datapack(), NS = 'archiv_spawn', out = {}, strukturen = {}, adv = {};
  // mit den Tags der Mission (wi_insel, wi_e_sN_K), damit deren Abschnitte sie wie eigene behandeln (kill vor dem Setzen, Abriss)
  const ents = (s) => d.teile.slice(0, s).flatMap((st, si) => st.flatMap((t, ki) => t.ents.map((e) => ({ ...e, tags: [...e.tags, 'wi_insel', `wi_e_s${si + 1}_${ki + 1}`] }))));
  const TAGS = ['wi_archiv', 'wi_archiv_insel'];
  const summon = (e) => `summon ${e.typ} ${e.x.toFixed(2)} ${(e.y + TIEF).toFixed(2)} ${e.z.toFixed(2)} ${d.zustandNbt(e.nbt).replace(/^\{/, `{Tags:${JSON.stringify([...TAGS, ...e.tags.filter((t) => t !== 'wi_kerze')])},Rotation:[${e.yaw}f,0f],`)}`;
  const txt = (x, y, z, tags, text, s, extra = '') => `summon text_display ${x} ${y} ${z} {Tags:${JSON.stringify(tags)},billboard:"vertical",${extra}text:${JSON.stringify(text)},transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[${s}f,${s}f,${s}f]}}`;
  // Eine Insel an der SMP-Stelle (TIEF tiefer), Zustand per Schalter: leer, Stufe 1–4 (Pascal 28.10.: „warum so viele Inseln?“).
  // Jeder Zustand ist eine Struktur über den gemeinsamen Kasten aller Stufen: Blöcke, die es darin noch nicht gibt, als cave_air (place template
  // setzt cave_air, überspringt aber air) – so baut jeder Zustand den anderen sauber zurück, ohne die angrenzende Spark-Insel anzufassen.
  const alle = new Set(d.stand.flatMap((m) => [...m.keys()]));
  const [mx, my, mz] = d.mitte, ausw = [];
  let laden = '';
  [new Map(), ...d.stand].forEach((m, s) => {
    const voll = new Map([...alle].map((k) => [k, m.get(k) ?? 'minecraft:cave_air']));
    const { nbt, ecke, groesse } = ausMap(voll, [0, TIEF, 0]);
    strukturen[`wi_stufe_${s}`] = nbt;
    laden = `forceload add ${ecke[0]} ${ecke[2]} ${ecke[0] + groesse[0] - 1} ${ecke[2] + groesse[2] - 1}`;
    const titel = s ? `Weihnachtsinsel – Stufe ${s} von 4` : 'Weihnachtsinsel – leer';
    ausw.push(fn(NS, `stufe_${s}`, `# Testwelt: Weihnachtsinsel auf „${STUFEN[s]}“ umschalten\n${laden}\ntellraw @a[distance=..200] {"text":"Weihnachtsinsel: ${STUFEN[s]} wird gebaut …","color":"gray"}\nschedule function ${NS}:stufe_${s}_setzen 20t\n`));
    // leer (Pascal 28.10., dritter Rundgang: es blieben Blöcke stehen): den ganzen Kasten bis vor die Spark-Insel (z < 22) zu Luft, den Anschluss
    // z 22…29 über die cave_air-Struktur; danach die Spark-Struktur darüber (die Brücke hatte dort 18 Spark-Blöcke ersetzt, ihre Luft bleibt unberührt)
    const zSpark = 22, leer = [];
    if (!s) {
      const w = groesse[0], l = zSpark - ecke[2], proY = Math.max(1, Math.floor(32768 / (w * l)));
      for (let y = 0; y < groesse[1]; y += proY) leer.push(`fill ${ecke[0]} ${ecke[1] + y} ${ecke[2]} ${ecke[0] + w - 1} ${ecke[1] + Math.min(groesse[1] - 1, y + proY - 1)} ${zSpark - 1} minecraft:air`);
      leer.push(`place template archiv_fremd:spark_insel -26 ${89 + TIEF} 22`);
    }
    // Stand der Server-Mission (Datapack archiv-mission) passend setzen, damit „Abschnitt +1“ an dieser Stelle weitermacht; Stufe 4 ohne zweite Feier
    const stand = [`scoreboard objectives add wi_mission dummy`, `scoreboard objectives add wi_test dummy`, `scoreboard players set #stufe wi_mission ${s}`, 'scoreboard players set #laeuft wi_mission 0',
      ...[1, 2, 3, 4].flatMap((n) => [...Array(10)].map((_, k) => n <= s ? `scoreboard players set #t${n}_${k + 1} wi_mission 1` : `scoreboard players reset #t${n}_${k + 1} wi_mission`)),
      s === 4 ? 'scoreboard players set #gefeiert wi_mission 1' : 'scoreboard players reset #gefeiert wi_mission',
      `scoreboard players set #pos wi_test ${s * 11}`, 'scoreboard players set #auto wi_test 0'];
    ausw.push(fn(NS, `stufe_${s}_setzen`, [
      ...leer, `place template ${NS}:wi_stufe_${s} ${ecke.join(' ')}`,
      ...(s ? [] : [`place template archiv_fremd:spark_insel -26 ${89 + TIEF} 22`]),
      'kill @e[tag=wi_archiv_insel]', 'kill @e[tag=wi_insel]', ...ents(s).map(summon),
      txt(mx + 0.5, my + TIEF + 56, mz + 0.5, [...TAGS, 'wi_archiv_titel'], { text: titel, color: 'gold', bold: true, extra: [{ text: s ? `\n${STUFEN[s]}` : '\nSchalter auf der Spark-Insel', color: 'white', bold: false }] }, 5),
      `kill @e[type=item,x=${ecke[0]},y=${ecke[1]},z=${ecke[2]},dx=${groesse[0]},dy=${groesse[1]},dz=${groesse[2]}]`,
      `execute as @e[type=text_display,tag=wi_schalter_text] run data merge entity @s {background:1073741824}`,
      `data merge entity @e[type=text_display,tag=wi_schalter_text_${s},limit=1] {background:-1064674800}`,
      ...stand,
      // nicht sofort entladen: forceload zählt nicht mit, ein zweiter Klick oder ein Abschnitt in Arbeit verlöre sonst seine Chunks
      `schedule function ${NS}:insel_entladen 300t`,
    ].join('\n') + '\n'));
  });
  ausw.push(fn(NS, 'insel_entladen', laden.replace('forceload add', 'forceload remove') + '\n'));
  // Schrittweiser Aufbau wie auf dem SMP (je Stufe 10 Abschnitte, dann der Abschluss): „Abschnitt +1“ und Automatik alle 2 s
  const folge = [1, 2, 3, 4].flatMap((n) => [...[...Array(10)].map((_, k) => [`weihnachtsinsel:stufe_${n}_teil_${k + 1}`, `Stufe ${n}, Abschnitt ${k + 1}/10`]), [`weihnachtsinsel:stufe_${n}`, `Stufe ${n} abgeschlossen`]]);
  ausw.push(fn(NS, 'abschnitt', [
    '# Testwelt: nächsten Bauabschnitt der Server-Mission auslösen (Datapack archiv-mission = Mission, TIEF tiefer)',
    'scoreboard objectives add wi_test dummy', 'execute unless score #pos wi_test matches 0.. run scoreboard players set #pos wi_test 0',
    `execute if score #pos wi_test matches ${folge.length}.. run return run tellraw @a[distance=..200] {"text":"Weihnachtsinsel ist fertig – „Leer“ setzt zurück","color":"gray"}`,
    'kill @e[tag=wi_archiv_titel]', 'scoreboard players add #pos wi_test 1', laden, `schedule function ${NS}:insel_entladen 300t`,
    ...folge.map(([f, t], i) => `execute if score #pos wi_test matches ${i + 1} run function ${f}`),
    ...folge.map(([, t], i) => `execute if score #pos wi_test matches ${i + 1} run tellraw @a[distance=..200] {"text":"Weihnachtsinsel: ${t} (${i + 1}/${folge.length})","color":"gold"}`),
    'execute as @e[type=text_display,tag=wi_schalter_text] run data merge entity @s {background:1073741824}',
  ].join('\n') + '\n'));
  ausw.push(fn(NS, 'auto', `# Automatik an/aus: alle 2 s ein Abschnitt\nscoreboard objectives add wi_test dummy\nexecute if score #auto wi_test matches 1 run return run function ${NS}:auto_aus\nscoreboard players set #auto wi_test 1\ntellraw @a[distance=..200] {"text":"Weihnachtsinsel: Automatik an (alle 2 s ein Abschnitt)","color":"gold"}\nfunction ${NS}:auto_takt\n`));
  ausw.push(fn(NS, 'auto_aus', `scoreboard players set #auto wi_test 0\nschedule clear ${NS}:auto_takt\ntellraw @a[distance=..200] {"text":"Weihnachtsinsel: Automatik aus","color":"gray"}\n`));
  ausw.push(fn(NS, 'auto_takt', `execute unless score #auto wi_test matches 1 run return fail\nexecute if score #pos wi_test matches ${folge.length}.. run return run function ${NS}:auto_aus\nfunction ${NS}:abschnitt\nschedule function ${NS}:auto_takt 40t\n`));
  // Schalter: eine Reihe aus 5 Feldern (Text dreht sich zum Spieler), Klick → Fortschritt → Zustand bauen
  const schalter = [];
  STUFEN.forEach((name, s) => {
    const x = +(SCHALTER.x + s * 1.2).toFixed(2), y = SCHALTER.y + 1.3;
    schalter.push(txt(x, y - 0.35, SCHALTER.z, ['wi_archiv', 'wi_schalter', 'wi_schalter_text', `wi_schalter_text_${s}`], { text: s ? `Stufe ${s}\n` : 'Leer\n', color: 'gold', bold: true, extra: [{ text: s ? name : 'vor der Mission', color: 'white', bold: false }] }, 0.4, 'line_width:80,background:1073741824,'));
    schalter.push(`summon interaction ${x} ${y - 0.5} ${SCHALTER.z} {Tags:["wi_archiv","wi_schalter","wi_schalter_${s}"],width:1.0f,height:0.9f,response:1b}`);
    adv[`stufe_${s}`] = { criteria: { klick: { trigger: 'minecraft:player_interacted_with_entity', conditions: { entity: { type: 'minecraft:entity_properties', entity: 'this', predicate: { 'minecraft:entity_type': 'minecraft:interaction', 'minecraft:nbt': `{Tags:["wi_schalter_${s}"]}` } } } } }, rewards: { function: `${NS}:klick_${s}` } };
    ausw.push(fn(NS, `klick_${s}`, `advancement revoke @s only ${NS}:stufe_${s}\nfunction ${NS}:stufe_${s}\n`));
  });
  // zweite Reihe darunter: Abschnitt +1 und Automatik
  [['abschnitt', 'Abschnitt +1', 'wie auf dem SMP', 1.2], ['auto', 'Automatik', 'an/aus, alle 2 s', 3.6]].forEach(([n, t1, t2, dx]) => {
    const x = +(SCHALTER.x + dx).toFixed(2), y = SCHALTER.y + 0.3;
    schalter.push(txt(x, y - 0.3, SCHALTER.z, ['wi_archiv', 'wi_schalter'], { text: `${t1}
`, color: 'aqua', bold: true, extra: [{ text: t2, color: 'white', bold: false }] }, 0.4, 'line_width:90,background:1073741824,'));
    schalter.push(`summon interaction ${x} ${y - 0.3} ${SCHALTER.z} {Tags:["wi_archiv","wi_schalter","wi_knopf_${n}"],width:1.6f,height:0.7f,response:1b}`);
    adv[`knopf_${n}`] = { criteria: { klick: { trigger: 'minecraft:player_interacted_with_entity', conditions: { entity: { type: 'minecraft:entity_properties', entity: 'this', predicate: { 'minecraft:entity_type': 'minecraft:interaction', 'minecraft:nbt': `{Tags:["wi_knopf_${n}"]}` } } } } }, rewards: { function: `${NS}:knopf_${n}` } };
    ausw.push(fn(NS, `knopf_${n}`, `advancement revoke @s only ${NS}:knopf_${n}
function ${NS}:${n}
`));
  });
  schalter.push(txt(SCHALTER.x + 2.4, SCHALTER.y + 2.4, SCHALTER.z, ['wi_archiv', 'wi_schalter'], { text: 'Weihnachtsinsel (Norden): Zustand wählen', color: 'gold', bold: true, extra: [{ text: '\nSo wächst sie auf dem SMP mit den Spenden', color: 'gray', bold: false }] }, 0.5, 'line_width:260,background:1073741824,'));
  // Aufräumen: alte Lage (bis 28.10. mittags: SMP-Höhe y 100…205, Stufen-Inseln bei x −70…−280) und Treppenturm (bis 28.10. abends); idempotent
  const alt = [], { lo, hi } = d.bereich;
  for (const dx of [0, -70, -140, -210, -280]) {
    const w = hi[0] - lo[0] + 1, l = hi[2] - lo[2] + 1, proY = Math.max(1, Math.floor(32768 / (w * l)));
    for (let y = lo[1]; y <= hi[1]; y += proY) alt.push(`fill ${lo[0] + dx} ${y} ${lo[2]} ${hi[0] + dx} ${Math.min(hi[1], y + proY - 1)} ${hi[2]} minecraft:air`);
  }
  alt.push(`fill ${TURM_ALT.join(' ')} minecraft:air`);
  const altLaden = `forceload add ${lo[0] - 280} ${lo[2]} ${hi[0]} ${hi[2]}`;
  Object.assign(out, Object.fromEntries([
    tag('weihnachtsinsel', `${NS}:weihnachtsinsel`), tag('deko', `${NS}:deko`), ...ausw,
    fn(NS, 'weihnachtsinsel', `# Testwelt: Weihnachtsinsel an der SMP-Stelle (Nordweg), ${-TIEF} Blöcke tiefer als im SMP, fertig (Stufe 4); Schalter auf der Spark-Insel; absolut, idempotent\n${altLaden}\n${laden}\nschedule function ${NS}:weihnachtsinsel2 40t\n`),
    // erst die alte Lage und den Turm räumen (der Turm-Kasten liegt im Kasten der Insel), dann Stufe 4 setzen
    fn(NS, 'weihnachtsinsel2', [`kill @e[tag=wi_archiv]`, ...alt, `kill @e[type=item,x=${lo[0] - 280},y=${lo[1]},z=${lo[2]},dx=${hi[0] - lo[0] + 280},dy=${hi[1] - lo[1]},dz=${hi[2] - lo[2]}]`, ...schalter, `function ${NS}:stufe_4_setzen`, altLaden.replace('forceload add', 'forceload remove')].join('\n') + '\n'),
  ]));
  for (const [n, a] of Object.entries(adv)) out[`data/${NS}/advancement/${n}.json`] = JSON.stringify(a, null, 2) + '\n';
  // Deko-Galerie relativ zum Ursprung (Boden): Wand mit allen Händler-Items in Leuchtrahmen, Kopfteile auf Rüstungsständern, 3D-Deko-Modelle auf Sockeln
  const w = JSON.parse(readFileSync(join(REPO, 'spawn/weihnachtsmann.json'), 'utf8'));
  const k = JSON.parse(readFileSync(join(REPO, 'spawn/standort-smp-spark.json'), 'utf8'));
  const m = k.deko.modelle, modelle = [...m.kugeln, m.stern, m.licht, ...m.geschenke, m.schneemann, m.rentier, ...m.birnen];
  const name = (t, x, y, z, s = 0.5) => `summon text_display ~${x} ~${y} ~${z} {Tags:["archiv_deko"],billboard:"center",text:${JSON.stringify({ text: t, color: 'white' })},transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[${s}f,${s}f,${s}f]}}`;
  const g = ['kill @e[tag=archiv_deko]', 'fill ~-30 ~ ~-8 ~30 ~6 ~8 minecraft:air', 'fill ~-30 ~-1 ~-8 ~30 ~-1 ~8 minecraft:polished_andesite', 'fill ~-30 ~ ~-6 ~30 ~5 ~-6 minecraft:spruce_planks', 'fill ~-30 ~5 ~-5 ~30 ~5 ~-5 minecraft:spruce_slab[type=bottom]'];
  for (let x = -28; x <= 28; x += 4) g.push(`setblock ~${x} ~4 ~-5 minecraft:lantern[hanging=true]`);
  const wand = w.ware.filter((x) => !x.item.startsWith('minecraft:leather_helmet'));
  wand.forEach((x, i) => {
    const sp = i % 14, re = Math.floor(i / 14), px = -26 + sp * 4, py = [3, 2, 1][re];
    g.push(`summon glow_item_frame ~${px} ~${Math.floor(py)} ~-5 {Tags:["archiv_deko"],block_pos:[I;${DEKO[0] + px},${DEKO[1] + Math.floor(py)},${DEKO[2] - 5}],Facing:3b,Fixed:1b,Invulnerable:1b,Item:${itemNbt(x.item)}}`);
    g.push(name(x.name, px + 0.5, Math.floor(py) + 0.95, -4.6, 0.35));
  });
  w.ware.filter((x) => x.item.startsWith('minecraft:leather_helmet')).forEach((x, i) => {
    const px = -15 + i * 6;
    g.push(`summon armor_stand ~${px + 0.5} ~ ~-1.5 {Tags:["archiv_deko"],Invulnerable:1b,NoGravity:1b,ShowArms:1b,Rotation:[0f,0f],equipment:{head:${itemNbt(x.item)}}}`, name(x.name, px + 0.5, 2.4, -1.5));
  });
  modelle.forEach((id, i) => {
    const px = -27 + i * 3;
    g.push(`setblock ~${px} ~ ~4 minecraft:polished_andesite_slab[type=top]`, `summon item_display ~${px + 0.5} ~1.6 ~4.5 {Tags:["archiv_deko"],item:{id:"minecraft:paper",count:1,components:{"minecraft:item_model":"${id}"}},transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[0.9f,0.9f,0.9f]}}`, name(id.replace('weihnachten:', ''), px + 0.5, 2.6, 4.5, 0.35));
  });
  g.push(name('Deko & Kalender-Items (Winter 2026)', 0.5, 6.5, -4.5, 1.2));
  Object.assign(out, Object.fromEntries([
    // fester Ursprung des Bereichs deko (server/testwelt/README.md): ein geplanter Aufruf verliert die Position, die Chunks müssen erst laden
    fn(NS, 'deko', `# Testwelt: Galerie aller Weihnachts-Items am Ursprung ${DEKO.join('/')} (Boden), alte Stelle ${DEKO_ALT.join('/')} wird geleert; idempotent\nforceload add ${DEKO[0] - 32} ${DEKO[2] - 10} ${DEKO[0] + 32} ${DEKO[2] + 10}\nforceload add ${DEKO_ALT[0] - 32} ${DEKO_ALT[2] - 10} ${DEKO_ALT[0] + 32} ${DEKO_ALT[2] + 10}\nschedule function ${NS}:deko2 40t\n`),
    fn(NS, 'deko2', [
      `kill @e[tag=archiv_deko]`,
      `fill ${DEKO_ALT[0] - 30} ${DEKO_ALT[1]} ${DEKO_ALT[2] - 8} ${DEKO_ALT[0] + 30} ${DEKO_ALT[1] + 6} ${DEKO_ALT[2] + 8} minecraft:air`,
      `fill ${DEKO_ALT[0] - 30} ${DEKO_ALT[1] - 1} ${DEKO_ALT[2] - 8} ${DEKO_ALT[0] + 30} ${DEKO_ALT[1] - 1} ${DEKO_ALT[2] + 8} minecraft:grass_block`,
      `execute positioned ${DEKO.join(' ')} run function ${NS}:deko3`,
      `forceload remove ${DEKO[0] - 32} ${DEKO[2] - 10} ${DEKO[0] + 32} ${DEKO[2] + 10}`, `forceload remove ${DEKO_ALT[0] - 32} ${DEKO_ALT[2] - 10} ${DEKO_ALT[0] + 32} ${DEKO_ALT[2] + 10}`,
    ].join('\n') + '\n'),
    fn(NS, 'deko3', `${g.join('\n')}\n`),
  ]));
  // Server-Mission als Kopie TIEF tiefer (Datapack archiv-mission, Namensraum weihnachtsinsel wie auf dem SMP) für „Abschnitt +1“ und Automatik
  const mission = { dateien: {
    ...Object.fromEntries(Object.entries(d.funktionen).map(([n, f]) => [`data/weihnachtsinsel/function/${n}.mcfunction`, f.split('\n').map((z) => verschiebeY(z, TIEF)).join('\n')])),
    'data/minecraft/tags/function/load.json': '{ "values": ["weihnachtsinsel:load"] }\n', 'data/minecraft/tags/function/tick.json': '{ "values": ["weihnachtsinsel:tick"] }\n',
    'pack.mcmeta': mcmeta(`Testwelt: Server-Mission Weihnachtsinsel ${-TIEF} Blöcke tiefer (spawn/archiv.mjs) – nur für die Testwelt, nicht auf den SMP`),
  }, strukturen: d.strukturen };
  return { dateien: { ...out, 'pack.mcmeta': mcmeta('Testwelt-Archiv: Bauten von Spawn & Welt (spawn/archiv.mjs) – nur für die Testwelt, nicht auf den SMP') }, strukturen, mission };
}

// ---------- fremde Bauten: archiv-fremd (nur aus spawn/quellen, git-ignoriert) ----------
export function archivFremd(ziel) {
  const NS = 'archiv_fremd', out = {}, strukturen = {};
  const k = JSON.parse(readFileSync(join(REPO, 'spawn/standort-smp-spark.json'), 'utf8'));
  const quelle = join(REPO, k.struktur.quelle);
  if (!existsSync(quelle)) throw new Error(`${quelle} fehlt (nur lokal)`);
  strukturen.spark_insel = struktur(lade(readFileSync(quelle)));
  const f = dateien(k).funktionen;
  // aus dem SMP-Aufbau nur die Insel selbst, Ender-Kiste, Lichter und Tafel (keine Lichtung, keine Rückweg-Plattform am SMP-Boden, kein Weltspawn,
  // keine Spielregeln); alles TIEF tiefer
  const bau = f.aufbau_teil2.split('\n').flatMap((z) => {
    if (z.startsWith('place template spawn:spark_insel')) return [z.replace('spawn:spark_insel', `${NS}:spark_insel`)];
    if (z === 'function insel:tafeln') return f.tafeln.split('\n').filter((y) => y && !y.startsWith('#'));
    return /^fill \S+ \S+ \S+ \S+ \S+ \S+ minecraft:(ender_chest|light)\b/.test(z) ? [z] : [];
  }).map((z) => verschiebeY(z, TIEF));
  // alte Lage bis 28.10. (SMP-Höhe y 89…183 und die mitgebaute SMP-Lichtung y 60…88) leeren; danach leer, also idempotent
  const [ux, uy, uz] = k.struktur.ursprung, [gx, gy, gz] = k.struktur.groesse, alt = [];
  for (const [y1, y2] of [[60, 88], [uy, uy + gy - 1]]) {
    const proY = Math.floor(32768 / (gx * (gz + 18)));
    for (let y = y1; y <= y2; y += proY) alt.push(`fill ${ux} ${y} ${uz} ${ux + gx - 1} ${Math.min(y2, y + proY - 1)} ${uz + gz + 17} minecraft:air`);
  }
  Object.assign(out, Object.fromEntries([
    tag('spark', `${NS}:spark`), tag('hub', `${NS}:hub`),
    fn(NS, 'spark', `# Testwelt: Spark-Insel an den SMP-Koordinaten, ${-TIEF} Blöcke tiefer (Spitze auf dem Boden), mit Deko und Kalenderwand (alle Türchen offen); idempotent\nforceload add -32 16 32 95\nschedule function ${NS}:spark2 40t\n`),
    fn(NS, 'spark2', `${alt.join('\n')}\n${bau.join('\n')}\nkill @e[type=item,x=-32,y=-64,z=16,dx=64,dy=384,dz=80]\nschedule function ${NS}:spark_deko 60t\n`),
    // Deko und Kalender nacheinander, jeweils mit frisch gesetztem forceload: forceload zählt nicht mit, d. h. das Entladen eines anderen Bereichs
    // (Weihnachtsinsel im selben Tick, Kalender am Ende seines Aufbaus) nähme sonst überlappende Chunks mit, bevor deko_an2 die Blöcke setzt
    fn(NS, 'spark_deko', `forceload add -32 16 32 95\nfunction insel:deko_an\nschedule function ${NS}:spark_kalender 100t\n`),
    fn(NS, 'spark_kalender', `forceload add -32 16 32 95\nscoreboard objectives add insel_kalender dummy\nfunction insel:kalender_an\nschedule function ${NS}:spark3 80t\n`),
    fn(NS, 'spark3', `forceload add -32 16 32 95\nfunction insel:kalender/tag {tag:24}\nschedule function ${NS}:spark4 40t\n`),
    fn(NS, 'spark4', 'forceload remove -32 16 32 95\n'),
  ]));
  // Ganzer Hub (Pascal 28.10. abends: nicht nur ein Ausschnitt) aus der Hub-Welt des Testnetzes (git-ignoriert, aus spawn/quellen gebaut),
  // Unterkante auf den Boden der Flachwelt; Kasten = Umriss aller Blöcke der Hub-Welt (tools/schem-welt.mjs umriss)
  const hubWelt = join(REPO, 'testnetz/hub/world');
  return import('../tools/schem-welt.mjs').then(({ ausschneiden }) => {
    const m = ausschneiden(hubWelt, HUB.von, HUB.bis);
    // Strukturen haben DataVersion 3955: Schildtexte dann als JSON-Text (sonst bricht die Umwandlung ab); hängende Entities (Rahmen, Bilder)
    // tragen ihre Weltposition in block_pos und landen beim Einsetzen ungültig → weglassen
    for (const be of m.blockEntities) for (const s of ['front_text', 'back_text']) { const l = be.daten[s]?.value?.messages?.value; if (l?.elem === 'string') l.items = l.items.map((t) => (/^["{[]/.test(t) ? t : JSON.stringify(t))); }
    m.entities = m.entities.filter((e) => !/item_frame|painting/.test(e.id));
    const O = HUB.ecke, zeilen = [];
    // Kasten leeren: fill in Stücken unter 32768 Blöcken (eine Lage ist größer, daher zusätzlich in z-Streifen)
    const leeren = (o, w, h, l) => { const r = [], dz = Math.min(l, Math.floor(32768 / w)), proY = Math.max(1, Math.floor(32768 / (w * dz)));
      for (let z = 0; z < l; z += dz) for (let y = 0; y < h; y += proY) r.push(`fill ${o[0]} ${o[1] + y} ${o[2] + z} ${o[0] + w - 1} ${o[1] + Math.min(h - 1, y + proY - 1)} ${o[2] + Math.min(l - 1, z + dz - 1)} minecraft:air`);
      return r; };
    zeilen.push(...leeren(O, m.w, m.h, m.l), `kill @e[type=!player,x=${O[0]},y=${O[1]},z=${O[2]},dx=${m.w},dy=${m.h},dz=${m.l}]`);
    for (const { i, j, teil } of kacheln(m, 48)) { strukturen[`hub_${i}_${j}`] = struktur(teil); zeilen.push(`place template ${NS}:hub_${i}_${j} ${O[0] + i * 48} ${O[1]} ${O[2] + j * 48}`); }
    const fl = `${O[0]} ${O[2]} ${O[0] + m.w - 1} ${O[2] + m.l - 1}`;
    // alter Ausschnitt (bis 28.10. abends: 81 × 160 × 81 bei −290/−60/110) – eigener forceload, da außerhalb des neuen Kastens möglich
    const ALT = [-290, -60, 110], altFl = `${ALT[0]} ${ALT[2]} ${ALT[0] + 80} ${ALT[2] + 80}`;
    Object.assign(out, Object.fromEntries([
      fn(NS, 'hub', `# Testwelt: ganzer Hub (Fantasy Village, ${m.w} × ${m.l}, ${m.h} hoch) ab Ecke ${O.join('/')}, Unterkante auf dem Boden; idempotent\nforceload add ${altFl}\nschedule function ${NS}:hub_alt 40t\n`),
      fn(NS, 'hub_alt', `${leeren(ALT, 81, 160, 81).join('\n')}\nkill @e[type=!player,x=${ALT[0]},y=${ALT[1]},z=${ALT[2]},dx=81,dy=160,dz=81]\nforceload remove ${altFl}\nforceload add ${fl}\nschedule function ${NS}:hub2 40t\n`),
      fn(NS, 'hub2', `${zeilen.join('\n')}\nkill @e[type=item,x=${O[0]},y=${O[1]},z=${O[2]},dx=${m.w},dy=${m.h},dz=${m.l}]\nschedule function ${NS}:hub3 100t\n`),
      fn(NS, 'hub3', `forceload remove ${fl}\n`),
    ]));
    const dp = join(ziel, 'archiv-fremd');
    rmSync(dp, { recursive: true, force: true });
    schreibe(dp, { ...out, 'pack.mcmeta': mcmeta('Testwelt-Archiv: fremde Bauten (Spark-Insel, Fantasy Village) – nur lokal, nie ins Repo oder auf einen Download') });
    for (const [n, t] of Object.entries(strukturen)) { const p = join(dp, `data/${NS}/structure/${n}.nbt`); mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, t); }
    // Deko und Kalender der Spark-Insel als Kopie mit allen Koordinaten TIEF tiefer (nur für die Testwelt)
    for (const p of ['insel-deko', 'insel-kalender']) {
      rmSync(join(ziel, p), { recursive: true, force: true });
      cpSync(join(REPO, 'spawn/datapack', p), join(ziel, p), { recursive: true });
      for (const datei of readdirSync(join(ziel, p), { recursive: true })) {
        if (!String(datei).endsWith('.mcfunction')) continue;
        const pf = join(ziel, p, String(datei));
        writeFileSync(pf, readFileSync(pf, 'utf8').split('\n').map((z) => verschiebeY(z, TIEF)).join('\n'));
      }
    }
    return { dp, strukturen: Object.keys(strukturen).length };
  });
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('spawn/archiv.mjs')) {
  if (process.argv[2] === 'fremd') {
    archivFremd(process.argv[3]).then(({ dp, strukturen }) => console.log(`Archiv (fremd, nur lokal) → ${dp}: ${strukturen} Strukturen, dazu insel-deko und insel-kalender`));
  } else {
    const { dateien: d, strukturen, mission } = archivSpawn();
    const mp = join(REPO, 'spawn/datapack/archiv-mission');
    rmSync(mp, { recursive: true, force: true });
    schreibe(mp, mission.dateien);
    for (const [n, t] of Object.entries(mission.strukturen)) { const p = join(mp, `data/weihnachtsinsel/structure/${n}.nbt`); mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, t); }
    const dp = join(REPO, 'spawn/datapack/archiv-spawn');
    rmSync(dp, { recursive: true, force: true });
    schreibe(dp, d);
    for (const [n, t] of Object.entries(strukturen)) { const p = join(dp, `data/archiv_spawn/structure/${n}.nbt`); mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, t); }
    console.log(`Archiv (eigene Bauten) → ${dp}: ${Object.keys(d).length} Dateien, ${Object.keys(strukturen).length} Strukturen`);
  }
}
