// Spawn-Technik unabhängig vom Spawn-Design: erzeugt aus einer Standort-Konfiguration (spawn/standort-*.json) das Datapack „insel“
// (Rückweg-Plattform mit Portal-Übergang, Sättigung oben, Lichter, Aufbau mit Spawnpunkt und Weltgrenze) und die WorldGuard-Region.
// Aufrufe:
//   node spawn/standort.mjs bauen <konfig.json> [ausgabeordner]   → <ausgabe>/datapack/insel/… und <ausgabe>/worldguard/regions.yml
//                                                                   (ohne Ausgabeordner: spawn/, also die Dateien im Repo)
//   node spawn/standort.mjs lichter <konfig.json> <welt> [ausgabeordner]
//                                                                 → lichter.mcfunction aus dem fertig aufgebauten Gelände (Oval, nur Boden)
// Konfig-Felder siehe spawn/standort-testserver.json und spawn/AUFBAU.md.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');

// Rückweg-Plattform: runde Scheibe Radius 4, relativ zur Mitte [dx, dy, dz, block]. Form von Pascal freigegeben (24.10.), zwei Stile:
// „stein“ (Amethyst, lila Ring, Kristallsäulen) und „wurzel“ (Dunkeleiche, Moos, Pilzlicht – passend zum Weltenbaum)
const STILE = {
  stein: { mitte: 'minecraft:pearlescent_froglight', kreuz: 'minecraft:amethyst_block', ring: ['minecraft:purple_concrete', 'minecraft:black_concrete'], boden: 'minecraft:polished_andesite',
    rand: ['minecraft:mossy_stone_bricks', 'minecraft:stone_bricks'], treppe: 'minecraft:stone_brick_stairs', saeule: ['minecraft:crying_obsidian', 'minecraft:amethyst_block', 'minecraft:amethyst_block', 'minecraft:end_rod[facing=up]'], mauer: 'minecraft:mossy_stone_brick_wall' },
  wurzel: { mitte: 'minecraft:shroomlight', kreuz: 'minecraft:moss_block', ring: ['minecraft:stripped_dark_oak_wood[axis=y]', 'minecraft:rooted_dirt'], boden: 'minecraft:dark_oak_planks',
    rand: ['minecraft:dark_oak_wood[axis=y]', 'minecraft:mossy_cobblestone'], treppe: 'minecraft:dark_oak_stairs', saeule: ['minecraft:moss_block', 'minecraft:dark_oak_log[axis=y]', 'minecraft:dark_oak_log[axis=y]', 'minecraft:shroomlight'], mauer: 'minecraft:dark_oak_fence' },
};
export function plattformTeile(stil = 'stein') {
  const S = STILE[stil] ?? STILE.stein, teile = [];
  for (let dx = -4; dx <= 4; dx++) for (let dz = -4; dz <= 4; dz++) {
    const r = Math.hypot(dx, dz);
    if (r > 4.5) continue;
    let b;
    if (r === 0) b = S.mitte;                                                   // leuchtende Mitte
    else if (r <= 1) b = S.kreuz;                                               // Kreuz
    else if (r <= 2.3) b = Math.abs(dx) === Math.abs(dz) ? S.ring[1] : S.ring[0]; // Ring mit betonten Diagonalen
    else if (r <= 3.5) b = S.boden;                                             // Boden
    else b = (dx * 3 + dz) % 2 ? S.rand[0] : S.rand[1];                         // Rand
    teile.push([dx, 0, dz, b]);
    if (r > 3.5) teile.push([dx, -1, dz, `${S.treppe}[facing=` + (Math.abs(dx) > Math.abs(dz) ? (dx > 0 ? 'west' : 'east') : (dz > 0 ? 'north' : 'south')) + ',half=top]']);
  }
  for (const [dx, dz] of [[3, 3], [-3, 3], [3, -3], [-3, -3]]) S.saeule.forEach((b, i) => teile.push([dx, i, dz, b])); // vier Säulen
  for (const [dx, dz] of [[4, 0], [-4, 0], [0, 4], [0, -4]]) teile.push([dx, 1, dz, S.mauer], [dx, 2, dz, 'minecraft:lantern']);
  return teile;
}

