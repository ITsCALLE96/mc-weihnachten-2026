// Baut die Leitfaden-Advancements aus datapack/kapitel.json.
// Bedingungen werden aus den Vanilla-Advancements kopiert, Texte kommen aus kapitel.json.
// Aufruf: node tools/leitfaden.mjs <ordner mit vanilla data/minecraft/advancement>
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const NS = 'leitfaden';

export function baueKapitel(kapitel, ladeVanilla) {
  const dateien = new Map();
  dateien.set(`${kapitel.id}/start`, {
    criteria: { freigeschaltet: { trigger: 'minecraft:impossible' } },
    display: {
      icon: { id: kapitel.icon },
      title: kapitel.titel,
      description: kapitel.beschreibung,
      background: 'minecraft:block/snow',
      hidden: true,
      show_toast: true,
      announce_to_chat: false,
    },
  });
  for (const ziel of kapitel.ziele) {
    const v = ladeVanilla(ziel.vanilla);
    if (!v) throw new Error(`Vanilla-Advancement ${ziel.vanilla} nicht gefunden (Ziel ${kapitel.id}/${ziel.id})`);
    dateien.set(`${kapitel.id}/${ziel.id}`, {
      parent: `${NS}:${kapitel.id}/${ziel.parent}`,
      criteria: v.criteria,
      requirements: v.requirements,
      display: {
        icon: { id: ziel.icon },
        title: ziel.titel,
        description: ziel.beschreibung,
        frame: v.display?.frame ?? 'task',
        show_toast: true,
        announce_to_chat: false,
      },
    });
  }
  return dateien;
}

function texteMarkdown(kapitelListe) {
  const zeilen = ['# Leitfaden-Texte (zum Gegenlesen)', '', 'Quelle: `datapack/kapitel.json` — Änderungen dort, dann `node tools/leitfaden.mjs …` neu ausführen.', ''];
  for (const k of kapitelListe) {
    zeilen.push(`## ${k.titel} (ab Phase ${k.phase})`, '', `_${k.beschreibung}_`, '', '| Ziel | Text | Vanilla |', '|---|---|---|');
    for (const z of k.ziele) zeilen.push(`| **${z.titel}** | ${z.beschreibung} | \`${z.vanilla}\` |`);
    zeilen.push('');
  }
  return zeilen.join('\n');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const vanillaDir = process.argv[2];
  if (!vanillaDir) {
    console.error('Aufruf: node tools/leitfaden.mjs <ordner data/minecraft/advancement>');
    process.exit(2);
  }
  const repo = join(fileURLToPath(import.meta.url), '..', '..');
  const { kapitel } = JSON.parse(readFileSync(join(repo, 'datapack/kapitel.json'), 'utf8'));
  const laden = (id) => {
    const p = join(vanillaDir, `${id}.json`);
    return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : undefined;
  };
  const ziel = join(repo, 'datapack/leitfaden/data', NS, 'advancement');
  rmSync(ziel, { recursive: true, force: true });
  let anzahl = 0;
  for (const k of kapitel) {
    for (const [pfad, json] of baueKapitel(k, laden)) {
      const datei = join(ziel, `${pfad}.json`);
      mkdirSync(dirname(datei), { recursive: true });
      writeFileSync(datei, JSON.stringify(json, null, 2) + '\n');
      anzahl++;
    }
  }
  writeFileSync(join(repo, 'datapack/TEXTE.md'), texteMarkdown(kapitel));
  console.log(`${anzahl} Advancements geschrieben, TEXTE.md aktualisiert`);
}
