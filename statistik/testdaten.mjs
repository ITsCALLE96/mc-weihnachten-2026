#!/usr/bin/env node
// Erzeugt eine glaubwürdige Test-Instanz (Paper-Logs, Statistiken, usercache, Sichtbarkeit) – deterministisch (fester Seed).
// node statistik/testdaten.mjs [--ziel <ordner>] [--live]   (legt zusätzlich <ziel>/archiv mit einer abgeschlossenen Season an)
//   --live  hängt danach alle paar Sekunden neue Zeilen an latest.log an und erhöht Werte (Test der Live-Anzeige)
import { mkdirSync, writeFileSync, appendFileSync, readFileSync, existsSync, rmSync, readdirSync, utimesSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ausBerlin, addiereTage, wochentag, isoBerlin } from './lib/zeit.mjs';
import { schreibeTar } from './lib/seasons.mjs';

const hier = dirname(fileURLToPath(import.meta.url));

function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const SPIELER = [
  { name: 'Schneeflocke42', typ: 'gelegentlich', tage: 0.45, std: 1.2, extra: { glocke: 3, kuchen: 1 } },
  { name: 'Lebkuchenlars', typ: 'miner', tage: 0.88, std: 2.7, extra: { diamant: 31, schrott: 48, totem: 2 } },
  { name: 'Rentier_Rudi', typ: 'kaempfer', tage: 0.82, std: 2.3, extra: { totem: 7 } },
  { name: 'Zimtstern_Zoe', typ: 'bauer', tage: 0.78, std: 2.0, extra: { kuchen: 26, glocke: 9 } },
  { name: 'Gluehwein_Gero', typ: 'baumeister', tage: 0.72, std: 2.5, extra: { glocke: 12 } },
  { name: 'Nikolaus_Nils', typ: 'entdecker', tage: 0.66, std: 2.1, extra: { totem: 1, feuerwerk: 220 } },
  { name: 'Tannenbaum_Tina', typ: 'angler', tage: 0.62, std: 1.7, extra: { glocke: 3 } },
  { name: 'Plaetzchen_Paul', typ: 'miner', tage: 0.55, std: 1.6, extra: { diamant: 12, schrott: 17, glocke: 54 } },
  { name: 'Eisbaer_Emil', typ: 'gelegentlich', tage: 0.3, std: 1.0, extra: { glocke: 74 } },
  { name: 'Wichtel_Wanda', typ: 'kaempfer', tage: 0.8, std: 2.1, extra: { totem: 4, glocke: 12 }, ausgeblendet: true },
];

const FAKTOR = {
  gelegentlich: { mine: 0.6, kampf: 0.6, bau: 0.6, farm: 0.6, reise: 0.7, angel: 0.5 },
  miner: { mine: 3, kampf: 0.8, bau: 0.7, farm: 0.4, reise: 0.8, angel: 0.3 },
  kaempfer: { mine: 0.6, kampf: 3, bau: 0.5, farm: 0.4, reise: 1.2, angel: 0.3 },
  bauer: { mine: 0.5, kampf: 0.5, bau: 1.2, farm: 3, reise: 0.8, angel: 0.8 },
  baumeister: { mine: 0.8, kampf: 0.4, bau: 3.5, farm: 0.5, reise: 0.8, angel: 0.3 },
  entdecker: { mine: 0.6, kampf: 1, bau: 0.5, farm: 0.3, reise: 3, angel: 0.4 },
  angler: { mine: 0.5, kampf: 0.5, bau: 0.7, farm: 0.9, reise: 1, angel: 4 },
};
const TODRATE = { gelegentlich: 0.2, miner: 0.35, kaempfer: 1.0, bauer: 0.1, baumeister: 0.08, entdecker: 0.6, angler: 0.1 };

