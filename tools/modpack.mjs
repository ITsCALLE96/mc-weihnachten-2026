// Baut das optionale Modrinth-Pack (.mrpack) aus modpack/mods.json.
// Holt je Mod die neueste Fabric-Version für die Minecraft-Version aus versions.json,
// löst Pflicht-Abhängigkeiten auf und schreibt build/weihnachten-modpack.mrpack.
// Aufruf: node tools/modpack.mjs
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
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
  const { name, version, mods, optional = [], shader = [], resourcepacks = [] } =
    JSON.parse(readFileSync(join(repo, 'modpack/mods.json'), 'utf8'));

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
  const aktivVorher = new Set(gefunden.keys());
  const deaktiviert = new Set();
  for (const projekt of optional) {
    const id = await hole(projekt, false);
    if (id && !aktivVorher.has(id)) deaktiviert.add(id);
  }
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
  const packDatei = join(repo, 'build/weihnachten-modpack.mrpack');
  rmSync(packDatei, { force: true });
  execFileSync('C:/Windows/System32/tar.exe', ['--format', 'zip', '-cf', packDatei, 'modrinth.index.json'], { cwd: tmp });
  writeFileSync(join(repo, 'modpack/STAND.md'),
    `# Stand des Modpacks\n\nMinecraft ${minecraft}, Fabric Loader ${loader}\n\n| Datei | Download |\n|---|---|\n` +
    index.files.map((f) => `| ${f.path} | ${f.downloads[0]} |`).join('\n') + '\n');
  console.log(`${index.files.length} Dateien (${deaktiviert.size} deaktiviert, ${shaderIds.length} Shader, ` +
    `${rpIds.length} Resourcepacks), Loader ${loader} → ${packDatei}`);
}