// Kasten um Oval und Plattform, auf ganze Chunks erweitert (für forceload)
export function ladeKasten(k) {
  // Plattform, Ovale und – falls die Größe bekannt ist – die ganze Struktur (place template braucht alle Chunks ihres Kastens)
  const p = k.plattform ?? { x: k.spawn.x, z: k.spawn.z, radius: 0 }, ovale = [k.oval, k.pilzland].filter(Boolean);
  const st = k.struktur?.groesse; if (st) { const [ux, , uz] = k.struktur.ursprung; ovale.push({ x: ux + (st[0] - 1) / 2, z: uz + (st[2] - 1) / 2, a: (st[0] - 1) / 2, b: (st[2] - 1) / 2 }); }
  const x1 = Math.min(p.x - p.radius, ...ovale.map((o) => o.x - o.a)), x2 = Math.max(p.x + p.radius, ...ovale.map((o) => o.x + o.a));
  const z1 = Math.min(p.z - p.radius, ...ovale.map((o) => o.z - o.b)), z2 = Math.max(p.z + p.radius, ...ovale.map((o) => o.z + o.b));
  return [Math.floor(x1 / 16) * 16 + 8, Math.floor(z1 / 16) * 16 + 8, Math.floor(x2 / 16) * 16 + 8, Math.floor(z2 / 16) * 16 + 8];
}

// Pilzland (mushroom_fields) über die ganze Höhe im Oval: dort erscheinen in 26.3 keine Monster (natürliche Spawns nur Fledermaus,
// Pilzkuh auf Myzel, Leuchttintenfisch), keine Plünderer-Patrouillen, keine Zombie-Belagerungen. Spawner und Phantome bleiben.
// fillbiome in 8×8-Säulen von −64 bis 319 (8·8·384 = 24.576 < 32.768, Grenze für Befehle)
export function pilzlandBefehle({ x, z, a, b, biom = 'minecraft:mushroom_fields' }) {
  const out = [];
  for (let bz = Math.floor((z - b) / 8) * 8; bz <= z + b; bz += 8) for (let bx = Math.floor((x - a) / 8) * 8; bx <= x + a; bx += 8) {
    const mx = bx + 4, mz = bz + 4; if (((mx - x) / (a + 4)) ** 2 + ((mz - z) / (b + 4)) ** 2 > 1) continue;
    out.push(`fillbiome ${bx} -64 ${bz} ${bx + 7} 319 ${bz + 7} ${biom}`);
  }
  return out;
}

// place template für den Bau; mit struktur.kachel in Kacheln (tools/schem-struktur.mjs … <kachel>): <name>_<i>_<j> ab Ecke + (i·k, 0, j·k)
export function strukturBefehle({ name, ursprung: [x, y, z], groesse, kachel }) {
  if (!kachel) return [`place template ${name} ${x} ${y} ${z}`];
  const out = [];
  for (let j = 0; j * kachel < groesse[2]; j++) for (let i = 0; i * kachel < groesse[0]; i++) out.push(`place template ${name}_${i}_${j} ${x + i * kachel} ${y} ${z + j * kachel}`);
  return out;
}

export function ovalPunkte({ x, z, a, b }, n = 32) {
  return Array.from({ length: n }, (_, i) => { const w = 2 * Math.PI * i / n; return [Math.round(x + a * Math.cos(w)), Math.round(z + b * Math.sin(w))]; });
}

