// Baut das Questbuch aus datapack/questbuch.json: Advancements, generierte Funktionen,
// Sprachdateien (DE/EN) im Resourcepack und datapack/TEXTE.md.
// Bedingungen der gespiegelten Quests kommen 1:1 aus den Vanilla-Advancements der Server-Jar.
// Aufruf: node tools/questbuch.mjs [server-jar]            → bauen + prüfen
//         node tools/questbuch.mjs --pruefen [server-jar]  → nur prüfen
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { vanillaFortschritte, oeffneJar } from './jar.mjs';

const NS = 'leitfaden';
const LANG_NS = 'weihnachten';

const tr = (key, en, extra = {}) => ({ translate: key, fallback: en, ...extra });
const vanillaListe = (q) => (q.vanilla === undefined ? [] : [q.vanilla].flat());

// Bonus-Erkennung in Kurzform → Advancement-Kriterien
export function baueErkennung(e) {
  if (e === 'info') return { criteria: { info: { trigger: 'minecraft:impossible' } } };
  const spieler = (predicate) => ({ player: { type: 'minecraft:entity_properties', entity: 'this', predicate } });
  const kriterien = {};
  if (e.gleiten) kriterien.gleiten = { trigger: 'minecraft:location', conditions: spieler({ 'minecraft:flags': { is_fall_flying: true } }) };
  for (const block of e.gesetzt ?? []) {
    kriterien[block.split(':')[1]] = { trigger: 'minecraft:placed_block', conditions: { location: { type: 'minecraft:match_block', blocks: block } } };
  }
  for (const item of e.inventar ?? []) {
    kriterien[item.split(':')[1]] = { trigger: 'minecraft:inventory_changed', conditions: { items: [{ items: item }] } };
  }
  for (const [slot, item] of Object.entries(e.tragen ?? {})) {
    kriterien[slot] = { trigger: 'minecraft:location', conditions: spieler({ 'minecraft:equipment': { [slot]: { items: item } } }) };
  }
  if (e.bauwerk) kriterien.bauwerk = { trigger: 'minecraft:location', conditions: spieler({ 'minecraft:location': { structures: e.bauwerk } }) };
  const namen = Object.keys(kriterien);
  if (!namen.length) throw new Error(`unbekannte Erkennung ${JSON.stringify(e)}`);
  return { criteria: kriterien, requirements: [namen] };
}

// Prüft, dass jeder Vanilla-Fortschritt genau einmal gespiegelt ist.
export function pruefeAbdeckung(daten, vanillaIds) {
  const fehler = [];
  const gesehen = new Map();
  for (const k of daten.kapitel) {
    if (k.aktiv === false) continue; // ausgeblendete Kapitel zählen nicht
    for (const q of k.quests) {
      for (const v of vanillaListe(q)) {
        if (!vanillaIds.has(v)) fehler.push(`${k.id}/${q.id}: ${v} gibt es in der Jar nicht`);
        if (gesehen.has(v)) fehler.push(`${v} doppelt: ${gesehen.get(v)} und ${k.id}/${q.id}`);
        gesehen.set(v, `${k.id}/${q.id}`);
      }
    }
  }
  for (const v of vanillaIds) if (!gesehen.has(v)) fehler.push(`${v} fehlt im Questbuch`);
  return fehler;
}

function pruefeStruktur(daten) {
  const fehler = [];
  for (const k of daten.kapitel) {
    const ids = new Set(['start']);
    for (const q of k.quests) {
      if (ids.has(q.id)) fehler.push(`${k.id}/${q.id}: ID doppelt`);
      ids.add(q.id);
      if (!q.vanilla && !q.erkennung) fehler.push(`${k.id}/${q.id}: weder vanilla noch erkennung`);
      if (!q.de?.tun || !q.en?.tun) fehler.push(`${k.id}/${q.id}: Text fehlt (de/en)`);
      if (!q.vanilla && (!q.de.titel || !q.en.titel)) fehler.push(`${k.id}/${q.id}: Bonus braucht Titel (de/en)`);
    }
    for (const q of k.quests) if (!ids.has(q.parent)) fehler.push(`${k.id}/${q.id}: parent ${q.parent} fehlt`);
    if (k.andenken && !ids.has(k.andenken.parent)) fehler.push(`${k.id}/andenken: parent ${k.andenken.parent} fehlt`);
    if (k.andenken && !k.quests.some((q) => q.kern)) fehler.push(`${k.id}: Andenken ohne ★-Quests`);
  }
  return fehler;
}

