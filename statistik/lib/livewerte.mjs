// Live-Werte der Online-Spieler: serverwahl schreibt auf dem SMP alle ~20 s je Online-Spieler
// plugins/Serverwahl/live/<uuid>.json (Format in DATENFORMAT.md, „Live-Werte“). Minecraft selbst schreibt die
// Statistikdateien nur etwa alle 5 Minuten und beim Abmelden; mit den Live-Werten sind die Bestenlisten nach ~1 Minute aktuell.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { normUuid } from './sichtbarkeit.mjs';

export const LIVE_ORDNER = join('plugins', 'Serverwahl', 'live');
// Ältere Dateien gelten als veraltet (Spieler offline, Server aus): dann zählen nur die Statistikdateien
export const LIVE_MAX_ALTER_MS = 90_000;

const SCHLUESSEL = /^[a-z_]+:[a-z0-9_./-]+$/;
const NAME = /^[.*]?[A-Za-z0-9_]{1,16}$/;

// Eine Live-Datei prüfen → { uuid, name, werte } oder null (kaputt, veraltet, falsche Form)
export function parseLive(text, { jetzt = Date.now(), maxAlterMs = LIVE_MAX_ALTER_MS } = {}) {
  let j;
  try { j = JSON.parse(text); } catch { return null; }
  const uuid = normUuid(j?.uuid);
  if (!uuid || typeof j.zeit !== 'number' || jetzt - j.zeit > maxAlterMs || j.zeit - jetzt > maxAlterMs) return null;
  if (!j.werte || typeof j.werte !== 'object') return null;
  const werte = {};
  for (const [k, v] of Object.entries(j.werte)) {
    if (SCHLUESSEL.test(k) && Number.isFinite(v) && v >= 0) werte[k] = v;
  }
  return { uuid, name: typeof j.name === 'string' && NAME.test(j.name) ? j.name : null, werte };
}

// Map uuid → { name, werte } aller frischen Live-Dateien (Dateiname muss zur UUID im Inhalt passen)
export function leseLive(instanz, optionen = {}) {
  const karte = new Map();
  const ordner = join(instanz, LIVE_ORDNER);
  if (!existsSync(ordner)) return karte;
  for (const f of readdirSync(ordner)) {
    const uuid = f.endsWith('.json') ? normUuid(f.slice(0, -5)) : null;
    if (!uuid) continue;
    let text;
    try { text = readFileSync(join(ordner, f), 'utf8'); } catch { continue; }
    const l = parseLive(text, optionen);
    if (l && l.uuid === uuid) karte.set(uuid, l);
  }
  return karte;
}

// Live-Werte über die Dateiwerte legen (neue Karte). Je Wert gilt der größere: Statistiken wachsen nur, so schadet
// eine Live-Datei, die kurz vor dem Speichern beim Abmelden entstand, nicht.
export function mitLive(statistiken, live) {
  const aus = new Map([...statistiken].map(([u, w]) => [u, { ...w }]));
  for (const [u, l] of live) {
    const w = aus.get(u) ?? {};
    for (const [k, v] of Object.entries(l.werte)) w[k] = Math.max(w[k] ?? 0, v);
    aus.set(u, w);
  }
  return aus;
}
