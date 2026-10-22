import { test } from 'node:test';
import assert from 'node:assert/strict';
import { leseNbt, schreibeNbt, tag } from './nbt.mjs';
import { litematicZuSchem, blockAus } from './schematic.mjs';

// Packt Indizes wie Litematica: feste Bitbreite, Werte dürfen über Long-Grenzen reichen.
function packe(werte, bits) {
  const longs = new Array(Math.ceil((werte.length * bits) / 64)).fill(0n);
  werte.forEach((v, i) => {
    for (let b = 0; b < bits; b++) {
      if ((v >> b) & 1) {
        const pos = i * bits + b;
        longs[pos >> 6] |= 1n << BigInt(pos & 63);
      }
    }
  });
  return longs.map((l) => BigInt.asIntN(64, l));
}

function testLitematic(groesse, palette, indizes, tiles = []) {
  const bits = Math.max(2, Math.ceil(Math.log2(palette.length)));
  const vec = (x, y, z) => tag('compound', { x: tag('int', x), y: tag('int', y), z: tag('int', z) });
  return schreibeNbt({
    name: '', type: 'compound', value: {
      MinecraftDataVersion: tag('int', 3953),
      Version: tag('int', 7),
      Regions: tag('compound', {
        R: tag('compound', {
          Position: vec(0, 0, 0),
          Size: vec(...groesse),
          BlockStatePalette: tag('list', {
            elem: 'compound',
            items: palette.map(([name, props]) => ({
              Name: tag('string', name),
              ...(props && { Properties: tag('compound', Object.fromEntries(Object.entries(props).map(([k, v]) => [k, tag('string', v)]))) }),
            })),
          }),
          BlockStates: tag('longArray', packe(indizes, bits)),
          TileEntities: tag('list', { elem: 'compound', items: tiles }),
        }),
      }),
    },
  });
}

test('wandelt Blöcke inkl. Properties und Long-übergreifender Bits korrekt um', () => {
  // 5 Paletteneinträge → 3 Bit, 3×2×4 = 24 Blöcke → Werte überschreiten die 64-Bit-Grenze
  const palette = [['minecraft:air'], ['minecraft:stone'], ['minecraft:spruce_stairs', { facing: 'east', half: 'top' }], ['minecraft:snow_block'], ['minecraft:glass']];
  const indizes = Array.from({ length: 24 }, (_, i) => i % 5);
  const schem = leseNbt(litematicZuSchem(testLitematic([3, 2, 4], palette, indizes))).value;
  assert.equal(schem.Width.value, 3);
  assert.equal(schem.Height.value, 2);
  assert.equal(schem.Length.value, 4);
  for (let y = 0; y < 2; y++) for (let z = 0; z < 4; z++) for (let x = 0; x < 3; x++) {
    const erwartet = palette[indizes[(y * 4 + z) * 3 + x]];
    const name = erwartet[1] ? `${erwartet[0]}[facing=east,half=top]` : erwartet[0];
    assert.equal(blockAus(schem, x, y, z), name, `x${x} y${y} z${z}`);
  }
});

test('übernimmt Block-Entities mit Pos und Id', () => {
  const schild = {
    x: tag('int', 1), y: tag('int', 0), z: tag('int', 2),
    id: tag('string', 'minecraft:sign'),
    is_waxed: tag('byte', 1),
  };
  const schem = leseNbt(litematicZuSchem(testLitematic([2, 1, 3], [['minecraft:air'], ['minecraft:oak_sign']], [0, 0, 0, 0, 0, 1], [schild]))).value;
  const be = schem.BlockEntities.value.items[0];
  assert.deepEqual(be.Pos.value, [1, 0, 2]);
  assert.equal(be.Id.value, 'minecraft:sign');
  assert.equal(be.is_waxed.value, 1);
  assert.equal(be.x, undefined);
});

test('lehnt Litematics mit mehreren Regionen ab', () => {
  const datei = leseNbt(testLitematic([1, 1, 1], [['minecraft:air']], [0]));
  datei.value.Regions.value.Zweite = datei.value.Regions.value.R;
  assert.throws(() => litematicZuSchem(schreibeNbt(datei)), /genau einer Region/);
});
