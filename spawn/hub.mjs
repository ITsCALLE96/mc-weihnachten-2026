// Hub-Datapack „hub“ aus spawn/hub.json: Fantasy Village als Hub (eigener Paper-Server hinter Velocity, Leerwelt).
// Aufbau (Bau in Kacheln, Kirschhain, Spawn, Weltgrenze, Gamerules), Hub-Regeln (Abenteuermodus, satt, wer fällt → Brunnen, beim Betreten
// zum Brunnen), Eröffnung (schaltet die SMP-Kiste frei: insel_zustand #offen, liest das Plugin serverwahl), Schriften über den Kisten,
// Bestenlisten-Platzhalter, Info-Stände, Info-Dorfbewohner, Voice-Chat-Ecke, Adventskalender (24 Geschenke).
// Aufruf: node spawn/hub.mjs bauen <hub.json> [ausgabeordner]   → <ausgabe>/datapack/hub/ (ohne Ausgabeordner: spawn/)
// Die Bau-Struktur selbst (gekauft) kommt lokal dazu, siehe spawn/hub-aufsetzen.sh.
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ladeKasten, pilzlandBefehle, strukturBefehle } from './standort.mjs';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const q = (t) => JSON.stringify(t); // Text als SNBT-Zeichenkette (JSON-Schreibweise ist gültiges SNBT)
const txt = (text, extra = {}) => JSON.stringify({ text, ...extra });

