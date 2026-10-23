import { test } from 'node:test';
import assert from 'node:assert/strict';
import { erzeugeUebersetzer, fuelle, zerlegeVorlage } from './uebersetzung.mjs';
import { SPRACHE } from './testsprache.mjs';

const ue = erzeugeUebersetzer(SPRACHE);

test('Vorlagen: %1$s, %s und Reihenfolge', () => {
  assert.equal(fuelle('%2$s tötete %1$s', ['A', 'B']), 'B tötete A');
  assert.equal(fuelle('%s und %s', ['A', 'B']), 'A und B');
  assert.deepEqual(zerlegeVorlage('x %s'), [{ text: 'x ' }, { arg: 1 }]);
});

test('Tod: Mob wird übersetzt, Spielername bleibt', () => {
  const t = ue.erkenneTod('Steve was slain by Skeleton');
  assert.equal(ue.todDeutsch(t.schluessel, t.args), 'Steve wurde von Skelett erschlagen');
});

test('Tod: Gegenstand in eckigen Klammern wird übersetzt', () => {
  const t = ue.erkenneTod('Steve was slain by Alex using [Iron Sword]');
  assert.equal(ue.todDeutsch(t.schluessel, t.args), 'Steve wurde von Alex mit [Eisenschwert] erschlagen');
});

test('Tod: spezifischere Vorlage gewinnt gegen die kürzere', () => {
  assert.equal(ue.erkenneTod('Steve was slain by Alex using [Iron Sword]').schluessel, 'death.attack.mob.item');
});

test('Fortschritt wird übersetzt, unbekannte Titel bleiben englisch', () => {
  assert.equal(ue.fortschrittDeutsch('made', 'Steve', 'Stone Age'), 'Steve hat den Fortschritt [Steinzeit] erzielt');
  assert.equal(ue.fortschrittDeutsch('challenge', 'Steve', 'Hero of the Village'), 'Steve hat die Herausforderung [Held des Dorfes] abgeschlossen');
  assert.equal(ue.fortschrittDeutsch('goal', 'Steve', 'Unbekannt'), 'Steve hat das Ziel [Unbekannt] erreicht');
});

test('Kein Treffer bei normalem Text', () => {
  assert.equal(ue.erkenneTod('Steve is doing something'), null);
});