const TODE_MOB = [
  ['was slain by Zombie', 'zombie'], ['was slain by Skeleton', 'skeleton'], ['was shot by Skeleton', 'skeleton'],
  ['was blown up by Creeper', 'creeper'], ['was slain by Spider', 'spider'], ['was slain by Husk', 'husk'],
  ['was fireballed by Ghast', 'ghast'], ['was slain by Enderman', 'enderman'], ['was shot by Pillager', 'pillager'],
];
const TODE_SONST = [
  'fell from a high place', 'hit the ground too hard', 'tried to swim in lava', 'drowned', 'burned to death',
  'went up in flames', 'suffocated in a wall', 'starved to death', 'was pricked to death', 'was killed by magic',
  'was struck by lightning', 'withered away',
];
const FORTSCHRITTE = [
  ['made the advancement', 'Stone Age'], ['made the advancement', 'Getting an Upgrade'], ['made the advancement', 'Acquire Hardware'],
  ['made the advancement', 'Suit Up'], ['made the advancement', "Isn't It Iron Pick?"], ['made the advancement', 'Diamonds!'],
  ['made the advancement', 'We Need to Go Deeper'], ['made the advancement', 'Enchanter'], ['made the advancement', 'Monster Hunter'],
  ['made the advancement', 'Sweet Dreams'], ['made the advancement', 'Hot Stuff'], ['made the advancement', 'Ice Bucket Challenge'],
  ['made the advancement', 'Adventure'], ['made the advancement', 'The Cutest Predator'],
  ['completed the challenge', 'Hero of the Village'], ['completed the challenge', 'Cover Me with Diamonds'],
  ['completed the challenge', 'Serious Dedication'], ['completed the challenge', 'Return to Sender'],
  ['reached the goal', 'Sniper Duel'], ['reached the goal', 'The End?'], ['reached the goal', 'Eye Spy'],
];
const CHAT = ['moin zusammen', 'hat jemand Eisen?', 'ich baue am Spawn weiter', 'wo ist die Glocke?', 'frohe Weihnachten!', 'brb', 'wer kommt mit in den Nether?', 'der Creeper war es'];

