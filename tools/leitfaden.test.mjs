import { test } from 'node:test';
import assert from 'node:assert/strict';
import { baueKapitel } from './leitfaden.mjs';

const vanilla = {
  'story/mine_stone': {
    parent: 'minecraft:story/root',
    criteria: { get_stone: { trigger: 'minecraft:inventory_changed', conditions: { items: [{ items: '#minecraft:stone_tool_materials' }] } } },
    requirements: [['get_stone']],
    display: { title: { translate: 'x' } },
    sends_telemetry_event: true,
  },
};
const kapitel = {
  id: 'kapitel1', phase: 1, titel: 'Leitfaden: Ankommen', beschreibung: 'Start', icon: 'minecraft:oak_sapling',
  ziele: [{ id: 'stein', vanilla: 'story/mine_stone', parent: 'start', icon: 'minecraft:wooden_pickaxe', titel: 'Steinzeit', beschreibung: 'Grab Stein ab.' }],
};

test('Kapitel-Start ist versteckter Reiter, nur per Befehl erreichbar', () => {
  const start = baueKapitel(kapitel, (id) => vanilla[id]).get('kapitel1/start');
  assert.equal(start.parent, undefined);
  assert.equal(start.display.hidden, true);
  assert.equal(start.display.background, 'minecraft:block/snow');
  assert.equal(start.criteria.freigeschaltet.trigger, 'minecraft:impossible');
});

test('Ziel übernimmt Vanilla-Bedingungen mit deutschem Text', () => {
  const stein = baueKapitel(kapitel, (id) => vanilla[id]).get('kapitel1/stein');
  assert.equal(stein.parent, 'leitfaden:kapitel1/start');
  assert.deepEqual(stein.criteria, vanilla['story/mine_stone'].criteria);
  assert.deepEqual(stein.requirements, [['get_stone']]);
  assert.equal(stein.display.title, 'Steinzeit');
  assert.equal(stein.display.description, 'Grab Stein ab.');
  assert.equal(stein.display.icon.id, 'minecraft:wooden_pickaxe');
  assert.equal(stein.display.announce_to_chat, false);
  assert.equal(stein.sends_telemetry_event, undefined);
});

test('unbekanntes Vanilla-Ziel bricht ab', () => {
  const k = { ...kapitel, ziele: [{ ...kapitel.ziele[0], vanilla: 'story/gibtsnicht' }] };
  assert.throws(() => baueKapitel(k, (id) => vanilla[id]), /story\/gibtsnicht/);
});
