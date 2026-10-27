// Baut das Weihnachts-Resourcepack: eigene Pixel-Sprites, Vanilla-Weihnachtstruhen für alle Truhen,
// Wanderhändler als Weihnachtsmann samt Lama-Decken. Der Winterteil (Reif, blasse Farbkarten,
// Mützen und Schals) landet getrennt in resourcepack-winter/, siehe tools/winter.mjs.
// Aufruf: node tools/texturen.mjs <ordner mit entpackten Vanilla-Client-assets>
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import pngjs from 'pngjs';
import { DEKO, palette as dekoPalette, modell as dekoModell } from './deko.mjs';
import { frostOben, frostSeite, winterFarbkarte, weihnachtsmuetze, weihnachtsschal, tierschal, TIER_SCHAL } from './winter.mjs';

const { PNG } = pngjs;

export function sprite(zeilen, palette, breite = 16) {
  const png = new PNG({ width: breite, height: zeilen.length });
  zeilen.forEach((zeile, y) => {
    if (zeile.length !== breite) throw new Error(`Zeile ${y} hat ${zeile.length} statt ${breite} Zeichen`);
    [...zeile].forEach((zeichen, x) => {
      const i = (y * breite + x) * 4;
      if (zeichen === '.') return png.data.fill(0, i, i + 4);
      const farbe = palette[zeichen];
      if (!farbe) throw new Error(`Unbekannte Farbe ${zeichen} in Zeile ${y}`);
      png.data.set([...farbe, 255], i);
    });
  });
  return png;
}

// Mischt jede Farbe um `anteil` Richtung Weiß (für verschneite Gras-/Laubfarben).
export function aufhellen(daten, anteil) {
  for (let i = 0; i < daten.length; i += 4) {
    for (let k = 0; k < 3; k++) daten[i + k] = Math.round(daten[i + k] + (255 - daten[i + k]) * anteil);
  }
}

export function hsv([r, g, b]) {
  const max = Math.max(r, g, b) / 255, min = Math.min(r, g, b) / 255, d = max - min;
  let h = 0;
  if (d) {
    if (max === r / 255) h = 60 * (((g - b) / 255 / d) % 6);
    else if (max === g / 255) h = 60 * ((b - r) / 255 / d + 2);
    else h = 60 * ((r - g) / 255 / d + 4);
  }
  return [(h + 360) % 360, max ? d / max : 0, max];
}

export function rgb([h, s, v]) {
  const f = (n) => { const k = (n + h / 60) % 6; return Math.round(255 * (v - v * s * Math.max(0, Math.min(k, 4 - k, 1)))); };
  return [f(5), f(3), f(1)];
}

// Färbt jedes Pixel nach der ersten passenden Regel um ({ wenn: (h, s, v) => bool, dann: (h, s, v) => [r, g, b] }).
export function umfaerben(daten, regeln) {
  for (let i = 0; i < daten.length; i += 4) {
    if (!daten[i + 3]) continue;
    const [h, s, v] = hsv(daten.subarray(i, i + 3));
    const regel = regeln.find((r) => r.wenn(h, s, v));
    if (regel) daten.set(regel.dann(h, s, v), i);
  }
}

const hell = (v) => Math.min(1, v);
const fell = (v) => { const w = Math.round(200 + 50 * v); return [w, w, w]; }; // weißer Pelz mit leichter Schattierung
const blau = (h, s) => h > 200 && h < 235 && s > 0.3;
const gold = (h, s) => h >= 25 && h <= 50 && s > 0.7;

// Wanderhändler als Weihnachtsmann: Kapuze und Mantel rot, Goldborten weißer Pelz, Schal wird weißer Bart.
const WEIHNACHTSMANN = [
  { wenn: blau, dann: (h, s, v) => rgb([358, 0.82, hell(v * 1.5)]) },
  { wenn: (h, s) => h > 80 && h < 110 && s > 0.3, dann: (h, s, v) => rgb([356, 0.85, hell(v * 2)]) },
  { wenn: gold, dann: (h, s, v) => fell(v) },
  { wenn: (h, s) => (h < 12 || h > 350) && s > 0.9, dann: (h, s, v) => fell(0.6 + v / 2) },
];

// Decke der Händler-Lamas: rot mit weißen Borten, die dunkelroten Streifen werden tannengrün.
const LAMA_DECKE = [
  { wenn: blau, dann: (h, s, v) => rgb([358, 0.82, hell(v * 1.5)]) },
  { wenn: gold, dann: (h, s, v) => fell(v) },
  { wenn: (h, s) => (h < 12 || h > 350) && s > 0.9, dann: (h, s, v) => rgb([135, 0.75, hell(v * 1.1)]) },
];

function vergroessern(png, faktor) {
  const gross = new PNG({ width: png.width * faktor, height: png.height * faktor });
  for (let y = 0; y < gross.height; y++) {
    for (let x = 0; x < gross.width; x++) {
      const q = ((Math.floor(y / faktor) * png.width) + Math.floor(x / faktor)) * 4;
      gross.data.set(png.data.subarray(q, q + 4), (y * gross.width + x) * 4);
    }
  }
  return gross;
}