function uuidAus(rnd) {
  const b = Array.from({ length: 16 }, () => Math.floor(rnd() * 256));
  b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
  const h = b.map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

const zeitText = (ms) => isoBerlin(ms).slice(11, 19);
const zeile = (ms, text) => `[${zeitText(ms)} INFO]: ${text}`;

// --- Stunden → Statistiken --------------------------------------------------------------
function statistiken(p, stunden, tode, todeUrsachen, rnd) {
  const f = FAKTOR[p.typ];
  const r = (x) => Math.max(0, Math.round(x * (0.8 + rnd() * 0.4)));
  const h = stunden;
  const e = p.extra;
  const custom = {
    play_time: Math.round(h * 72000), total_world_time: Math.round(h * 72000 * 1.9),
    deaths: tode, leave_game: Math.round(h / 1.8),
    mob_kills: r(45 * f.kampf * h), damage_dealt: r(5200 * f.kampf * h), damage_taken: r(3200 * (0.5 + f.kampf) * h),
    walk_one_cm: r(380000 * f.reise * h), sprint_one_cm: r(240000 * f.reise * h), crouch_one_cm: r(14000 * h),
    swim_one_cm: r(20000 * h * (f.angel > 2 ? 3 : 1)), walk_under_water_one_cm: r(7000 * h), walk_on_water_one_cm: r(1500 * f.angel * h),
    fall_one_cm: r(60000 * (f.mine + f.reise) * h), aviate_one_cm: p.typ === 'entdecker' ? r(150000 * h) : r(4000 * h),
    boat_one_cm: r(12000 * f.angel * h), horse_one_cm: r(15000 * f.reise * h), minecart_one_cm: r(25000 * f.mine * h),
    jump: r(2300 * f.reise * h * (p.name === 'Eisbaer_Emil' ? 4 : 1)), sneak_time: r(4000 * h), time_since_death: Math.round(rnd() * 400000),
    animals_bred: r(14 * f.farm * h), fish_caught: r(11 * f.angel * h), traded_with_villager: r(3.5 * f.farm * h),
    bell_ring: e.glocke ?? 0, sleep_in_bed: Math.max(0, Math.round(h / 3.2 * (0.7 + rnd() * 0.6))),
    open_chest: r(50 * (f.mine + f.bau) / 2 * h), interact_with_crafting_table: r(28 * h), eat_cake_slice: e.kuchen ?? 0,
    drop: r(30 * h), enchant_item: r(1.2 * f.mine * h), player_kills: p.typ === 'kaempfer' ? Math.round(rnd() * 3) : 0,
  };
  const mined = {
    stone: r(520 * f.mine * h), deepslate: r(380 * f.mine * h), dirt: r(140 * h * (f.bau + 0.5)), cobblestone: r(260 * f.mine * h),
    gravel: r(35 * h), sand: r(45 * f.bau * h), netherrack: r(70 * f.mine * h), oak_log: r(30 * (f.farm + f.bau) * h / 2),
    iron_ore: r(8 * f.mine * h), deepslate_iron_ore: r(10 * f.mine * h), coal_ore: r(9 * f.mine * h), copper_ore: r(7 * f.mine * h),
    redstone_ore: r(4 * f.mine * h), lapis_ore: r(2 * f.mine * h), gold_ore: r(2 * f.mine * h),
    diamond_ore: e.diamant ? Math.round(e.diamant * 0.35) : r(0.15 * f.mine * h),
    deepslate_diamond_ore: e.diamant ? Math.round(e.diamant * 0.65) : r(0.2 * f.mine * h),
    wheat: r(60 * f.farm * h), carrots: r(35 * f.farm * h), potatoes: r(30 * f.farm * h), sugar_cane: r(20 * f.farm * h),
    pumpkin: r(4 * f.farm * h), obsidian: r(2 * f.mine * h), snow_block: r(12 * h), spruce_log: r(20 * f.bau * h),
  };
  if (e.schrott) mined.ancient_debris = e.schrott; else if (f.mine > 2) mined.ancient_debris = 1;
  const used = {
    cobblestone: r(420 * f.bau * h), oak_planks: r(360 * f.bau * h), stone_bricks: r(150 * f.bau * h), glass: r(110 * f.bau * h),
    dirt: r(70 * h), torch: r(55 * h), spruce_planks: r(120 * f.bau * h), oak_door: r(6 * f.bau * h), crafting_table: r(2 * h),
    chest: r(3 * (f.bau + f.farm) * h), furnace: r(1.5 * h), white_wool: r(25 * f.farm * h), wheat_seeds: r(90 * f.farm * h),
    diamond_pickaxe: r(700 * f.mine * h), iron_pickaxe: r(150 * f.mine * h), diamond_sword: r(160 * f.kampf * h), iron_sword: r(60 * f.kampf * h),
    bow: r(30 * f.kampf * h), shield: r(25 * f.kampf * h), bone_meal: r(50 * f.farm * h), fishing_rod: r(15 * f.angel * h),
    cooked_beef: r(6 * h), bread: r(4 * f.farm * h), apple: r(2 * h), golden_apple: r(0.4 * f.kampf * h), carrot: r(2 * f.farm * h),
    baked_potato: r(2 * f.farm * h), cooked_porkchop: r(4 * h), cookie: r(3 * h), pumpkin_pie: r(0.8 * f.farm * h),
    cooked_salmon: r(2 * f.angel * h), cooked_cod: r(2 * f.angel * h),
  };
  if (e.kuchen) used.cake = r(6);
  if (e.totem) used.totem_of_undying = e.totem;
  if (e.feuerwerk) used.firework_rocket = e.feuerwerk;
  const crafted = {
    crafting_table: r(1 * h), torch: r(30 * h), oak_planks: r(80 * h), stick: r(120 * h), chest: r(2 * h), bread: r(3 * f.farm * h),
    iron_pickaxe: r(0.5 * f.mine * h), diamond_pickaxe: r(0.2 * f.mine * h), cooked_beef: r(5 * h), furnace: r(1 * h),
  };
  const broken = {
    iron_pickaxe: r(1.2 * f.mine * h), diamond_pickaxe: r(0.4 * f.mine * h), iron_sword: r(0.6 * f.kampf * h), shears: r(0.5 * f.farm * h),
  };
  if (p.typ === 'entdecker') broken.elytra = 1;
  const picked = { cobblestone: r(180 * f.mine * h), dirt: r(90 * h), rotten_flesh: r(14 * f.kampf * h), bone: r(6 * f.kampf * h), arrow: r(5 * f.kampf * h), cod: r(6 * f.angel * h) };
  const dropped = { cobblestone: r(40 * h), rotten_flesh: r(10 * f.kampf * h), dirt: r(15 * h) };
  const killed = {
    zombie: r(14 * f.kampf * h), skeleton: r(8 * f.kampf * h), creeper: r(5 * f.kampf * h), spider: r(6 * f.kampf * h),
    enderman: r(1.5 * f.kampf * h), pig: r(2 * f.farm * h), cow: r(2 * f.farm * h), chicken: r(2 * f.farm * h), sheep: r(1.5 * f.farm * h),
  };
  const killedBy = {};
  for (const u of todeUrsachen) killedBy[u] = (killedBy[u] ?? 0) + 1;
  const mk = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v > 0).map(([k, v]) => [`minecraft:${k}`, v]));
  const stats = {
    'minecraft:custom': mk(custom), 'minecraft:mined': mk(mined), 'minecraft:used': mk(used), 'minecraft:crafted': mk(crafted),
    'minecraft:broken': mk(broken), 'minecraft:picked_up': mk(picked), 'minecraft:dropped': mk(dropped), 'minecraft:killed': mk(killed),
  };
  if (Object.keys(killedBy).length) stats['minecraft:killed_by'] = mk(killedBy);
  return { stats, DataVersion: 5023 };
}

