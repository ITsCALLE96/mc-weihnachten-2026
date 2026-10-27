// Weihnachtsdeko als 3D-Item-Modelle (Quader auf einer Farbpaletten-Textur), vom Server als item_display
// mit Komponente item_model="weihnachten:<id>" platziert. Keine fremden Modelle, alles hier beschrieben.
import pngjs from 'pngjs';

const { PNG } = pngjs;

// Ein Pixel je Farbe; die Fläche eines Quaders greift genau dieses Pixel ab.
export const FARBEN = {
  rot: [196, 30, 42], rot_dunkel: [130, 16, 26], gruen: [32, 120, 56], gruen_dunkel: [18, 70, 36],
  blau: [36, 82, 186], lila: [118, 52, 160], gold: [232, 182, 46], gold_dunkel: [176, 124, 24],
  silber: [200, 206, 214], weiss: [244, 246, 248], schwarz: [28, 28, 32], orange: [236, 120, 28],
  braun: [112, 72, 40], braun_hell: [160, 112, 70], gelb: [255, 226, 90], tuerkis: [60, 200, 200],
  eisblau: [186, 222, 240], creme: [242, 224, 186], schoko: [78, 46, 26], karamell: [196, 128, 48],
  apfelrot: [160, 26, 30], grau: [120, 124, 130], rosa: [236, 150, 170], wolle_rot: [176, 36, 44],
};
const NAMEN = Object.keys(FARBEN);

export function palette() {
  const png = new PNG({ width: 16, height: 16 });
  png.data.fill(0);
  NAMEN.forEach((n, i) => png.data.set([...FARBEN[n], 255], i * 4)); // Zeile für Zeile, 16 je Reihe
  return png;
}

const uv = (farbe) => { const i = NAMEN.indexOf(farbe); if (i < 0) throw new Error(`Farbe ${farbe}`); return [i % 16, Math.floor(i / 16), i % 16 + 1, Math.floor(i / 16) + 1]; };

// Quader von [x,y,z] bis [x,y,z] in einer Farbe; optional Drehung und Leuchten.
export function quader(von, bis, farbe, extra = {}) {
  const f = { uv: uv(farbe), texture: '#p' };
  return { from: von, to: bis, faces: Object.fromEntries(['north', 'south', 'east', 'west', 'up', 'down'].map((s) => [s, f])), ...extra };
}
const leuchtend = (von, bis, farbe, dreh) => quader(von, bis, farbe, {
  light_emission: 15, ...(dreh ? { rotation: { angle: dreh, axis: 'z', origin: [(von[0] + bis[0]) / 2, (von[1] + bis[1]) / 2, (von[2] + bis[2]) / 2] } } : {}),
});

function geschenk(papier, band) {
  return [
    quader([2, 0, 2], [14, 10, 14], papier),
    quader([1.5, 9, 1.5], [14.5, 12, 14.5], papier), // Deckel
    quader([7, 0, 1.9], [9, 12.1, 14.1], band), quader([1.9, 0, 7], [14.1, 12.1, 9], band), // Bänder
    quader([4, 12, 7], [7, 14.5, 9], band), quader([9, 12, 7], [12, 14.5, 9], band), // Schleife
    quader([7, 12, 6], [9, 14, 10], band),
  ];
}

// Kugelmitte = Modellmitte (8, 8, 8), damit item_display sie um ihren Mittelpunkt skaliert.
function kugel(farbe, streifen) {
  return [
    quader([5, 5, 5], [11, 11, 11], farbe),
    quader([4, 6, 6], [12, 10, 10], farbe), quader([6, 6, 4], [10, 10, 12], farbe),
    quader([6, 4, 6], [10, 12, 10], farbe),
    quader([4.9, 7.5, 4.9], [11.1, 8.5, 11.1], streifen),
    quader([7, 12, 7], [9, 13, 9], 'gold_dunkel'), // Kappe
    quader([7.5, 13, 7.75], [8.5, 15, 8.25], 'silber'), // Haken
  ];
}

// Einzelne Lichterkettenbirne, Mitte = Modellmitte, zum Verteilen in kleiner Größe.
function birne(farbe) {
  return [leuchtend([6, 4, 6], [10, 10, 10], farbe), quader([6.5, 10, 6.5], [9.5, 12, 9.5], 'gruen_dunkel')];
}

