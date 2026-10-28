// Testwelt-Archiv (Pascal 28.10.): die Bauten von Spawn & Welt für Pascals begehbares Bauarchiv der Server-Session (server/testwelt/README.md).
// Schnittstelle: Funktions-Tags #archiv:saal/<name> (die Testwelt ruft sie beim Aufbau positioned am Ursprung auf), jede Funktion idempotent.
//   node spawn/archiv.mjs                              → spawn/datapack/archiv-spawn (eigene Bauten, ins Repo):
//        weihnachtsinsel: eine Insel an der SMP-Stelle (Nordweg, TIEF tiefer) mit Treppenturm und Schaltern für Stufe 1–4; deko: Galerie aller Items
//   node spawn/archiv.mjs fremd <datapacks-ordner>     → <ordner>/archiv-fremd, insel-deko, insel-kalender (fremde Bauten nur aus spawn/quellen,
//        NIE ins Repo; Ziel z. B. testnetz/testwelt/world/datapacks): spark (Spark-Insel mit Plattform, Deko, Kalenderwand), hub (Hub-Ausschnitt)
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { neu, setze, lade } from '../tools/schem.mjs';
import { struktur, kacheln } from '../tools/schem-struktur.mjs';
import { datapack } from './weihnachtsinsel.mjs';
import { dateien } from './standort.mjs';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const DEKO = [0, -60, 150];
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
  else if (t[0] === 'place' && t[1] === 'template') y(4);
  else if (t[0] === 'data' && t[2] === 'block') y(4);
  return sel(t.join(' '));
}

// ---------- eigene Bauten: archiv-spawn ----------
export const STUFEN = ['Die Insel taucht auf', 'Der Baum wächst', 'Der Baum wird geschmückt', 'Heiligabend (fertig)'];
// Treppenturm von der Flachwelt zur Brücke (östlich daneben, Brücke x −3…1, Deck y 156 → TIEF): Wendeltreppe um einen Fichtenkern, 65 Stufen
export const TURM = { x: 6, z: 0 };
export function turm(deck = 156 + TIEF) {
  const { x: cx, z: cz } = TURM, b = [], boden = -60;
  // Ring 5 × 5 um den Kern 3 × 3, gegen den Uhrzeigersinn von oben gesehen; Stufe i auf Höhe boden + i, die letzte (i = deck − boden) mündet nach Norden auf den Absatz
  const ring = [];
  for (let z = 2; z >= -2; z--) ring.push([-2, z]);
  for (let x = -1; x <= 2; x++) ring.push([x, -2]);
  for (let z = -1; z <= 2; z++) ring.push([2, z]);
  for (let x = 1; x >= -1; x--) ring.push([x, 2]);
  const richtung = ([ax, az], [bx, bz]) => (bz < az ? 'north' : bz > az ? 'south' : bx > ax ? 'east' : 'west');
  b.push(`fill ${cx - 3} ${boden} ${cz - 3} ${cx + 3} ${deck + 4} ${cz + 3} minecraft:air`);
  for (const [s, z1, z2, x1, x2] of [[0, -3, -3, -3, 3], [0, 3, 3, -3, 3], [0, -3, 3, -3, -3], [0, -3, 3, 3, 3]]) b.push(`fill ${cx + x1} ${boden} ${cz + z1} ${cx + x2} ${deck + 3} ${cz + z2} minecraft:glass`);
  b.push(`fill ${cx - 3} ${deck + 4} ${cz - 3} ${cx + 3} ${deck + 4} ${cz + 3} minecraft:spruce_slab[type=bottom]`, `fill ${cx - 3} ${deck + 5} ${cz - 3} ${cx + 3} ${deck + 5} ${cz + 3} minecraft:snow[layers=2]`);
  b.push(`fill ${cx - 1} ${boden} ${cz - 1} ${cx + 1} ${deck + 3} ${cz + 1} minecraft:spruce_log`);
  for (let y = boden + 3; y < deck; y += 6) b.push(`fill ${cx - 1} ${y} ${cz - 1} ${cx + 1} ${y} ${cz + 1} minecraft:ochre_froglight`, `setblock ${cx} ${y} ${cz} minecraft:spruce_log`);
  const n = deck - boden;
  for (let i = 0; i <= n; i++) { const p = ring[i % 16], q = ring[(i + 1) % 16]; b.push(`setblock ${cx + p[0]} ${boden + i} ${cz + p[1]} minecraft:spruce_stairs[facing=${richtung(p, q)}]`); }
  // Eingang unten (Süden, vor der ersten Stufe), Absatz oben vor dem Kern, Steg nach Westen bis zur Brücke, Geländer der Brücke dort offen
  b.push(`fill ${cx - 2} ${boden} ${cz + 3} ${cx - 2} ${boden + 2} ${cz + 3} minecraft:air`);
  b.push(`fill ${cx - 4} ${deck} ${cz - 1} ${cx - 2} ${deck} ${cz + 1} minecraft:stripped_spruce_log[axis=x]`, `fill ${cx - 4} ${deck + 1} ${cz - 1} ${cx - 2} ${deck + 2} ${cz + 1} minecraft:air`);
  b.push(`fill ${cx - 5} ${deck + 1} ${cz - 1} ${cx - 5} ${deck + 2} ${cz + 1} minecraft:air`);
  b.push(`setblock ${cx - 2} ${deck + 3} ${cz} minecraft:lantern[hanging=true]`, `setblock ${cx - 2} ${boden + 3} ${cz + 2} minecraft:lantern[hanging=true]`);
  return b;
}