export function baueQuestbuch(daten, vanilla) {
  const fehler = pruefeStruktur(daten);
  if (fehler.length) throw new Error(fehler.join('\n'));
  const lang = { de: {}, en: {} };
  const setze = (key, de, en) => { lang.de[key] = de; lang.en[key] = en; return key; };
  const advancements = new Map();
  const funktionen = new Map();

  for (const [key, t] of Object.entries(daten.texte ?? {})) setze(key, t.de, t.en);
  const L = {
    brauchst: setze('questbuch.label.brauchst', 'Du brauchst: ', 'You need: '),
    tipp: setze('questbuch.label.tipp', 'Tipp: ', 'Tip: '),
    kern: setze('questbuch.label.kern', '★ zählt fürs Andenken', '★ counts towards the souvenir'),
  };

  const beschreibung = (basis, q, kern) => {
    const teile = [tr(setze(`${basis}.tun`, q.de.tun, q.en.tun), q.en.tun)];
    if (q.de.brauchst) {
      teile.push('\n', tr(L.brauchst, lang.en[L.brauchst], { color: 'gray' }), tr(setze(`${basis}.brauchst`, q.de.brauchst, q.en.brauchst), q.en.brauchst, { color: 'gray' }));
    }
    if (q.de.tipp) {
      teile.push('\n', tr(L.tipp, lang.en[L.tipp], { color: 'gold' }), tr(setze(`${basis}.tipp`, q.de.tipp, q.en.tipp), q.en.tipp, { color: 'gold' }));
    }
    if (kern) teile.push('\n', tr(L.kern, lang.en[L.kern], { color: 'aqua' }));
    return ['', ...teile];
  };
  const icon = (i) => (typeof i === 'string' ? { id: i } : i);

  const aktualisieren = ['# Generiert von tools/questbuch.mjs – nicht von Hand ändern.', '# Läuft einmal je Spieler nach Phasenwechsel, Serverstart oder /reload (lf_stand ≠ #phase).'];
  const abgleich = ['', '# Schon erreichte Vanilla-Fortschritte nachreichen (z. B. Spieler aus dem Testlauf)'];
  const ersteStartKapitel = daten.kapitel.find((k) => k.phase === 1)?.id;

  for (const k of daten.kapitel) {
    // "aktiv": false blendet ein Kapitel aus: kein Reiter, keine Funktionen, keine Texte (Daten bleiben für später)
    if (k.aktiv === false) continue;
    const basis = `questbuch.${k.id}`;
    advancements.set(`${k.id}/start`, {
      criteria: { freigeschaltet: { trigger: 'minecraft:impossible' } },
      display: {
        icon: icon(k.icon),
        title: tr(setze(`${basis}.titel`, k.de.titel, k.en.titel), k.en.titel),
        description: tr(setze(`${basis}.beschreibung`, k.de.beschreibung, k.en.beschreibung), k.en.beschreibung),
        background: k.hintergrund,
        hidden: true,
        show_toast: true,
        announce_to_chat: false,
      },
    });

    const neu = [`# Kapitel ${k.de.titel} freischalten (generiert)`, `advancement grant @s only ${NS}:${k.id}/start`];
    const kern = [];
    for (const q of k.quests) {
      const qb = `${basis}.${q.id}`;
      const adv = { parent: `${NS}:${k.id}/${q.parent}` };
      let titel, frame = 'task', ico = q.icon;
      if (q.vanilla) {
        const [erstes, ...weitere] = vanillaListe(q);
        const v = vanilla.get(erstes);
        if (!v) throw new Error(`Vanilla-Advancement ${erstes} nicht gefunden (${k.id}/${q.id})`);
        for (const w of weitere) {
          if (JSON.stringify(vanilla.get(w)?.criteria) !== JSON.stringify(v.criteria)) throw new Error(`${k.id}/${q.id}: ${w} hat andere Bedingungen als ${erstes}`);
        }
        adv.criteria = v.criteria;
        adv.requirements = v.requirements;
        // Vanilla-Wurzeln heißen wie ihr Bereich („Minecraft“, „Abenteuer“) – dort eigener Titel
        titel = q.de.titel ? tr(setze(`${qb}.titel`, q.de.titel, q.en.titel), q.en.titel) : { translate: v.display.title.translate };
        frame = v.display.frame ?? 'task';
        ico ??= v.display.icon.id;
        const sel = vanillaListe(q).map((id) => `minecraft:${id}=true`).join(',');
        abgleich.push(`execute if entity @s[advancements={${sel}}] run advancement grant @s only ${NS}:${k.id}/${q.id}`);
      } else {
        Object.assign(adv, baueErkennung(q.erkennung));
        titel = tr(setze(`${qb}.titel`, q.de.titel, q.en.titel), q.en.titel);
        if (q.erkennung === 'info') neu.push(`advancement grant @s only ${NS}:${k.id}/${q.id}`);
      }
      adv.display = { icon: icon(ico), title: titel, description: beschreibung(qb, q, q.kern && k.andenken), frame, show_toast: false, announce_to_chat: false };
      if (q.kern && k.andenken) {
        adv.rewards = { function: `${NS}:andenken/${k.id}` };
        kern.push(q.id);
      }
      advancements.set(`${k.id}/${q.id}`, adv);
    }

    if (k.andenken) {
      const a = k.andenken;
      advancements.set(`${k.id}/andenken`, {
        parent: `${NS}:${k.id}/${a.parent}`,
        criteria: { andenken: { trigger: 'minecraft:impossible' } },
        display: {
          icon: icon(a.icon),
          title: tr(setze(`${basis}.andenken.titel`, a.de.titel, a.en.titel), a.en.titel),
          description: beschreibung(`${basis}.andenken`, a, false),
          frame: 'challenge',
          show_toast: true,
          announce_to_chat: true,
        },
        rewards: { function: `${NS}:items/${a.item}` },
      });
      const sel = kern.map((id) => `${NS}:${k.id}/${id}=true`).join(',');
      funktionen.set(`andenken/${k.id}`, [
        `# Andenken ${k.de.titel}: alle ★-Quests geschafft? (generiert, Belohnung über das Advancement)`,
        `execute if entity @s[advancements={${sel}}] run advancement grant @s only ${NS}:${k.id}/andenken`,
      ]);
      abgleich.push(`function ${NS}:andenken/${k.id}`);
    }

    if (k.id === ersteStartKapitel) neu.push(`tellraw @s ${JSON.stringify(tr('questbuch.meldung.start', daten.texte['questbuch.meldung.start'].en, { color: 'aqua' }))}`);
    else if (k.phase > 1) {
      const t = daten.texte['questbuch.meldung.neu'];
      neu.push(`tellraw @s ${JSON.stringify({ ...tr('questbuch.meldung.neu', t.en.replace('%s', k.en.titel), { color: 'aqua' }), with: [tr(`${basis}.titel`, k.en.titel, { bold: true })] })}`);
    }
    funktionen.set(`questbuch/neu/${k.id}`, neu);
    aktualisieren.push(`execute if score #phase lf_phase matches ${k.phase}.. unless entity @s[advancements={${NS}:${k.id}/start=true}] run function ${NS}:questbuch/neu/${k.id}`);
  }
  aktualisieren.push(...abgleich, '', 'scoreboard players operation @s lf_stand = #phase lf_phase');
  funktionen.set('questbuch/aktualisieren', aktualisieren);
  return { advancements, funktionen, lang };
}

