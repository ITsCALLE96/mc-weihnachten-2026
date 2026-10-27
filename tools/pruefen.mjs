// Prüft Datapack und Resourcepack vor dem Hochladen (nur Node-Standardbibliothek).
// Aufruf: node tools/pruefen.mjs datapack|resourcepack|geyser [pfad]
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = join(fileURLToPath(import.meta.url), '..', '..');
// Deutsche Questbuch-Texte für Bedrock-Spieler: Geyser (im Proxy) liest Java-Übersetzungen aus locales/overrides/.
// Ohne die Datei sehen Bedrock-Spieler die englischen fallback-Texte. Wird von tools/questbuch.mjs geschrieben.
export const GEYSER_DE = 'server/plugin-konfig/proxy/plugins/Geyser-Velocity/locales/overrides/de_de.json';
const VERSIONEN = JSON.parse(readFileSync(join(REPO, 'versions.json'), 'utf8'));

function alleDateien(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { recursive: true })
    .map((p) => join(dir, p))
    .filter((p) => statSync(p).isFile());
}

// Liest alle JSON-Dateien; Parse-Fehler landen in `fehler`.
function leseJson(wurzel, fehler) {
  const ergebnis = new Map();
  for (const datei of alleDateien(wurzel)) {
    if (!/\.(json|mcmeta)$/.test(datei)) continue;
    const rel = relative(wurzel, datei).split(sep).join('/');
    try {
      ergebnis.set(rel, JSON.parse(readFileSync(datei, 'utf8')));
    } catch (e) {
      fehler.push(`${rel}: kein gültiges JSON (${e.message})`);
    }
  }
  return ergebnis;
}

function pruefeMeta(json, erwartet, fehler) {
  const meta = json.get('pack.mcmeta');
  if (!meta) {
    if (!fehler.some((f) => f.startsWith('pack.mcmeta'))) fehler.push('pack.mcmeta fehlt');
    return;
  }
  const soll = erwartet.join('.');
  const falsch = ['min_format', 'max_format'].filter((feld) => {
    const ist = meta.pack?.[feld];
    return !Array.isArray(ist) || ist.join('.') !== soll;
  });
  if (falsch.length) {
    fehler.push(`pack.mcmeta: ${falsch.join(' und ')} müssen [${erwartet.join(', ')}] (${soll}) sein`);
  }
}

export function pruefeDatapack(wurzel) {
  const fehler = [];
  const json = leseJson(wurzel, fehler);
  pruefeMeta(json, VERSIONEN.datapack_format, fehler);

  const advancements = new Map();
  for (const [rel, inhalt] of json) {
    const m = rel.match(/^data\/([^/]+)\/advancement\/(.+)\.json$/);
    if (m) advancements.set(`${m[1]}:${m[2]}`, { rel, inhalt });
  }
  for (const [, { rel, inhalt }] of advancements) {
    const parent = inhalt.parent;
    if (parent && !parent.startsWith('minecraft:') && !advancements.has(parent)) {
      fehler.push(`${rel}: parent ${parent} existiert nicht`);
    }
    const fn = inhalt.rewards?.function;
    if (fn) {
      const [ns, pfad] = fn.split(':');
      if (!existsSync(join(wurzel, 'data', ns, 'function', `${pfad}.mcfunction`))) fehler.push(`${rel}: Funktion ${fn} fehlt`);
    }
    for (const key of ohneFallback(inhalt.display)) fehler.push(`${rel}: ${key} ohne fallback`);
  }
  return fehler;
}

// Eigene Übersetzungsschlüssel brauchen einen fallback (Spieler ohne Resourcepack); Vanilla-Schlüssel nicht.
function ohneFallback(x, treffer = []) {
  if (Array.isArray(x)) x.forEach((y) => ohneFallback(y, treffer));
  else if (x && typeof x === 'object') {
    if (typeof x.translate === 'string' && !x.translate.startsWith('advancements.') && typeof x.fallback !== 'string') treffer.push(x.translate);
    Object.values(x).forEach((y) => ohneFallback(y, treffer));
  }
  return treffer;
}

