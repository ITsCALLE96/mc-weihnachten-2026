#!/usr/bin/env node
// Erzeugt daten/sprache.json (de + en) aus dem lokalen Minecraft-Client.
// Aufruf: node statistik/sprache.mjs [--jar <jar>] [--index <assetindex.json>] [--objekte <assets/objects>] [--aus <datei>]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { liesZipEintrag } from './lib/zip.mjs';

const hier = dirname(fileURLToPath(import.meta.url));
const MODRINTH = 'C:/Users/pasca/AppData/Roaming/ModrinthApp/meta';
export const STANDARD = {
  jar: `${MODRINTH}/versions/26.3-0.19.5/26.3-0.19.5.jar`,
  index: `${MODRINTH}/assets/indexes/34.json`,
  objekte: `${MODRINTH}/assets/objects`,
  aus: join(hier, 'daten', 'sprache.json'),
};
export const PRAEFIXE = ['block.minecraft.', 'item.minecraft.', 'entity.minecraft.', 'stat.minecraft.', 'death.', 'advancements.'];

export function filtere(obj) {
  const aus = {};
  for (const [k, v] of Object.entries(obj)) if (PRAEFIXE.some((p) => k.startsWith(p))) aus[k] = v;
  return aus;
}

export function baueSprache(opt = {}) {
  const o = { ...STANDARD, ...opt };
  const en = JSON.parse(liesZipEintrag(o.jar, 'assets/minecraft/lang/en_us.json').toString('utf8'));
  const index = JSON.parse(readFileSync(o.index, 'utf8'));
  const eintrag = index.objects?.['minecraft/lang/de_de.json'];
  if (!eintrag) throw new Error('de_de.json fehlt im Asset-Index');
  const hash = eintrag.hash;
  const de = JSON.parse(readFileSync(join(o.objekte, hash.slice(0, 2), hash), 'utf8'));
  return { de: filtere(de), en: filtere(en) };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const opt = {};
  const a = process.argv.slice(2);
  for (let i = 0; i < a.length; i += 2) opt[a[i].replace(/^--/, '')] = a[i + 1];
  const s = baueSprache(opt);
  const ziel = opt.aus ?? STANDARD.aus;
  mkdirSync(dirname(ziel), { recursive: true });
  writeFileSync(ziel, JSON.stringify(s));
  console.log(`sprache.json: ${Object.keys(s.de).length} de, ${Object.keys(s.en).length} en → ${ziel}`);
}