export function dateien(k) {
  // Optional: plattform (Rückweg mit Portal-Übergang), saettigung (+ obenBereich), lichter (Oval), eroeffnung (Ausgänge zu/auf), spawnTeleport
  const s = k.spawn, p = k.plattform, t = k.teleportTicks ?? 70, o = k.obenBereich, g = k.weltgrenze;
  const [lx1, lz1, lx2, lz2] = ladeKasten(k);
  const geladen = []; for (let x = lx1; x <= lx2; x += 16) for (let z = lz1; z <= lz2; z += 16) geladen.push(`if loaded ${x} ${(p?.y ?? s.y) + 2} ${z}`);
  const f = {};
  f.load = '# Zähler und Merker der Spawn-Technik\n';
  f.tick = '';
  if (p) {
    const auf = `x=${p.x + 0.5},y=${p.y + 1},z=${p.z + 0.5},distance=..${p.radius}`;
    f.load += 'scoreboard objectives add insel_tp dummy\n';
    f.tick += `# Rückweg wie ein Netherportal: auf der runden Plattform (Mitte ${p.x}/${p.y}/${p.z}, Radius ${p.radius}) stehen bleiben,
# nach ${t} Ticks (${t / 20} s) geht es auf den Spawn. Wer vorher runtergeht, bricht ab. Wirkt ohne OP (Datapack).
scoreboard players add @a[${auf},gamemode=!spectator] insel_tp 1
execute as @a[scores={insel_tp=1..}] unless entity @s[${auf},gamemode=!spectator] run function insel:abbruch
execute as @a[scores={insel_tp=1}] at @s run function insel:start
execute as @a[scores={insel_tp=2..${t - 1}}] at @s run particle minecraft:portal ~ ~1 ~ 0.4 0.9 0.4 0.6 6 normal
execute as @a[scores={insel_tp=${t}..}] at @s run function insel:zurueck
`;
    f.start = `# Beginn des Übergangs: Portal-Geräusch, Bildschirm wabert (Übelkeit), Hinweis
playsound minecraft:block.portal.trigger block @s ~ ~ ~ 0.7 1
effect give @s minecraft:nausea ${Math.ceil(t / 20) + 2} 0 true
title @s actionbar {"text":"Stehen bleiben – gleich geht es zurück zum Spawn …","color":"light_purple"}
`;
    f.abbruch = `# Plattform vor Ablauf verlassen: alles zurücksetzen
scoreboard players reset @s insel_tp
effect clear @s minecraft:nausea
stopsound @s block minecraft:block.portal.trigger
`;
    f.zurueck = `# Ankommen am Spawn: Reise-Geräusch, umgekehrte Portal-Partikel, kurz Blindheit als Einblendung
scoreboard players reset @s insel_tp
stopsound @s block minecraft:block.portal.trigger
tp @s ${s.x + 0.5} ${s.y} ${s.z + 0.5} ${s.yaw} ${s.pitch}
effect give @s minecraft:blindness 1 0 true
playsound minecraft:block.portal.travel block @s ~ ~ ~ 0.35 1
particle minecraft:reverse_portal ~ ~1 ~ 0.6 1 0.6 0.05 60 normal
title @s actionbar {"text":"Zurück am Spawn – zweimal springen zum Fliegen","color":"aqua"}
`;
  }
  if (k.saettigung && o) {
    const oben = `x=${o.von[0]},y=${o.von[1]},z=${o.von[2]},dx=${o.bis[0] - o.von[0]},dy=${o.bis[1] - o.von[1]},dz=${o.bis[2] - o.von[2]}`;
    f.load += 'scoreboard objectives add insel_satt dummy\n';
    f.tick += `
# Sättigung: beim Betreten des Spawns oben (Kasten ${o.von.join('/')} bis ${o.bis.join('/')}) einmal kurz Sättigung I für ${k.saettigung.sekunden} s,
# danach ${k.saettigung.abklingTicks / 1200} min Abklingzeit, damit Rein- und Rausspringen nichts bringt
scoreboard players remove @a[scores={insel_satt=1..}] insel_satt 1
execute as @a[tag=insel_oben] unless entity @s[${oben}] run tag @s remove insel_oben
execute as @a[${oben},tag=!insel_oben] run function insel:betreten
`;
    f.betreten = `# Spawn oben betreten: Sättigung nur, wenn die Abklingzeit abgelaufen ist
tag @s add insel_oben
execute unless score @s insel_satt matches 1.. run effect give @s minecraft:saturation ${k.saettigung.sekunden} 0 true
execute unless score @s insel_satt matches 1.. run scoreboard players set @s insel_satt ${k.saettigung.abklingTicks}
`;
  }
  const e = k.eroeffnung;
  if (e) {
    // Eröffnungs-Event: vor dem Start sind alle im geschlossenen Spawn (Ausgänge zu, kleine Weltgrenze). insel:eroeffnung zählt 10 s herunter,
    // öffnet die Ausgänge nacheinander und setzt die große Weltgrenze. Doppelt auslösen tut nichts (#offen), insel:schliessen setzt alles zurück.
    const fill = (b, blk) => `fill ${b.join(' ')} ${blk}`;
    f.load += 'scoreboard objectives add insel_zustand dummy\nexecute unless score #offen insel_zustand matches 0.. run scoreboard players set #offen insel_zustand 0\n';
    f.schliessen = [`# Spawn schließen (vor dem Start, auch zum Proben): Ausgänge zu, kleine Weltgrenze, Merker zurück`,
      ...e.ausgaenge.flatMap((a) => [fill(a.wurzeln, a.block ?? 'minecraft:mangrove_roots'), fill(a.barriere, 'minecraft:barrier')]),
      `worldborder center ${e.grenzeZu.x} ${e.grenzeZu.z}`, `worldborder set ${e.grenzeZu.breite}`,
      'scoreboard players set #offen insel_zustand 0', 'scoreboard players set #countdown insel_zustand -1', 'bossbar remove insel:eroeffnung',
      'say Spawn geschlossen – bereit für die Eröffnung (function insel:eroeffnung)'].join('\n') + '\n';
    f.eroeffnung = `# Eröffnung auslösen (Konsole oder AMP-Aufgabe). Läuft nur einmal, solange der Spawn offen ist (#offen = 1).
execute if score #offen insel_zustand matches 1 run say Spawn ist schon offen – nichts zu tun
execute if score #offen insel_zustand matches 0 if score #countdown insel_zustand matches 0.. run say Eröffnung läuft schon
execute if score #offen insel_zustand matches 0 unless score #countdown insel_zustand matches 0.. run function insel:eroeffnung_start
`;
    f.eroeffnung_start = `bossbar add insel:eroeffnung {"text":"${e.text ?? 'Der Baum öffnet sich …'}","color":"light_purple"}
bossbar set insel:eroeffnung max ${e.sekunden}
bossbar set insel:eroeffnung color purple
bossbar set insel:eroeffnung players @a
scoreboard players set #countdown insel_zustand ${e.sekunden}
playsound minecraft:block.beacon.activate master @a ~ ~ ~ 1 0.8
function insel:eroeffnung_tick
`;
    f.eroeffnung_tick = `# Jede Sekunde: Bossbar füllen, letzte 3 Sekunden als Titel, bei 0 öffnen
execute store result bossbar insel:eroeffnung value run scoreboard players get #countdown insel_zustand
execute if score #countdown insel_zustand matches 1..3 run title @a title {"score":{"name":"#countdown","objective":"insel_zustand"},"color":"gold"}
execute if score #countdown insel_zustand matches 1..3 as @a at @s run playsound minecraft:block.note_block.bell master @s ~ ~ ~ 1 1
execute if score #countdown insel_zustand matches 0 run function insel:oeffnen
execute if score #countdown insel_zustand matches 1.. run schedule function insel:eroeffnung_tick 20t
scoreboard players remove #countdown insel_zustand 1
`;
    f.oeffnen = [`# Ausgänge nacheinander öffnen, dann große Weltgrenze und Begrüßung`,
      'scoreboard players set #offen insel_zustand 1', 'bossbar remove insel:eroeffnung',
      ...e.ausgaenge.map((_, i) => `schedule function insel:ausgang_${i} ${1 + i * (e.abstand ?? 15)}t`),
      `schedule function insel:willkommen ${20 + e.ausgaenge.length * (e.abstand ?? 15)}t`].join('\n') + '\n';
    e.ausgaenge.forEach((a, i) => {
      // ohne „destroy“, sonst fallen die Blöcke als Gegenstände heraus: Bruch-Partikel des Verschlusses, Holz-Geräusch, Tresor-Ton bei erster und letzter Reihe
      const m = a.wurzeln.slice(0, 3).map((v, j) => (v + a.wurzeln[j + 3]) / 2), b = (a.block ?? 'minecraft:mangrove_roots').replace(/\[.*/, '');
      const sp = a.wurzeln.slice(0, 3).map((v, j) => Math.max(0.3, (a.wurzeln[j + 3] - v + 1) / 2)).join(' ');
      f[`ausgang_${i}`] = [fill(a.barriere, 'minecraft:air'), `fill ${a.wurzeln.join(' ')} minecraft:air`,
        `particle minecraft:block{block_state:"${b}"} ${m.join(' ')} ${sp} 0 60 force`,
        `particle minecraft:cherry_leaves ${m.join(' ')} ${sp} 0 30 force`, `particle minecraft:happy_villager ${m.join(' ')} ${sp} 0 12 force`,
        `playsound minecraft:block.wood.break master @a ${m.join(' ')} 1.5 0.7`,
        ...(i === 0 || i === e.ausgaenge.length - 1 ? [`playsound minecraft:block.vault.open_shutter master @a ${m.join(' ')} 2 0.8`] : [])].join('\n') + '\n';
    });
    // grenzeAufSekunden: die Weltgrenze fährt sichtbar auseinander statt zu springen
    f.willkommen = `worldborder center ${g.x} ${g.z}
worldborder set ${g.breite}${e.grenzeAufSekunden ? ` ${e.grenzeAufSekunden}` : ''}
title @a times 10 60 20
title @a subtitle {"text":"${e.untertitel ?? 'Der Baum ist offen – viel Spaß!'}","color":"green"}
title @a title {"text":"Willkommen!","color":"gold","bold":true}
execute as @a at @s run playsound minecraft:ui.toast.challenge_complete master @s ~ ~ ~ 1 1
`;
  }
  f.aufbau = `# Kompletter Spawn-Aufbau in einer frischen Welt (Konsole: function insel:aufbau)${k.struktur ? `, braucht lokal die Struktur ${k.struktur.name}` : ''}.
# Lädt die Chunks und wartet, bis sie da sind. Erzeugt aus ${k.datei ?? 'der Standort-Konfiguration'} mit spawn/standort.mjs.
forceload add ${lx1} ${lz1} ${lx2} ${lz2}
schedule function insel:aufbau_pruefen 20t
`;
  f.aufbau_pruefen = `# Erst weiter, wenn alle ${geladen.length} Chunks wirklich geladen sind (frische Welt erzeugt sie erst), sonst in 1 s erneut
scoreboard objectives add insel_tp dummy
execute store success score #geladen insel_tp ${geladen.join(' ')}
execute if score #geladen insel_tp matches 1 run function insel:aufbau_teil2
execute unless score #geladen insel_tp matches 1 run schedule function insel:aufbau_pruefen 20t
`;
  f.aufbau_teil2 = [
    // Hinweis gekaufter Bauten: beim Einfügen kein Zufallsticken (Laub, Ranken, Gras); aufbau_ende stellt den Standard wieder her
    k.struktur && `# Spawn-Bau als Struktur (untere Nordwest-Ecke ${k.struktur.ursprung.join('/')})\ngamerule random_tick_speed 0\n${strukturBefehle(k.struktur).join('\n')}`,
    k.pilzland && '# Pilzland-Biom (keine Monster) über die ganze Höhe\nfunction insel:pilzland',
    p && '# Rückweg-Plattform\nfunction insel:plattform',
    k.lichter !== null && '# Unsichtbare Lichter im Oval (spawn/standort.mjs lichter)\nfunction insel:lichter',
    k.tafeln?.length && '# Infotafeln (Namensnennung des Erbauers)\nfunction insel:tafeln',
    // Zusätzliche Bauteile, in Reihenfolge (z.B. Hub-Portal: erst Rahmen, dann Portalblöcke)
    k.bloecke?.length && `# Zusätzliche Bauteile\n${k.bloecke.map((b) => `fill ${b.von.join(' ')} ${b.bis.join(' ')} ${b.block}`).join('\n')}`,
    `setworldspawn ${s.x} ${s.y} ${s.z} ${s.yaw} ${s.pitch}`, 'gamerule respawn_radius 0',
    `# Weltgrenze (Vorgenerierung mit Chunky macht die Server-Session)\nworldborder center ${g.x} ${g.z}\nworldborder set ${g.breite}`,
    e && '# Vor dem Start geschlossen (Eröffnungs-Event)\nfunction insel:schliessen',
    '# In 5 s aufräumen und fertig melden\nschedule function insel:aufbau_ende 100t',
  ].filter(Boolean).join('\n') + '\n';
  f.aufbau_ende = [
    `# Beim Setzen abgefallene Gegenstände entfernen (Blumen des Geländes, deren Boden der Bau ersetzt hat), dann Chunks freigeben\nkill @e[type=item,x=${lx1 - 8},y=-64,z=${lz1 - 8},dx=${lx2 - lx1 + 16},dy=384,dz=${lz2 - lz1 + 16}]`,
    `forceload remove ${lx1} ${lz1} ${lx2} ${lz2}`,
    k.struktur && 'gamerule random_tick_speed 3',
    `say Spawn eingerichtet: ${k.struktur ? 'Bau, ' : ''}${p ? 'Plattform, ' : ''}${k.lichter !== null ? 'Lichter, ' : ''}Weltspawn ${s.x}/${s.y}/${s.z}, Weltgrenze${e ? ', geschlossen' : ''} (Nether/End per Konsole sperren)`,
  ].filter(Boolean).join('\n') + '\n';
  if (k.lichter !== null) {
    // Lichter nachträglich (nach „standort.mjs lichter“) in einer vorhandenen Welt setzen: Chunks laden, setzen, freigeben
    f.lichter_fertig = `forceload add ${lx1} ${lz1} ${lx2} ${lz2}\nschedule function insel:lichter_fertig2 60t\n`;
    f.lichter_fertig2 = `function insel:lichter\nforceload remove ${lx1} ${lz1} ${lx2} ${lz2}\nsay Lichter gesetzt\n`;
  }
  if (k.spawnTeleport) {
    // Spawn unter einem Dach (z.B. Baumkrone): 26.3 setzt Spieler sonst auf den obersten Block der Spalte. Deshalb beim ersten Betreten
    // der Welt und nach dem Tod ohne eigenen Respawnpunkt (Bett, Ankerstein) per Datapack auf den geplanten Spawn.
    f.load += `# Tode zählen, um Respawns ohne eigenen Respawnpunkt zu erkennen
scoreboard objectives add insel_tod deathCount
`;
    f.tick += `
# Erstes Betreten und Respawn ohne Bett: auf den geplanten Spawn (@e wählt nur lebende Spieler, also nach dem Wiederbeleben)
execute as @a[tag=!insel_da] run function insel:erstbesuch
execute as @e[type=player,scores={insel_tod=1..}] run function insel:respawn
`;
    f.erstbesuch = `# Erstes Betreten der Welt
tag @s add insel_da
tp @s ${s.x + 0.5} ${s.y} ${s.z + 0.5} ${s.yaw} ${s.pitch}
`;
    f.respawn = `# Nach dem Tod: nur ohne eigenen Respawnpunkt zurück auf den Spawn
scoreboard players reset @s insel_tod
execute unless data entity @s respawn run tp @s ${s.x + 0.5} ${s.y} ${s.z + 0.5} ${s.yaw} ${s.pitch}
`;
  }
  if (k.pilzland) f.pilzland = (k.pilzland.biom && k.pilzland.biom !== 'minecraft:mushroom_fields'
    ? `# Biom ${k.pilzland.biom} im Oval (Mitte ${k.pilzland.x}/${k.pilzland.z}, Halbachsen ${k.pilzland.a}/${k.pilzland.b}), ganze Höhe – Farben wie im Original; keine Monster macht hier die WorldGuard-Region\n`
    : `# Pilzland-Biom im Oval (Mitte ${k.pilzland.x}/${k.pilzland.z}, Halbachsen ${k.pilzland.a}/${k.pilzland.b}), ganze Höhe – keine Monster, Licht ist dann Stimmung\n`) + pilzlandBefehle(k.pilzland).join('\n') + '\n';
  // Infotafeln: gewachste Schilder (nicht bearbeitbar), bis 4 Zeilen; in 26.3 ist eine Zeichenkette im SNBT ein schlichter Text
  if (k.tafeln?.length) f.tafeln = '# Infotafeln am Spawn\n' + k.tafeln.map((t) => {
    const zeilen = [...t.zeilen, '', '', '', ''].slice(0, 4).map((z) => `"${z.replace(/"/g, '\\"')}"`).join(',');
    return `setblock ${t.x} ${t.y} ${t.z} ${t.block ?? 'minecraft:spruce_sign[rotation=0]'}{is_waxed:1b,front_text:{messages:[${zeilen}]}}`;
  }).join('\n') + '\n';
  if (p) f.plattform = `# Rückweg-Plattform (Mitte ${p.x}/${p.y}/${p.z}, Radius 4, Stil ${p.stil ?? 'stein'}), Form von Pascal freigegeben\n` +
    plattformTeile(p.stil).map(([dx, dy, dz, b]) => `setblock ${p.x + dx} ${p.y + dy} ${p.z + dz} ${b}`).join('\n') + '\n';
  const regionen = `# WorldGuard-Region der Oberwelt, erzeugt mit spawn/standort.mjs aus ${k.datei ?? 'der Standort-Konfiguration'}. Einspielen nach
#   plugins/WorldGuard/worlds/world/regions.yml   (laufender Server: rg load -w world)
# spawn: Oval (Mitte ${k.oval.x}/${k.oval.z}, Halbachsen ${k.oval.a} in x und ${k.oval.b} in z, 32 Punkte), volle Höhe: Spawnschutz (Nicht-Mitglieder bauen
#   nicht, OPs umgehen das), keine Monster, kein PvP, Truhen zu, Türen/Knöpfe frei.${k.saettigung ? " Sättigung macht das Datapack insel." : ""} Kein großes Bauverbot.
# Später weiterbauen (Pascal): Nicht-Mitglieder bauen in der Region nicht, deshalb kein build-Flag hier (build deny würde auch Mitglieder sperren).
#   Einzelne Spawn-Bauer:   rg addmember -w world spawn <Name>      (wieder weg: rg removemember -w world spawn <Name>)
#   Für alle freigeben:     rg flag -w world spawn build allow      (und ggf. rg flag -w world spawn chest-access allow)
#   Wieder schützen:        rg flag -w world spawn build             (Flag löschen)
regions:
    spawn:
        type: poly2d
        priority: 10
        min-y: -64
        max-y: 319
        points:
${ovalPunkte(k.oval).map(([x, z]) => `            - {x: ${x}, z: ${z}}`).join('\n')}
        members: {}
        owners: {}
        flags:
${['mob-spawning', 'pvp', 'chest-access', 'creeper-explosion', 'other-explosion', 'tnt', 'fire-spread', 'lava-fire', 'lighter', 'ghast-fireball', 'enderman-grief', 'ravager-grief', 'wither-damage', 'item-frame-rotation', 'vehicle-destroy', 'leaf-decay', 'ice-melt', 'snow-melt', 'vine-growth', 'mushroom-growth', 'mycelium-spread', 'coral-fade', 'copper-fade'].map((n) => `            ${n}: deny`).join('\n')}
            use: allow
`;
  return { funktionen: f, regionen };
}

export function lichterAus(k, welt) {
  return import('../tools/schem-welt.mjs').then(({ ausschneiden }) => import('../tools/schem-licht.mjs').then(({ lichter }) => {
    const { x, z, a, b } = k.oval, A = [x - a, 40, z - b], B = [x + a, 319, z + b];
    const m = ausschneiden(welt, A, B);
    return `# Unsichtbare Lichter nur im Oval (Mitte ${x}/${z}, Halbachsen ${a}/${b}), nur auf Boden bzw. Wasser, Raster ${k.lichter.raster} – erzeugt mit spawn/standort.mjs lichter\n` +
      lichter(m, A, k.lichter.unterkante, k.lichter.raster, { oval: [x, z, a, b], nurBoden: true }).join('\n') + '\n';
  }));
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('spawn/standort.mjs')) {
  const [befehl, konfig, ...rest] = process.argv.slice(2);
  const k = JSON.parse(readFileSync(konfig, 'utf8')); k.datei ??= konfig.replace(/\\/g, '/').split('/').slice(-2).join('/');
  if (befehl === 'bauen') {
    const aus = rest[0] ?? join(REPO, 'spawn');
    const fn = join(aus, 'datapack/insel/data/insel/function'), tags = join(aus, 'datapack/insel/data/minecraft/tags/function');
    mkdirSync(fn, { recursive: true }); mkdirSync(tags, { recursive: true }); mkdirSync(join(aus, 'worldguard'), { recursive: true });
    const { funktionen, regionen } = dateien(k);
    for (const [n, t] of Object.entries(funktionen)) writeFileSync(join(fn, `${n}.mcfunction`), t);
    // Lichter entstehen erst aus dem fertigen Gelände („lichter“); bis dahin ein leerer Platzhalter, sonst lädt insel:aufbau_teil2 nicht
    if (k.lichter !== null && !existsSync(join(fn, 'lichter.mcfunction'))) writeFileSync(join(fn, 'lichter.mcfunction'), '# Lichter folgen: node spawn/standort.mjs lichter <konfig> <welt>\n');
    writeFileSync(join(tags, 'tick.json'), '{ "values": ["insel:tick"] }\n');
    writeFileSync(join(tags, 'load.json'), '{ "values": ["insel:load"] }\n');
    writeFileSync(join(aus, 'datapack/insel/pack.mcmeta'), JSON.stringify({ pack: { description: 'Spawn-Technik: Rückweg-Plattform, Sättigung, Lichter, Aufbau', min_format: [121, 0], max_format: [121, 0] } }, null, 2) + '\n');
    writeFileSync(join(aus, 'worldguard/regions.yml'), regionen);
    console.log(`Datapack insel und regions.yml aus ${konfig} → ${aus} (lichter.mcfunction mit „lichter“ erzeugen)`);
  } else if (befehl === 'lichter') {
    const [welt, aus = join(REPO, 'spawn')] = rest;
    lichterAus(k, welt).then((t) => { writeFileSync(join(aus, 'datapack/insel/data/insel/function/lichter.mcfunction'), t); console.log(`${t.split('\n').length - 2} Lichter → ${aus}`); });
  } else if (befehl === 'aus-entwurf') {
    // Standort-Konfiguration aus Entwurfs-Metadaten (spawn/entwuerfe/ausgabe/*.json) und Platzierung (untere Nordwest-Ecke) in der Welt
    const [u, name = 'spawn:entwurf'] = rest, U = u.split(',').map(Number);
    const plus = (a) => a.map((v, i) => v + U[i % 3]);
    const sp = plus(k.spawn), mitte = k.spawnRaum ? plus(k.spawnRaum.mitte) : sp;
    console.log(JSON.stringify({
      beschreibung: `${k.name}, Ursprung ${U.join('/')}`, spawn: { x: sp[0], y: sp[1], z: sp[2], yaw: k.blick?.[0] ?? 0, pitch: k.blick?.[1] ?? 0 },
      spawnTeleport: true, oval: { x: k.oval.x + U[0], z: k.oval.z + U[2], a: k.oval.a, b: k.oval.b },
      ...(k.pilzland && { pilzland: { x: k.pilzland.x + U[0], z: k.pilzland.z + U[2], a: k.pilzland.a, b: k.pilzland.b } }),
      struktur: { name, ursprung: U, ...(k.groesse && { groesse: k.groesse }) }, weltgrenze: { x: mitte[0], z: mitte[2], breite: 10000 }, lichter: null,
      ...(k.ausgaenge?.length && { eroeffnung: { sekunden: 10, grenzeZu: { x: mitte[0], z: mitte[2], breite: 128 }, ...(k.tor?.abstand && { abstand: k.tor.abstand }),
        ausgaenge: k.ausgaenge.map((a) => ({ wurzeln: plus(a.wurzeln), barriere: plus(a.barriere), ...(a.block && { block: a.block }) })) } }),
    }, null, 2));
  } else console.log('Aufruf: bauen <konfig> [ausgabe] | lichter <konfig> <welt> [ausgabe] | aus-entwurf <entwurf.json> <ursprung x,y,z> [struktur] – siehe Kopf der Datei');
}
