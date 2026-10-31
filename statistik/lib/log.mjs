// Parser für Paper-Logs. Zeilenformat: „[18:04:12 INFO]: Steve joined the game“ (alt: „[18:04:12] [Server thread/INFO]: …“).
// Uhrzeiten sind Berliner Wanduhrzeit; das Datum kommt aus dem Dateinamen (JJJJ-MM-TT-n.log.gz) bzw. dem Änderungsdatum.
import { ausBerlin, addiereTage } from './zeit.mjs';
import { erkenneTod } from './uebersetzung.mjs';

const ZEILE = /^\[(\d{2}):(\d{2}):(\d{2})(?:\]? \[[^\]/]*\/|\s)(INFO|WARN|ERROR|DEBUG)\]: (.*)$/;
const NAME = '([A-Za-z0-9_.]{2,24})';
const RE_JOIN = new RegExp(`^${NAME} joined the game$`);
const RE_QUIT = new RegExp(`^${NAME} left the game$`);
const RE_UUID = new RegExp(`^UUID of player ${NAME} is ([0-9a-fA-F-]{32,36})$`);
const RE_FORTSCHRITT = new RegExp(`^${NAME} has (made the advancement|completed the challenge|reached the goal) \\[(.+)\\]$`);
const ART = { 'made the advancement': 'made', 'completed the challenge': 'challenge', 'reached the goal': 'goal' };
const RE_START = /^Done \([^)]*\)! For help, type "help"/;
const RE_STOPP = /^Stopping server$/;

const TAG = 24 * 3600;

export function logDatumAusDateiname(name) {
  const m = /^(\d{4}-\d{2}-\d{2})-\d+\.log(?:\.gz)?$/.exec(name);
  return m ? m[1] : null;
}

export function parseZeile(zeile) {
  const m = ZEILE.exec(zeile.replace(/\r$/, ''));
  // Paper 26.x schreibt Systemmeldungen (Beitritt, Tod, Fortschritt) mit „System chat: “ davor
  return m ? { sek: Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]), ebene: m[4], text: m[5].replace(/^System chat: /, '') } : null;
}

// Zählt Mitternachtswechsel (Uhrzeit springt deutlich zurück)
export function zaehleTagwechsel(zeilen) {
  let n = 0;
  let letzt = null;
  for (const z of zeilen) {
    const p = parseZeile(z);
    if (!p) continue;
    if (letzt !== null && p.sek < letzt - TAG / 2) n++;
    letzt = p.sek;
  }
  return n;
}

// Inhalt einer INFO-Zeile → Rohereignis ohne Zeit (oder null)
export function klassifiziere(text, { todeMuster, istSpieler } = {}) {
  let m;
  if ((m = RE_JOIN.exec(text))) return { typ: 'join', name: m[1] };
  if ((m = RE_QUIT.exec(text))) return { typ: 'quit', name: m[1] };
  if ((m = RE_UUID.exec(text))) return { typ: 'uuid', name: m[1], uuid: m[2] };
  if ((m = RE_FORTSCHRITT.exec(text))) return { typ: 'fortschritt', name: m[1], art: ART[m[2]], titel: m[3] };
  if (RE_START.test(text)) return { typ: 'start' };
  if (RE_STOPP.test(text)) return { typ: 'stopp' };
  if (todeMuster) {
    const erstes = text.split(' ', 1)[0];
    if (/^[A-Za-z0-9_.]{2,24}$/.test(erstes) && (!istSpieler || istSpieler(erstes))) {
      const t = erkenneTod(text, todeMuster);
      if (t && (!istSpieler || istSpieler(t.args[0]))) return { typ: 'tod', name: t.args[0], schluessel: t.schluessel, args: t.args, text };
    }
  }
  return null;
}

// Zustandsbehafteter Zeilenparser; liefert Rohereignisse { zeit(ms), typ, … }
export function erzeugeParser({ datum, todeMuster, istSpieler }) {
  let tag = datum;
  let letzt = null;
  return (zeile) => {
    const p = parseZeile(zeile);
    if (!p) return null;
    if (letzt !== null && p.sek < letzt - TAG / 2) tag = addiereTage(tag, 1);
    letzt = p.sek;
    if (p.ebene !== 'INFO') return null;
    const k = klassifiziere(p.text, { todeMuster, istSpieler });
    if (!k) return null;
    const h = Math.floor(p.sek / 3600);
    const mi = Math.floor((p.sek % 3600) / 60);
    return { zeit: ausBerlin(tag, h, mi, p.sek % 60), ...k };
  };
}

// Ganze Logdatei. Mit `endDatum` (latest.log: Änderungsdatum) wird das Startdatum rückwärts aus den Mitternachtswechseln bestimmt.
export function parseLog(text, { datum, endDatum, todeMuster, istSpieler }) {
  const zeilen = text.split('\n');
  const start = datum ?? addiereTage(endDatum, -zaehleTagwechsel(zeilen));
  const parser = erzeugeParser({ datum: start, todeMuster, istSpieler });
  const aus = [];
  for (const z of zeilen) {
    const e = parser(z);
    if (e) aus.push(e);
  }
  return aus;
}
