// Baut eine HTML-Vorschau des Questbuchs (Reiter, Quest-Baum, Tooltips) auf Deutsch und Englisch.
// Symbole und Vanilla-Titel kommen aus der Client-Jar, die Weihnachts-Symbole aus dem Resourcepack.
// Aufruf: node tools/questbuch-vorschau.mjs [client-jar] [vanilla-de_de.json]  → build/questbuch-vorschau.html
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { oeffneJar } from './jar.mjs';

const REPO = join(fileURLToPath(import.meta.url), '..', '..');
const NS = 'leitfaden';

// Baum-Layout ähnlich dem Fortschrittsfenster: Tiefe = Spalte, Eltern stehen auf Höhe ihres ersten Kindes.
export function layout(knoten) {
  const kinder = new Map();
  for (const k of knoten) if (k.parent) kinder.set(k.parent, [...(kinder.get(k.parent) ?? []), k.id]);
  const pos = new Map();
  let zeile = 0;
  const setze = (id, tiefe) => {
    const ks = kinder.get(id) ?? [];
    if (!ks.length) { pos.set(id, { x: tiefe, y: zeile++ }); return; }
    const start = zeile;
    for (const k of ks) setze(k, tiefe + 1);
    pos.set(id, { x: tiefe, y: start });
  };
  setze(knoten.find((k) => !k.parent).id, 0);
  return pos;
}

function text(c, sprache, lang, vanillaLang) {
  if (typeof c === 'string') return [{ t: c }];
  if (Array.isArray(c)) return c.flatMap((x) => text(x, sprache, lang, vanillaLang)).map((s) => ({ ...s }));
  let t = c.translate ? (lang[sprache][c.translate] ?? vanillaLang[sprache][c.translate] ?? c.fallback ?? c.translate) : (c.text ?? '');
  if (c.with) t = t.replace('%s', c.with.map((w) => text(w, sprache, lang, vanillaLang).map((s) => s.t).join('')).join(''));
  return [{ t, farbe: c.color }];
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const meta = join(process.env.APPDATA ?? '', 'ModrinthApp/meta');
  const clientJar = process.argv[2] ?? join(meta, 'versions/26.3-0.20.1/26.3-0.20.1.jar');
  let deDatei = process.argv[3];
  if (!deDatei) {
    const index = JSON.parse(readFileSync(join(meta, 'assets/indexes/34.json'), 'utf8'));
    const h = index.objects['minecraft/lang/de_de.json'].hash;
    deDatei = join(meta, 'assets/objects', h.slice(0, 2), h);
  }
  const jar = oeffneJar(clientJar);
  const vanillaLang = { en: JSON.parse(jar.lies('assets/minecraft/lang/en_us.json')), de: JSON.parse(readFileSync(deDatei, 'utf8')) };
  const lang = {};
  for (const [s, d] of [['de', 'de_de'], ['en', 'en_us']]) lang[s] = JSON.parse(readFileSync(join(REPO, `resourcepack/assets/weihnachten/lang/${d}.json`), 'utf8'));
  const daten = JSON.parse(readFileSync(join(REPO, 'datapack/questbuch.json'), 'utf8'));
  const advDir = join(REPO, 'datapack/leitfaden/data', NS, 'advancement');

  const bilder = new Map();
  const bild = (icon) => {
    const modell = icon.components?.['minecraft:item_model'];
    const schluessel = modell ?? icon.id;
    if (bilder.has(schluessel)) return bilder.get(schluessel);
    let png;
    if (modell) {
      const p = join(REPO, 'resourcepack/assets', modell.split(':')[0], 'textures/item', `${modell.split(':')[1]}.png`);
      if (existsSync(p)) png = readFileSync(p);
    } else {
      const n = icon.id.split(':')[1];
      for (const p of [`item/${n}`, `block/${n}`, `block/${n}_front`, `block/${n}_top`, `block/${n}_side`, `item/${n.replace('carved_', '')}`]) {
        png = jar.liesBinaer(`assets/minecraft/textures/${p}.png`);
        if (png) break;
      }
    }
    const url = png ? `data:image/png;base64,${png.toString('base64')}` : '';
    bilder.set(schluessel, url);
    return url;
  };

  const kapitel = daten.kapitel.map((k) => {
    const dateien = readdirSync(join(advDir, k.id)).map((f) => ({ id: f.replace('.json', ''), ...JSON.parse(readFileSync(join(advDir, k.id, f), 'utf8')) }));
    const knoten = dateien.map((a) => ({ id: a.id, parent: a.parent?.split('/')[1] }));
    const pos = layout(knoten);
    return {
      id: k.id, phase: k.phase, icon: bild(typeof k.icon === 'string' ? { id: k.icon } : k.icon), hintergrund: k.hintergrund,
      titel: { de: k.de.titel, en: k.en.titel },
      quests: dateien.map((a) => ({
        id: a.id, parent: knoten.find((x) => x.id === a.id).parent, ...pos.get(a.id), frame: a.display.frame ?? 'task', icon: bild(a.display.icon),
        info: a.criteria?.info?.trigger === 'minecraft:impossible',
        titel: { de: text(a.display.title, 'de', lang, vanillaLang), en: text(a.display.title, 'en', lang, vanillaLang) },
        text: { de: text(a.display.description, 'de', lang, vanillaLang), en: text(a.display.description, 'en', lang, vanillaLang) },
      })),
    };
  });
  const hg = {};
  for (const k of daten.kapitel) {
    const n = k.hintergrund.split('/').pop();
    const png = jar.liesBinaer(`assets/minecraft/textures/block/${n}.png`);
    if (png) hg[k.id] = `data:image/png;base64,${png.toString('base64')}`;
  }
  const html = readFileSync(join(REPO, 'tools/questbuch-vorschau.html'), 'utf8').replace('/*DATEN*/null', JSON.stringify({ kapitel, hg }));
  mkdirSync(join(REPO, 'build'), { recursive: true });
  writeFileSync(join(REPO, 'build/questbuch-vorschau.html'), html);
  console.log('build/questbuch-vorschau.html geschrieben');
}

