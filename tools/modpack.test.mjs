import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { baueIndex, festerIndex, lokaleMods, overrideDateien } from './modpack.mjs';

const version = {
  project_id: 'AANobbMI',
  version_number: '0.8.0',
  files: [
    { primary: false, filename: 'x-sources.jar', url: 'https://cdn.modrinth.com/x-sources.jar', size: 1, hashes: { sha1: 'a', sha512: 'b' } },
    { primary: true, filename: 'sodium.jar', url: 'https://cdn.modrinth.com/sodium.jar', size: 42, hashes: { sha1: 'c1', sha512: 'c5' } },
  ],
};

test('Index enthält primäre Datei als Client-Mod mit Hashes', () => {
  const index = baueIndex({ name: 'Pack', version: '1', minecraft: '26.3', fabricLoader: '0.19.0', versionen: [version] });
  assert.equal(index.formatVersion, 1);
  assert.equal(index.game, 'minecraft');
  assert.deepEqual(index.dependencies, { minecraft: '26.3', 'fabric-loader': '0.19.0' });
  assert.deepEqual(index.files, [{
    path: 'mods/sodium.jar',
    hashes: { sha1: 'c1', sha512: 'c5' },
    env: { client: 'required', server: 'unsupported' },
    downloads: ['https://cdn.modrinth.com/sodium.jar'],
    fileSize: 42,
  }]);
});

test('Shader landen in shaderpacks/', () => {
  const shader = { ...version, project_id: 'HVnmMxH1', files: [{ primary: true, filename: 'Complementary.zip', url: 'https://cdn.modrinth.com/c.zip', size: 7, hashes: { sha1: 's1', sha512: 's5' } }] };
  const index = baueIndex({ name: 'P', version: '1', minecraft: '26.3', fabricLoader: '0', versionen: [version, shader], shader: ['HVnmMxH1'] });
  assert.deepEqual(index.files.map((f) => f.path), ['mods/sodium.jar', 'shaderpacks/Complementary.zip']);
});

test('Optionale Mods liegen deaktiviert bei, Resourcepacks in resourcepacks/', () => {
  const rp = { ...version, project_id: 'RP1', files: [{ primary: true, filename: 'tweaks.zip', url: 'https://cdn.modrinth.com/t.zip', size: 3, hashes: { sha1: 'r1', sha512: 'r5' } }] };
  const opt = { ...version, project_id: 'OPT1' };
  const index = baueIndex({ name: 'P', version: '1', minecraft: '26.3', fabricLoader: '0', versionen: [opt, rp], deaktiviert: ['OPT1'], resourcepacks: ['RP1'] });
  assert.deepEqual(index.files.map((f) => f.path), ['mods/sodium.jar.disabled', 'resourcepacks/tweaks.zip']);
});

test('Version ohne Dateien bricht ab', () => {
  assert.throws(() => baueIndex({ name: 'P', version: '1', minecraft: '26.3', fabricLoader: '0', versionen: [{ ...version, files: [] }] }), /AANobbMI/);
});

test('Lokale Mods landen in overrides/mods/', () => {
  const ordner = mkdtempSync(join(tmpdir(), 'modpack-'));
  writeFileSync(join(ordner, 'block-marker-1.0.0.jar'), 'jar');
  assert.deepEqual(lokaleMods(['../block-marker-1.0.0.jar'], join(ordner, 'repo')),
    [{ quelle: join(ordner, 'block-marker-1.0.0.jar'), ziel: 'overrides/mods/block-marker-1.0.0.jar' }]);
});

test('Fehlende lokale Mod bricht mit Pfad ab', () => {
  assert.throws(() => lokaleMods(['../fehlt/mod.jar'], join(tmpdir(), 'repo')), /Lokale Mod fehlt: .*mod\.jar/);
});

test('Voreinstellungen aus modpack/overrides landen mit Unterordnern in overrides/', () => {
  const ordner = mkdtempSync(join(tmpdir(), 'overrides-'));
  mkdirSync(join(ordner, 'config/fancymenu'), { recursive: true });
  writeFileSync(join(ordner, 'options.txt'), 'lang:de_de');
  writeFileSync(join(ordner, 'config/fancymenu/options.txt'), 'x');
  assert.deepEqual(overrideDateien(ordner).map((d) => d.ziel).sort(),
    ['overrides/config/fancymenu/options.txt', 'overrides/options.txt']);
  assert.deepEqual(overrideDateien(join(ordner, 'gibtsnicht')), []);
});

test('Fester Bau übernimmt Versionen des alten Packs und lässt nicht mehr gewollte Resourcepacks weg', () => {
  const alt = {
    formatVersion: 1, game: 'minecraft', versionId: '2.0.0', name: 'Alt',
    files: [{ path: 'mods/sodium.jar' }, { path: 'shaderpacks/c.zip' }, { path: 'resourcepacks/tweaks.zip' }],
    dependencies: { minecraft: '26.3', 'fabric-loader': '0.20.1' },
  };
  const index = festerIndex(alt, { name: 'Neu', version: '3.0.0', shader: ['x'], resourcepacks: [] });
  assert.equal(index.name, 'Neu');
  assert.equal(index.versionId, '3.0.0');
  assert.deepEqual(index.dependencies, alt.dependencies);
  assert.deepEqual(index.files.map((f) => f.path), ['mods/sodium.jar', 'shaderpacks/c.zip']);
  assert.deepEqual(festerIndex(alt, { name: 'N', version: '3', shader: [], resourcepacks: ['y'] }).files.map((f) => f.path),
    ['mods/sodium.jar', 'resourcepacks/tweaks.zip']);
});

test('Fester Bau schaltet Mods ein, die mods.json jetzt aktiv vorsieht', () => {
  const alt = {
    files: [{ path: 'mods/esm.jar.disabled', downloads: ['https://cdn.modrinth.com/data/5IIKsxiL/versions/a/esm.jar'] },
      { path: 'mods/coolrain.jar.disabled', downloads: ['https://cdn.modrinth.com/data/OTHER/versions/b/coolrain.jar'] }],
    dependencies: {},
  };
  assert.deepEqual(festerIndex(alt, { name: 'N', version: '3', shader: [], resourcepacks: [], aktiv: ['5IIKsxiL'] }).files.map((f) => f.path),
    ['mods/esm.jar', 'mods/coolrain.jar.disabled']);
});