// Detail-Seitenleiste (Mod „Quest-Details“, Format v1): je Quest eine Datei assets/leitfaden/questbuch/<kapitel>/<quest>.json
// mit nummerierten Schritten (Text, Item-Symbole, Rezept) und „Wo finde ich das?“. Quelle: datapack/schritte.json.
// `spiel` = { rezepte (ID → Rezeptart), biome, biomTags, itemTags, items? } aus Server- bzw. Client-Jar zum Prüfen der IDs.
export function baueDetails(schritte, daten, spiel) {
  const fehler = [];
  const aus = new Set(daten.kapitel.filter((k) => k.aktiv === false).map((k) => k.id));
  const quests = new Set(daten.kapitel.flatMap((k) => [...k.quests.map((q) => `${k.id}/${q.id}`), ...(k.andenken ? [`${k.id}/andenken`] : [])]));
  const lang = { de: {}, en: {} };
  const dateien = new Map();
  const text = (key, t, wo) => {
    if (!t?.de || !t?.en) fehler.push(`${wo}: Text DE/EN fehlt`);
    lang.de[key] = t?.de; lang.en[key] = t?.en;
    return { translate: key, fallback: t?.en };
  };
  const pruefeId = (id, menge, tags, wo, art) => {
    if (id.startsWith('#') ? !tags.has(id.slice(1)) : !menge.has(id)) fehler.push(`${wo}: ${art} ${id} gibt es nicht`);
  };
  for (const [q, e] of Object.entries(schritte)) {
    if (aus.has(q.split('/')[0])) continue;
    if (!quests.has(q)) { fehler.push(`${q}: Quest gibt es nicht`); continue; }
    const basis = `questbuch.${q.replace('/', '.')}`;
    const datei = { schritte: (e.schritte ?? []).map((s, i) => {
      const wo = `${q} Schritt ${i + 1}`;
      const aus = { text: text(`${basis}.schritt.${i + 1}`, s, wo) };
      if (s.items?.length) {
        for (const it of s.items) {
          if (it.startsWith('#')) pruefeId(it, new Set(), spiel.itemTags, wo, 'Item-Tag');
          else if (spiel.items && !spiel.items.has(it)) fehler.push(`${wo}: ${it} ist kein Item (Block ohne Item?)`);
        }
        aus.items = s.items;
      }
      if (s.rezept) {
        const art = spiel.rezepte.get(s.rezept);
        if (!art) fehler.push(`${wo}: Rezept ${s.rezept} gibt es nicht`);
        else if (OHNE_RASTER.test(art)) fehler.push(`${wo}: Rezept ${s.rezept} ist ein Sonderrezept (${art}) ohne Raster`);
        aus.rezept = s.rezept;
      }
      return aus;
    }) };
    if (!datei.schritte.length) fehler.push(`${q}: keine Schritte`);
    if (e.fundort?.length) {
      datei.fundort = e.fundort.map((o, i) => {
        const wo = `${q} Fundort ${i + 1}`;
        const aus = { text: text(`${basis}.fundort.${i + 1}`, o, wo) };
        if (o.biome?.length) { for (const b of o.biome) pruefeId(b, spiel.biome, spiel.biomTags, wo, 'Biom'); aus.biome = o.biome; }
        if (o.hoehe) {
          const [von, bis] = o.hoehe;
          if (!(von <= bis)) fehler.push(`${wo}: hoehe muss [von, bis] sein`);
          aus.hoehe = { von, bis };
        }
        if (o.dimension) aus.dimension = o.dimension;
        return aus;
      });
    }
    dateien.set(q, datei);
  }
  if (fehler.length) throw new Error(fehler.join('\n'));
  return { dateien, lang };
}

