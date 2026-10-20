// Baut das Weihnachts-Resourcepack: eigene Pixel-Sprites, aufgehellte Farbkarten,
// Vanilla-Weihnachtstruhen für alle Truhen.
// Aufruf: node tools/texturen.mjs <ordner mit entpackten Vanilla-Client-assets>
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import pngjs from 'pngjs';

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

  for (const karte of ['grass', 'foliage']) {
    const png = PNG.sync.read(readFileSync(mc(`colormap/${karte}.png`)));
    aufhellen(png.data, 0.45);
    schreibePng(ziel(`minecraft/textures/colormap/${karte}.png`), png);
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