function stern() {
  const zacke = (dreh) => [
    leuchtend([7, 1, 7], [9, 15, 9], 'gelb'),
    leuchtend([1, 7, 7], [15, 9, 9], 'gelb'),
  ].map((q) => ({ ...q, rotation: { angle: dreh, axis: 'z', origin: [8, 8, 8] } }));
  return [leuchtend([5, 5, 6.5], [11, 11, 9.5], 'gold'), ...zacke(0), ...zacke(45)];
}

function lichterkette() {
  const birnen = ['rot', 'gelb', 'blau', 'gruen', 'tuerkis'];
  return [
    quader([0, 9, 7.5], [16, 10, 8.5], 'gruen_dunkel'),
    ...[1, 4.5, 8, 11.5, 14].flatMap((x, i) => [
      quader([x - 0.5, 8, 7.25], [x + 0.5, 9, 8.75], 'gruen_dunkel'),
      leuchtend([x - 1, 5, 7], [x + 1, 8, 9], birnen[i]),
    ]),
  ];
}

function schneemann() {
  return [
    quader([3, 0, 3], [13, 9, 13], 'weiss'),
    quader([4.5, 9, 4.5], [11.5, 16, 11.5], 'weiss'),
    quader([5.5, 16, 5.5], [10.5, 21, 10.5], 'weiss'),
    quader([4.4, 15, 4.4], [11.6, 16.5, 11.6], 'rot'), quader([9, 11, 3.9], [11, 15, 4.5], 'rot'), // Schal
    quader([7.5, 18, 3], [8.5, 19, 5.5], 'orange'), // Karottennase
    quader([6.5, 19.5, 5.4], [7.5, 20.5, 5.5], 'schwarz'), quader([8.5, 19.5, 5.4], [9.5, 20.5, 5.5], 'schwarz'),
    ...[5, 7.5, 10.5, 13].map((y) => quader([7.5, y, 4.4], [8.5, y + 1, 4.5], 'schwarz')), // Knöpfe
    quader([4.5, 21, 4.5], [11.5, 21.5, 11.5], 'schwarz'), quader([6, 21.5, 6], [10, 25, 10], 'schwarz'), // Hut
    quader([5.9, 21.5, 5.9], [10.1, 22.5, 10.1], 'rot'),
  ];
}

function rentier() {
  return [
    quader([4, 8, 2], [12, 14, 15], 'braun'), // Rumpf
    ...[[4.5, 2.5], [9.5, 2.5], [4.5, 12.5], [9.5, 12.5]].map(([x, z]) => quader([x, 0, z], [x + 2, 8, z + 2], 'braun_hell')),
    quader([6, 12, 0], [10, 18, 3.5], 'braun'), // Hals
    quader([5.5, 17, -3.5], [10.5, 21, 2], 'braun'), // Kopf
    leuchtend([7, 17.5, -4.5], [9, 19.5, -3.5], 'rot'), // Nase
    quader([6, 19.5, -3.6], [7, 20.5, -3.5], 'schwarz'), quader([9, 19.5, -3.6], [10, 20.5, -3.5], 'schwarz'),
    ...[[5.5, 4], [9.5, 12]].flatMap(([x, xo]) => [
      quader([x, 21, -0.5], [x + 1, 25, 0.5], 'braun_hell'),
      quader([Math.min(x, xo), 24, -0.5], [Math.max(x + 1, xo), 25, 0.5], 'braun_hell'),
      quader([x, 23, -2.5], [x + 1, 24, -0.5], 'braun_hell'),
    ]),
    quader([7, 12, 14.5], [9, 14, 16], 'weiss'), // Schwanz
    quader([3.9, 12, 1.9], [12.1, 13, 15.1], 'rot'), // Geschirr
    quader([7.25, 10.5, -0.6], [8.75, 12, 0.4], 'gold'), // Glöckchen
  ];
}

