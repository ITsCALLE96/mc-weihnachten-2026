// Winterfassung Paket 4 (Pascal 28.10.): Dorfbewohner je Beruf mit eigenem Weihnachts-Outfit (zusätzlich zu Mütze und Schal
// aus winter.mjs), Zombie-Dorfbewohner als böse, zerlumpte Fassung. Gemalt wird nur auf deckende Pixel der Berufs-Ebene,
// damit Schürze, Hut und Werkzeug-Umriss des Berufs erkennbar bleiben. Layout: Kopf (0,0) 8×10×8, Rumpf (16,20) 8×12×6,
// Gewand (0,38) 8×20×6, Arme (44,22)/(40,38), Beine (0,22).
import { quader, flaechen, seiten, male, setze, rausch, misch, hell, muetze, ring, zerfetzterSchal, kruste } from './mobs.mjs';

const ROT = [186, 28, 38], WEISS = [242, 244, 246], GOLD = [236, 196, 64], GRUEN = [44, 120, 56], DUNKELGRUEN = [24, 70, 34];
const LEBKUCHEN = [150, 88, 44], CREME = [242, 224, 186];
const RUMPF = quader(16, 20, 8, 12, 6), GEWAND = quader(0, 38, 8, 20, 6), ARME = [quader(44, 22, 4, 8, 4), quader(40, 38, 8, 4, 4)], BEINE = quader(0, 22, 4, 12, 4);
const KLEIDUNG = [RUMPF, GEWAND, ...ARME, BEINE];
const auf = (p, fn, saat) => { for (const q of KLEIDUNG) male(p, seiten(q), fn, { saat: saat + q.u + q.v }); };

// Muster (i, j = Position im Seitenband; alt = Originalpixel)
const pullover = (grund, muster, punkte = WEISS) => (i, j, alt, r) => {
  if (j % 6 === 2) return (i + Math.floor(j / 6)) % 4 < 2 ? muster : grund; // Zickzack-Band
  if (j % 6 === 4 && i % 4 === 1) return punkte;                              // Schneeflocken-Punkte
  return rausch(grund, r, 10);
};
const streuen = (farben, dichte) => (i, j, alt, r) => (r() < dichte ? farben[Math.floor(r() * farben.length)] : null);
const abtoenen = (ziel, t) => (i, j, alt) => misch(alt.slice(0, 3), ziel, t);

// Wunschzettel-Rolle vorne auf dem Gewand (Bibliothekar).
function wunschzettel(p) {
  const [vx, vy] = flaechen(GEWAND).vorne;
  for (let j = 2; j < 14; j++) for (let i = 1; i < 7; i++) setze(p, vx + i, vy + j, j === 2 || j === 13 ? [200, 180, 140] : (j % 2 && i > 1 && i < 6) ? [60, 60, 90] : CREME);
  for (const i of [1, 6]) for (const j of [2, 13]) setze(p, vx + i, vy + j, ROT); // Siegelband an den Enden
}
// Lebkuchen-Kekse mit Zuckerguss auf der Schürze (Bäcker).
function kekse(p, saat) {
  male(p, seiten(GEWAND), (i, j, alt, r) => ((i % 5 === 1 && j % 5 === 2) ? WEISS : (i % 5 < 3 && j % 5 > 0 && j % 5 < 4) ? LEBKUCHEN : null), { saat });
}

