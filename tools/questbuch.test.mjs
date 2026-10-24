import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { baueQuestbuch, baueErkennung, pruefeAbdeckung, baueDetails } from './questbuch.mjs';

const REPO = join(fileURLToPath(import.meta.url), '..', '..');

const vanilla = new Map([
  ['story/mine_stone', {
    criteria: { get_stone: { trigger: 'minecraft:inventory_changed', conditions: { items: [{ items: '#minecraft:stone_tool_materials' }] } } },
    requirements: [['get_stone']],
    display: { title: { translate: 'advancements.story.mine_stone.title' }, icon: { id: 'minecraft:wooden_pickaxe' } },
    rewards: { experience: 10 },
  }],
  ['story/enter_the_nether', { criteria: { n: { trigger: 'minecraft:changed_dimension', conditions: { to: 'minecraft:the_nether' } } }, requirements: [['n']], display: { title: { translate: 'advancements.story.enter_the_nether.title' }, icon: { id: 'minecraft:flint_and_steel' } } }],
  ['nether/root', { criteria: { n: { trigger: 'minecraft:changed_dimension', conditions: { to: 'minecraft:the_nether' } } }, requirements: [['n']], display: { title: { translate: 'advancements.nether.root.title' }, icon: { id: 'minecraft:red_nether_bricks' } } }],
]);
const text = (tun) => ({ de: { tun, tipp: 'Tipp' }, en: { tun: `${tun} (en)`, tipp: 'Tip' } });
const daten = {
  texte: { 'questbuch.meldung.start': { de: 'Start', en: 'Start' }, 'questbuch.meldung.neu': { de: 'Neu: %s', en: 'New: %s' } },
  kapitel: [
    {
      id: 'ankommen', phase: 1, icon: 'minecraft:oak_sapling', hintergrund: 'minecraft:block/snow',
      de: { titel: 'Ankommen', beschreibung: 'B' }, en: { titel: 'Getting Started', beschreibung: 'B' },
      andenken: { item: 'lebkuchen', parent: 'stein', icon: 'minecraft:cookie', de: { titel: 'A', tun: 'T' }, en: { titel: 'A', tun: 'T' } },
      quests: [
        { id: 'stein', vanilla: 'story/mine_stone', parent: 'start', kern: true, ...text('Grab Stein ab.') },
        { id: 'regeln', parent: 'start', icon: 'minecraft:book', erkennung: 'info', de: { titel: 'Regeln', tun: 'R' }, en: { titel: 'Rules', tun: 'R' } },
      ],
    },
    {
      id: 'nether', phase: 2, icon: 'minecraft:netherrack', hintergrund: 'minecraft:block/netherrack',
      de: { titel: 'Nether', beschreibung: 'B' }, en: { titel: 'The Nether', beschreibung: 'B' },
      quests: [{ id: 'portal', vanilla: ['story/enter_the_nether', 'nether/root'], parent: 'start', ...text('Portal') }],
    },
  ],
};

test('Kapitel-Start ist versteckter Reiter, nur per Befehl erreichbar', () => {
  const start = baueQuestbuch(daten, vanilla).advancements.get('ankommen/start');
  assert.equal(start.parent, undefined);
  assert.equal(start.display.hidden, true);
  assert.equal(start.criteria.freigeschaltet.trigger, 'minecraft:impossible');
  assert.deepEqual(start.display.title, { translate: 'questbuch.ankommen.titel', fallback: 'Getting Started' });
});

test('Quest übernimmt Vanilla-Bedingungen, Vanilla-Titel und keine Vanilla-Belohnung', () => {
  const { advancements, lang } = baueQuestbuch(daten, vanilla);
  const stein = advancements.get('ankommen/stein');
  assert.deepEqual(stein.criteria, vanilla.get('story/mine_stone').criteria);
  assert.deepEqual(stein.requirements, [['get_stone']]);
  assert.deepEqual(stein.display.title, { translate: 'advancements.story.mine_stone.title' });
  assert.equal(stein.display.icon.id, 'minecraft:wooden_pickaxe');
  assert.equal(stein.display.show_toast, false);
  assert.deepEqual(stein.rewards, { function: 'leitfaden:andenken/ankommen' });
  const tun = stein.display.description[1];
  assert.deepEqual(tun, { translate: 'questbuch.ankommen.stein.tun', fallback: 'Grab Stein ab. (en)' });
  assert.equal(lang.de['questbuch.ankommen.stein.tun'], 'Grab Stein ab.');
  assert.equal(lang.en['questbuch.ankommen.stein.tun'], 'Grab Stein ab. (en)');
});

