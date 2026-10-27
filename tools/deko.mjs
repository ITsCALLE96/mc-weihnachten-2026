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
};
const NAMEN = Object.keys(FARBEN);

export function palette() {
  const png = new PNG({ width: 16, height: 16 });
  png.data.fill(0);
  NAMEN.forEach((n, i) => png.data.set([...FARBEN[n], 255], i * 4));
  return png;
}

const uv = (farbe) => { const i = NAMEN.indexOf(farbe); if (i < 0) throw new Error(`Farbe ${farbe}`); return [i, 0, i + 1, 1]; };

// Quader von [x,y,z] bis [x,y,z] in einer Farbe; optional Drehung und Leuchten.
export function quader(von, bis, farbe, extra = {}) {
  const f = { uv: uv(farbe), texture: '#p' };
  return { from: von, to: bis, faces: Object.fromEntries(['north', 'south', 'east', 'west', 'up', 'down'].map((s) => [s, f])), ...extra };
}
const leuchtend = (von, bis, farbe) => quader(von, bis, farbe, { light_emission: 15 });

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

const display = {
  gui: { rotation: [30, 225, 0], scale: [0.6, 0.6, 0.6] },
  ground: { translation: [0, 2, 0], scale: [0.4, 0.4, 0.4] },
  fixed: { scale: [1, 1, 1] },
  thirdperson_righthand: { rotation: [75, 45, 0], translation: [0, 2.5, 0], scale: [0.375, 0.375, 0.375] },
  firstperson_righthand: { rotation: [0, 45, 0], scale: [0.4, 0.4, 0.4] },
};

export const DEKO = {
  geschenk_rot: geschenk('rot', 'gold'), geschenk_gruen: geschenk('gruen', 'rot'), geschenk_blau: geschenk('blau', 'silber'),
  geschenk_gold: geschenk('gold', 'rot'), geschenk_lila: geschenk('lila', 'weiss'), geschenk_weiss: geschenk('weiss', 'rot'),
  kugel_rot: kugel('rot', 'gold'), kugel_gold: kugel('gold', 'weiss'), kugel_blau: kugel('blau', 'silber'),
  kugel_silber: kugel('silber', 'rot'), kugel_gruen: kugel('gruen', 'gold'),
  birne_rot: birne('rot'), birne_gelb: birne('gelb'), birne_blau: birne('blau'), birne_gruen: birne('gruen'),
  stern: stern(), lichterkette: lichterkette(), schneemann: schneemann(), rentier: rentier(),
};

export function modell(elemente) {
  return { textures: { p: 'weihnachten:item/deko_palette', particle: 'weihnachten:item/deko_palette' }, elements: elemente, display };
}