// Info-Stände in den 8 Marktzelten (Pascal/Leitung 28.10.): je ein Standbetreiber (Dorfbewohner Typ Schnee, NoAI, unverwundbar, ohne Handel, Deko
// aus dem Pack auf dem Kopf), Klick → Fortschritt → Info im Chat (Deutsch, eine Zeile Englisch, klickbare Links aus k.links), Zeltschilder,
// großes Hologramm über dem Zelt; dazu Hologramme (Statistik am Brunnen, Danke am Dorfschild). Regeln zentral in k.regeln.
// versatz/ns: dieselben Stände im Bauarchiv der Testwelt (Hub dort verschoben, eigener Namensraum)
// nummerierte Liste unter „## Regeln“ (bis zur nächsten Überschrift), ohne Nummern und Markdown-Hervorhebung
export function regelnAusMd(md) {
  const teil = md.replace(/\r/g, '').split(/^## /m).find((t) => /^Regeln\s*$/.test(t.split('\n')[0]));
  const r = (teil ?? '').split('\n').map((z) => z.match(/^\s*\d+\.\s+(.+)$/)?.[1]).filter(Boolean).map((z) => z.replace(/\*\*|__|`/g, '').trim());
  if (!r.length) throw new Error('REGELN.md: keine nummerierte Liste unter „## Regeln“');
  return r;
}

export function infoStaende(k, { ns = 'hub', versatz = [0, 0, 0] } = {}) {
  const [vx, vy, vz] = versatz, P = (x, y, z) => [x + vx, y + vy, z + vz].map((v) => Math.round(v * 100) / 100).join(' ');
  const befehle = ['kill @e[tag=hub_stand]'], funktionen = {}, fortschritte = {};
  const link = (t, schluessel) => { const url = k.links?.[schluessel];
    return url ? { text: `[${t}]`, color: 'aqua', underlined: true, click_event: { action: 'open_url', url }, hover_event: { action: 'show_text', value: url } } : { text: `[${t}: Link folgt]`, color: 'gray' }; };
  const zeilen = (t) => { const w = t.split(' '), z = ['']; for (const x of w) { if ((z.at(-1) + ' ' + x).trim().length > 15) z.push(x); else z[z.length - 1] = (z.at(-1) + ' ' + x).trim(); } return z; };
  const holo = (x, y, z, inhalt, s, tags = []) => `summon text_display ${P(x, y, z)} {Tags:${q(['hub', 'hub_stand', ...tags])},billboard:"center",alignment:"center",line_width:240,background:1073741824,text:${JSON.stringify(inhalt)},transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[${s}f,${s}f,${s}f]}}`;
  k.stände.forEach((st, i) => {
    // Altbestand vor dem Umbau 28.10. (Hinweis-Text und Klickfläche ohne Tag hub_stand) überlebt das kill oben: hier mit weg, sonst doppelte Beschriftung
    { const [ax, ay, az] = P(st.front[0] + 0.5, st.front[1] + 1, st.front[2] + 0.5).split(' '); befehle.push(`kill @e[tag=hub,tag=!hub_stand,type=!player,x=${ax},y=${ay},z=${az},distance=..2.5]`); }
    const n = i + 1, [x, y, z] = st.front, mx = st.schilder.reduce((a, s) => a + s[0], 0) / st.schilder.length, mz = st.schilder.reduce((a, s) => a + s[2], 0) / st.schilder.length;
    // Blick vom Zelt weg zum Markt (Minecraft-Yaw: 0 = Süden, 90 = Westen)
    const yaw = Math.round((Math.atan2(-(x + 0.5 - mx), z + 0.5 - mz) * 180) / Math.PI);
    const text = st.titel === 'Regeln' ? k.regeln.de.map((r) => `• ${r}`).join('\n') : st.text, en = st.titel === 'Regeln' ? k.regeln.en : st.en;
    befehle.push(`summon villager ${P(x + 0.5, y, z + 0.5)} {Tags:["hub","hub_stand","hub_stand_${n}"],NoAI:1b,Invulnerable:1b,PersistenceRequired:1b,Silent:1b,Rotation:[${yaw}f,0f],`
      + `CustomName:${JSON.stringify({ text: st.name, color: 'gold' })},CustomNameVisible:1b,VillagerData:{type:"minecraft:snow",profession:"minecraft:${st.beruf}",level:5},Offers:{Recipes:[]},`
      + `equipment:{head:{id:"minecraft:paper",count:1,components:{"minecraft:item_model":"weihnachten:${st.kopf}"}}},drop_chances:{head:0f}}`);
    befehle.push(holo(x + 0.5, y + 3.05, z + 0.5, [{ text: `${st.titel}\n`, color: 'yellow', bold: true }, { text: 'Rechtsklick', color: 'gray' }], 0.6, ['hub_hinweis']));
    befehle.push(holo(mx + 0.5, y + 4.6, mz + 0.5, [{ text: `${st.symbol} ${st.titel}`, color: 'gold', bold: true }], 1.6));
    // Zeltschilder ohne festen Halt fallen beim Einfügen ab: dann neu setzen, danach beschriften (lange Titel auf zwei Zeilen)
    const zl = [...zeilen(st.titel), '', '', ''].slice(0, 3);
    for (const [sx, sy, sz, blick] of st.schilder) befehle.push(`execute unless block ${P(sx, sy, sz)} #minecraft:wall_signs run setblock ${P(sx, sy, sz)} minecraft:spruce_wall_sign[facing=${blick}]`,
      `data merge block ${P(sx, sy, sz)} {is_waxed:1b,front_text:{messages:["",${zl.map(q).join(',')}]}}`);
    fortschritte[`stand/${n}`] = { criteria: { klick: { trigger: 'minecraft:player_interacted_with_entity', conditions: { entity: { type: 'minecraft:entity_properties', entity: 'this', predicate: { 'minecraft:entity_type': 'minecraft:villager', 'minecraft:nbt': `{Tags:["hub_stand_${n}"]}` } } } } }, rewards: { function: `${ns}:stand/${n}` } };
    const teile = [{ text: `${st.name} `, color: 'gold', bold: true }, { text: `(${st.titel})\n`, color: 'yellow' }, { text: `${text}\n`, color: 'white' }, { text: en, color: 'gray', italic: true }];
    for (const [t, s] of st.links ?? []) teile.push({ text: '\n' }, link(t, s));
    funktionen[`stand/${n}`] = `advancement revoke @s only ${ns}:stand/${n}\ntellraw @s ${JSON.stringify(teile)}\nplaysound minecraft:entity.villager.celebrate neutral @s ~ ~ ~ 0.8 1.1\n`;
  });
  for (const h of k.hologramme ?? []) befehle.push(holo(h.x, h.y, h.z, [{ text: `${h.titel}\n`, color: 'gold', bold: true }, { text: h.text, color: 'white' }], 0.9));
  funktionen.staende = `# Info-Stände neu setzen (idempotent; Konsole: function ${ns}:staende)\n${befehle.join('\n')}\n`;
  return { befehle, funktionen, fortschritte };
}

