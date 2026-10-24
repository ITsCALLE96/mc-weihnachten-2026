// Spawn-Technik unabhängig vom Spawn-Design: erzeugt aus einer Standort-Konfiguration (spawn/standort-*.json) das Datapack „insel“
// (Rückweg-Plattform mit Portal-Übergang, Sättigung oben, Lichter, Aufbau mit Spawnpunkt und Weltgrenze) und die WorldGuard-Region.
// Aufrufe:
//   node spawn/standort.mjs bauen <konfig.json> [ausgabeordner]   → <ausgabe>/datapack/insel/… und <ausgabe>/worldguard/regions.yml
//                                                                   (ohne Ausgabeordner: spawn/, also die Dateien im Repo)
//   node spawn/standort.mjs lichter <konfig.json> <welt> [ausgabeordner]
//                                                                 → lichter.mcfunction aus dem fertig aufgebauten Gelände (Oval, nur Boden)
// Konfig-Felder siehe spawn/standort-testserver.json und spawn/AUFBAU.md.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');

// Rückweg-Plattform (Entwurf von Pascal freigegeben 24.10.): runde Scheibe Radius 4, relativ zur Mitte [dx, dy, dz, block]
export function plattformTeile() {
  const teile = [];
  for (let dx = -4; dx <= 4; dx++) for (let dz = -4; dz <= 4; dz++) {
    const r = Math.hypot(dx, dz);
    if (r > 4.5) continue;
    let b;
    if (r === 0) b = 'minecraft:pearlescent_froglight';                        // leuchtende Mitte
    else if (r <= 1) b = 'minecraft:amethyst_block';                            // Amethyst-Kreuz
    else if (r <= 2.3) b = Math.abs(dx) === Math.abs(dz) ? 'minecraft:black_concrete' : 'minecraft:purple_concrete'; // lila Ring, schwarze Diagonalen
    else if (r <= 3.5) b = 'minecraft:polished_andesite';                       // Boden
    else b = (dx * 3 + dz) % 2 ? 'minecraft:mossy_stone_bricks' : 'minecraft:stone_bricks'; // Rand
    teile.push([dx, 0, dz, b]);
    if (r > 3.5) teile.push([dx, -1, dz, 'minecraft:stone_brick_stairs[facing=' + (Math.abs(dx) > Math.abs(dz) ? (dx > 0 ? 'west' : 'east') : (dz > 0 ? 'north' : 'south')) + ',half=top]']);
  }
  for (const [dx, dz] of [[3, 3], [-3, 3], [3, -3], [-3, -3]]) // vier Kristallsäulen
    teile.push([dx, 0, dz, 'minecraft:crying_obsidian'], [dx, 1, dz, 'minecraft:amethyst_block'], [dx, 2, dz, 'minecraft:amethyst_block'], [dx, 3, dz, 'minecraft:end_rod[facing=up]']);
  for (const [dx, dz] of [[4, 0], [-4, 0], [0, 4], [0, -4]]) teile.push([dx, 1, dz, 'minecraft:mossy_stone_brick_wall'], [dx, 2, dz, 'minecraft:lantern']);
  return teile;
}

// Kasten um Oval und Plattform, auf ganze Chunks erweitert (für forceload)
export function ladeKasten(k) {
  const { x, z, a, b } = k.oval, p = k.plattform;
  const x1 = Math.min(x - a, p.x - p.radius), x2 = Math.max(x + a, p.x + p.radius), z1 = Math.min(z - b, p.z - p.radius), z2 = Math.max(z + b, p.z + p.radius);
  return [Math.floor(x1 / 16) * 16 + 8, Math.floor(z1 / 16) * 16 + 8, Math.floor(x2 / 16) * 16 + 8, Math.floor(z2 / 16) * 16 + 8];
}

export function ovalPunkte({ x, z, a, b }, n = 32) {
  return Array.from({ length: n }, (_, i) => { const w = 2 * Math.PI * i / n; return [Math.round(x + a * Math.cos(w)), Math.round(z + b * Math.sin(w))]; });
}

