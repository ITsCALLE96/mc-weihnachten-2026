// Winterfassung Paket 3 (Pascal 28.10.): Tiere und Helfer. Ebene 1 (Textur): Mützen, Schals, Rentiernase, Glitzer;
// Ebene 2 (EMF): Zipfelmützen mit Bommel, Rentiergeweihe, Schleifen, Heiligenschein, Zylinder. Kopf-Lage aus den 26.3-Modellklassen.
import { quader, flaechen, seiten, male, rausch, misch, ring, muetze, geschenkband, schneedecke, schneekante, TIERE } from './mobs.mjs';
import { tierschal, TIER_SCHAL } from './winter.mjs';

const ROT = [186, 28, 38], WEISS = [242, 244, 246], GOLD = [236, 196, 64];
const ganz = (p) => [0, 0, p.width, p.height];
// Schnee auf dem Rücken (Oberseite + Kante) statt verstreuter Glitzer-/Schneepixel (Mob-Zoo 28.10.: wirkte wie Störbild).
const schneeAuf = (...qs) => (p) => { for (const q of qs) { schneedecke(p, q, { saat: 600 + q.u + q.v }); schneekante(p, q, { reihen: 1, tropfen: q.h > 8 ? 2 : 1, saat: 601 + q.u + q.v }); } };
const schal = (x, i) => (i === 1 && x % 4 < 2 ? WEISS : ROT);

// Rentiernase auf der Schnauze der Kühe (Schnauze texOffs (1,33) 6×3×1 → Vorderseite (2,34)).
const nase = (p) => male(p, [4, 34, 2, 2], () => [230, 30, 36], { nurDeckend: false });

