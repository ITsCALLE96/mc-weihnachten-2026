// SMP-Neuaufbau, Datapacks an den natürlichen World-Spawn verschieben (spawn/smp-neu/README.md).
//   node spawn/smp-neu/bauen.mjs vorbereiten <lage.json> <ausgabe>
//       → <ausgabe>/datapacks/{insel,insel-deko,insel-kalender,weihnachtsinsel,weihnachtsplatten}, regions.yml, weihnachtsmann.json – alles verschoben
//         (insel ohne Lichtung: das Gelände gleicht insel:angleichen aus der echten Höhenkarte an)
//   node spawn/smp-neu/bauen.mjs lichter <lage.json> <welt> <ausgabe>   – Lichter aus dem fertigen Gelände, schon in Weltkoordinaten
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dateien, lichterAus } from '../standort.mjs';
import { verschiebeDatapack, verschiebeRegionen } from './verschieben.mjs';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '../..');
export const STANDORT = join(REPO, 'spawn/standort-smp-spark.json');

// Spawn-Konfiguration ohne Lichtung (fester Boden y 66 passt nur zur alten Welt)
// und ohne die Aufräum-Einträge unterhalb der Insel (alte Südlichtung im Testnetz: würden in frischem Gelände Gras über Wasser setzen)
export const ohneLichtung = (k) => ({ ...k, lichtung: undefined, entfernen: (k.entfernen ?? []).filter((e) => Math.min(e.von[1], e.bis[1]) >= k.struktur.ursprung[1]) });

export function vorbereiten(lage, aus) {
  const d = [lage.dx, lage.dy, lage.dz];
  const k = ohneLichtung(JSON.parse(readFileSync(STANDORT, 'utf8')));
  k.datei = 'spawn/standort-smp-spark.json';
  const dp = join(aus, 'datapacks');
  rmSync(dp, { recursive: true, force: true });
  const { funktionen, regionen } = dateien(k);
  const fn = join(dp, 'insel/data/insel/function'), tags = join(dp, 'insel/data/minecraft/tags/function');
  mkdirSync(fn, { recursive: true }); mkdirSync(tags, { recursive: true });
  for (const [n, t] of Object.entries(funktionen)) writeFileSync(join(fn, `${n}.mcfunction`), t);
  writeFileSync(join(fn, 'lichter.mcfunction'), '# Lichter folgen: node spawn/smp-neu/bauen.mjs lichter\n');
  writeFileSync(join(tags, 'tick.json'), '{ "values": ["insel:tick"] }\n');
  writeFileSync(join(tags, 'load.json'), '{ "values": ["insel:load"] }\n');
  writeFileSync(join(dp, 'insel/pack.mcmeta'), JSON.stringify({ pack: { description: 'Spawn-Technik: Rückweg-Plattform, Sättigung, Lichter, Aufbau', min_format: [121, 0], max_format: [121, 0] } }, null, 2) + '\n');
  // erzeugt vom Aufrufer (bauen.sh) in <ausgabe>/roh: insel-deko, insel-kalender; aus dem Repo: weihnachtsinsel, weihnachtsplatten
  for (const p of ['insel-deko', 'insel-kalender']) cpSync(join(aus, 'roh/datapack', p), join(dp, p), { recursive: true });
  for (const p of ['weihnachtsinsel', 'weihnachtsplatten']) cpSync(join(REPO, 'spawn/datapack', p), join(dp, p), { recursive: true });
  const n = ['insel', 'insel-deko', 'insel-kalender', 'weihnachtsinsel'].map((p) => verschiebeDatapack(join(dp, p), d));
  writeFileSync(join(aus, 'regions.yml'), `# Verschoben um ${d.join('/')} (spawn/smp-neu, natürlicher World-Spawn)\n` + verschiebeRegionen(regionen, d));
  const wm = JSON.parse(readFileSync(join(REPO, 'spawn/weihnachtsmann.json'), 'utf8'));
  for (const t of [wm.mannequin, wm.jukebox]) { t.x += lage.dx; t.y += lage.dy; t.z += lage.dz; }
  writeFileSync(join(aus, 'weihnachtsmann.json'), JSON.stringify(wm, null, 2) + '\n');
  const mi = JSON.parse(readFileSync(join(REPO, 'spawn/mission.json'), 'utf8'));
  mi.tafel.x += lage.dx; mi.tafel.y += lage.dy; mi.tafel.z += lage.dz;
  writeFileSync(join(aus, 'mission.json'), JSON.stringify(mi, null, 2) + '\n');
  // für die Plugin-Konfiguration der Server-Session (server/plugin-konfig/versatz.py)
  writeFileSync(join(REPO, 'spawn/smp-versatz.json'), JSON.stringify({ dx: lage.dx, dy: lage.dy, dz: lage.dz }, null, 2) + '\n');
  writeFileSync(join(aus, 'lage.json'), JSON.stringify(lage, null, 2) + '\n');
  return { funktionen: n, versatz: d };
}

export function verschobeneKonfig(lage) {
  const k = JSON.parse(readFileSync(STANDORT, 'utf8'));
  return { ...k, oval: { ...k.oval, x: k.oval.x + lage.dx, z: k.oval.z + lage.dz }, lichter: { ...k.lichter, unterkante: k.lichter.unterkante + lage.dy } };
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('spawn/smp-neu/bauen.mjs')) {
  const [cmd, lageDatei, a, b] = process.argv.slice(2);
  const lage = JSON.parse(readFileSync(lageDatei, 'utf8'));
  if (cmd === 'vorbereiten') console.log(JSON.stringify(vorbereiten(lage, a)));
  else if (cmd === 'lichter') {
    const t = await lichterAus(verschobeneKonfig(lage), a);
    const z = join(b, 'datapacks/insel/data/insel/function/lichter.mcfunction');
    if (!existsSync(dirname(z))) throw new Error(`${z} fehlt – erst vorbereiten`);
    writeFileSync(z, t);
    console.log(`${t.split('\n').length - 2} Lichter → ${z}`);
  } else { console.error('Befehle: vorbereiten, lichter'); process.exit(1); }
}