// ── Winterkalender ───────────────────────────────────────────────────────────────────────────────
// Aufsetzbares (equippable head ohne asset_id) rendert Minecraft als Item-Modell am Kopf:
// Modellmitte = Kopfmitte, der Kopf füllt x/y/z 1,6–14,4, vorne ist −z.
const KOPF = { min: 1.6, max: 14.4 };

function zuckerstange() {
  const teile = [];
  for (let y = 1; y < 12; y += 1.5) teile.push(quader([7, y, 7], [9, y + 1.5, 9], (y - 1) % 3 ? 'weiss' : 'rot'));
  teile.push(quader([7, 12, 7], [9, 14, 9], 'rot'), quader([8, 14, 7], [10.5, 15.5, 9], 'weiss'),
    quader([10.5, 13, 7], [12.5, 15.5, 9], 'rot'), quader([10.5, 11, 7], [12.5, 13, 9], 'weiss'));
  return teile;
}

function strickmuetze() {
  const { min, max } = KOPF;
  return [
    quader([min - 0.4, 10, min - 0.4], [max + 0.4, 12, max + 0.4], 'weiss'), // Umschlag
    quader([min - 0.2, 12, min - 0.2], [max + 0.2, max + 1, max + 0.2], 'wolle_rot'),
    quader([min + 0.8, max + 1, min + 0.8], [max - 0.8, max + 2.5, max - 0.8], 'wolle_rot'),
    quader([min - 0.3, 13.2, min - 0.3], [max + 0.3, 13.8, max + 0.3], 'weiss'), // Strickmuster-Streifen
    quader([6.5, max + 2.5, 6.5], [9.5, max + 5.5, 9.5], 'weiss'), // Bommel
  ];
}

function plaetzchenTeller() {
  const keks = (x, z, farbe, punkt) => [quader([x, 1, z], [x + 4, 2, z + 4], farbe), quader([x + 1.5, 2, z + 1.5], [x + 2.5, 2.4, z + 2.5], punkt)];
  return [
    quader([1, 0, 1], [15, 0.6, 15], 'weiss'), quader([0.5, 0.4, 0.5], [15.5, 1, 15.5], 'silber'),
    ...keks(2.5, 2.5, 'braun_hell', 'rot'), ...keks(9.5, 2.5, 'schoko', 'weiss'), ...keks(2.5, 9.5, 'creme', 'gruen'),
    ...keks(9.5, 9.5, 'braun_hell', 'gelb'), ...keks(6, 6, 'karamell', 'rosa').map((q) => ({ ...q, from: [q.from[0], q.from[1] + 1, q.from[2]], to: [q.to[0], q.to[1] + 1, q.to[2]] })),
  ];
}

function kerzeGlas() {
  const pfosten = [[4, 4], [11, 4], [4, 11], [11, 11]].map(([x, z]) => quader([x, 1, z], [x + 1, 11, z + 1], 'eisblau'));
  return [
    quader([4, 0, 4], [12, 1, 12], 'eisblau'), ...pfosten, quader([3.5, 11, 3.5], [12.5, 12, 12.5], 'gold'),
    quader([6, 1, 6], [10, 7, 10], 'rot'), quader([7.75, 7, 7.75], [8.25, 8, 8.25], 'schwarz'),
    leuchtend([7.25, 8, 7.25], [8.75, 10.5, 8.75], 'gelb'),
  ];
}

function heisseSchokolade() {
  return [
    quader([4, 0, 4], [12, 9, 12], 'weiss'), quader([3.9, 3, 3.9], [12.1, 5, 12.1], 'rot'),
    quader([4.5, 8.5, 4.5], [11.5, 8.9, 11.5], 'schoko'),
    quader([12, 2, 7], [14.5, 3, 9], 'weiss'), quader([13.5, 3, 7], [14.5, 7, 9], 'weiss'), quader([12, 7, 7], [14.5, 8, 9], 'weiss'), // Henkel
    quader([5.5, 8.6, 6], [7.5, 10, 8], 'weiss'), quader([8.5, 8.6, 7.5], [10.5, 10.2, 9.5], 'rosa'), // Marshmallows
  ];
}