export const TIERE3 = {
  ...TIERE, // Mützen (Schaf, Huhn, Wolf, Katze, Fuchs) und Schals (Pferd, Esel, Maultier, Lama) aus mobs.mjs
  // Kühe als Rentier (Schal wie bisher + rote Nase), Schweine mit Schal (Schleife kommt per EMF).
  ...Object.fromEntries(['cow/cow_cold', 'cow/cow_temperate', 'cow/cow_warm', 'cow/mooshroom_brown', 'cow/mooshroom_red'].map((n) => [n, (p) => { tierschal(p, TIER_SCHAL.kuh); nase(p); }])),
  ...Object.fromEntries(['pig/pig_cold', 'pig/pig_temperate', 'pig/pig_warm'].map((n) => [n, (p) => tierschal(p, TIER_SCHAL.schwein)])),
  'cat/ocelot': (p) => muetze(p, quader(0, 0, 5, 4, 5), { reihen: 1, saat: 600 }),
  ...Object.fromEntries(['bee', 'bee_angry', 'bee_nectar', 'bee_angry_nectar'].map((n) => [`bee/${n}`, schneeAuf(quader(0, 0, 7, 7, 10))])),
  'axolotl/axolotl_lucy': (p) => muetze(p, quader(0, 1, 8, 5, 5), { reihen: 1, saat: 601 }),
  'axolotl/axolotl_wild': (p) => muetze(p, quader(0, 1, 8, 5, 5), { reihen: 1, saat: 602 }),
  'axolotl/axolotl_gold': (p) => muetze(p, quader(0, 1, 8, 5, 5), { reihen: 1, saat: 603 }),
  'axolotl/axolotl_cyan': (p) => muetze(p, quader(0, 1, 8, 5, 5), { reihen: 1, saat: 604 }),
  'axolotl/axolotl_blue': (p) => muetze(p, quader(0, 1, 8, 5, 5), { reihen: 1, saat: 605 }),
  ...Object.fromEntries(['panda', 'panda_aggressive', 'panda_brown', 'panda_lazy', 'panda_playful', 'panda_weak', 'panda_worried'].map((n, i) => [`panda/${n}`, (p) => ring(p, quader(0, 6, 13, 10, 9), 8, 2, schal, 606 + i)])),
  'bear/polarbear': (p) => ring(p, quader(0, 0, 7, 7, 7), 5, 2, schal, 607),
  'rabbit/rabbit_brown': (p) => muetze(p, quader(0, 16, 5, 5, 5), { reihen: 1, saat: 610 }),
  'rabbit/rabbit_white': (p) => muetze(p, quader(0, 16, 5, 5, 5), { reihen: 1, saat: 611 }),
  'rabbit/rabbit_black': (p) => muetze(p, quader(0, 16, 5, 5, 5), { reihen: 1, saat: 612 }),
  'rabbit/rabbit_gold': (p) => muetze(p, quader(0, 16, 5, 5, 5), { reihen: 1, saat: 613 }),
  'rabbit/rabbit_salt': (p) => muetze(p, quader(0, 16, 5, 5, 5), { reihen: 1, saat: 614 }),
  'rabbit/rabbit_white_splotched': (p) => muetze(p, quader(0, 16, 5, 5, 5), { reihen: 1, saat: 615 }),
  'rabbit/rabbit_caerbannog': (p) => muetze(p, quader(0, 16, 5, 5, 5), { reihen: 1, saat: 616 }),
  'rabbit/rabbit_toast': (p) => muetze(p, quader(0, 16, 5, 5, 5), { reihen: 1, saat: 617 }),
  'fish/cod': schneeAuf(quader(0, 0, 2, 4, 7)),
  'fish/salmon': schneeAuf(quader(0, 0, 3, 5, 8), quader(0, 13, 3, 5, 8)),
  'fish/pufferfish': schneeAuf(quader(0, 0, 8, 8, 8)),
  'squid/squid': (p) => muetze(p, quader(0, 0, 12, 16, 12), { reihen: 3, saat: 623 }),
  'squid/glow_squid': (p) => muetze(p, quader(0, 0, 12, 16, 12), { reihen: 3, saat: 624 }),
  'dolphin/dolphin': schneeAuf(quader(22, 0, 8, 7, 13), quader(0, 0, 8, 7, 6)),
  'nautilus/nautilus': schneeAuf(quader(0, 0, 14, 10, 16)),
  'strider/strider': (p) => muetze(p, quader(0, 0, 16, 14, 16), { reihen: 2, saat: 627 }),
  'strider/strider_cold': (p) => muetze(p, quader(0, 0, 16, 14, 16), { reihen: 2, saat: 628 }),
  'sniffer/sniffer': schneeAuf(quader(62, 0, 25, 24, 40)),
  'goat/goat': schneeAuf(quader(1, 1, 9, 11, 16)),
  'camel/camel': schneeAuf(quader(0, 25, 15, 12, 27), quader(74, 0, 9, 5, 11), quader(60, 24, 7, 8, 19)),
  'camel/camel_husk': schneeAuf(quader(0, 25, 15, 12, 27), quader(74, 0, 9, 5, 11), quader(60, 24, 7, 8, 19)),
  'allay/allay': (p) => male(p, [0, 10, 10, 12], (i, j, alt) => misch(alt.slice(0, 3), WEISS, 0.4)), // helles Engelsgewand
  // Eisengolem als Weihnachtsmann: rote Weste mit Pelzsaum und Gürtel auf dem Oberkörper, Eisen bleibt an Kopf und Gliedern.
  'iron_golem/iron_golem': (p) => {
    const k = quader(0, 40, 18, 12, 11);
    male(p, seiten(k), (i, j, alt, r) => (j >= 10 ? rausch(WEISS, r, 6) : j === 7 ? (i % 29 >= 19 && i % 29 <= 21 ? GOLD : [32, 26, 24]) : rausch(ROT, r, 10)), { saat: 640 });
    male(p, flaechen(k).oben, (i, j, alt, r) => rausch(WEISS, r, 6), { saat: 641 });
  },
  'snow_golem/snow_golem': (p) => male(p, [0, 16, 40, 10], (i, j) => (j < 2 ? (j && i % 4 < 2 ? WEISS : ROT) : null)), // Schal am Oberkörper
  'ghast/happy_ghast': (p) => geschenkband(p, quader(0, 0, 16, 16, 16), 650),
};

// EMF (Teilnamen nach OptiFine). Pivot = absolute Lage des Kopf- bzw. Körperteils; Hut sitzt mittig auf (cx, cz) mit Oberkante y.
const verschiebe = (liste, dx, dz) => liste.map(([[x, y, z], m, f]) => [[x + dx, y, z + dz], m, f]);
const zipfel = (b, y, cx = 0, cz = 0, rot = 'rot', weiss = 'weiss') => verschiebe([
  [[-b / 2 - 0.4, y - 1, -b / 2 - 0.4], [b + 0.8, 1.2, b + 0.8], weiss], [[-b / 2 + 0.2, y - 2.6, -b / 2 + 0.4], [b - 0.4, 1.6, b - 0.4], rot],
  [[-b * 0.35, y - 4, -b * 0.15], [b * 0.7, 1.4, b * 0.7], rot], [[-b * 0.2, y - 5.2, b * 0.05], [b * 0.4, 1.2, b * 0.4], rot],
  [[-Math.max(0.8, b * 0.2), y - 6.8, b * 0.15], [Math.max(1.6, b * 0.4), Math.max(1.6, b * 0.4), Math.max(1.6, b * 0.4)], weiss]], cx, cz);
const geweih = (x, y, cz, g = 1) => [-1, 1].flatMap((s) => [[[s * x - 0.5 * g, y - 4 * g, cz], [g, 4 * g, g], 'braun'], [[s > 0 ? x : -x - 3 * g, y - 4 * g, cz], [3 * g, g, g], 'braun'],
  [[s * (x + 2.5 * g) - 0.5 * g, y - 7 * g, cz], [g, 3 * g, g], 'braun'], [[s * (x + 1.2 * g) - 0.5 * g, y - 6.5 * g, cz], [g, 2.5 * g, g], 'braun']]);
