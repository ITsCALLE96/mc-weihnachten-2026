// Spielerdateien (players/stats/*.json) und usercache.json einlesen.
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { normUuid } from './sichtbarkeit.mjs';

// { stats: { "minecraft:custom": { "minecraft:play_time": 5 } } } → { "custom:play_time": 5 }
export function flacheStatistik(json) {
  const aus = {};
  const stats = json?.stats ?? {};
  for (const [kat, inhalt] of Object.entries(stats)) {
    const k = kat.replace(/^minecraft:/, '');
    for (const [sache, wert] of Object.entries(inhalt ?? {})) {
      if (typeof wert === 'number' && Number.isFinite(wert)) aus[`${k}:${sache.replace(/^minecraft:/, '')}`] = wert;
    }
  }
  // ältere Welten: play_one_minute statt play_time
  if (aus['custom:play_time'] === undefined && aus['custom:play_one_minute'] !== undefined) {
    aus['custom:play_time'] = aus['custom:play_one_minute'];
  }
  return aus;
}

// Weltordner = <instanz>/<level-name>
export function weltOrdner(instanz) {
  let name = 'world';
  try {
    const m = readFileSync(join(instanz, 'server.properties'), 'utf8').match(/^level-name=(.*)$/m);
    if (m && m[1].trim()) name = m[1].trim();
  } catch { /* Standard */ }
  return join(instanz, name);
}

// Statistikordner: players/stats (ab 26.x) oder stats (älter)
export function statistikOrdner(welt) {
  return ['players/stats', 'stats'].map((p) => join(welt, p)).filter((p) => existsSync(p));
}

export function statistikDateien(welt) {
  const dateien = [];
  for (const ordner of statistikOrdner(welt)) {
    for (const f of readdirSync(ordner)) {
      if (!f.endsWith('.json')) continue;
      const uuid = normUuid(f.slice(0, -5));
      if (uuid) dateien.push({ uuid, pfad: join(ordner, f) });
    }
  }
  return dateien;
}

// Map uuid → flache Werte
export function leseStatistiken(welt) {
  const karte = new Map();
  for (const { uuid, pfad } of statistikDateien(welt)) {
    try {
      karte.set(uuid, flacheStatistik(JSON.parse(readFileSync(pfad, 'utf8'))));
    } catch { /* kaputte Datei überspringen */ }
  }
  return karte;
}

// Signatur der Statistikdateien (zum Erkennen von Änderungen)
export function statistikSignatur(welt) {
  return statistikDateien(welt).map(({ pfad }) => {
    try { const s = statSync(pfad); return `${pfad}:${s.mtimeMs}:${s.size}`; } catch { return pfad; }
  }).sort().join('|');
}

// usercache.json → Map uuid → name (wird nie ausgeliefert)
export function parseUsercache(text) {
  const karte = new Map();
  for (const e of JSON.parse(text)) {
    const u = normUuid(e?.uuid);
    if (u && typeof e.name === 'string') karte.set(u, e.name);
  }
  return karte;
}

export function leseUsercache(instanz) {
  try { return parseUsercache(readFileSync(join(instanz, 'usercache.json'), 'utf8')); } catch { return new Map(); }
}
