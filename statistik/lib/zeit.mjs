// Zeit-Hilfen für Europe/Berlin. Alle Zeitpunkte intern als Millisekunden (UTC-Epoche).
const FMT = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Berlin', hourCycle: 'h23',
  year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
});

const teile = (ms) => {
  const t = {};
  for (const p of FMT.formatToParts(new Date(ms))) if (p.type !== 'literal') t[p.type] = Number(p.value);
  return t;
};

// Abstand Berlin–UTC in Minuten (+60 Winter, +120 Sommer)
export function berlinOffsetMin(ms) {
  const t = teile(ms);
  return (Date.UTC(t.year, t.month - 1, t.day, t.hour, t.minute, t.second) - Math.floor(ms / 1000) * 1000) / 60000;
}

const z2 = (n) => String(n).padStart(2, '0');

// 'JJJJ-MM-TT' in Berlin
export function berlinDatum(ms) {
  const t = teile(ms);
  return `${t.year}-${z2(t.month)}-${z2(t.day)}`;
}

// ISO-Text mit Berlin-Versatz: 2026-12-06T18:04:00+01:00
export function isoBerlin(ms) {
  const t = teile(ms);
  const off = berlinOffsetMin(ms);
  const vz = off < 0 ? '-' : '+';
  const a = Math.abs(off);
  return `${t.year}-${z2(t.month)}-${z2(t.day)}T${z2(t.hour)}:${z2(t.minute)}:${z2(t.second)}${vz}${z2(Math.floor(a / 60))}:${z2(a % 60)}`;
}

// Berliner Wanduhrzeit → Millisekunden
export function ausBerlin(datum, h = 0, mi = 0, s = 0) {
  const [y, m, d] = datum.split('-').map(Number);
  const raten = Date.UTC(y, m - 1, d, h, mi, s);
  let t = raten - berlinOffsetMin(raten) * 60000;
  const off2 = berlinOffsetMin(t);
  t = raten - off2 * 60000;
  return t;
}

export function addiereTage(datum, n) {
  const [y, m, d] = datum.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return `${dt.getUTCFullYear()}-${z2(dt.getUTCMonth() + 1)}-${z2(dt.getUTCDate())}`;
}

export const tagesStart = (datum) => ausBerlin(datum, 0, 0, 0);

// Wochentag 0 = Sonntag
export function wochentag(datum) {
  const [y, m, d] = datum.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}
