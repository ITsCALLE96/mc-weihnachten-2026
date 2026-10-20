import { test } from 'node:test';
import assert from 'node:assert/strict';
import { baueIndex } from './modpack.mjs';

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

test('Version ohne Dateien bricht ab', () => {
  assert.throws(() => baueIndex({ name: 'P', version: '1', minecraft: '26.3', fabricLoader: '0', versionen: [{ ...version, files: [] }] }), /AANobbMI/);
});