test('jeder Übersetzungsschlüssel hat einen englischen fallback und steht in beiden Sprachdateien', () => {
  const { advancements, lang } = baueQuestbuch(daten, vanilla);
  const schluessel = [];
  const sammle = (x) => {
    if (Array.isArray(x)) x.forEach(sammle);
    else if (x && typeof x === 'object') {
      if (x.translate && !x.translate.startsWith('advancements.')) {
        assert.equal(typeof x.fallback, 'string', x.translate);
        schluessel.push(x.translate);
      }
      Object.values(x).forEach(sammle);
    }
  };
  for (const a of advancements.values()) sammle(a.display);
  for (const k of schluessel) {
    assert.ok(k in lang.de, `${k} fehlt in de`);
    assert.ok(k in lang.en, `${k} fehlt in en`);
  }
});

test('Andenken: erst wenn alle ★-Quests geschafft, Belohnung ist das Item', () => {
  const { advancements, funktionen } = baueQuestbuch(daten, vanilla);
  assert.deepEqual(advancements.get('ankommen/andenken').rewards, { function: 'leitfaden:items/lebkuchen' });
  assert.equal(advancements.get('ankommen/andenken').criteria.andenken.trigger, 'minecraft:impossible');
  assert.match(funktionen.get('andenken/ankommen').join('\n'), /advancements=\{leitfaden:ankommen\/stein=true\}\] run advancement grant @s only leitfaden:ankommen\/andenken/);
});

test('Freischaltung: Kapitel ab Phase, Info-Tipps sofort abgehakt, Meldung bei neuem Kapitel', () => {
  const { funktionen } = baueQuestbuch(daten, vanilla);
  const akt = funktionen.get('questbuch/aktualisieren').join('\n');
  assert.match(akt, /matches 1\.\. unless entity @s\[advancements=\{leitfaden:ankommen\/start=true\}\] run function leitfaden:questbuch\/neu\/ankommen/);
  assert.match(akt, /matches 2\.\. .* run function leitfaden:questbuch\/neu\/nether/);
  assert.match(akt, /scoreboard players operation @s lf_stand = #phase lf_phase$/);
  const neu = funktionen.get('questbuch/neu/ankommen').join('\n');
  assert.match(neu, /advancement grant @s only leitfaden:ankommen\/regeln/);
  assert.match(neu, /questbuch\.meldung\.start/);
  assert.match(funktionen.get('questbuch/neu/nether').join('\n'), /questbuch\.meldung\.neu.*questbuch\.nether\.titel/);
});

test('Abgleich reicht schon erreichte Vanilla-Fortschritte nach, auch zusammengelegte', () => {
  const akt = baueQuestbuch(daten, vanilla).funktionen.get('questbuch/aktualisieren').join('\n');
  assert.match(akt, /advancements=\{minecraft:story\/mine_stone=true\}\] run advancement grant @s only leitfaden:ankommen\/stein/);
  assert.match(akt, /advancements=\{minecraft:story\/enter_the_nether=true,minecraft:nether\/root=true\}\] run advancement grant @s only leitfaden:nether\/portal/);
});

test('zusammengelegte Quests brauchen gleiche Bedingungen', () => {
  const anders = new Map(vanilla);
  anders.set('nether/root', { ...vanilla.get('nether/root'), criteria: { x: { trigger: 'minecraft:tick' } } });
  assert.throws(() => baueQuestbuch(daten, anders), /andere Bedingungen/);
});

test('Bonus-Erkennung: Gleiten, Blöcke, Inventar, Tragen, Bauwerk', () => {
  assert.equal(baueErkennung('info').criteria.info.trigger, 'minecraft:impossible');
  assert.deepEqual(baueErkennung({ gleiten: true }).criteria.gleiten.conditions.player.predicate, { 'minecraft:flags': { is_fall_flying: true } });
  assert.deepEqual(baueErkennung({ gesetzt: ['minecraft:torch', 'minecraft:wall_torch'] }).requirements, [['torch', 'wall_torch']]);
  assert.equal(baueErkennung({ inventar: ['minecraft:spyglass'] }).criteria.spyglass.trigger, 'minecraft:inventory_changed');
  assert.deepEqual(baueErkennung({ tragen: { head: 'minecraft:carved_pumpkin' } }).criteria.head.conditions.player.predicate, { 'minecraft:equipment': { head: { items: 'minecraft:carved_pumpkin' } } });
  assert.equal(baueErkennung({ bauwerk: '#minecraft:village' }).criteria.bauwerk.conditions.player.predicate['minecraft:location'].structures, '#minecraft:village');
});