export function archivSpawn() {
  const d = datapack(), NS = 'archiv_spawn', out = {}, strukturen = {}, adv = {};
  const ents = (s) => d.teile.slice(0, s + 1).flatMap((st) => st.flatMap((t) => t.ents));
  const TAGS = ['wi_archiv', 'wi_archiv_insel'];
  const summon = (e) => `summon ${e.typ} ${e.x.toFixed(2)} ${(e.y + TIEF).toFixed(2)} ${e.z.toFixed(2)} ${d.zustandNbt(e.nbt).replace(/^\{/, `{Tags:${JSON.stringify([...TAGS, ...e.tags.filter((t) => t !== 'wi_kerze')])},Rotation:[${e.yaw}f,0f],`)}`;
  const txt = (x, y, z, text, s, extra = '') => `summon text_display ${x} ${y} ${z} {Tags:${JSON.stringify(TAGS)},${extra}text:${JSON.stringify(text)},transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[${s}f,${s}f,${s}f]}}`;
  // Eine Insel an der SMP-Stelle (TIEF tiefer), Stufen 1–4 per Schalter umschaltbar (Pascal 28.10.: „warum so viele Inseln?“).
  // Jede Stufe ist eine Struktur über den gemeinsamen Kasten aller Stufen: Blöcke, die es in dieser Stufe noch nicht gibt, als cave_air (place template
  // setzt cave_air, überspringt aber air) – so baut jede Stufe die andere sauber zurück, ohne die angrenzende Spark-Insel anzufassen.
  const alle = new Set(d.stand.flatMap((m) => [...m.keys()]));
  const [mx, my, mz] = d.mitte, laden = [];
  const ausw = [];
  d.stand.forEach((m, s) => {
    const voll = new Map([...alle].map((k) => [k, m.get(k) ?? 'minecraft:cave_air']));
    const { nbt, ecke, groesse } = ausMap(voll, [0, TIEF, 0]);
    strukturen[`wi_stufe_${s + 1}`] = nbt;
    if (!s) laden.push(`forceload add ${ecke[0]} ${ecke[2]} ${ecke[0] + groesse[0] - 1} ${ecke[2] + groesse[2] - 1}`);
    ausw.push(fn(NS, `stufe_${s + 1}`, `# Testwelt: Weihnachtsinsel auf Stufe ${s + 1} (${STUFEN[s]}) umschalten\n${laden[0]}\ntellraw @a[distance=..200] {"text":"Weihnachtsinsel: Stufe ${s + 1} wird gebaut …","color":"gray"}\nschedule function ${NS}:stufe_${s + 1}_setzen 20t\n`));
    ausw.push(fn(NS, `stufe_${s + 1}_setzen`, [
      `place template ${NS}:wi_stufe_${s + 1} ${ecke.join(' ')}`, 'kill @e[tag=wi_archiv_insel]', ...ents(s).map(summon),
      txt(mx + 0.5, my + TIEF + 56, mz + 0.5, { text: `Weihnachtsinsel – Stufe ${s + 1} von 4`, color: 'gold', bold: true, extra: [{ text: `\n${STUFEN[s]}`, color: 'white', bold: false }] }, 5, 'billboard:"center",'),
      `kill @e[type=item,x=${ecke[0]},y=${ecke[1]},z=${ecke[2]},dx=${groesse[0]},dy=${groesse[1]},dz=${groesse[2]}]`,
      `execute as @e[type=text_display,tag=wi_schalter_text] run data merge entity @s {background:1073741824}`,
      `data merge entity @e[type=text_display,tag=wi_schalter_text_${s + 1},limit=1] {background:-1064674800}`,
      laden[0].replace('forceload add', 'forceload remove'),
    ].join('\n') + '\n'));
  });
  // Schalter am Absatz des Treppenturms (Blick nach Osten auf die Kernwand, 2 × 2): Klick → Fortschritt → Stufe bauen
  const deck = 156 + TIEF, sx = TURM.x - 1.45, schalter = [];
  [[-0.55, 2.55], [0.55, 2.55], [-0.55, 1.45], [0.55, 1.45]].forEach(([dz, dyy], s) => {
    const z = +(TURM.z + 0.5 + dz).toFixed(2), y = +(deck + dyy).toFixed(2);
    schalter.push(txt(sx, y - 0.3, z, { text: `Stufe ${s + 1}\n`, color: 'gold', bold: true, extra: [{ text: STUFEN[s], color: 'white', bold: false }] }, 0.45, `Tags:${JSON.stringify(['wi_archiv', 'wi_schalter', 'wi_schalter_text', `wi_schalter_text_${s + 1}`])},Rotation:[90f,0f],line_width:90,background:1073741824,`).replace(`{Tags:${JSON.stringify(TAGS)},`, '{'));
    schalter.push(`summon interaction ${sx + 0.2} ${y - 0.4} ${z} {Tags:["wi_archiv","wi_schalter","wi_schalter_${s + 1}"],width:0.9f,height:0.8f,response:1b}`);
    adv[`stufe_${s + 1}`] = { criteria: { klick: { trigger: 'minecraft:player_interacted_with_entity', conditions: { entity: { type: 'minecraft:entity_properties', entity: 'this', predicate: { 'minecraft:entity_type': 'minecraft:interaction', 'minecraft:nbt': `{Tags:["wi_schalter_${s + 1}"]}` } } } } }, rewards: { function: `${NS}:klick_${s + 1}` } };
    ausw.push(fn(NS, `klick_${s + 1}`, `advancement revoke @s only ${NS}:stufe_${s + 1}\nfunction ${NS}:stufe_${s + 1}\n`));
  });
  schalter.push(txt(sx, deck + 3.55, TURM.z + 0.5, { text: 'Weihnachtsinsel: Stufe wählen', color: 'gold', bold: true, extra: [{ text: '\nSo wächst sie auf dem SMP mit den Spenden', color: 'gray', bold: false }] }, 0.5, `Tags:["wi_archiv","wi_schalter"],Rotation:[90f,0f],line_width:200,background:1073741824,`).replace(`{Tags:${JSON.stringify(TAGS)},`, '{'));
  // Abkürzung Turm: unten am Eingang nach oben, oben am Absatz nach unten
  const abk = [['hoch', TURM.x + 0.5, -60, TURM.z + 4.2, 'Abkürzung nach oben', `${TURM.x - 3.5} ${deck + 1} ${TURM.z + 0.5} 90 0`], ['runter', TURM.x - 2.5, deck + 1, TURM.z - 0.6, 'Abkürzung nach unten', `${TURM.x - 1.5} -60 ${TURM.z + 5.5} 180 0`]];
  for (const [n, x, y, z, t, ziel] of abk) {
    schalter.push(`summon interaction ${x} ${y} ${z} {Tags:["wi_archiv","wi_schalter","wi_abk_${n}"],width:0.8f,height:1.8f,response:1b}`, txt(x, y + 2, z, { text: t, color: 'aqua' }, 0.5, 'billboard:"center",').replace(`{Tags:${JSON.stringify(TAGS)},`, '{Tags:["wi_archiv","wi_schalter"],'));
    adv[`abk_${n}`] = { criteria: { klick: { trigger: 'minecraft:player_interacted_with_entity', conditions: { entity: { type: 'minecraft:entity_properties', entity: 'this', predicate: { 'minecraft:entity_type': 'minecraft:interaction', 'minecraft:nbt': `{Tags:["wi_abk_${n}"]}` } } } } }, rewards: { function: `${NS}:abk_${n}` } };
    ausw.push(fn(NS, `abk_${n}`, `advancement revoke @s only ${NS}:abk_${n}\ntp @s ${ziel}\n`));
  }
  // Aufräumen der alten Lage (bis 28.10.: Insel auf SMP-Höhe y 100…205, Stufen 1–4 bei x −70…−280) – idempotent, danach leer
  const alt = [], { lo, hi } = d.bereich;
  for (const dx of [0, -70, -140, -210, -280]) {
    const w = hi[0] - lo[0] + 1, l = hi[2] - lo[2] + 1, proY = Math.max(1, Math.floor(32768 / (w * l)));
    for (let y = lo[1]; y <= hi[1]; y += proY) alt.push(`fill ${lo[0] + dx} ${y} ${lo[2]} ${hi[0] + dx} ${Math.min(hi[1], y + proY - 1)} ${hi[2]} minecraft:air`);
  }
  const altLaden = `forceload add ${lo[0] - 280} ${lo[2]} ${hi[0]} ${hi[2]}`;
  Object.assign(out, Object.fromEntries([
    tag('weihnachtsinsel', `${NS}:weihnachtsinsel`), tag('deko', `${NS}:deko`), ...ausw,
    fn(NS, 'weihnachtsinsel', `# Testwelt: Weihnachtsinsel an der SMP-Stelle (Nordweg), ${-TIEF} Blöcke tiefer als im SMP, Stufe 4; Treppenturm mit Stufen-Schaltern; absolut, idempotent\n${altLaden}\n${laden[0]}\nschedule function ${NS}:weihnachtsinsel2 40t\n`),
    fn(NS, 'weihnachtsinsel2', [`kill @e[tag=wi_archiv]`, ...alt, `kill @e[type=item,x=${lo[0] - 280},y=${lo[1]},z=${lo[2]},dx=${hi[0] - lo[0] + 280},dy=${hi[1] - lo[1]},dz=${hi[2] - lo[2]}]`, ...turm(), ...schalter, `function ${NS}:stufe_4_setzen`, altLaden.replace('forceload add', 'forceload remove')].join('\n') + '\n'),
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
    fn(NS, 'deko', `# Testwelt: Galerie aller Weihnachts-Items am Ursprung ${DEKO.join('/')} (Boden), idempotent\nforceload add ${DEKO[0] - 32} ${DEKO[2] - 10} ${DEKO[0] + 32} ${DEKO[2] + 10}\nschedule function ${NS}:deko2 40t\n`),
    fn(NS, 'deko2', `execute positioned ${DEKO.join(' ')} run function ${NS}:deko3\nforceload remove ${DEKO[0] - 32} ${DEKO[2] - 10} ${DEKO[0] + 32} ${DEKO[2] + 10}\n`),
    fn(NS, 'deko3', `${g.join('\n')}\n`),
  ]));
  return { dateien: { ...out, 'pack.mcmeta': mcmeta('Testwelt-Archiv: Bauten von Spawn & Welt (spawn/archiv.mjs) – nur für die Testwelt, nicht auf den SMP') }, strukturen };
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
  // Hub-Ausschnitt um den Brunnen (Hub-Welt des Testnetzes), Unterkante auf den Boden des Bereichs
  const hubWelt = join(REPO, 'testnetz/hub/world');
  return import('../tools/schem-welt.mjs').then(({ ausschneiden }) => {
    const A = [-40, 100, -40], B = [40, 259, 40], m = ausschneiden(hubWelt, A, B);
    // Strukturen haben DataVersion 3955: Schildtexte dann als JSON-Text (sonst bricht die Umwandlung ab); hängende Entities (Rahmen, Bilder)
    // tragen ihre Weltposition in block_pos und landen beim Einsetzen ungültig → weglassen
    for (const be of m.blockEntities) for (const s of ['front_text', 'back_text']) { const l = be.daten[s]?.value?.messages?.value; if (l?.elem === 'string') l.items = l.items.map((t) => (/^["{[]/.test(t) ? t : JSON.stringify(t))); }
    m.entities = m.entities.filter((e) => !/item_frame|painting/.test(e.id));
    const O = [-250 - 40, -60, 150 - 40], zeilen = [];
    // erst leeren (fill in Scheiben unter 32768 Blöcken)
    const proY = Math.max(1, Math.floor(32768 / (m.w * m.l)));
    for (let y = 0; y < m.h; y += proY) zeilen.push(`fill ${O[0]} ${O[1] + y} ${O[2]} ${O[0] + m.w - 1} ${O[1] + Math.min(m.h - 1, y + proY - 1)} ${O[2] + m.l - 1} minecraft:air`);
    zeilen.push(`kill @e[type=!player,x=${O[0]},y=${O[1]},z=${O[2]},dx=${m.w},dy=${m.h},dz=${m.l}]`);
    for (const { i, j, teil } of kacheln(m, 48)) { strukturen[`hub_${i}_${j}`] = struktur(teil); zeilen.push(`place template ${NS}:hub_${i}_${j} ${O[0] + i * 48} ${O[1]} ${O[2] + j * 48}`); }
    const fl = `${O[0]} ${O[2]} ${O[0] + m.w - 1} ${O[2] + m.l - 1}`;
    Object.assign(out, Object.fromEntries([
      fn(NS, 'hub', `# Testwelt: Ausschnitt des Hubs (Fantasy Village, Brunnen-Platz, 81 × 81), Unterkante auf dem Boden; idempotent\nforceload add ${fl}\nschedule function ${NS}:hub2 40t\n`),
      fn(NS, 'hub2', `${zeilen.join('\n')}\nkill @e[type=item,x=${O[0]},y=${O[1]},z=${O[2]},dx=${m.w},dy=${m.h},dz=${m.l}]\nforceload remove ${fl}\n`),
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
    const { dateien: d, strukturen } = archivSpawn();
    const dp = join(REPO, 'spawn/datapack/archiv-spawn');
    rmSync(dp, { recursive: true, force: true });
    schreibe(dp, d);
    for (const [n, t] of Object.entries(strukturen)) { const p = join(dp, `data/archiv_spawn/structure/${n}.nbt`); mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, t); }
    console.log(`Archiv (eigene Bauten) → ${dp}: ${Object.keys(d).length} Dateien, ${Object.keys(strukturen).length} Strukturen`);
  }
}