// Rezeptarten ohne Raster in Quest-Details (Auskunft Block-Marker-Session 24.10.). Raster gibt es für
// Werkbank (shaped, shapeless, transmute), Öfen, Lagerfeuer, Steinsäge und smithing_transform.
const OHNE_RASTER = /^minecraft:(crafting_special_|crafting_decorated_pot$|crafting_dye$|crafting_imbue$|smithing_trim$)/;

export function spielDaten(jarPfad, clientJarPfad) {
  const jar = oeffneJar(jarPfad);
  const namen = jar.namen();
  const ids = (prefix) => new Set(namen.filter((n) => n.startsWith(prefix) && n.endsWith('.json')).map((n) => `minecraft:${n.slice(prefix.length, -5)}`));
  return {
    rezepte: new Map([...ids('data/minecraft/recipe/')].map((id) => [id, JSON.parse(jar.lies(`data/minecraft/recipe/${id.slice(10)}.json`)).type])),
    biome: ids('data/minecraft/worldgen/biome/'),
    biomTags: ids('data/minecraft/tags/worldgen/biome/'),
    itemTags: ids('data/minecraft/tags/item/'),
    // Echte Items nur in der Client-Jar (assets/minecraft/items/); ohne Client-Jar entfällt die Prüfung
    items: clientJarPfad && existsSync(clientJarPfad) ? new Set(oeffneJar(clientJarPfad).namen().filter((n) => n.startsWith('assets/minecraft/items/')).map((n) => `minecraft:${n.slice(23, -5)}`)) : undefined,
  };
}

