// Verschiebt alle absoluten Koordinaten in Datapack-Funktionen um einen Versatz [dx, dy, dz] (Spawn an den natürlichen World-Spawn, Pascal 30.10.).
// Erweitert verschiebeY aus spawn/archiv.mjs auf x/z. Relative (~) und lokale (^) Angaben bleiben, NBT hinter den Koordinaten bleibt unberührt.
//   node spawn/smp-neu/verschieben.mjs <datapack-ordner> <dx> <dy> <dz>   – alle .mcfunction darin werden umgeschrieben
//   node spawn/smp-neu/verschieben.mjs regionen <ein.yml> <aus.yml> <dx> <dy> <dz>
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const zahl = (t, d) => (d && /^-?\d+(\.\d+)?$/.test(t) ? String(Math.round((+t + d) * 1e6) / 1e6) : t);

export function verschiebe(zeile, [dx, dy, dz]) {
  if (/^\s*(#|$)/.test(zeile)) return zeile;
  if (zeile.startsWith('$')) return '$' + verschiebe(zeile.slice(1), [dx, dy, dz]);
  const d3 = [dx, dy, dz];
  const sel = (s) => s.replace(/([[,])([xyz])=(-?\d+(?:\.\d+)?)/g, (_, a, k, n) => `${a}${k}=${zahl(n, d3['xyz'.indexOf(k)])}`);
  const tripel = (x, y, z) => `${zahl(x, dx)} ${zahl(y, dy)} ${zahl(z, dz)}`;
  if (zeile.startsWith('execute ')) {
    const i = zeile.indexOf(' run ');
    let kopf = sel(i < 0 ? zeile : zeile.slice(0, i));
    kopf = kopf
      .replace(/(positioned|block|loaded) (\S+) (\S+) (\S+)/g, (m, w, x, y, z) => (w === 'positioned' && x === 'as' ? m : `${w} ${tripel(x, y, z)}`))
      .replace(/blocks (\S+) (\S+) (\S+) (\S+) (\S+) (\S+) (\S+) (\S+) (\S+)/g, (_, ...p) => `blocks ${tripel(p[0], p[1], p[2])} ${tripel(p[3], p[4], p[5])} ${tripel(p[6], p[7], p[8])}`);
    return i < 0 ? kopf : `${kopf} run ${verschiebe(zeile.slice(i + 5), d3)}`;
  }
  const t = zeile.split(' ');
  const p3 = (...start) => { for (const s of start) for (let k = 0; k < 3; k++) if (t[s + k] !== undefined) t[s + k] = zahl(t[s + k], d3[k]); };
  const p2 = (...start) => { for (const s of start) { if (t[s] !== undefined) t[s] = zahl(t[s], dx); if (t[s + 1] !== undefined) t[s + 1] = zahl(t[s + 1], dz); } };
  if (t[0] === 'setblock' || t[0] === 'setworldspawn') p3(1);
  else if (t[0] === 'fill') p3(1, 4);
  else if (t[0] === 'clone') p3(1, 4, 7);
  else if (t[0] === 'summon' || t[0] === 'particle' || (t[0] === 'tp' && t.length >= 5) || t[0] === 'teleport') p3(2);
  else if (t[0] === 'playsound') p3(4);
  else if (t[0] === 'place' && t[1] === 'template') p3(3);
  else if (t[0] === 'data' && t[2] === 'block') p3(3);
  else if (t[0] === 'item' && t[2] === 'block') p3(3);
  else if (t[0] === 'forceload' && (t[1] === 'add' || t[1] === 'remove') && t[2] !== 'all') p2(2, 4);
  else if (t[0] === 'worldborder' && t[1] === 'center') p2(2);
  else if (t[0] === 'spreadplayers') p2(1);
  return sel(t.join(' '));
}

export function verschiebeDatapack(ordner, d) {
  let n = 0;
  const lauf = (o) => { for (const e of readdirSync(o)) {
    const p = join(o, e);
    if (statSync(p).isDirectory()) lauf(p);
    else if (e.endsWith('.mcfunction')) { writeFileSync(p, readFileSync(p, 'utf8').split('\n').map((z) => verschiebe(z, d)).join('\n')); n++; }
  } };
  lauf(ordner);
  return n;
}

// WorldGuard-YAML (poly2d-Punkte, cuboid min/max, min-y/max-y)
export function verschiebeRegionen(text, [dx, dy, dz]) {
  return text
    .replace(/\{x: (-?\d+), z: (-?\d+)\}/g, (_, x, z) => `{x: ${+x + dx}, z: ${+z + dz}}`)
    .replace(/\{x: (-?\d+), y: (-?\d+), z: (-?\d+)\}/g, (_, x, y, z) => `{x: ${+x + dx}, y: ${+y + dy}, z: ${+z + dz}}`)
    .replace(/^(\s+)(min-y|max-y): (-?\d+)/gm, (_, s, k, y) => `${s}${k}: ${Math.min(319, Math.max(-64, +y + dy))}`);
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('spawn/smp-neu/verschieben.mjs')) {
  const a = process.argv.slice(2);
  if (a[0] === 'regionen') {
    writeFileSync(a[2], verschiebeRegionen(readFileSync(a[1], 'utf8'), a.slice(3, 6).map(Number)));
    console.log(`Regionen verschoben → ${a[2]}`);
  } else console.log(`${verschiebeDatapack(a[0], a.slice(1, 4).map(Number))} Funktionen in ${a[0]} verschoben um ${a.slice(1, 4).join('/')}`);
}