// --- Hauptfunktion -----------------------------------------------------------------------
export function erzeugeTestwelt(ziel, { seed = 2026, start = '2026-12-05', tage = 18, variante = 0, ausgeblendetMord = true } = {}) {
  ziel = resolve(ziel);
  if (existsSync(ziel) && readdirSync(ziel).length) {
    if (!existsSync(join(ziel, '.testwelt'))) throw new Error(`${ziel} ist nicht leer und keine Testwelt – abgebrochen`);
    rmSync(ziel, { recursive: true, force: true });
  }
  const rnd = mulberry32(seed);
  const zahl = (a, b) => a + rnd() * (b - a);
  const wahl = (a) => a[Math.floor(rnd() * a.length)];
  const spieler = SPIELER.map((p) => ({ ...p, uuid: uuidAus(rnd), tode: 0, ursachen: [], fortschritte: [], sek: 0 }));
  for (let i = 0; i < variante * 7; i++) rnd(); // gleiche Spieler (UUIDs), anderer Verlauf
  const nach = (n) => spieler.find((p) => p.name === n);
  const wanda = nach('Wichtel_Wanda');

  const sitzungen = []; // { p, start, ende|null, quit: bool }
  const letzterTag = addiereTage(start, tage - 1);
  for (let t = 0; t < tage; t++) {
    const datum = addiereTage(start, t);
    const wochenende = [0, 6].includes(wochentag(datum));
    for (const p of spieler) {
      if (rnd() > Math.min(0.95, p.tage * (wochenende ? 1.3 : 1))) continue;
      const n = wochenende && rnd() < 0.3 ? 2 : 1;
      let von = wochenende ? zahl(13, 20) : zahl(16.5, 20.5);
      for (let i = 0; i < n; i++) {
        const dauer = zahl(0.5, 1.5) * p.std * 60 * (wochenende ? 1.3 : 1) / (n === 2 ? 1.8 : 1);
        const s0 = ausBerlin(datum, Math.floor(von), Math.floor((von % 1) * 60), Math.floor(rnd() * 60));
        sitzungen.push({ p, start: s0, ende: s0 + Math.round(dauer) * 60000, quit: true });
        von += dauer / 60 + zahl(1, 2.5);
      }
    }
  }
  const setze = (p, datum, v1, v2) => {
    for (let i = sitzungen.length - 1; i >= 0; i--) if (sitzungen[i].p === p && sitzungen[i].start >= ausBerlin(datum) && sitzungen[i].start < ausBerlin(addiereTage(datum, 1))) sitzungen.splice(i, 1);
    sitzungen.push({ p, start: ausBerlin(datum, ...v1), ende: ausBerlin(datum, ...v2), quit: true });
  };
  // gezielte Fälle: Sitzung über Mitternacht, Absturz, Mörder Wanda, letzter Tag mit zwei Online
  setze(nach('Lebkuchenlars'), '2026-12-12', [23, 10, 5], [24, 40, 20]);
  setze(nach('Rentier_Rudi'), '2026-12-09', [20, 0, 12], [22, 0, 0]);
  setze(nach('Rentier_Rudi'), '2026-12-16', [20, 0, 40], [22, 30, 0]);
  setze(wanda, '2026-12-16', [19, 30, 11], [22, 30, 0]);
  const CRASH = ausBerlin('2026-12-09', 20, 40, 7);
  const NEUSTART = ausBerlin('2026-12-09', 20, 52, 31);
  for (let i = sitzungen.length - 1; i >= 0; i--) {
    const s = sitzungen[i];
    if (s.start < CRASH && s.ende > CRASH && s.start >= ausBerlin('2026-12-09')) { s.ende = CRASH; s.quit = false; }
    else if (s.start >= CRASH && s.start < NEUSTART + 180000) s.start = NEUSTART + 240000, s.ende = Math.max(s.ende, s.start + 20 * 60000);
  }
  // letzter Tag: Gero und Tina bleiben online, alle anderen sind vor 21:30 durch
  const ende = ausBerlin(letzterTag, 21, 47, 0);
  for (let i = sitzungen.length - 1; i >= 0; i--) {
    const s = sitzungen[i];
    if (s.start >= ausBerlin(letzterTag)) sitzungen.splice(i, 1);
  }
  sitzungen.push({ p: nach('Gluehwein_Gero'), start: ausBerlin(letzterTag, 19, 12, 3), ende: null, quit: false });
  sitzungen.push({ p: nach('Tannenbaum_Tina'), start: ausBerlin(letzterTag, 20, 5, 44), ende: null, quit: false });
  sitzungen.push({ p: nach('Nikolaus_Nils'), start: ausBerlin(letzterTag, 18, 3, 12), ende: ausBerlin(letzterTag, 20, 30, 0), quit: true });
  sitzungen.push({ p: nach('Zimtstern_Zoe'), start: ausBerlin(letzterTag, 17, 20, 40), ende: ausBerlin(letzterTag, 19, 45, 0), quit: true });
  sitzungen.sort((a, b) => a.start - b.start);

  // Logzeilen sammeln
  const zeilen = []; // { zeit, text }
  const add = (zeit, text) => zeilen.push({ zeit, text });
  add(ausBerlin(start, 15, 0, 0), 'Done (4.213s)! For help, type "help"');
  add(ausBerlin('2026-12-14', 3, 0, 0), 'Stopping server');
  add(ausBerlin('2026-12-14', 3, 3, 10), 'Done (3.987s)! For help, type "help"');
  add(NEUSTART, 'Done (4.020s)! For help, type "help"');
  let eid = 100;
  for (const s of sitzungen) {
    const p = s.p;
    const bis = s.ende ?? ende;
    add(s.start - 2000, `UUID of player ${p.name} is ${p.uuid}`);
    add(s.start - 1000, `${p.name}[/127.0.0.1:${50000 + Math.floor(rnd() * 9000)}] logged in with entity id ${eid++} at ([world]${(rnd() * 400 - 200).toFixed(1)}, 64.0, ${(rnd() * 400 - 200).toFixed(1)})`);
    add(s.start, `${p.name} joined the game`);
    const stunden = Math.max(0, (bis - s.start) / 3600000);
    p.sek += (bis - s.start) / 1000;
    for (let i = 0, n = Math.floor(stunden * TODRATE[p.typ] * (0.6 + rnd() * 0.8) + rnd()); i < n; i++) {
      const zt = s.start + 60000 + rnd() * Math.max(1, bis - s.start - 120000);
      let ursache; let eintrag;
      const w = rnd();
      if (w < 0.55) { const [t, e] = wahl(TODE_MOB); ursache = e; eintrag = `${p.name} ${t}`; }
      else if (w < 0.62 && p.typ === 'kaempfer') { eintrag = `${p.name} was slain by ${wahl(spieler.filter((x) => x !== p)).name}`; }
      else eintrag = `${p.name} ${wahl(TODE_SONST)}`;
      add(zt, eintrag);
      p.tode++;
      if (ursache) p.ursachen.push(ursache);
    }
    const nFort = Math.floor(stunden * 0.7 * rnd() * (p.typ === "gelegentlich" ? 0.5 : 1) + rnd());
    for (let i = 0; i < nFort && p.fortschritte.length < FORTSCHRITTE.length; i++) {
      let k; do { k = Math.floor(rnd() * FORTSCHRITTE.length); } while (p.fortschritte.includes(k));
      p.fortschritte.push(k);
      add(s.start + 120000 + rnd() * Math.max(1, bis - s.start - 240000), `${p.name} has ${FORTSCHRITTE[k][0]} [${FORTSCHRITTE[k][1]}]`);
    }
    if (rnd() < 0.5) add(s.start + 60000 + rnd() * Math.max(1, bis - s.start - 120000), `<${p.name}> ${wahl(CHAT)}`);
    if (s.quit) {
      add(s.ende - 500, `${p.name} lost connection: Disconnected`);
      add(s.ende, `${p.name} left the game`);
    }
  }
  // Wanda erschlägt Rudi (Datenschutz: darf nirgends auftauchen)
  if (ausgeblendetMord) {
    add(ausBerlin(addiereTage(start, 11), 21, 15, 9), 'Rentier_Rudi was slain by Wichtel_Wanda');
    nach('Rentier_Rudi').tode++;
  }
  add(ende, `${nach('Gluehwein_Gero').name} has made the advancement [Enchanter]`);
  zeilen.sort((a, b) => a.zeit - b.zeit);

  // Dateien schreiben
  const logs = join(ziel, 'logs');
  const welt = join(ziel, 'world');
  mkdirSync(logs, { recursive: true });
  mkdirSync(join(welt, 'players', 'stats'), { recursive: true });
  writeFileSync(join(ziel, '.testwelt'), 'von testdaten.mjs erzeugt – darf überschrieben werden\n');
  const proTag = new Map();
  for (const z of zeilen) {
    const d = isoBerlin(z.zeit).slice(0, 10);
    if (!proTag.has(d)) proTag.set(d, []);
    proTag.get(d).push(zeile(z.zeit, z.text));
  }
  for (const [d, l] of proTag) {
    const inhalt = `${l.join('\n')}\n`;
    if (d === letzterTag) {
      writeFileSync(join(logs, 'latest.log'), inhalt);
      utimesSync(join(logs, 'latest.log'), new Date(ende), new Date(ende));
    } else {
      const f = join(logs, `${d}-1.log.gz`);
      writeFileSync(f, gzipSync(inhalt));
      const t = new Date(ausBerlin(d, 23, 59, 59));
      utimesSync(f, t, t);
    }
  }
  for (const p of spieler) {
    const st = statistiken(p, p.sek / 3600, p.tode, p.ursachen, rnd);
    const f = join(welt, 'players', 'stats', `${p.uuid}.json`);
    writeFileSync(f, JSON.stringify(st));
    const t = new Date(ende - Math.floor(rnd() * 3 * 86400000));
    utimesSync(f, t, t);
  }
  writeFileSync(join(ziel, 'usercache.json'), JSON.stringify(spieler.map((p) => ({ name: p.name, uuid: p.uuid, expiresOn: '2027-01-20 12:00:00 +0100' })), null, 2));
  writeFileSync(join(ziel, 'server.properties'), '#Minecraft server properties\nlevel-name=world\nmotd=Weihnachtsserver (Testdaten)\nserver-port=25565\n');
  writeFileSync(join(ziel, 'sichtbarkeit.json'), JSON.stringify({ ausgeblendet: [wanda.uuid] }, null, 2));
  return { ziel, spieler, ausgeblendet: wanda, jetzt: ende, sichtbarkeit: join(ziel, 'sichtbarkeit.json') };
}

