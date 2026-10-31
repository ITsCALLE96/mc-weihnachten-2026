// Werte, die nicht in den Vanilla-Statistiken stehen: abgeschlossene Fortschritte und Spenden für die Weihnachtsinsel.
// Sie landen als „server:fortschritte“ und „server:spenden“ in den flachen Werten je Spieler.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { normUuid } from './sichtbarkeit.mjs';

// Pfad der Missionsdatei von serverwahl (relativ zum Instanzordner)
export const MISSION_DATEI = join('plugins', 'Serverwahl', 'mission-stand.yml');

// Nur Vanilla-Fortschritte (minecraft:), ohne Rezepte. Datapack-Fortschritte (z. B. leitfaden:) vergibt das Questbuch
// teils automatisch, sie würden die Liste verzerren.
export function zaehleFortschritte(json) {
  let n = 0;
  for (const [id, v] of Object.entries(json ?? {})) {
    if (id.startsWith('minecraft:') && !id.startsWith('minecraft:recipes/') && v?.done === true) n++;
  }
  return n;
}

// Advancement-Ordner: players/advancements (ab 26.x) oder advancements (älter)
export function leseFortschritte(welt) {
  const karte = new Map();
  for (const ordner of ['players/advancements', 'advancements'].map((p) => join(welt, p)).filter((p) => existsSync(p))) {
    for (const f of readdirSync(ordner)) {
      const uuid = f.endsWith('.json') ? normUuid(f.slice(0, -5)) : null;
      if (!uuid) continue;
      try { karte.set(uuid, zaehleFortschritte(JSON.parse(readFileSync(join(ordner, f), 'utf8')))); } catch { /* kaputte Datei */ }
    }
  }
  return karte;
}

// mission-stand.yml (Bukkit-YAML) → Map uuid → gespendete Gegenstände insgesamt (Abschnitt „gesamt-spender“)
export function parseSpenden(text) {
  const karte = new Map();
  let drin = false;
  for (const zeile of text.split(/\r?\n/)) {
    if (/^\S/.test(zeile)) { drin = /^gesamt-spender:\s*$/.test(zeile); continue; }
    if (!drin) continue;
    const m = /^\s+['"]?([0-9a-fA-F-]{32,36})['"]?:\s*(\d+)\s*$/.exec(zeile);
    const uuid = m && normUuid(m[1]);
    if (uuid) karte.set(uuid, Number(m[2]));
  }
  return karte;
}

export function leseSpenden(instanz) {
  try { return parseSpenden(readFileSync(join(instanz, MISSION_DATEI), 'utf8')); } catch { return new Map(); }
}

// Zusatzwerte in die Statistik-Karte einmischen (neue Karte, Eingaben bleiben unverändert)
export function ergaenzeWerte(statistiken, { fortschritte = new Map(), spenden = new Map() } = {}) {
  const aus = new Map([...statistiken].map(([u, w]) => [u, { ...w }]));
  for (const [quelle, schluessel] of [[fortschritte, 'server:fortschritte'], [spenden, 'server:spenden']]) {
    for (const [u, n] of quelle) {
      if (!n) continue;
      const w = aus.get(u) ?? {};
      w[schluessel] = n;
      aus.set(u, w);
    }
  }
  return aus;
}