const schleife = (y, cx = 0, cz = 0, g = 1) => verschiebe([[[-g, y - 1.5 * g, -g], [2 * g, 1.5 * g, 2 * g], 'gold'], [[-4.5 * g, y - 2.5 * g, -g], [3.5 * g, 2.5 * g, 2 * g], 'rot'], [[g, y - 2.5 * g, -g], [3.5 * g, 2.5 * g, 2 * g], 'rot']], cx, cz);
const ring_ = (b, y, cz = 0) => verschiebe([[[-b / 2, y, -b / 2], [b, 0.6, 0.8], 'gold'], [[-b / 2, y, b / 2 - 0.8], [b, 0.6, 0.8], 'gold'], [[-b / 2, y, -b / 2], [0.8, 0.6, b], 'gold'], [[b / 2 - 0.8, y, -b / 2], [0.8, 0.6, b], 'gold']], 0, cz);
const rentier = (pivot, x, top, cz, nase) => ({ head: { pivot, quader: [...geweih(x, top, cz), [nase[0], [2, 2, 1], 'nase']] } });
const hut = (pivot, b, y, cx = 0, cz = 0, teil = 'head') => ({ [teil]: { pivot, quader: zipfel(b, y, cx, cz) } });

export const TIERE3_EMF = {
  ...Object.fromEntries(['cow', 'cold_cow', 'warm_cow', 'mooshroom'].map((n) => [n, rentier([0, 4, -8], 2, -4, -3, [[-1, 1, -7.8]])])),
  ...Object.fromEntries(['pig', 'cold_pig', 'warm_pig'].map((n) => [n, { head: { pivot: [0, 12, -6], quader: schleife(-4, 0, -4) } }])),
  sheep: hut([0, 6, -8], 6, -4.8, 0, -2),
  chicken: hut([0, 15, -4], 4, -6, 0, -0.5),
  wolf: hut([-1, 13.5, -7], 6, -3, 1, 0),
  cat: hut([0, 15, -9], 5, -2, 0, -0.5),
  ocelot: hut([0, 15, -9], 5, -2, 0, -0.5),
  fox: hut([-1, 16.5, -3], 7, -2, 1, -2),
  ...Object.fromEntries(['horse', 'donkey', 'mule', 'skeleton_horse', 'zombie_horse'].map((n) => [n, { head: { pivot: [0, 4, -12], quader: geweih(2, -11, 1.5) } }])),
  ...Object.fromEntries(['llama', 'trader_llama'].map((n) => [n, { head: { pivot: [0, 7, -6], quader: geweih(2.5, -16, -3.5) } }])),
  bee: hut([0, 19, 0], 3, -4, 0, -3.5, 'body'),
  axolotl: hut([0, 19.5, -4], 5, -3, 0, -2.5),
  frog: hut([0, 20, 3], 5, -2, 0, -2.5),
  turtle: hut([0, 19, -10], 5, -1, 0, 0),
  panda: hut([0, 11.5, -17], 9, -5, 0, 0.5),
  polar_bear: hut([0, 10, -16], 7, -3, 0, 0.5),
  armadillo: hut([0, 19, -7], 3, -1, 0, 0),
  camel: hut([0, 1, -10], 7, -21, 0, -11.5),
  parrot: hut([0, 15.69, -2.76], 2, -1.5, 0, 0),
  bat: hut([0, 17, 0], 3, -3, 0, 0),
  rabbit: hut([0, 17.7, -4.1], 4, -3, 0, -1.5),
  squid: hut([0, 8, 0], 12, -8, 0, 0, 'body'),
  glow_squid: hut([0, 8, 0], 12, -8, 0, 0, 'body'),
  dolphin: hut([0, 18, -8], 6, -3, 0, 0),
  strider: hut([0, 1, 0], 12, -6, 0, 0, 'body'),
  allay: { head: { pivot: [0, 19.5, 0], quader: ring_(5, -6.5) } },
  iron_golem: hut([0, -7, -2], 8, -12, 0, -1.5),
  copper_golem: { head: { pivot: [0, -11, 0], quader: zipfel(8, -5, 0, 0, 'gruen', 'rot') } },
  snow_golem: { head: { pivot: [0, 4, 0], quader: [[[-5, -9, -5], [10, 1, 10], 'dunkel'], [[-3.5, -14, -3.5], [7, 5, 7], 'dunkel'], [[-3.6, -10.5, -3.6], [7.2, 1.2, 7.2], 'rot']] } },
  happy_ghast: { body: { pivot: [0, 16, 0], quader: schleife(-8, 0, 0, 2) } },
};