// --- Archiv mit einer abgeschlossenen Season -----------------------------------------------
// <ziel>/archiv/SEASON = weihnachten-2026, <ziel>/archiv/herbst-2026/ (Schnappschuss + Logs wie schnappschuss.sh)
export function erzeugeArchiv(ziel, { vorher = 'herbst-2026', aktuell = 'weihnachten-2026' } = {}) {
  ziel = resolve(ziel);
  const archiv = join(ziel, 'archiv');
  const tmp = join(ziel, '.vorher');
  const alt = erzeugeTestwelt(tmp, { start: '2026-10-03', tage: 14, variante: 1, ausgeblendetMord: false });
  const ordner = join(archiv, vorher);
  mkdirSync(join(ordner, 'logs', 'paper'), { recursive: true });
  mkdirSync(join(ordner, 'schnappschuesse'), { recursive: true });
  mkdirSync(join(archiv, aktuell, 'logs', 'paper'), { recursive: true });
  for (const f of readdirSync(join(tmp, 'logs'))) {
    const inhalt = readFileSync(join(tmp, 'logs', f));
    if (f === 'latest.log') writeFileSync(join(ordner, 'logs', 'paper', `${isoBerlin(alt.jetzt).slice(0, 10)}-1.log.gz`), gzipSync(inhalt));
    else writeFileSync(join(ordner, 'logs', 'paper', f), inhalt);
  }
  const datum = addiereTage(isoBerlin(alt.jetzt).slice(0, 10), 1);
  const statOrdner = join(tmp, 'world', 'players', 'stats');
  const eintraege = readdirSync(statOrdner).map((f) => ({ pfad: `${datum}/world/players/stats/${f}`, inhalt: readFileSync(join(statOrdner, f)) }));
  eintraege.push({ pfad: `${datum}/usercache.json`, inhalt: readFileSync(join(tmp, 'usercache.json')) });
  writeFileSync(join(ordner, 'schnappschuesse', `${datum}.tar.gz`), gzipSync(schreibeTar(eintraege)));
  writeFileSync(join(archiv, 'SEASON'), `${aktuell}
`);
  rmSync(tmp, { recursive: true, force: true });
  return archiv;
}