function ohrenschuetzer() {
  const { min, max } = KOPF;
  return [
    quader([min - 0.6, max, 7], [max + 0.6, max + 1.2, 9], 'grau'), // Bügel
    quader([min - 1.2, 9, 7], [min, max + 1.2, 9], 'grau'), quader([max, 9, 7], [max + 1.2, max + 1.2, 9], 'grau'),
    quader([min - 2.4, 4, 4.5], [min, 10, 11.5], 'weiss'), quader([max, 4, 4.5], [max + 2.4, 10, 11.5], 'weiss'),
    quader([min - 2.6, 5, 5.5], [min - 2.3, 9, 10.5], 'rosa'), quader([max + 2.3, 5, 5.5], [max + 2.6, 9, 10.5], 'rosa'),
  ];
}

function schneekugel() {
  return [
    quader([3, 0, 3], [13, 2.5, 13], 'braun'), quader([3.5, 2.5, 3.5], [12.5, 3, 12.5], 'gold'),
    quader([5, 3, 5], [11, 13, 11], 'eisblau'), quader([4, 4, 6], [12, 12, 10], 'eisblau'), quader([6, 4, 4], [10, 12, 12], 'eisblau'),
    quader([4.5, 3, 4.5], [11.5, 4, 11.5], 'weiss'), // Schnee am Boden (ragt aus dem Glas)
    quader([7.5, 4, 7.5], [8.5, 5, 8.5], 'braun'), quader([6.5, 5, 6.5], [9.5, 7, 9.5], 'gruen'), quader([7, 7, 7], [9, 9, 9], 'gruen'),
    leuchtend([7.6, 9, 7.6], [8.4, 9.8, 8.4], 'gelb'),
    ...[[4.4, 10, 7], [11.2, 7, 9], [7, 12.3, 5.5], [9, 11, 4.4], [5.5, 8, 11.2]].map(([x, y, z]) => quader([x, y, z], [x + 0.4, y + 0.4, z + 0.4], 'weiss')),
  ];
}

function bratapfel() {
  return [
    quader([4, 0, 4], [12, 7, 12], 'apfelrot'), quader([3, 1, 5], [13, 6, 11], 'apfelrot'), quader([5, 1, 3], [11, 6, 13], 'apfelrot'),
    quader([5.5, 7, 5.5], [10.5, 7.6, 10.5], 'karamell'), // aufgeplatzte, gebackene Oberseite
    quader([3.9, 5, 6], [4.4, 7, 7], 'karamell'), quader([11.6, 4.5, 8], [12.1, 7, 9], 'karamell'), quader([7, 5.2, 3.9], [8, 7, 4.4], 'karamell'),
    quader([6.5, 7.6, 6.5], [9.5, 8.6, 9.5], 'braun_hell'), // Nussfüllung
    quader([7.6, 8.6, 7.6], [8.4, 10.5, 8.4], 'braun'), quader([8.4, 9.5, 7.8], [10.5, 10.2, 8.2], 'gruen'),
  ];
}

function rentiergeweih() {
  const { min, max } = KOPF;
  const stange = (x, aussen) => [
    quader([x, max, 7.25], [x + 1.5, max + 6, 8.75], 'braun_hell'),
    quader([Math.min(x, aussen), max + 4.5, 7.25], [Math.max(x + 1.5, aussen), max + 5.5, 8.75], 'braun_hell'),
    quader([aussen < x ? aussen : aussen - 1, max + 5.5, 7.25], [aussen < x ? aussen + 1 : aussen, max + 8, 8.75], 'braun_hell'),
    quader([x, max + 2.5, 5], [x + 1.5, max + 3.5, 7.25], 'braun_hell'),
    quader([x, max + 6, 7.25], [x + 1.5, max + 8.5, 8.75], 'braun_hell'),
  ];
  return [
    quader([min - 0.3, max - 0.5, 7], [max + 0.3, max + 0.4, 9], 'braun'), // Haarreif
    ...stange(3.5, 0.5), ...stange(11, 15.5),
    quader([min - 1.5, max - 3, 7], [min, max - 1, 9], 'braun'), quader([max, max - 3, 7], [max + 1.5, max - 1, 9], 'braun'), // Ohren
  ];
}

