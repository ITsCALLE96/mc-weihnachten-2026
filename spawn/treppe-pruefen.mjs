// Prüft die Wendeltreppe des Weltenbaums in einer echten Welt Stufe für Stufe: jede Halbstufe liegt an ihrem Platz (Platte bzw. voller Block),
// darüber sind 2 Blöcke frei, die letzte Stufe schließt bündig ans Deck an. Dazu Blasensäule, Fallschacht mit Becken und die beiden Türen.
// Aufruf: node spawn/treppe-pruefen.mjs <welt> <standort.json> [entwurf.json]
import { readFileSync } from 'node:fs';
import { ausschneiden } from '../tools/schem-welt.mjs';
import { hole, LUFT } from '../tools/schem.mjs';

const [welt, standortDatei, entwurfDatei = new URL('./entwuerfe/ausgabe/weltenbaum.json', import.meta.url)] = process.argv.slice(2);
const k = JSON.parse(readFileSync(standortDatei, 'utf8')), e = JSON.parse(readFileSync(entwurfDatei, 'utf8'));
const [ox, oy, oz] = k.struktur.ursprung, G = e.boden, [CX, , CZ] = e.blasensaeule, { halb: HALB, startwinkel: W0, letzte: KMAX, bis: A } = e.treppe;
const a = [ox + CX - 6, oy + G - 1, oz + CZ - 6], b = [ox + CX + 6, oy + A + 3, oz + CZ + 6];
const m = ausschneiden(welt, a, b);
const hol = (x, y, z) => hole(m, x + ox - a[0], y + oy - a[1], z + oz - a[2]); // lokale Entwurfskoordinaten
const frei = (s) => s === LUFT || /^minecraft:(cave_air|void_air|light|[a-z_]*lantern)/.test(s);
const stufeY = (n) => ((n + 1) % 2 === 0 ? G + (n + 1) / 2 : G + 1 + Math.floor((n + 1) / 2));
const fehler = [];
for (let n = 0; n <= KMAX; n++) {
  const w = W0 + ((n % HALB) + 0.5) / HALB * 2 * Math.PI, x = Math.round(CX + 3.4 * Math.cos(w)), z = Math.round(CZ + 3.4 * Math.sin(w)), y = stufeY(n);
  const s = hol(x, y, z), platte = (n + 1) % 2 === 1;
  // 26.3 speichert Standardeigenschaften nicht: eine Platte ohne Angabe ist die untere
  if (platte ? !/_slab(?!\[.*type=(top|double))/.test(s) : (frei(s) || /_slab/.test(s))) fehler.push(`Stufe ${n} (${x + ox}/${y + oy}/${z + oz}): ${s}`);
  for (const h of [1, 2]) if (!frei(hol(x, y + h, z))) fehler.push(`Stufe ${n}: über ${x + ox}/${y + oy}/${z + oz} +${h} steht ${hol(x, y + h, z)}`);
}
const letzte = (() => { const w = W0 + ((KMAX % HALB) + 0.5) / HALB * 2 * Math.PI; return [Math.round(CX + 5.3 * Math.cos(w)), Math.round(CZ + 5.3 * Math.sin(w))]; })();
if (frei(hol(letzte[0], A, letzte[1])) || !frei(hol(letzte[0], A + 1, letzte[1]))) fehler.push(`Deck neben der letzten Stufe fehlt oder ist verbaut (${hol(letzte[0], A, letzte[1])})`);
const zaehle = (x, z, y1, y2, re) => { let n = 0; for (let y = y1; y <= y2; y++) if (re.test(hol(x, y, z))) n++; return n; };
const saeule = zaehle(CX - 1, CZ, G + 1, A - 1, /bubble_column\[drag=false/), schacht = zaehle(CX + 1, CZ, G + 2, A, /air/);
if (!/soul_sand/.test(hol(CX - 1, G, CZ)) || saeule !== A - 1 - G) fehler.push(`Blasensäule: Seelensand ${hol(CX - 1, G, CZ)}, ${saeule}/${A - 1 - G} Blöcke`);
if (!/water/.test(hol(CX + 1, G, CZ)) || !/water/.test(hol(CX + 1, G + 1, CZ)) || schacht !== A - G - 1) fehler.push(`Fallschacht: Becken ${hol(CX + 1, G, CZ)}/${hol(CX + 1, G + 1, CZ)}, frei ${schacht}/${A - G - 1}`);
for (const dx of [-1, 1]) if (!/door/.test(hol(CX + dx, G + 1, CZ + 1))) fehler.push(`Tür ${dx}: ${hol(CX + dx, G + 1, CZ + 1)}`);
console.log(fehler.length ? `${fehler.length} Fehler:\n${fehler.slice(0, 20).join('\n')}` : `Treppe ok: ${KMAX + 1} Halbstufen von y ${stufeY(0) + oy} bis ${stufeY(KMAX) + oy} (Deck y ${A + oy}), je 2 Blöcke frei; Blasensäule ${saeule} Blöcke, Fallschacht ${schacht} Blöcke mit Becken, beide Türen da`);
process.exitCode = fehler.length ? 1 : 0;