export function pruefeResourcepack(wurzel) {
  const fehler = [];
  const json = leseJson(wurzel, fehler);
  pruefeMeta(json, VERSIONEN.resourcepack_format, fehler);

  for (const [rel, inhalt] of json) {
    const m = rel.match(/^(assets\/[^/]+\/lang\/)de_de\.json$/);
    if (!m) continue;
    const en = json.get(`${m[1]}en_us.json`);
    if (!en) { fehler.push(`${m[1]}en_us.json fehlt zu de_de.json`); continue; }
    for (const k of Object.keys(inhalt)) if (!(k in en)) fehler.push(`${m[1]}en_us.json: ${k} fehlt`);
    for (const k of Object.keys(en)) if (!(k in inhalt)) fehler.push(`${m[1]}de_de.json: ${k} fehlt`);
  }
  // Detail-Dateien der Quest-Seitenleiste: jeder Schlüssel mit fallback und in beiden Sprachdateien
  const alleLang = (sprache) => Object.assign({}, ...[...json].filter(([r]) => r.endsWith(`/lang/${sprache}.json`)).map(([, j]) => j));
  const deAlle = alleLang('de_de'), enAlle = alleLang('en_us');
  for (const [rel, inhalt] of json) {
    if (!/^assets\/[^/]+\/questbuch\//.test(rel)) continue;
    const texte = [...(inhalt.schritte ?? []), ...(inhalt.fundort ?? [])].map((e) => e.text).filter(Boolean);
    for (const t of texte) {
      if (typeof t.fallback !== 'string') fehler.push(`${rel}: ${t.translate} ohne fallback`);
      if (!(t.translate in deAlle) || !(t.translate in enAlle)) fehler.push(`${rel}: ${t.translate} fehlt in de_de/en_us`);
    }
  }
  for (const [rel, inhalt] of json) {
    if (!/^assets\/[^/]+\/models\//.test(rel)) continue;
    for (const ref of Object.values(inhalt.textures ?? {})) {
      if (typeof ref !== 'string' || ref.startsWith('#')) continue;
      const [ns, pfad] = ref.includes(':') ? ref.split(':') : ['minecraft', ref];
      if (ns === 'minecraft') continue;
      if (!existsSync(join(wurzel, 'assets', ns, 'textures', `${pfad}.png`))) {
        fehler.push(`${rel}: Textur ${ns}:${pfad} fehlt`);
      }
    }
  }
  return fehler;
}

// Die Geyser-Datei muss genau die deutschen Texte des Resourcepacks enthalten (sonst veraltet nach Textänderungen).
export function pruefeGeyser(rpWurzel, datei) {
  const fehler = [];
  if (!existsSync(datei)) return [`${datei} fehlt, erzeugen mit node tools/questbuch.mjs`];
  const rp = leseJson(rpWurzel, fehler);
  const de = Object.assign({}, ...[...rp].filter(([r]) => r.endsWith('/lang/de_de.json')).map(([, j]) => j));
  let geyser;
  try { geyser = JSON.parse(readFileSync(datei, 'utf8')); } catch (e) { return [`${datei}: ${e.message}`]; }
  for (const [k, v] of Object.entries(de)) {
    if (!(k in geyser)) fehler.push(`Geyser de_de.json: ${k} fehlt`);
    else if (geyser[k] !== v) fehler.push(`Geyser de_de.json: ${k} weicht ab`);
  }
  for (const k of Object.keys(geyser)) if (!(k in de)) fehler.push(`Geyser de_de.json: ${k} steht nicht im Resourcepack`);
  return fehler;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const [art, pfad] = process.argv.slice(2);
  const pruefer = { datapack: pruefeDatapack, resourcepack: pruefeResourcepack, geyser: (p) => pruefeGeyser(p, join(REPO, GEYSER_DE)) }[art];
  if (!pruefer) {
    console.error('Aufruf: node tools/pruefen.mjs datapack|resourcepack|geyser [pfad]');
    process.exit(2);
  }
  const fehler = pruefer(pfad ?? join(REPO, art === 'datapack' ? 'datapack/leitfaden' : 'resourcepack'));
  if (fehler.length) {
    console.error(`${fehler.length} Fehler:\n- ${fehler.join('\n- ')}`);
    process.exit(1);
  }
  console.log(`${art}: ok`);
}
