// Baut das optionale Modrinth-Pack (.mrpack) aus modpack/mods.json.
// Holt je Mod die neueste Fabric-Version für die Minecraft-Version aus versions.json,
// löst Pflicht-Abhängigkeiten auf und schreibt build/weihnachten-modpack.mrpack.
// Aufruf: node tools/modpack.mjs [mods.json einer Testvariante]  (Variante → build/<dateiname>.mrpack)
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, copyFileSync, readdirSync } from 'node:fs';
import { join, resolve, basename, relative, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// shader/resourcepacks: Projekt-IDs, die in shaderpacks/ bzw. resourcepacks/ statt mods/ landen.
// deaktiviert: Projekt-IDs optionaler Mods; sie liegen als .jar.disabled bei und lassen sich im Launcher einschalten.
function ziel(v, datei, { shader, resourcepacks, deaktiviert }) {
  if (shader.includes(v.project_id)) return `shaderpacks/${datei.filename}`;
  if (resourcepacks.includes(v.project_id)) return `resourcepacks/${datei.filename}`;
  return `mods/${datei.filename}${deaktiviert.includes(v.project_id) ? '.disabled' : ''}`;
}

export function baueIndex({ name, version, minecraft, fabricLoader, versionen, shader = [], resourcepacks = [], deaktiviert = [] }) {
  return {
    formatVersion: 1,
    game: 'minecraft',
    versionId: version,
    name,
    files: versionen.map((v) => {
      const datei = v.files.find((f) => f.primary) ?? v.files[0];
      if (!datei) throw new Error(`Version ${v.version_number} von ${v.project_id} hat keine Datei`);
      return {
        path: ziel(v, datei, { shader, resourcepacks, deaktiviert }),
        hashes: { sha1: datei.hashes.sha1, sha512: datei.hashes.sha512 },
        env: { client: 'required', server: 'unsupported' },
        downloads: [datei.url],
        fileSize: datei.size,
      };
    }),
    dependencies: { minecraft, 'fabric-loader': fabricLoader },
  };
}

// Eigene Mods, die nicht auf Modrinth liegen: Pfade relativ zum Repo, landen als overrides/mods/<datei> im Pack.
// Die Jars werden nicht committet, sondern beim Bau aus dem Nachbar-Repo gelesen.
export function lokaleMods(pfade, repo) {
  return pfade.map((pfad) => {
    const quelle = resolve(repo, pfad);
    if (!existsSync(quelle)) throw new Error(`Lokale Mod fehlt: ${quelle} – erst im Nachbar-Repo bauen`);
    return { quelle, ziel: `overrides/mods/${basename(quelle)}` };
  });
}

// Voreinstellungen (Tasten, Sprache, Mod-Configs) aus modpack/overrides/: landen 1:1 unter overrides/ im Pack.
export function overrideDateien(ordner) {
  if (!existsSync(ordner)) return [];
  return readdirSync(ordner, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => {
      const quelle = join(e.parentPath, e.name);
      return { quelle, ziel: `overrides/${relative(ordner, quelle).replaceAll('\\', '/')}` };
    });
}

async function holeJson(url) {
  const antwort = await fetch(url, { headers: { 'User-Agent': 'ITsCALLE96/mc-weihnachten-2026' } });
  if (!antwort.ok) throw new Error(`${url}: HTTP ${antwort.status}`);
  return antwort.json();
}

async function neuesteVersion(projekt, minecraft, loader = 'fabric') {
  const q = `loaders=${encodeURIComponent(JSON.stringify([loader]))}&game_versions=${encodeURIComponent(JSON.stringify([minecraft]))}`;
  const liste = await holeJson(`https://api.modrinth.com/v2/project/${projekt}/version?${q}`);
  const v = liste.find((x) => x.version_type === 'release') ?? liste[0];
  if (!v) throw new Error(`${projekt}: keine ${loader}-Version für ${minecraft}`);
  return v;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const repo = join(fileURLToPath(import.meta.url), '..', '..');
  const { minecraft } = JSON.parse(readFileSync(join(repo, 'versions.json'), 'utf8'));
  const modsDatei = process.argv[2] ? resolve(process.argv[2]) : join(repo, 'modpack/mods.json');
  const { name, version, mods, aktivSobaldVerfuegbar = [], optional = [], shader = [], resourcepacks = [], lokal = [] } =
    JSON.parse(readFileSync(modsDatei, 'utf8'));
  const variante = process.argv[2] ? basename(modsDatei, '.json') : null; // Testvarianten überschreiben weder Pack noch STAND.md
  const eigene = lokaleMods(lokal, repo); // vor allen Downloads, damit ein fehlendes Jar sofort auffällt

  const loader = (await holeJson(`https://meta.fabricmc.net/v2/versions/loader/${minecraft}`))
    .find((l) => l.loader.stable)?.loader.version;
  if (!loader) throw new Error(`Kein stabiler Fabric-Loader für ${minecraft}`);

  const gefunden = new Map(); // Projekt-ID → Version
  const pflichtAb = (v) => (v.dependencies ?? []).filter((d) => d.dependency_type === 'required' && d.project_id).map((d) => d.project_id);

  // Holt ein Projekt samt Pflicht-Abhängigkeiten; liefert die Projekt-ID oder null, wenn es keine passende Version gibt.
  const slugZuId = new Map();
  async function hole(projekt, muss, loaderName = 'fabric') {
    if (gefunden.has(projekt)) return projekt;
    if (slugZuId.has(projekt)) return slugZuId.get(projekt);
    let v;
    try {
      v = await neuesteVersion(projekt, minecraft, loaderName);
    } catch (e) {
      // Manche Mods listen Forge-Abhängigkeiten fälschlich als Pflicht; Kern-Mods müssen aber da sein.
      if (muss) throw e;
      console.warn(`Übersprungen: ${e.message}`);
      return null;
    }
    slugZuId.set(projekt, v.project_id);
    gefunden.set(v.project_id, v);
    for (const d of pflichtAb(v)) await hole(d, false);
    return v.project_id;
  }

  for (const projekt of mods) await hole(projekt, true);
  // Gewünscht, aber noch ohne Version für diese Minecraft-Version: kommen beim nächsten Bau von selbst dazu.
  for (const projekt of aktivSobaldVerfuegbar) await hole(projekt, false);
  const aktivVorher = new Set(gefunden.keys());
  const deaktiviert = new Set();
  for (const projekt of optional) await hole(projekt, false);
  // Optionale Mods und alles, was nur sie mitbringen (z. B. ukulib für uku's Armor HUD), liegen deaktiviert bei.
  for (const id of gefunden.keys()) if (!aktivVorher.has(id)) deaktiviert.add(id);
  // Was eine aktive Mod braucht, muss selbst aktiv bleiben.
  for (let geaendert = true; geaendert;) {
    geaendert = false;
    for (const v of gefunden.values()) {
      if (deaktiviert.has(v.project_id)) continue;
      for (const d of pflichtAb(v)) if (deaktiviert.delete(d)) geaendert = true;
    }
  }
  // Shader und Resourcepacks haben keine Abhängigkeiten und eigene Loader.
  const shaderIds = [];
  for (const projekt of shader) shaderIds.push(await hole(projekt, true, 'iris'));
  const rpIds = [];
  for (const projekt of resourcepacks) rpIds.push(await hole(projekt, true, 'minecraft'));
  const versionen = [...gefunden.values()];

  const index = baueIndex({ name, version, minecraft, fabricLoader: loader, versionen,
    shader: shaderIds, resourcepacks: rpIds, deaktiviert: [...deaktiviert] });
  const tmp = join(repo, 'build/mrpack');
  rmSync(tmp, { recursive: true, force: true });
  mkdirSync(tmp, { recursive: true });
  writeFileSync(join(tmp, 'modrinth.index.json'), JSON.stringify(index, null, 2));
  const packDatei = join(repo, `build/${variante ?? 'weihnachten-modpack'}.mrpack`);
  rmSync(packDatei, { force: true });
  const voreinstellungen = overrideDateien(join(repo, 'modpack/overrides'));
  for (const { quelle, ziel: z } of [...eigene, ...voreinstellungen]) {
    mkdirSync(dirname(join(tmp, z)), { recursive: true });
    copyFileSync(quelle, join(tmp, z));
  }
  execFileSync('C:/Windows/System32/tar.exe', ['--format', 'zip', '-cf', packDatei, 'modrinth.index.json',
    ...(eigene.length || voreinstellungen.length ? ['overrides'] : [])], { cwd: tmp });
  if (!variante) writeFileSync(join(repo, 'modpack/STAND.md'),
    `# Stand des Modpacks\n\nMinecraft ${minecraft}, Fabric Loader ${loader}\n\n| Datei | Download |\n|---|---|\n` +
    index.files.map((f) => `| ${f.path} | ${f.downloads[0]} |`).join('\n') + '\n' +
    eigene.map((e) => `| ${e.ziel} | eigene Mod, liegt im Pack |`).join('\n') + (eigene.length ? '\n' : ''));
  console.log(`${index.files.length} Dateien + ${eigene.length} eigene (${deaktiviert.size} deaktiviert, ${shaderIds.length} Shader, ` +
    `${rpIds.length} Resourcepacks), Loader ${loader} → ${packDatei}`);
}
