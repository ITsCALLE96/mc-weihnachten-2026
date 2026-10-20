// Baut das optionale Modrinth-Pack (.mrpack) aus modpack/mods.json.
// Holt je Mod die neueste Fabric-Version für die Minecraft-Version aus versions.json,
// löst Pflicht-Abhängigkeiten auf und schreibt build/weihnachten-modpack.mrpack.
// Aufruf: node tools/modpack.mjs
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export function baueIndex({ name, version, minecraft, fabricLoader, versionen }) {
  return {
    formatVersion: 1,
    game: 'minecraft',
    versionId: version,
    name,
    files: versionen.map((v) => {
      const datei = v.files.find((f) => f.primary) ?? v.files[0];
      if (!datei) throw new Error(`Version ${v.version_number} von ${v.project_id} hat keine Datei`);
      return {
        path: `mods/${datei.filename}`,
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

async function neuesteVersion(projekt, minecraft) {
  const q = `loaders=${encodeURIComponent('["fabric"]')}&game_versions=${encodeURIComponent(JSON.stringify([minecraft]))}`;
  const liste = await holeJson(`https://api.modrinth.com/v2/project/${projekt}/version?${q}`);
  const v = liste.find((x) => x.version_type === 'release') ?? liste[0];
  if (!v) throw new Error(`${projekt}: keine Fabric-Version für ${minecraft}`);
  return v;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const repo = join(fileURLToPath(import.meta.url), '..', '..');
  const { minecraft } = JSON.parse(readFileSync(join(repo, 'versions.json'), 'utf8'));
  const { name, version, mods } = JSON.parse(readFileSync(join(repo, 'modpack/mods.json'), 'utf8'));

  const loader = (await holeJson(`https://meta.fabricmc.net/v2/versions/loader/${minecraft}`))
    .find((l) => l.loader.stable)?.loader.version;
  if (!loader) throw new Error(`Kein stabiler Fabric-Loader für ${minecraft}`);

  const gefunden = new Map();
  const offen = [...mods];
  while (offen.length) {
    const projekt = offen.shift();
    if ([...gefunden.values()].some((v) => v.project_id === projekt) || gefunden.has(projekt)) continue;
    let v;
    try {
      v = await neuesteVersion(projekt, minecraft);
    } catch (e) {
      // Manche Mods listen Forge-Abhängigkeiten fälschlich als Pflicht; direkt gewählte Mods müssen aber da sein.
      if (mods.includes(projekt)) throw e;
      console.warn(`Abhängigkeit übersprungen: ${e.message}`);
      continue;
    }
    gefunden.set(projekt, v);
    for (const d of v.dependencies ?? []) {
      if (d.dependency_type === 'required' && d.project_id) offen.push(d.project_id);
    }
  }
  const versionen = [...new Map([...gefunden.values()].map((v) => [v.project_id, v])).values()];

  const index = baueIndex({ name, version, minecraft, fabricLoader: loader, versionen });
  const tmp = join(repo, 'build/mrpack');
  rmSync(tmp, { recursive: true, force: true });
  mkdirSync(tmp, { recursive: true });
  writeFileSync(join(tmp, 'modrinth.index.json'), JSON.stringify(index, null, 2));
  const ziel = join(repo, 'build/weihnachten-modpack.mrpack');
  rmSync(ziel, { force: true });
  execFileSync('C:/Windows/System32/tar.exe', ['--format', 'zip', '-cf', ziel, 'modrinth.index.json'], { cwd: tmp });
  writeFileSync(join(repo, 'modpack/STAND.md'),
    `# Stand des Modpacks\n\nMinecraft ${minecraft}, Fabric Loader ${loader}\n\n| Datei | Download |\n|---|---|\n` +
    index.files.map((f) => `| ${f.path} | ${f.downloads[0]} |`).join('\n') + '\n');
  console.log(`${index.files.length} Mods, Loader ${loader} → ${ziel}`);
}
