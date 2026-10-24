import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { schreibeNbt, leseNbt, tag } from './nbt.mjs';
import { weltInfo, umriss, ausschneiden, sektionsBloecke, randBloecke } from './schem-welt.mjs';
import { lade, speichere, hole } from './schem.mjs';

// Regionsdatei mit genau einem Chunk (gzip-Kompression = Art 1).
function region(cx, cz, wurzel) {
  const daten = schreibeNbt(wurzel);
  const kopf = Buffer.alloc(8192);
  kopf.writeUIntBE(2, 4 * ((cx & 31) + (cz & 31) * 32), 3);
  kopf[4 * ((cx & 31) + (cz & 31) * 32) + 3] = Math.ceil((daten.length + 5) / 4096);
  const chunk = Buffer.alloc(Math.ceil((daten.length + 5) / 4096) * 4096);
  chunk.writeUInt32BE(daten.length + 1, 0);
  chunk[4] = 1;
  daten.copy(chunk, 5);
  return Buffer.concat([kopf, chunk]);
}

const block = (name, props) => ({ Name: tag('string', name), ...(props && { Properties: tag('compound', props) }) });

function testwelt() {
  const ordner = mkdtempSync(join(tmpdir(), 'welt-'));
  mkdirSync(join(ordner, 'region')); mkdirSync(join(ordner, 'entities'));
  writeFileSync(join(ordner, 'level.dat'), schreibeNbt({ name: '', type: 'compound', value: { Data: tag('compound', {
    LevelName: tag('string', 'Test'), DataVersion: tag('int', 4000),
    Version: tag('compound', { Name: tag('string', '26.3') }),
    WorldGenSettings: tag('compound', { seed: tag('long', -42n) }),
    SpawnX: tag('int', 5), SpawnY: tag('int', 100), SpawnZ: tag('int', 6),
  }) } }));
  // Sektion Y=6 (y 96–111): Palette [Luft, Stein, Truhe]; Stein bei (1,100,2), Truhe bei (3,101,4).
  const idx = [(100 - 96) * 256 + 2 * 16 + 1, (101 - 96) * 256 + 4 * 16 + 3];
  const longs = new Array(256).fill(0n); // 4 Bit je Eintrag, 16 je Long
  longs[idx[0] >> 4] |= 1n << BigInt((idx[0] & 15) * 4);
  longs[idx[1] >> 4] |= 2n << BigInt((idx[1] & 15) * 4);
  writeFileSync(join(ordner, 'region', 'r.0.0.mca'), region(0, 0, { name: '', type: 'compound', value: {
    DataVersion: tag('int', 4000),
    sections: tag('list', { elem: 'compound', items: [{
      Y: tag('byte', 6),
      block_states: tag('compound', {
        palette: tag('list', { elem: 'compound', items: [block('minecraft:air'), block('minecraft:stone'), block('minecraft:chest', { facing: tag('string', 'north') })] }),
        data: tag('longArray', longs.map((l) => BigInt.asIntN(64, l))),
      }),
    }] }),
    block_entities: tag('list', { elem: 'compound', items: [{ id: tag('string', 'minecraft:chest'), x: tag('int', 3), y: tag('int', 101), z: tag('int', 4), keepPacked: tag('byte', 0) }] }),
  } }));
  writeFileSync(join(ordner, 'entities', 'r.0.0.mca'), region(0, 0, { name: '', type: 'compound', value: {
    Entities: tag('list', { elem: 'compound', items: [{ id: tag('string', 'minecraft:villager'), Pos: tag('list', { elem: 'double', items: [2.5, 101, 2.5] }) }] }),
  } }));
  return ordner;
}

test('level.dat: Version, Seed und Spawn', () => {
  const i = weltInfo(testwelt());
  assert.equal(i.version, '26.3');
  assert.equal(i.seed, '-42');
  assert.deepEqual(i.spawn.pos, [5, 100, 6]);
});

test('Umriss findet den Kasten der schwebenden Blöcke', () => {
  assert.deepEqual(umriss(testwelt(), 8, 8, 8, 90), { min: [1, 100, 2], max: [3, 101, 4], bloecke: 2 });
});

test('Ausschneiden liefert Blöcke, Block-Entities und Entities relativ zur Ecke', () => {
  const m = ausschneiden(testwelt(), [1, 100, 2], [3, 101, 4]);
  assert.deepEqual([m.w, m.h, m.l], [3, 2, 3]);
  assert.equal(hole(m, 0, 0, 0), 'minecraft:stone');
  assert.equal(hole(m, 2, 1, 2), 'minecraft:chest[facing=north]');
  assert.deepEqual(m.blockEntities[0].pos, [2, 1, 2]);
  assert.deepEqual(m.entities[0].pos, [1.5, 1, 0.5]);
  const zurueck = lade(speichere(m));
  assert.deepEqual(zurueck.bloecke, m.bloecke);
  assert.equal(leseNbt(speichere(m)).value.Entities.value.items[0].Id.value, 'minecraft:villager');
});

test('26.x-Palette: Text, {"": Text} und {id, properties}', () => {
  const sektion = { block_states: tag('compound', { palette: tag('list', { elem: 'compound', items: [
    { '': tag('string', 'minecraft:andesite') },
    { id: tag('string', 'minecraft:tall_seagrass'), properties: tag('compound', { half: tag('string', 'upper') }) },
  ] }), data: tag('longArray', [1n, ...new Array(255).fill(0n)]) }) };
  const b = sektionsBloecke(sektion);
  assert.equal(b[0], 'minecraft:tall_seagrass[half=upper]');
  assert.equal(b[1], 'minecraft:andesite');
  assert.equal(sektionsBloecke({ block_states: tag('compound', { palette: tag('list', { elem: 'string', items: ['minecraft:stone'] }) }) })[5], 'minecraft:stone');
});

test('Randwarnung: meldet Blöcke an den Seiten des Kastens', () => {
  assert.deepEqual(randBloecke(ausschneiden(testwelt(), [0, 99, 0], [5, 105, 5])), {});
  assert.deepEqual(randBloecke(ausschneiden(testwelt(), [0, 101, 0], [5, 105, 5])), { unten: 1 }); // Truhe auf y 101 liegt auf der Unterkante
});