export const BERUFE = {
  armorer: (p) => { auf(p, abtoenen([60, 40, 30], 0.3), 700); ring(p, GEWAND, 0, 1, () => ROT, 701); auf(p, (i, j) => (j === 6 && i % 4 === 0 ? GOLD : null), 702); },
  butcher: (p) => { kekse(p, 710); ring(p, GEWAND, 0, 1, () => ROT, 711); }, // Plätzchen-Bäcker
  cartographer: (p) => auf(p, streuen([GOLD, [255, 240, 160]], 0.1), 720), // Sternenkarte
  cleric: (p) => { auf(p, (i, j, alt, r) => (j < 2 ? ROT : rausch(WEISS, r, 8)), 730); auf(p, (i, j) => (i % 6 === 2 ? GOLD : null), 731); }, // Chorgewand
  farmer: (p) => auf(p, (i, j) => ((Math.floor(i / 2) + Math.floor(j / 2)) % 2 ? GRUEN : ROT), 740), // Wichtel-Karo
  fisherman: (p) => auf(p, streuen([WEISS, [196, 232, 248]], 0.18), 750), // vereist
  fletcher: (p) => auf(p, (i, j) => (Math.floor((i + j) / 2) % 2 ? ROT : WEISS), 760), // Zuckerstange
  leatherworker: (p) => { auf(p, abtoenen([110, 70, 40], 0.3), 770); auf(p, (i, j) => (j % 4 === 1 && i % 3 === 0 ? GOLD : null), 771); }, // Schellen
  librarian: (p) => { auf(p, abtoenen(DUNKELGRUEN, 0.35), 780); wunschzettel(p); },
  mason: (p) => auf(p, (i, j) => (j % 3 === 0 || (i + (Math.floor(j / 3) % 2) * 2) % 4 === 0 ? WEISS : LEBKUCHEN), 790), // Lebkuchenhaus
  nitwit: (p) => auf(p, pullover(GRUEN, ROT), 800),   // hässlicher Weihnachtspulli
  shepherd: (p) => auf(p, pullover(ROT, WEISS, GOLD), 810),
  toolsmith: (p) => { auf(p, abtoenen(GRUEN, 0.4), 820); ring(p, GEWAND, 0, 1, () => GOLD, 821); },
  weaponsmith: (p) => { auf(p, abtoenen([120, 20, 26], 0.4), 830); ring(p, GEWAND, 0, 1, () => GOLD, 831); },
};

// Zombie-Dorfbewohner: zerfetzte Mütze in der Hut-Ebene, zerrissener Schal, Reif; Berufs-Outfit verdreckt.
export function zombieDorf(p, saat) {
  muetze(p, quader(32, 0, 8, 10, 8), { reihen: 3, zerfetzt: true, saat });
  ring(p, RUMPF, 0, 2, zerfetzterSchal, saat + 1);
  kruste(p, seiten(GEWAND), 0.08, saat + 2);
}
export const ZOMBIE_BERUFE = Object.fromEntries(Object.entries(BERUFE).map(([b, fn], k) => [b, (p) => {
  fn(p);
  male(p, [0, 0, p.width, p.height], (i, j, alt, r) => (r() < 0.18 && alt[3] ? misch(alt.slice(0, 3), [60, 70, 40], 0.5) : null), { saat: 900 + k }); // Dreck
  // Berufshut weg (Krempe), stattdessen auch hier die zerfetzte Mütze
  for (let y = 47; y < 64; y++) for (let x = 30; x < 64; x++) setze(p, x, y, [0, 0, 0], 0);
  muetze(p, quader(32, 0, 8, 10, 8), { reihen: 3, zerfetzt: true, saat: 950 + k });
}]));

// EMF: Zipfel mit Bommel über der Mütze (Kopf 8×10×8, Oberkante y −10) für Dorfbewohner und Wanderhändler.
const zipfelOben = [[[-3, -12, -2.6], [6, 2, 6], 'rot'], [[-2, -14, -1], [4, 2, 4], 'rot'], [[-1.2, -15.5, 0.8], [2.4, 1.5, 2.4], 'rot'], [[-1.6, -18, 1.6], [3.2, 2.6, 3.2], 'weiss']];
export const DORF_EMF = {
  villager: { head: { pivot: [0, 0, 0], quader: zipfelOben } },
  wandering_trader: { head: { pivot: [0, 0, 0], quader: zipfelOben } },
};