export function dateien(k) {
  const s = k.spawn, g = k.weltgrenze, e = k.eroeffnung;
  const [lx1, lz1, lx2, lz2] = ladeKasten({ spawn: s, oval: k.biom, struktur: k.struktur });
  const [ux, uy, uz] = k.struktur.ursprung, [gw, gh, gl] = k.struktur.groesse;
  const kasten = `x=${ux},y=${uy},z=${uz},dx=${gw},dy=${gh},dz=${gl}`;
  const geladen = []; for (let x = lx1; x <= lx2; x += 16) for (let z = lz1; z <= lz2; z += 16) geladen.push(`if loaded ${x} ${s.y} ${z}`);
  const zumSpawn = `tp @s ${s.x + 0.5} ${s.y} ${s.z + 0.5} ${s.yaw} ${s.pitch}`;
  const f = {}, adv = {};

  f.load = `# Zustand und Zähler des Hubs
scoreboard objectives add insel_zustand dummy
execute unless score #offen insel_zustand matches 0.. run scoreboard players set #offen insel_zustand 0
scoreboard objectives add hub_weg minecraft.custom:minecraft.leave_game
scoreboard objectives add hub_advent dummy
execute unless score #tag hub_advent matches 0.. run scoreboard players set #tag hub_advent 0
scoreboard objectives add hub_funde dummy
schedule function hub:sekunde 20t replace
`;
  // Kasten an der Position des Spielers (at @s), sonst gilt x/z des Ausführungsorts; nach unten weit über −64 hinaus (Leerwelt, freier Fall)
  f.tick = `# Wer unter y ${k.zurueckUnter} fällt (Insel verlassen), kommt zurück zum Brunnen
execute as @a at @s if entity @s[y=-2048,dy=${k.zurueckUnter + 2047}] run function hub:zurueck
# Beim Betreten (nach dem Verlassen) zum Brunnen
execute as @a[scores={hub_weg=1..}] run function hub:ankommen
# Klicks auf Info-Stände, Voice-Ecke und Adventsgeschenke (Interaction-Entities)
execute as @e[type=interaction,tag=hub_klick] if data entity @s interaction run function hub:klick
`;
  f.sekunde = `# Jede Sekunde: Abenteuermodus (außer Kreativ/Zuschauer für OPs) und satt
gamemode adventure @a[gamemode=survival]
effect give @a[gamemode=adventure] minecraft:saturation infinite 0 true
# Adventsgeschenke freischalten, sobald ihr Tag erreicht ist (nur in geladenen Chunks, also wo Spieler sind)
execute as @e[tag=hub_advent_zu] if score @s hub_advent <= #tag hub_advent run function hub:advent/zeigen
# Leichte Partikel an den Klickpunkten (Stände, Voice-Ecke, Dorfbewohner)
execute at @e[type=text_display,tag=hub_hinweis] run particle minecraft:end_rod ~ ~-0.4 ~ 0.25 0.2 0.25 0.005 1 normal
schedule function hub:sekunde 20t replace
`;
  f.zurueck = `# Insel verlassen: zurück zum Brunnen, kurz Blindheit als Einblendung
${zumSpawn}
effect give @s minecraft:blindness 1 0 true
playsound minecraft:entity.enderman.teleport master @s ~ ~ ~ 0.6 1.2
title @s actionbar ${txt('Zurück am Brunnen', { color: 'aqua' })}
`;
  f.ankommen = `scoreboard players reset @s hub_weg
${zumSpawn}
`;
  // Klick-Verteiler: jedes Interaction-Entity trägt hub_klick und genau einen Funktionsnamen als Tag „hub_f_<name>“
  const klicks = [];
  const interaktion = (x, y, z, name, w = 1, h = 1.5) => { klicks.push(name); return `summon interaction ${x} ${y} ${z} {width:${w}f,height:${h}f,response:1b,Tags:["hub","hub_klick","hub_f_${name.replace(/\//g, '_')}"]}`; };
  const anzeige = (x, y, z, text, tags = []) => `summon text_display ${x} ${y} ${z} {text:${text},billboard:"center",alignment:"center",line_width:200,background:1073741824,Tags:${q(['hub', ...tags])}}`;
  // Sichtbarer Hinweis an jedem Klickpunkt (Pascal 26.10.: sonst „unsichtbare Dinger“): Titel + „Rechtsklick“ auf Augenhöhe, dazu leichte Partikel (hub:sekunde)
  const hinweis = (x, y, z, titel, farbe) => anzeige(x, y, z, `[${txt(titel + '\n', { color: farbe, bold: true })},${txt('Rechtsklick', { color: 'gray' })}]`, ['hub_hinweis']);

  // Schriften über den Kisten (Serverwahl), Bestenlisten-Platzhalter, Info-Stände, Voice-Ecke
  const kisten = k.kisten.map((c) => anzeige(c.x + 0.5, c.y + 1.2, c.z + 0.5, `[${txt(c.titel + '\n', { color: c.farbe, bold: true })},${txt('Rechtsklick', { color: 'gray' })}]`));
  const besten = k.bestenlisten.map((b, i) => anzeige(b.x, b.y + 1.5, b.z, `[${txt(`Bestenliste ${i + 1}\n`, { color: 'gold', bold: true })},${txt('folgt', { color: 'gray', italic: true })}]`, ['hub_bestenliste', `hub_bestenliste_${i + 1}`]));
  const st8 = infoStaende(k);
  Object.assign(f, st8.funktionen); Object.assign(adv, st8.fortschritte);
  const staende = st8.befehle;
  const v = k.voiceEcke;
  f['stand/voice'] = `tellraw @s [${txt('[Voice Chat] ', { color: 'light_purple', bold: true })},${txt('Taste V öffnet die Einstellungen. Dort kannst du dein Mikrofon testen und die Lautstärke einstellen. Wer in der Nähe ist, hört dich.', { color: 'white' })}]\n`;
  const voice = [hinweis(v.x + 0.5, v.y + 1.7, v.z + 0.5, 'Voice-Chat-Ecke', 'light_purple'),interaktion(v.x + 0.5, v.y, v.z + 0.5, 'stand/voice', 1.2, 2)];

  // Info-Dorfbewohner: Klick löst einen Fortschritt aus (player_interacted_with_entity), dessen Belohnung den Text zeigt
  const npcTags = k.dorfbewohner.flatMap((d, i) => [`tag @e[type=villager,x=${d.pos[0]},y=${d.pos[1]},z=${d.pos[2]},distance=..1.5,limit=1] add hub_npc_${i + 1}`,
    hinweis(d.pos[0], d.pos[1] + 2.4, d.pos[2], d.titel, 'green')]);
  k.dorfbewohner.forEach((d, i) => {
    adv[`npc/${i + 1}`] = { criteria: { klick: { trigger: 'minecraft:player_interacted_with_entity', conditions: { entity: { type: 'minecraft:entity_properties', entity: 'this', predicate: { 'minecraft:entity_type': 'minecraft:villager', 'minecraft:nbt': `{Tags:["hub_npc_${i + 1}"]}` } } } } }, rewards: { function: `hub:npc/${i + 1}` } };
    f[`npc/${i + 1}`] = `advancement revoke @s only hub:npc/${i + 1}\ntellraw @s [${txt(`${d.titel}: `, { color: 'green' })},${txt(d.text, { color: 'white' })}]\nplaysound minecraft:entity.villager.ambient neutral @s ~ ~ ~ 1 1\n`;
  });

  // Adventskalender: alle 24 Geschenke entstehen beim Aufbau unsichtbar und gesperrt (hub_advent_zu, Nummer im Score hub_advent).
  // Geschenk n wird sichtbar und klickbar, sobald #tag hub_advent ≥ n ist (täglich per Aufgabe: function hub:advent/naechster_tag) und
  // sein Chunk geladen ist – nachträglich setzen ginge in ungeladenen Chunks nicht. Je Spieler einmal (Tag hub_hat_<n>), Belohnung kosmetisch
  f['advent/naechster_tag'] = `# Täglich um 00:00 ab 01.12. (AMP-Aufgabe): nächstes Geschenk freischalten
scoreboard players add #tag hub_advent 1
execute if score #tag hub_advent matches 25.. run scoreboard players set #tag hub_advent 24
tellraw @a [${txt('Adventskalender: ', { color: 'red', bold: true })},${txt('Ein neues Geschenk ist auf der Insel versteckt!', { color: 'white' })}]
`;
  f['advent/zeigen'] = `# Freigeschaltet: sichtbar (Anzeige) bzw. klickbar (Interaktion)
tag @s remove hub_advent_zu
execute if entity @s[type=item_display] run data modify entity @s transformation.scale set value [0.5f,0.5f,0.5f]
`;
  const advent = k.advent.flatMap(([x, y, z], i) => {
    const n = i + 1;
    return [`summon item_display ${x + 0.5} ${y + 0.3} ${z + 0.5} {item:{id:"minecraft:red_shulker_box",count:1},transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[0f,0f,0f]},Tags:["hub","hub_advent","hub_advent_zu","hub_g_${n}"]}`,
      interaktion(x + 0.5, y, z + 0.5, `advent/fund_${n}`, 0.7, 0.7).replace('"hub_klick"', `"hub_klick","hub_advent","hub_advent_zu","hub_g_${n}"`),
      `scoreboard players set @e[tag=hub_g_${n}] hub_advent ${n}`];
  });
  k.advent.forEach((_, i) => {
    const n = i + 1, item = k.adventGeschenke[i];
    f[`advent/fund_${n}`] = `execute if entity @s[tag=hub_hat_${n}] run tellraw @s ${txt(`Geschenk ${n} hast du schon gefunden.`, { color: 'gray' })}
execute unless entity @s[tag=hub_hat_${n}] run function hub:advent/neu_${n}
`;
    f[`advent/neu_${n}`] = `tag @s add hub_hat_${n}
scoreboard players add @s hub_funde 1
give @s ${item}[custom_name=${txt(`Adventsgeschenk ${n}`, { color: 'red', italic: false })},lore=[${txt('Weihnachten 2026', { color: 'gray', italic: false })}]]
tellraw @s [${txt(`Geschenk ${n} gefunden! `, { color: 'red', bold: true })},${txt('Gefunden: ', { color: 'white' })},{"score":{"name":"@s","objective":"hub_funde"},"color":"gold"},${txt(' von 24', { color: 'white' })}]
playsound minecraft:entity.player.levelup master @s ~ ~ ~ 1 1.4
particle minecraft:happy_villager ~ ~1 ~ 0.4 0.6 0.4 0 20 normal @s
`;
  });
  klicks.push(...k.advent.map((_, i) => `advent/fund_${i + 1}`));
  f.klick = `# Ausgelöst als das Interaction-Entity: Funktion nach Tag, ausgeführt als der klickende Spieler, dann Klick löschen
${[...new Set(klicks)].map((n) => `execute if entity @s[tag=hub_f_${n.replace(/\//g, '_')},tag=!hub_advent_zu] on target at @s run function hub:${n}`).join('\n')}
data remove entity @s interaction
`;

  // Eröffnung 05.12.: Countdown, dann SMP-Kiste frei (serverwahl liest #offen)
  f.eroeffnung = `# Eröffnung auslösen (Konsole oder AMP-Aufgabe), läuft nur einmal (#offen = 1 heißt offen)
execute if score #offen insel_zustand matches 1 run say SMP ist schon offen – nichts zu tun
execute if score #offen insel_zustand matches 0 if score #countdown insel_zustand matches 0.. run say Eröffnung läuft schon
execute if score #offen insel_zustand matches 0 unless score #countdown insel_zustand matches 0.. run function hub:eroeffnung_start
`;
  f.eroeffnung_start = `bossbar add hub:eroeffnung ${txt(e.text, { color: 'gold' })}
bossbar set hub:eroeffnung max ${e.sekunden}
bossbar set hub:eroeffnung color yellow
bossbar set hub:eroeffnung players @a
scoreboard players set #countdown insel_zustand ${e.sekunden}
playsound minecraft:block.beacon.activate master @a ~ ~ ~ 1 0.8
function hub:eroeffnung_tick
`;
  f.eroeffnung_tick = `execute store result bossbar hub:eroeffnung value run scoreboard players get #countdown insel_zustand
execute if score #countdown insel_zustand matches 1..3 run title @a title {"score":{"name":"#countdown","objective":"insel_zustand"},"color":"gold"}
execute if score #countdown insel_zustand matches 1..3 as @a at @s run playsound minecraft:block.note_block.bell master @s ~ ~ ~ 1 1
execute if score #countdown insel_zustand matches 0 run function hub:oeffnen
execute if score #countdown insel_zustand matches 1.. run schedule function hub:eroeffnung_tick 20t
scoreboard players remove #countdown insel_zustand 1
`;
  const smp = k.kisten[0];
  f.oeffnen = `scoreboard players set #offen insel_zustand 1
bossbar remove hub:eroeffnung
title @a times 10 70 20
title @a subtitle ${txt(e.untertitel, { color: 'green' })}
title @a title ${txt(e.titel, { color: 'gold', bold: true })}
execute as @a at @s run playsound minecraft:ui.toast.challenge_complete master @s ~ ~ ~ 1 1
particle minecraft:firework ${smp.x + 0.5} ${smp.y + 1.5} ${smp.z + 0.5} 0.6 0.8 0.6 0.05 120 force
particle minecraft:totem_of_undying ${smp.x + 0.5} ${smp.y + 1.5} ${smp.z + 0.5} 0.6 0.8 0.6 0.4 80 force
`;
  f.schliessen = `# Vor der Eröffnung (auch zum Proben): SMP-Kiste wieder gesperrt
scoreboard players set #offen insel_zustand 0
scoreboard players set #countdown insel_zustand -1
bossbar remove hub:eroeffnung
say SMP-Kiste gesperrt – bereit für die Eröffnung (function hub:eroeffnung)
`;

  // Aufbau in der frischen Leerwelt
  f.aufbau = `# Kompletter Hub-Aufbau (Konsole: function hub:aufbau), braucht lokal die Struktur ${k.struktur.name}_*. Mehrfach ausführbar.
forceload add ${lx1} ${lz1} ${lx2} ${lz2}
schedule function hub:aufbau_pruefen 20t
`;
  f.aufbau_pruefen = `execute store success score #geladen insel_zustand ${geladen.join(' ')}
execute if score #geladen insel_zustand matches 1 run function hub:aufbau_teil2
execute unless score #geladen insel_zustand matches 1 run schedule function hub:aufbau_pruefen 20t
`;
  f.aufbau_teil2 = [
    '# Alte Hub-Entities und die der Struktur entfernen (mehrfacher Aufbau), dann Bau in Kacheln setzen',
    `kill @e[type=!player,${kasten}]`,
    'gamerule random_tick_speed 0',
    ...strukturBefehle(k.struktur),
    '# Kirschhain wie im Original (Gras- und Laubfarben)', ...pilzlandBefehle(k.biom),
    `setworldspawn ${s.x} ${s.y} ${s.z} ${s.yaw} ${s.pitch}`,
    ...['respawn_radius 0', 'fall_damage false', 'drowning_damage false', 'fire_damage false', 'freeze_damage false', 'pvp false', 'spawn_mobs false', 'spawn_monsters false',
      'spawn_phantoms false', 'spawn_patrols false', 'spawn_wandering_traders false', 'spawn_wardens false', 'mob_griefing false', 'keep_inventory true',
      'show_death_messages false', 'advance_weather false', 'spread_vines false', 'fire_spread_radius_around_player 0'].map((r) => `gamerule ${r}`),
    'weather clear',
    `worldborder center ${g.x} ${g.z}`, `worldborder set ${g.breite}`,
    'schedule function hub:aufbau_ende 100t',
  ].join('\n') + '\n';
  f.aufbau_ende = [
    '# Herausgefallene Gegenstände weg, Dorfbewohner markieren, Hub-Inhalte setzen, Chunks freigeben',
    `kill @e[type=item,${kasten}]`,
    ...npcTags,
    // Einzelne Korrekturen am gekauften Bau (Lizenz erlaubt Änderungen), z.B. ein fehl platzierter Block
    ...(k.korrekturen ?? []).map((b) => `setblock ${b.x} ${b.y} ${b.z} ${b.block}`),
    ...k.tafeln.map((t) => `setblock ${t.x} ${t.y} ${t.z} ${t.block}{is_waxed:1b,front_text:{messages:[${[...t.zeilen, '', '', '', ''].slice(0, 4).map(q).join(',')}]}}`),
    ...kisten, ...besten, ...staende, ...voice,
    ...advent,
    'function hub:schliessen',
    `forceload remove ${lx1} ${lz1} ${lx2} ${lz2}`,
    `say Hub eingerichtet: Bau, Kirschhain, Spawn ${s.x}/${s.y}/${s.z}, Weltgrenze, ${k.dorfbewohner.length} Info-Dorfbewohner, ${k.stände.length} Stände, ${k.advent.length ? 'Adventskalender, ' : ''}SMP gesperrt`,
  ].join('\n') + '\n';
  // Ohne Adventsverstecke (seit 27.10. Winterkalender auf der SMP-Insel) auch keine Advents-Funktionen
  if (!k.advent.length) { delete f['advent/naechster_tag']; delete f['advent/zeigen']; }
  return { funktionen: f, fortschritte: adv };
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('spawn/hub.mjs')) {
  const [befehl, konfig, aus = join(REPO, 'spawn')] = process.argv.slice(2);
  if (befehl !== 'bauen') { console.log('Aufruf: node spawn/hub.mjs bauen <hub.json> [ausgabeordner]'); process.exit(1); }
  const k = JSON.parse(readFileSync(konfig, 'utf8'));
  // Regeln-Stand: Text aus server/REGELN.md (von Pascal abgenommen, 30.10.), hub.json nur als Ersatz
  const md = join(REPO, 'server/REGELN.md');
  if (existsSync(md)) k.regeln = { ...k.regeln, de: regelnAusMd(readFileSync(md, 'utf8')) };
  const dp = join(aus, 'datapack/hub');
  rmSync(dp, { recursive: true, force: true });
  const { funktionen, fortschritte } = dateien(k);
  for (const [n, t] of Object.entries(funktionen)) { const p = join(dp, 'data/hub/function', `${n}.mcfunction`); mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, t); }
  for (const [n, a] of Object.entries(fortschritte)) { const p = join(dp, 'data/hub/advancement', `${n}.json`); mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, JSON.stringify(a, null, 2) + '\n'); }
  mkdirSync(join(dp, 'data/minecraft/tags/function'), { recursive: true });
  writeFileSync(join(dp, 'data/minecraft/tags/function/tick.json'), '{ "values": ["hub:tick"] }\n');
  writeFileSync(join(dp, 'data/minecraft/tags/function/load.json'), '{ "values": ["hub:load"] }\n');
  writeFileSync(join(dp, 'pack.mcmeta'), JSON.stringify({ pack: { description: 'Hub: Fantasy Village (LavaBuilds), Info-Stände, Adventskalender, Eröffnung', min_format: [121, 0], max_format: [121, 0] } }, null, 2) + '\n');
  console.log(`Datapack hub aus ${konfig} → ${dp} (${Object.keys(funktionen).length} Funktionen, ${Object.keys(fortschritte).length} Fortschritte)`);
}
