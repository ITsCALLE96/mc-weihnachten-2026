// Vorschau der Discord-Bestenliste aus der Testwelt (Pixelgesichter statt Mojang), so wie Discord sie zeigt:
//   discord-pc.png    – Chatspalte am PC, Embed-Bilder in der Box 400 × 300 px
//   discord-handy.png – Handy, 400 px Bildschirmbreite
//   kachel-1.png …    – die Bilder, die tatsächlich gesendet werden
// Aufruf: node statistik/vorschau-grafik.mjs <ziel-ordner>
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { erzeugeTestwelt } from './testdaten.mjs';
import { Instanz } from './lib/quellen.mjs';
import { Sichtbarkeit } from './lib/sichtbarkeit.mjs';
import { baueBestenlisten, standText } from './lib/anzeige.mjs';
import { bestenlistenBilder, svgZuPng, MASSE } from './lib/grafik.mjs';
import { dekodierePng, pixelGesicht, steveGesicht } from './lib/kopf.mjs';

const ziel = process.argv[2] ?? '.';
mkdirSync(ziel, { recursive: true });
const welt = erzeugeTestwelt(join(tmpdir(), 'statistik-vorschau-welt'));
const b = baueBestenlisten(await new Instanz({ instanz: welt.ziel, sichtbarkeit: new Sichtbarkeit(welt.sichtbarkeit), sprache: { de: {}, en: {} } }).daten());
b.seasonName = 'Generalprobe';
// eine leere Liste und ein sehr langer Name zum Prüfen
b.listen.find((l) => l.id === 'spenden').plaetze = [];
b.listen[0].plaetze[1].name = 'Xx_SehrLangerName';
let n = 0;
const grob = (png) => { const d = dekodierePng(png); const a = Buffer.alloc(256); for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) d.rgba.copy(a, (y * 8 + x) * 4, (y * 8 * 64 + x * 8) * 4, (y * 8 * 64 + x * 8) * 4 + 4); return a; };
const bilder = await bestenlistenBilder(b, { gesicht: async (u) => (n++ % 4 === 3 ? steveGesicht() : grob(pixelGesicht(u))) });
for (const x of bilder) writeFileSync(join(ziel, x.datei), x.png);

// Discord-Ansicht nachbauen: Embeds untereinander, Bild auf die Box skaliert
function ansicht({ breite, links, bildB, bildH, schrift }) {
  const s = Math.min(bildB / MASSE.breite, bildH / MASSE.hoehe);
  const bw = MASSE.breite * s; const bh = MASSE.hoehe * s;
  const t = [];
  let y = 16;
  t.push(`<circle cx="${links / 2}" cy="${y + 20}" r="20" fill="#5865f2"/>`);
  t.push(`<text x="${links}" y="${y + 16}" font-size="${schrift}" font-weight="600" fill="#f2f3f5">Bestenliste <tspan font-size="${schrift - 4}" fill="#949ba4" font-weight="400">BOT</tspan></text>`);
  t.push(`<text x="${links}" y="${y + 40}" font-size="${schrift}" font-weight="700" fill="#dbdee1">Bestenliste – ${b.seasonName} · ${standText(b.stand)}</text>`);
  t.push(`<text x="${links}" y="${y + 60}" font-size="${schrift - 3}" fill="#949ba4">Wird laufend aktualisiert. Wer nicht in der Statistik auftauchen möchte …</text>`);
  y += 76;
  for (const x of bilder) {
    t.push(`<rect x="${links}" y="${y}" width="${bw + 32}" height="${bh + 32}" rx="4" fill="#2b2d31"/><rect x="${links}" y="${y}" width="4" height="${bh + 32}" rx="2" fill="#1f3a44"/>`);
    t.push(`<svg x="${links + 16}" y="${y + 16}" width="${bw}" height="${bh}" viewBox="0 0 ${MASSE.breite} ${MASSE.hoehe}">${x.svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '')}</svg>`);
    y += bh + 32 + 8;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${breite}" height="${y + 16}" font-family="Poppins"><rect width="100%" height="100%" fill="#313338"/>${t.join('')}</svg>`;
}
writeFileSync(join(ziel, 'discord-pc.png'), await svgZuPng(ansicht({ breite: 760, links: 72, bildB: 400, bildH: 300, schrift: 16 })));
// Handy: 400 px breit, Inhalt ab 60 px, Embed bis 8 px vor dem Rand (innen 16 px Abstand)
writeFileSync(join(ziel, 'discord-handy.png'), await svgZuPng(ansicht({ breite: 400, links: 60, bildB: 400 - 60 - 8 - 32, bildH: 1000, schrift: 14 })));
console.log('ok', bilder.length, 'Kacheln');