function texteMarkdown(daten, schritte = {}) {
  const z = ['# Questbuch-Texte (zum Gegenlesen)', '', 'Quelle: `datapack/questbuch.json`. Nach Änderungen `node tools/questbuch.mjs` ausführen.', 'Titel gespiegelter Quests sind die Vanilla-Titel (in jeder Spielsprache). ★ zählt fürs Andenken.', ''];
  const zelle = (t) => [t.titel ? `**${t.titel}** ` : '', t.tun, t.brauchst ? `<br>_${t.brauchst}_` : '', t.tipp ? `<br>💡 ${t.tipp}` : ''].join('');
  for (const k of daten.kapitel) {
    z.push(`## ${k.de.titel} / ${k.en.titel} (${k.aktiv === false ? 'ausgeblendet' : `ab Phase ${k.phase}`})`, '', `_${k.de.beschreibung}_ / _${k.en.beschreibung}_`, '', '| Quest | Deutsch | English | Vanilla |', '|---|---|---|---|');
    for (const q of k.quests) z.push(`| ${q.id}${q.kern && k.andenken ? ' ★' : ''} | ${zelle(q.de)} | ${zelle(q.en)} | ${vanillaListe(q).map((v) => `\`${v}\``).join(', ') || (q.erkennung === 'info' ? 'Info' : 'Bonus')} |`);
    if (k.andenken) z.push(`| andenken | ${zelle(k.andenken.de)} | ${zelle(k.andenken.en)} | – |`);
    z.push('');
    const mitSchritten = k.quests.filter((q) => schritte[`${k.id}/${q.id}`]);
    if (mitSchritten.length) {
      z.push(`### Schritte ${k.de.titel} (Seitenleiste)`, '');
      for (const q of mitSchritten) {
        const e = schritte[`${k.id}/${q.id}`];
        z.push(`**${q.id}**`, '');
        e.schritte.forEach((s, i) => z.push(`${i + 1}. ${s.de} · _${s.en}_${s.rezept ? ` · Rezept \`${s.rezept}\`` : ''}`));
        for (const o of e.fundort ?? []) z.push(`- 📍 ${o.de} · _${o.en}_${o.hoehe ? ` · Y ${o.hoehe[0]} bis ${o.hoehe[1]}` : ''}${o.biome ? ` · ${o.biome.join(', ')}` : ''}`);
        z.push('');
      }
    }
  }
  return z.join('\n');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  const nurPruefen = args[0] === '--pruefen';
  const repo = join(fileURLToPath(import.meta.url), '..', '..');
  const jar = args.find((a) => !a.startsWith('--')) ?? join(repo, 'testserver/server/versions/26.3/paper-26.3.jar');
  if (!existsSync(jar)) {
    console.error(`Server-Jar nicht gefunden: ${jar}\nAufruf: node tools/questbuch.mjs [--pruefen] [server-jar]`);
    process.exit(2);
  }
  const vanilla = vanillaFortschritte(jar);
  const daten = JSON.parse(readFileSync(join(repo, 'datapack/questbuch.json'), 'utf8'));
  const fehler = pruefeAbdeckung(daten, new Set(vanilla.keys()));
  if (fehler.length) {
    console.error(`${fehler.length} Fehler:\n- ${fehler.join('\n- ')}`);
    process.exit(1);
  }
  for (const k of daten.kapitel) {
    const v = k.quests.reduce((n, q) => n + vanillaListe(q).length, 0);
    console.log(`${k.id.padEnd(15)} ${k.aktiv === false ? 'aus    ' : `Phase ${k.phase}`}  ${String(v).padStart(3)} Vanilla  ${String(k.quests.filter((q) => !q.vanilla).length).padStart(2)} Bonus`);
  }
  console.log(`Alle ${vanilla.size} Vanilla-Fortschritte aus ${jar.split(/[\\/]/).pop()} genau einmal im Questbuch.`);
  if (nurPruefen) process.exit(0);

  const { advancements, funktionen, lang } = baueQuestbuch(daten, vanilla);
  const schritteDatei = join(repo, 'datapack/schritte.json');
  const details = existsSync(schritteDatei) ? baueDetails(JSON.parse(readFileSync(schritteDatei, 'utf8')), daten, spielDaten(jar, join(process.env.APPDATA ?? '', 'ModrinthApp/meta/versions/26.3-0.20.1/26.3-0.20.1.jar'))) : { dateien: new Map(), lang: { de: {}, en: {} } };
  Object.assign(lang.de, details.lang.de);
  Object.assign(lang.en, details.lang.en);
  const dp = join(repo, 'datapack/leitfaden/data', NS);
  for (const alt of ['advancement', 'function/questbuch', 'function/andenken']) rmSync(join(dp, alt), { recursive: true, force: true });
  const schreibe = (datei, inhalt) => { mkdirSync(dirname(datei), { recursive: true }); writeFileSync(datei, inhalt); };
  for (const [pfad, json] of advancements) schreibe(join(dp, 'advancement', `${pfad}.json`), JSON.stringify(json, null, 2) + '\n');
  for (const [pfad, zeilen] of funktionen) schreibe(join(dp, 'function', `${pfad}.mcfunction`), zeilen.join('\n') + '\n');
  const qd = join(repo, 'resourcepack/assets', NS, 'questbuch');
  rmSync(qd, { recursive: true, force: true });
  for (const [pfad, json] of details.dateien) schreibe(join(qd, `${pfad}.json`), JSON.stringify(json, null, 2) + '\n');
  const sortiert = (o) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)));
  schreibe(join(repo, 'resourcepack/assets', LANG_NS, 'lang/de_de.json'), JSON.stringify(sortiert(lang.de), null, 2) + '\n');
  schreibe(join(repo, 'resourcepack/assets', LANG_NS, 'lang/en_us.json'), JSON.stringify(sortiert(lang.en), null, 2) + '\n');
  schreibe(join(repo, 'datapack/vanilla-26.3.txt'), [...vanilla.keys()].sort().join('\n') + '\n');
  writeFileSync(join(repo, 'datapack/TEXTE.md'), texteMarkdown(daten, existsSync(schritteDatei) ? JSON.parse(readFileSync(schritteDatei, 'utf8')) : {}));
  console.log(`${advancements.size} Advancements, ${funktionen.size} Funktionen, ${Object.keys(lang.de).length} Sprachschlüssel, ${details.dateien.size} Detail-Dateien geschrieben, TEXTE.md aktualisiert`);
}
