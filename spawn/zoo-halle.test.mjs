import { test } from 'node:test';
import assert from 'node:assert/strict';
import { datapack, fluegel, FLUEGEL } from './zoo-halle.mjs';

const kasten = (z) => { const t = z.split(' '); const n = t[0] === 'fill' ? t.slice(1, 7).map(Number) : [...t.slice(1, 4), ...t.slice(1, 4)].map(Number);
  return { lo: [0, 1, 2].map((i) => Math.min(n[i], n[i + 3])), hi: [0, 1, 2].map((i) => Math.max(n[i], n[i + 3])), block: t[t[0] === 'fill' ? 7 : 4], ersetzt: z.includes(' replace ') }; };

test('Zoo-Halle: Funktions-Tag #zoo:halle der Server-Session', () => {
  const d = datapack();
  assert.deepEqual(JSON.parse(d['data/zoo/tags/function/halle.json']).values, ['zoo_halle:bau']);
  assert.match(d['data/zoo_halle/function/bau.mcfunction'], /^schedule function zoo_halle:bau2 40t$/m);
});

test('Zoo-Halle: innen frei (nur Licht in Luft), Wände genau auf den Grenzen, Eingänge offen, fill unter 32768', () => {
  for (const w of FLUEGEL) {
    const c = fluegel(w).map(kasten);
    for (const k of c) {
      const vol = (k.hi[0] - k.lo[0] + 1) * (k.hi[1] - k.lo[1] + 1) * (k.hi[2] - k.lo[2] + 1);
      assert.ok(vol <= 32768, `${w.name}: fill zu groß`);
      const innen = k.lo[0] <= 243 && k.hi[0] >= 117 && k.lo[2] <= w.z2 - 1 && k.hi[2] >= w.z1 + 1 && k.lo[1] <= w.decke - 1 && k.hi[1] >= -60;
      if (innen) assert.ok(k.ersetzt && k.block.startsWith('minecraft:light'), `${w.name}: setzt innen ${k.block}`);
      assert.ok(k.hi[2] < 86 && k.lo[2] > -129, `${w.name}: Geschoss-Galerie bzw. Arena`);
    }
    const tuer = c.find((k) => k.block === 'minecraft:air');
    assert.deepEqual([tuer.lo, tuer.hi], [[116, -60, w.tuer], [116, -57, w.tuer + 4]]);
  }
});
