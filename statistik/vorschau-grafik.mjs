// Vorschau der Discord-Grafik aus der Testwelt (Pixelgesichter statt Mojang): node statistik/vorschau-grafik.mjs <ziel-ordner>
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { erzeugeTestwelt } from './testdaten.mjs';
import { Instanz } from './lib/quellen.mjs';
import { Sichtbarkeit } from './lib/sichtbarkeit.mjs';
import { baueBestenlisten } from './lib/anzeige.mjs';
import { bestenlistenGrafik } from './lib/grafik.mjs';
import { dekodierePng, pixelGesicht, steveGesicht } from './lib/kopf.mjs';
import { tmpdir } from 'node:os';

const ziel = process.argv[2] ?? '.';
mkdirSync(ziel, { recursive: true });
const welt = erzeugeTestwelt(join(tmpdir(), 'statistik-vorschau-welt'));
const sprache = { de: {}, en: {} };
const b = baueBestenlisten(await new Instanz({ instanz: welt.ziel, sichtbarkeit: new Sichtbarkeit(welt.sichtbarkeit), sprache, optionen: { name: 'Generalprobe' } }).daten());
b.seasonName = 'Generalprobe';
// eine leere Liste und ein sehr langer Name zum Prüfen
b.listen.find((l) => l.id === 'spenden').plaetze = [];
b.listen[0].plaetze[1].name = 'Xx_SehrLangerName';
let n = 0;
const kopf = { gesicht: async (u) => (n++ % 4 === 3 ? steveGesicht() : grob(pixelGesicht(u))) };
function grob(png) { const d = dekodierePng(png); const a = Buffer.alloc(256); for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) d.rgba.copy(a, (y * 8 + x) * 4, (y * 8 * 64 + x * 8) * 4, (y * 8 * 64 + x * 8) * 4 + 4); return a; }
const { png, klein } = await bestenlistenGrafik(b, kopf, { vorschauBreite: 400 });
writeFileSync(join(ziel, 'bestenliste-desktop.png'), png);
writeFileSync(join(ziel, 'bestenliste-handy-400px.png'), klein);
console.log('ok', png.length, klein.length);
