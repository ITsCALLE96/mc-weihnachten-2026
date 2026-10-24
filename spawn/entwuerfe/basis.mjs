// Gemeinsame Bausteine für die Spawn-Entwürfe: Rauschen, Schilder, Speichern mit Metadaten
import { writeFileSync } from 'node:fs';
import { neu, setze, hole, speichere, LUFT } from '../../tools/schem.mjs';
import { tag } from '../../tools/nbt.mjs';

export { neu, setze, hole, LUFT };

// Deterministisches Wertrauschen (0…1), glatt interpoliert
const h = (x, y, s) => { let n = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(s, 2147483647); n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
export function rauschen(x, y, skala = 8, saat = 1) {
  const fx = x / skala, fy = y / skala, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0;
  const s = (t) => t * t * (3 - 2 * t);
  const a = h(x0, y0, saat), b = h(x0 + 1, y0, saat), c = h(x0, y0 + 1, saat), d = h(x0 + 1, y0 + 1, saat);
  return a + (b - a) * s(tx) + (c - a) * s(ty) + (a - b - c + d) * s(tx) * s(ty);
}
export const zufall = (x, y, z, saat = 7) => h(x * 31 + z, y * 17 + z * 13, saat);

// Setzt nur innerhalb des Volumens
export function sicher(m, x, y, z, b) { if (x >= 0 && y >= 0 && z >= 0 && x < m.w && y < m.h && z < m.l) setze(m, x, y, z, b); }

// Stehendes Schild mit bis zu 4 Zeilen (Format 1.21.1, Minecraft wandelt es beim Einsetzen um). rotation: 0 Süd, 4 West, 8 Nord, 12 Ost
export function schild(m, x, y, z, zeilen, rotation = 0, holz = 'spruce') {
  setze(m, x, y, z, `minecraft:${holz}_sign[rotation=${rotation},waterlogged=false]`);
  const msg = [0, 1, 2, 3].map((i) => tag('string', JSON.stringify({ text: zeilen[i] ?? '' })));
  const seite = (m2) => tag('compound', { messages: tag('list', { elem: 'string', items: m2.map((t) => t.value) }), color: tag('string', 'black'), has_glowing_text: tag('byte', 0) });
  m.blockEntities.push({ pos: [x, y, z], id: 'minecraft:sign', daten: { front_text: seite(msg), back_text: seite([0, 1, 2, 3].map(() => tag('string', '""'))), is_waxed: tag('byte', 1) } });
}

// Speichert Schematic (DataVersion 1.21.1, wird beim Einsetzen umgewandelt) und Metadaten (Spawn, Oval, Plattform … relativ zum Ursprung)
export function speichern(m, datei, meta) {
  m.dataVersion = 3955;
  writeFileSync(datei, speichere(m));
  writeFileSync(datei.replace(/\.schem$/, '.json'), JSON.stringify({ groesse: [m.w, m.h, m.l], ...meta }, null, 2) + '\n');
}

// Standard-Infotafeln (Texte füllt Pascal)
export const TAFELN = [
  ['§lRegeln', 'Fair spielen,', 'nichts zerstören,', 'nett sein'],
  ['§lDiscord', 'Link folgt', '', ''],
  ['§lStatistik', 'Seite folgt', '', ''],
];