const ROT = [200, 32, 42];
const WEISS = [244, 244, 244];

const SPRITES = {
  lebkuchen: {
    palette: { b: [160, 101, 45], d: [107, 62, 26], w: WEISS, r: ROT },
    zeilen: [
      '................',
      '......dddd......',
      '.....dbbbbd.....',
      '.....bwbbwb.....',
      '.....bbbbbb.....',
      '.....dbwwbd.....',
      '..dddbbbbbbddd..',
      '.dbbwbbrrbbwbbd.',
      '.dbbbbbbbbbbbbd.',
      '......bbbb......',
      '.....bbrrbb.....',
      '.....bbbbbb.....',
      '....bbb..bbb....',
      '....bwb..bwb....',
      '...bbb....bbb...',
      '................',
    ],
  },
  lichterkette: {
    palette: { g: [46, 74, 42], r: ROT, y: [245, 211, 58], b: [58, 123, 245], l: [58, 200, 90] },
    zeilen: [
      '................',
      '................',
      '................',
      'gg............gg',
      '..g..........g..',
      '..rgg......ggb..',
      '..r..gggggg..b..',
      '.....y.ll.y.....',
      '.....y.ll.y.....',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  weihnachtsmuetze: {
    palette: { r: ROT, w: WEISS },
    zeilen: [
      '................',
      '...........ww...',
      '..........wwww..',
      '.........rrww...',
      '........rrr.....',
      '.......rrrr.....',
      '......rrrrr.....',
      '.....rrrrrr.....',
      '....rrrrrrrr....',
      '...rrrrrrrrrr...',
      '..rrrrrrrrrrrr..',
      '.wwwwwwwwwwwwww.',
      '.wwwwwwwwwwwwww.',
      '................',
      '................',
      '................',
    ],
  },
};

// Helm-Schicht (64×32, Kopf-Layout wie Lederkappe): oben rot, Seiten oben rot mit weißer Krempe.
function muetzeAusruestung() {
  const png = new PNG({ width: 64, height: 32 });
  png.data.fill(0);
  const setze = (x0, y0, x1, y1, farbe) => {
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) png.data.set([...farbe, 255], (y * 64 + x) * 4);
  };
  setze(8, 0, 16, 8, ROT); // oben
  for (const x0 of [0, 8, 16, 24]) { // rechts, vorne, links, hinten
    setze(x0, 8, x0 + 8, 11, ROT);
    setze(x0, 11, x0 + 8, 13, WEISS);
  }
  return png;
}

// Winterteil als eigener Ordner: winter_assets.py legt ihn ins Pflicht-Pack (rp mit Winter)
// oder lässt ihn weg (Variante ohne Winter nach der Saison). Reif und blasse Farbkarten nur mit REIF=1:
// zurückgehalten, bis klar ist, wie die echten Winter-Biome per Datapack aussehen (Leitung 27.10.).
function baueWinter(wrp, mc, modell, reif) {
  const ziel = (pfad) => join(wrp, 'assets', pfad);
  const lies = (pfad) => PNG.sync.read(readFileSync(mc(pfad)));
  rmSync(wrp, { recursive: true, force: true });
  schreibeJson(ziel('weihnachten/winter.json'), { winter: true, reif });
  if (reif) baueReif(ziel, lies, modell);

  const dorf = 'entity/villager';
  const berufe = ['armorer', 'butcher', 'cartographer', 'cleric', 'farmer', 'fisherman', 'fletcher', 'leatherworker',
    'librarian', 'mason', 'nitwit', 'shepherd', 'toolsmith', 'weaponsmith'];
  const typen = ['desert', 'jungle', 'plains', 'savanna', 'snow', 'swamp', 'taiga'];
  for (const datei of ['villager', ...typen.map((t) => `type/${t}`), ...berufe.map((b) => `profession/${b}`)]) {
    const png = lies(`${dorf}/${datei}.png`);
    if (datei !== 'villager') weihnachtsmuetze(png);
    weihnachtsschal(png);
    schreibePng(ziel(`minecraft/textures/${dorf}/${datei}.png`), png);
  }

  for (const [art, varianten] of [['kuh', ['cow/cow_cold', 'cow/cow_temperate', 'cow/cow_warm', 'cow/mooshroom_brown', 'cow/mooshroom_red']],
    ['schwein', ['pig/pig_cold', 'pig/pig_temperate', 'pig/pig_warm']]]) {
    for (const v of varianten) {
      const png = lies(`entity/${v}.png`);
      tierschal(png, TIER_SCHAL[art]);
      schreibePng(ziel(`minecraft/textures/entity/${v}.png`), png);
    }
  }
}

function baueReif(ziel, lies, modell) {
  schreibePng(ziel('weihnachten/textures/block/frost_oben.png'), frostOben());
  schreibePng(ziel('weihnachten/textures/block/frost_seite.png'), frostSeite());
  schreibePng(ziel('weihnachten/textures/block/frost_laub.png'), frostOben(0.22, 3));

  // Reif als ungefärbte Zusatzfläche über den Vanilla-Flächen (wie die Seiten-Overlays beim Gras).
  const frost = (seiten, textur) => ({
    from: [0, 0, 0], to: [16, 16, 16],
    faces: Object.fromEntries(seiten.map((s) => [s, { uv: [0, 0, 16, 16], texture: textur, cullface: s }])),
  });
  const gras = modell('grass_block.json');
  gras.textures.frost = 'weihnachten:block/frost_oben';
  gras.textures.frost_seite = 'weihnachten:block/frost_seite';
  gras.elements.push(frost(['up'], '#frost'), frost(['north', 'south', 'west', 'east'], '#frost_seite'));
  schreibeJson(ziel('minecraft/models/block/grass_block.json'), gras);
  const laub = modell('leaves.json');
  laub.textures.frost = 'weihnachten:block/frost_laub';
  laub.elements.push(frost(['up'], '#frost'));
  schreibeJson(ziel('minecraft/models/block/leaves.json'), laub);

  for (const karte of ['grass', 'foliage', 'dry_foliage']) {
    const png = lies(`colormap/${karte}.png`);
    winterFarbkarte(png.data);
    schreibePng(ziel(`minecraft/textures/colormap/${karte}.png`), png);
  }
}

function schreibePng(datei, png) {
  mkdirSync(dirname(datei), { recursive: true });
  writeFileSync(datei, PNG.sync.write(png));
}

function schreibeJson(datei, json) {
  mkdirSync(dirname(datei), { recursive: true });
  writeFileSync(datei, JSON.stringify(json, null, 2) + '\n');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const vanilla = process.argv[2];
  if (!vanilla) {
    console.error('Aufruf: node tools/texturen.mjs <ordner mit assets/minecraft aus dem Client>');
    process.exit(2);
  }
  const repo = join(fileURLToPath(import.meta.url), '..', '..');
  const versionen = JSON.parse(readFileSync(join(repo, 'versions.json'), 'utf8'));
  const rp = join(repo, 'resourcepack');
  const mc = (pfad) => join(vanilla, 'assets/minecraft/textures', pfad);
  const ziel = (pfad) => join(rp, 'assets', pfad);

  schreibeJson(join(rp, 'pack.mcmeta'), {
    pack: {
      description: '❄ Weihnachtsprojekt 2026',
      min_format: versionen.resourcepack_format,
      max_format: versionen.resourcepack_format,
    },
  });

  schreibePng(ziel('weihnachten/textures/item/deko_palette.png'), dekoPalette());
  for (const [name, elemente] of Object.entries(DEKO)) {
    schreibeJson(ziel(`weihnachten/models/item/deko/${name}.json`), dekoModell(elemente));
    schreibeJson(ziel(`weihnachten/items/${name}.json`), {
      model: { type: 'minecraft:model', model: `weihnachten:item/deko/${name}` },
    });
  }

  for (const [name, { palette, zeilen }] of Object.entries(SPRITES)) {
    schreibePng(ziel(`weihnachten/textures/item/${name}.png`), sprite(zeilen, palette));
    schreibeJson(ziel(`weihnachten/models/item/${name}.json`), {
      parent: 'minecraft:item/generated',
      textures: { layer0: `weihnachten:item/${name}` },
    });
    schreibeJson(ziel(`weihnachten/items/${name}.json`), {
      model: { type: 'minecraft:model', model: `weihnachten:item/${name}` },
    });
  }
  schreibePng(join(rp, 'pack.png'), vergroessern(sprite(SPRITES.weihnachtsmuetze.zeilen, SPRITES.weihnachtsmuetze.palette), 4));
  schreibePng(ziel('weihnachten/textures/entity/equipment/humanoid/weihnachtsmuetze.png'), muetzeAusruestung());
  schreibeJson(ziel('weihnachten/equipment/weihnachtsmuetze.json'), {
    layers: { humanoid: [{ texture: 'weihnachten:weihnachtsmuetze' }] },
  });

  baueWinter(join(repo, 'resourcepack-winter'), mc, (pfad) => JSON.parse(readFileSync(join(vanilla, 'assets/minecraft/models/block', pfad), 'utf8')), process.env.REIF === '1');

  for (const [quelle, regeln] of [
    ['entity/wandering_trader/wandering_trader.png', WEIHNACHTSMANN],
    ['entity/equipment/llama_body/trader_llama.png', LAMA_DECKE],
    ['entity/equipment/llama_body/trader_llama_baby.png', LAMA_DECKE],
  ]) {
    const png = PNG.sync.read(readFileSync(mc(quelle)));
    umfaerben(png.data, regeln);
    schreibePng(ziel(`minecraft/textures/${quelle}`), png);
  }

  for (const art of ['normal', 'trapped']) {
    for (const seite of ['', '_left', '_right']) {
      const datei = ziel(`minecraft/textures/entity/chest/${art}${seite}.png`);
      mkdirSync(dirname(datei), { recursive: true });
      copyFileSync(mc(`entity/chest/christmas${seite}.png`), datei);
    }
  }
  console.log('Resourcepack gebaut');
}