// --- Live-Modus ---------------------------------------------------------------------------
export function live(ziel, welt, { intervallMs = 4000 } = {}) {
  const rnd = mulberry32(99);
  const wahl = (a) => a[Math.floor(rnd() * a.length)];
  const log = join(ziel, 'logs', 'latest.log');
  let virtuell = welt.jetzt;
  const online = new Set(['Gluehwein_Gero', 'Tannenbaum_Tina']);
  const statPfad = (p) => join(ziel, 'world', 'players', 'stats', `${p.uuid}.json`);
  const schreibe = (text) => {
    virtuell += 20000 + Math.floor(rnd() * 30000);
    appendFileSync(log, `${zeile(virtuell, text)}\n`);
    utimesSync(log, new Date(virtuell), new Date(virtuell));
    console.log(zeitText(virtuell), text);
  };
  const erhoehe = (p, kat, key, n) => {
    const j = JSON.parse(readFileSync(statPfad(p), 'utf8'));
    j.stats[kat] ??= {};
    j.stats[kat][key] = (j.stats[kat][key] ?? 0) + n;
    writeFileSync(statPfad(p), JSON.stringify(j));
  };
  let runde = 0;
  const timer = setInterval(() => {
    runde++;
    const offline = welt.spieler.filter((p) => !online.has(p.name));
    const da = welt.spieler.filter((p) => online.has(p.name));
    const w = rnd();
    if (w < 0.25 && offline.length) {
      const p = wahl(offline); online.add(p.name);
      schreibe(`UUID of player ${p.name} is ${p.uuid}`);
      schreibe(`${p.name} joined the game`);
    } else if (w < 0.5 && da.length) {
      const p = wahl(da); schreibe(`${p.name} ${wahl([...TODE_MOB.map((x) => x[0]), ...TODE_SONST])}`);
      erhoehe(p, 'minecraft:custom', 'minecraft:deaths', 1);
    } else if (w < 0.7 && da.length) {
      const p = wahl(da); const [art, titel] = wahl(FORTSCHRITTE); schreibe(`${p.name} has ${art} [${titel}]`);
    } else if (w < 0.85 && da.length > 1) {
      const p = wahl(da); online.delete(p.name);
      schreibe(`${p.name} left the game`);
    } else if (da.length) {
      schreibe(`<${wahl(da).name}> ${wahl(CHAT)}`);
    }
    if (runde % 2 === 0) for (const p of da) { erhoehe(p, 'minecraft:custom', 'minecraft:play_time', 1200); erhoehe(p, 'minecraft:mined', 'minecraft:stone', 25); }
  }, intervallMs);
  return () => clearInterval(timer);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const a = process.argv.slice(2);
  const ziel = a.includes('--ziel') ? a[a.indexOf('--ziel') + 1] : join(hier, 'testwelt');
  const welt = erzeugeTestwelt(ziel);
  const archiv = erzeugeArchiv(ziel);
  console.log(`Testwelt: ${welt.ziel} (${welt.spieler.length} Spieler, ausgeblendet: ${welt.ausgeblendet.name}), Archiv mit Season herbst-2026: ${archiv}`);
  if (a.includes('--live')) {
    console.log('Live-Modus: hängt alle paar Sekunden Zeilen an latest.log an (Strg+C beendet).');
    live(welt.ziel, welt);
  }
}