test('Abdeckung meldet fehlende, doppelte und unbekannte Fortschritte', () => {
  const ids = new Set(['story/mine_stone', 'story/enter_the_nether', 'nether/root', 'story/root']);
  const doppelt = structuredClone(daten);
  doppelt.kapitel[1].quests.push({ id: 'x', vanilla: ['story/mine_stone', 'story/gibtsnicht'], parent: 'start', ...text('x') });
  const fehler = pruefeAbdeckung(doppelt, ids);
  assert.ok(fehler.some((f) => f.includes('story/root fehlt')));
  assert.ok(fehler.some((f) => f.includes('story/mine_stone doppelt')));
  assert.ok(fehler.some((f) => f.includes('story/gibtsnicht gibt es in der Jar nicht')));
});

test('echtes Questbuch: jeder Vanilla-Fortschritt von 26.3 genau einmal (Liste aus der Server-Jar)', () => {
  const echt = JSON.parse(readFileSync(join(REPO, 'datapack/questbuch.json'), 'utf8'));
  const ids = new Set(readFileSync(join(REPO, 'datapack/vanilla-26.3.txt'), 'utf8').trim().split('\n'));
  assert.equal(ids.size, 126);
  assert.deepEqual(pruefeAbdeckung(echt, ids), []);
});

const spiel = {
  rezepte: new Set(['minecraft:crafting_table', 'minecraft:oak_planks']),
  biome: new Set(['minecraft:forest']), biomTags: new Set(['minecraft:is_taiga']), itemTags: new Set(['minecraft:logs']),
};

test('Detail-Datei im Format Quest-Details v1: Schritte, Rezept, Fundort mit Höhe von/bis', () => {
  const schritte = { 'ankommen/stein': {
    schritte: [{ de: 'Hau Holz', en: 'Chop wood', items: ['#minecraft:logs'] }, { de: 'Werkbank', en: 'Table', items: ['minecraft:crafting_table'], rezept: 'minecraft:crafting_table' }],
    fundort: [{ de: 'Wald', en: 'Forest', biome: ['minecraft:forest', '#minecraft:is_taiga'], hoehe: [60, 120], dimension: 'minecraft:overworld' }],
  } };
  const { dateien, lang } = baueDetails(schritte, daten, spiel);
  const d = dateien.get('ankommen/stein');
  assert.deepEqual(d.schritte[1], { text: { translate: 'questbuch.ankommen.stein.schritt.2', fallback: 'Table' }, items: ['minecraft:crafting_table'], rezept: 'minecraft:crafting_table' });
  assert.deepEqual(d.fundort[0].hoehe, { von: 60, bis: 120 });
  assert.equal(d.fundort[0].text.translate, 'questbuch.ankommen.stein.fundort.1');
  assert.equal(lang.de['questbuch.ankommen.stein.schritt.1'], 'Hau Holz');
  assert.equal(lang.en['questbuch.ankommen.stein.fundort.1'], 'Forest');
});

test('Detail-Dateien: unbekannte Quest, Rezept, Biom, Item-Tag und fehlende Sprache brechen ab', () => {
  const kaputt = {
    'ankommen/gibtsnicht': { schritte: [{ de: 'x', en: 'x' }] },
    'ankommen/stein': { schritte: [{ de: 'x', items: ['#minecraft:quatsch'], rezept: 'minecraft:quatsch' }], fundort: [{ de: 'a', en: 'b', biome: ['minecraft:mond'] }] },
  };
  assert.throws(() => baueDetails(kaputt, daten, spiel), (e) => ['Quest gibt es nicht', 'Text DE/EN fehlt', 'Item-Tag #minecraft:quatsch', 'Rezept minecraft:quatsch', 'Biom minecraft:mond'].every((s) => e.message.includes(s)));
});
