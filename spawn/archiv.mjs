// Testwelt-Archiv (Pascal 28.10.): die Bauten von Spawn & Welt für Pascals begehbares Bauarchiv der Server-Session (server/testwelt/README.md).
// Schnittstelle: Funktions-Tags #archiv:saal/<name> (die Testwelt ruft sie beim Aufbau positioned am Ursprung auf), jede Funktion idempotent.
//   node spawn/archiv.mjs                              → spawn/datapack/archiv-spawn (eigene Bauten, ins Repo):
//        weihnachtsinsel: fertige Insel an den SMP-Koordinaten (Nordweg) + Stufen 1–4 schwebend nebeneinander im Westen; deko: Galerie aller Items
//   node spawn/archiv.mjs fremd <datapacks-ordner>     → <ordner>/archiv-fremd, insel-deko, insel-kalender (fremde Bauten nur aus spawn/quellen,
//        NIE ins Repo; Ziel z. B. testnetz/testwelt/world/datapacks): spark (Spark-Insel mit Plattform, Deko, Kalenderwand), hub (Hub-Ausschnitt)
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync } from 'node:fs';
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

// ---------- eigene Bauten: archiv-spawn ----------
export function archivSpawn() {
  const d = datapack(), NS = 'archiv_spawn', out = {}, strukturen = {};
  const NAMEN = ['Die Insel taucht auf', 'Der Baum wächst', 'Der Baum wird geschmückt', 'Heiligabend (fertig)'];
  const ents = (s) => d.teile.slice(0, s + 1).flatMap((st) => st.flatMap((t) => t.ents));
  const summon = (e, dx, n) => `summon ${e.typ} ${(e.x + dx).toFixed(2)} ${e.y.toFixed(2)} ${e.z.toFixed(2)} ${d.zustandNbt(e.nbt).replace(/^\{/, `{Tags:${JSON.stringify(['wi_archiv', `wi_archiv_${n}`, ...e.tags.filter((t) => t !== 'wi_kerze')])},Rotation:[${e.yaw}f,0f],`)}`;
  // Platz: 0 = fertige Insel an der echten Stelle; Stufen 1–4 je 70 Blöcke weiter westlich (nicht über dem Zoo x 116…244, nicht am Hub z ~150)
  const platz = [[0, 3], [-70, 0], [-140, 1], [-210, 2], [-280, 3]];
  const zeilen = [], laden = [], [mx, my, mz] = d.mitte;
  platz.forEach(([dx, s], n) => {
    const { nbt, ecke, groesse } = ausMap(d.stand[s], [dx, 0, 0]);
    strukturen[`wi_${n}`] = nbt;
    laden.push(`forceload add ${ecke[0]} ${ecke[2]} ${ecke[0] + groesse[0] - 1} ${ecke[2] + groesse[2] - 1}`);
    zeilen.push(`place template ${NS}:wi_${n} ${ecke.join(' ')}`, `kill @e[tag=wi_archiv_${n}]`, ...ents(s).map((e) => summon(e, dx, n)));
    zeilen.push(`summon text_display ${mx + dx + 0.5} ${my + 56} ${mz + 0.5} {Tags:["wi_archiv","wi_archiv_${n}"],billboard:"center",text:${JSON.stringify({ text: n ? `Weihnachtsinsel – Stufe ${s + 1}\n${NAMEN[s]}` : 'Weihnachtsinsel – fertig', color: 'gold', bold: true })},transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[4f,4f,4f]}}`);
  });
  Object.assign(out, Object.fromEntries([
    tag('weihnachtsinsel', `${NS}:weihnachtsinsel`), tag('deko', `${NS}:deko`),
    fn(NS, 'weihnachtsinsel', `# Testwelt: fertige Weihnachtsinsel an der SMP-Stelle (Nordweg) und Stufen 1–4 nebeneinander westlich davon; absolut, idempotent\n${laden.join('\n')}\nschedule function ${NS}:weihnachtsinsel2 40t\n`),
    fn(NS, 'weihnachtsinsel2', `${zeilen.join('\n')}\nkill @e[type=item,x=-320,y=90,z=-70,dx=360,dy=130,dz=110]\nschedule function ${NS}:entladen 200t\n`),
    fn(NS, 'entladen', laden.map((z) => z.replace('forceload add', 'forceload remove')).join('\n') + '\n'),
  ]));
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
  // aus dem SMP-Aufbau nur Bau-Befehle (kein Weltspawn, keine Weltgrenze, keine Spielregeln, keine Lichter)
  const bau = f.aufbau_teil2.split('\n').flatMap((z) => {
    if (z.startsWith('place template spawn:spark_insel')) return [z.replace('spawn:spark_insel', `${NS}:spark_insel`)];
    if (z === 'function insel:plattform') return f.plattform.split('\n').filter((y) => y && !y.startsWith('#'));
    if (z === 'function insel:tafeln') return f.tafeln.split('\n').filter((y) => y && !y.startsWith('#'));
    return /^(fill|setblock) /.test(z) ? [z] : [];
  });
  Object.assign(out, Object.fromEntries([
    tag('spark', `${NS}:spark`), tag('hub', `${NS}:hub`),
    fn(NS, 'spark', `# Testwelt: Spark-Insel an den SMP-Koordinaten mit Plattform, Deko und Kalenderwand (alle Türchen offen); idempotent\nforceload add -32 16 32 80\nschedule function ${NS}:spark2 40t\n`),
    fn(NS, 'spark2', `${bau.join('\n')}\nkill @e[type=item,x=-32,y=-64,z=16,dx=64,dy=384,dz=64]\nfunction insel:deko_an\nfunction insel:kalender_an\nscoreboard objectives add insel_kalender dummy\nfunction insel:kalender/tag {tag:24}\nforceload remove -32 16 32 80\n`),
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
    for (const p of ['insel-deko', 'insel-kalender']) { rmSync(join(ziel, p), { recursive: true, force: true }); cpSync(join(REPO, 'spawn/datapack', p), join(ziel, p), { recursive: true }); }
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