function schal() {
  const { min, max } = KOPF;
  const ring = (y0, y1, farbe) => [
    quader([min - 0.6, y0, min - 0.6], [max + 0.6, y1, min + 0.6], farbe), quader([min - 0.6, y0, max - 0.6], [max + 0.6, y1, max + 0.6], farbe),
    quader([min - 0.6, y0, min - 0.6], [min + 0.6, y1, max + 0.6], farbe), quader([max - 0.6, y0, min - 0.6], [max + 0.6, y1, max + 0.6], farbe),
  ];
  return [
    ...ring(-1.5, 0, 'wolle_rot'), ...ring(0, 0.6, 'weiss'), ...ring(0.6, 2, 'wolle_rot'),
    quader([9.5, -7, min - 1.4], [12.5, 0, min - 0.6], 'wolle_rot'), // herabhängendes Ende vorne
    quader([9.5, -5, min - 1.5], [12.5, -4.4, min - 0.5], 'weiss'), quader([9.5, -7.8, min - 1.4], [12.5, -7, min - 0.6], 'weiss'),
  ];
}

function laterneStern() {
  const ecken = [[4, 4], [11, 4], [4, 11], [11, 11]].map(([x, z]) => quader([x, 1, z], [x + 1, 11, z + 1], 'schwarz'));
  return [
    quader([3.5, 0, 3.5], [12.5, 1, 12.5], 'schwarz'), ...ecken, quader([3.5, 11, 3.5], [12.5, 12, 12.5], 'schwarz'),
    quader([5, 12, 5], [11, 13, 11], 'schwarz'), quader([7.5, 13, 7.5], [8.5, 15, 8.5], 'schwarz'),
    leuchtend([5.5, 1, 5.5], [10.5, 10.5, 10.5], 'gelb'),
    ...[0, 45].flatMap((dreh) => [leuchtend([7.5, 14.5, 7.75], [8.5, 19.5, 8.25], 'gold'), leuchtend([5.5, 16.5, 7.75], [10.5, 17.5, 8.25], 'gold')]
      .map((q) => ({ ...q, rotation: { angle: dreh, axis: 'z', origin: [8, 17, 8] } }))),
  ];
}

function lichterkrone() {
  const { min, max } = KOPF;
  const birnen = ['rot', 'gelb', 'blau', 'gruen', 'tuerkis', 'rosa'];
  const zacken = [];
  const orte = [[3, min - 0.7], [8, min - 0.7], [13, min - 0.7], [3, max + 0.7], [8, max + 0.7], [13, max + 0.7],
    [min - 0.7, 5.5], [min - 0.7, 10.5], [max + 0.7, 5.5], [max + 0.7, 10.5]];
  orte.forEach(([x, z], i) => {
    const hoch = i === 1 ? 6 : 3.5; // vorne Mitte die große Zacke
    zacken.push(quader([x - 0.75, max + 2, z - 0.75], [x + 0.75, max + 2 + hoch, z + 0.75], 'gold'),
      leuchtend([x - 0.9, max + 2 + hoch, z - 0.9], [x + 0.9, max + 3.8 + hoch, z + 0.9], birnen[i % birnen.length]));
  });
  return [
    quader([min - 0.8, max - 1, min - 0.8], [max + 0.8, max + 2, min + 0.2], 'gold'), quader([min - 0.8, max - 1, max - 0.2], [max + 0.8, max + 2, max + 0.8], 'gold'),
    quader([min - 0.8, max - 1, min - 0.8], [min + 0.2, max + 2, max + 0.8], 'gold'), quader([max - 0.2, max - 1, min - 0.8], [max + 0.8, max + 2, max + 0.8], 'gold'),
    quader([min - 0.9, max, min - 0.9], [max + 0.9, max + 0.6, max + 0.9], 'gold_dunkel'),
    ...zacken,
    leuchtend([6.5, max + 10.5, 7.5], [9.5, max + 13.5, 8.5], 'weiss'), // Schneeflocke über der Mittelzacke
    ...[0, 45].map((dreh) => leuchtend([7.5, max + 9.5, 7.6], [8.5, max + 14.5, 8.4], 'weiss', dreh)),
  ];
}