export function dateien(k) {
  const s = k.spawn, p = k.plattform, t = k.teleportTicks, o = k.obenBereich, g = k.weltgrenze;
  const [lx1, lz1, lx2, lz2] = ladeKasten(k);
  const auf = `x=${p.x + 0.5},y=${p.y + 1},z=${p.z + 0.5},distance=..${p.radius}`;
  const oben = `x=${o.von[0]},y=${o.von[1]},z=${o.von[2]},dx=${o.bis[0] - o.von[0]},dy=${o.bis[1] - o.von[1]},dz=${o.bis[2] - o.von[2]}`;
  const geladen = []; for (let x = lx1; x <= lx2; x += 16) for (let z = lz1; z <= lz2; z += 16) geladen.push(`if loaded ${x} ${p.y + 2} ${z}`);
  const f = {};
  f.load = `# Zähler für den Portal-Übergang auf der Rückweg-Plattform (Ticks, die man schon draufsteht)
scoreboard objectives add insel_tp dummy
# Abklingzeit der Sättigung beim Betreten des Spawns oben (Ticks)
scoreboard objectives add insel_satt dummy
`;
  f.tick = `# Rückweg wie ein Netherportal: auf der runden Plattform (Mitte ${p.x}/${p.y}/${p.z}, Radius ${p.radius}) stehen bleiben,
# nach ${t} Ticks (${t / 20} s) geht es auf den Spawn. Wer vorher runtergeht, bricht ab. Wirkt ohne OP (Datapack).
scoreboard players add @a[${auf},gamemode=!spectator] insel_tp 1
execute as @a[scores={insel_tp=1..}] unless entity @s[${auf},gamemode=!spectator] run function insel:abbruch
execute as @a[scores={insel_tp=1}] at @s run function insel:start
execute as @a[scores={insel_tp=2..${t - 1}}] at @s run particle minecraft:portal ~ ~1 ~ 0.4 0.9 0.4 0.6 6 normal
execute as @a[scores={insel_tp=${t}..}] at @s run function insel:zurueck

# Sättigung: beim Betreten des Spawns oben (Kasten ${o.von.join('/')} bis ${o.bis.join('/')}) einmal kurz Sättigung I für ${k.saettigung.sekunden} s,
# danach ${k.saettigung.abklingTicks / 1200} min Abklingzeit, damit Rein- und Rausspringen nichts bringt
scoreboard players remove @a[scores={insel_satt=1..}] insel_satt 1
execute as @a[tag=insel_oben] unless entity @s[${oben}] run tag @s remove insel_oben
execute as @a[${oben},tag=!insel_oben] run function insel:betreten
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
  f.betreten = `# Spawn oben betreten: Sättigung nur, wenn die Abklingzeit abgelaufen ist
tag @s add insel_oben
execute unless score @s insel_satt matches 1.. run effect give @s minecraft:saturation ${k.saettigung.sekunden} 0 true
execute unless score @s insel_satt matches 1.. run scoreboard players set @s insel_satt ${k.saettigung.abklingTicks}
`;
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
    k.struktur && `# Spawn-Bau als Struktur (untere Nordwest-Ecke ${k.struktur.ursprung.join('/')})\nplace template ${k.struktur.name} ${k.struktur.ursprung.join(' ')}`,
    '# Rückweg-Plattform\nfunction insel:plattform',
    '# Unsichtbare Lichter im Oval (spawn/standort.mjs lichter)\nfunction insel:lichter',
    `setworldspawn ${s.x} ${s.y} ${s.z} ${s.yaw} ${s.pitch}`, 'gamerule respawn_radius 0',
    `# Weltgrenze (Vorgenerierung mit Chunky macht die Server-Session)\nworldborder center ${g.x} ${g.z}\nworldborder set ${g.breite}`,
    `forceload remove ${lx1} ${lz1} ${lx2} ${lz2}`,
    `say Spawn eingerichtet: ${k.struktur ? 'Bau, ' : ''}Plattform, Lichter, Weltspawn ${s.x}/${s.y}/${s.z}, Weltgrenze (Nether/End per Konsole sperren)`,
  ].filter(Boolean).join('\n') + '\n';
  f.plattform = `# Rückweg-Plattform (Mitte ${p.x}/${p.y}/${p.z}, Radius 4), Entwurf von Pascal freigegeben\n` +
    plattformTeile().map(([dx, dy, dz, b]) => `setblock ${p.x + dx} ${p.y + dy} ${p.z + dz} ${b}`).join('\n') + '\n';
  const regionen = `# WorldGuard-Region der Oberwelt, erzeugt mit spawn/standort.mjs aus ${k.datei ?? 'der Standort-Konfiguration'}. Einspielen nach
#   plugins/WorldGuard/worlds/world/regions.yml   (laufender Server: rg load -w world)
# spawn: Oval (Mitte ${k.oval.x}/${k.oval.z}, Halbachsen ${k.oval.a} in x und ${k.oval.b} in z, 32 Punkte), volle Höhe: Spawnschutz (Nicht-Mitglieder bauen
#   nicht, OPs umgehen das), keine Monster, kein PvP, Truhen zu, Türen/Knöpfe frei. Sättigung macht das Datapack insel. Kein großes Bauverbot.
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
${['mob-spawning', 'pvp', 'chest-access', 'creeper-explosion', 'other-explosion', 'tnt', 'fire-spread', 'lava-fire', 'lighter', 'ghast-fireball', 'enderman-grief', 'ravager-grief', 'wither-damage', 'item-frame-rotation', 'vehicle-destroy', 'leaf-decay', 'ice-melt', 'snow-melt'].map((n) => `            ${n}: deny`).join('\n')}
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
    writeFileSync(join(tags, 'tick.json'), '{ "values": ["insel:tick"] }\n');
    writeFileSync(join(tags, 'load.json'), '{ "values": ["insel:load"] }\n');
    writeFileSync(join(aus, 'datapack/insel/pack.mcmeta'), JSON.stringify({ pack: { description: 'Spawn-Technik: Rückweg-Plattform, Sättigung, Lichter, Aufbau', min_format: [121, 0], max_format: [121, 0] } }, null, 2) + '\n');
    writeFileSync(join(aus, 'worldguard/regions.yml'), regionen);
    console.log(`Datapack insel und regions.yml aus ${konfig} → ${aus} (lichter.mcfunction mit „lichter“ erzeugen)`);
  } else if (befehl === 'lichter') {
    const [welt, aus = join(REPO, 'spawn')] = rest;
    lichterAus(k, welt).then((t) => { writeFileSync(join(aus, 'datapack/insel/data/insel/function/lichter.mcfunction'), t); console.log(`${t.split('\n').length - 2} Lichter → ${aus}`); });
  } else console.log('Aufruf: bauen <konfig> [ausgabe] | lichter <konfig> <welt> [ausgabe] – siehe Kopf der Datei');
}