// Kalender-Items, die noch kein Modell hatten (Tag 1, 3, 8, 12, 16, 18, 19, 21, 23 nutzen vorhandene IDs).
export const KALENDER = {
  zuckerstange: zuckerstange(), strickmuetze: strickmuetze(), plaetzchen_teller: plaetzchenTeller(),
  kerze_glas: kerzeGlas(), heisse_schokolade: heisseSchokolade(), ohrenschuetzer: ohrenschuetzer(),
  schneekugel: schneekugel(), bratapfel: bratapfel(), rentiergeweih: rentiergeweih(), laterne_stern: laterneStern(),
  schal: schal(), lichterkrone: lichterkrone(),
};
// Gebrauchshinweise in der Lore (Spawn-Session setzt sie als translate). Eigener Namensraum fürs
// Sprachfile, weil tools/questbuch.mjs weihnachten/lang komplett neu schreibt; Minecraft führt alle zusammen.
export const KALENDER_TEXTE = {
  'item.weihnachten.kalender.hinweis.kopf': ['Aufsetzen: in den Helm-Platz ziehen', 'Wear it: drag into the helmet slot'],
  'item.weihnachten.kalender.hinweis.deko': ['Deko: in einen Rahmen hängen', 'Decoration: hang it in an item frame'],
  'item.weihnachten.kalender.hinweis.deko2': ['oder einem Rüstungsständer aufsetzen', 'or put it on an armor stand'],
  'item.weihnachten.kalender.hinweis.essen': ['Essbar', 'Edible'],
  'item.weihnachten.kalender.hinweis.schokolade': ['Trinken: kurz Regeneration', 'Drink it: brief regeneration'],
  'item.weihnachten.kalender.hinweis.werfen': ['Zum Werfen', 'Throw it'],
  'item.weihnachten.kalender.hinweis.feuerwerk': ['Abfeuern: Rechtsklick in die Luft', 'Launch it: right-click into the air'],
  'item.weihnachten.kalender.hinweis.andenken': ['Andenken an den Winter 2026', 'A keepsake of winter 2026'],
};

export const AUFSETZBAR =['strickmuetze', 'ohrenschuetzer', 'rentiergeweih', 'schal', 'lichterkrone'];

// Ansichten: Inventar und Rahmen passen große Modelle auf einen Block ein; head bleibt 1:1 (Kopf-Maße oben).
function display(elemente) {
  const ausdehnung = Math.max(...elemente.flatMap((e) => e.to.map((b, i) => b - e.from[i])),
    ...[0, 1, 2].map((i) => Math.max(...elemente.map((e) => e.to[i])) - Math.min(...elemente.map((e) => e.from[i]))));
  const passt = Math.min(1, 16 / ausdehnung);
  const s = (f) => [f * passt, f * passt, f * passt];
  return {
    gui: { rotation: [30, 225, 0], scale: s(0.625) },
    ground: { translation: [0, 2, 0], scale: s(0.4) },
    fixed: { scale: s(1) },
    thirdperson_righthand: { rotation: [75, 45, 0], translation: [0, 2.5, 0], scale: s(0.375) },
    firstperson_righthand: { rotation: [0, 45, 0], scale: s(0.4) },
  };
}

export const DEKO = {
  geschenk_rot: geschenk('rot', 'gold'), geschenk_gruen: geschenk('gruen', 'rot'), geschenk_blau: geschenk('blau', 'silber'),
  geschenk_gold: geschenk('gold', 'rot'), geschenk_lila: geschenk('lila', 'weiss'), geschenk_weiss: geschenk('weiss', 'rot'),
  kugel_rot: kugel('rot', 'gold'), kugel_gold: kugel('gold', 'weiss'), kugel_blau: kugel('blau', 'silber'),
  kugel_silber: kugel('silber', 'rot'), kugel_gruen: kugel('gruen', 'gold'),
  birne_rot: birne('rot'), birne_gelb: birne('gelb'), birne_blau: birne('blau'), birne_gruen: birne('gruen'),
  stern: stern(), lichterkette_deko: lichterkette(), schneemann: schneemann(), rentier: rentier(),
};

export function modell(elemente) {
  return { textures: { p: 'weihnachten:item/deko_palette', particle: 'weihnachten:item/deko_palette' }, elements: elemente, display: display(elemente) };
}
