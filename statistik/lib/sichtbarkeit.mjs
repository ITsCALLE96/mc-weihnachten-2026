// Sichtbarkeit: welche Spieler ausgeblendet sind. Quelle: Datei oder URL mit { "ausgeblendet": ["uuid", …] }.
// Ist nie ein Stand geladen worden, ist niemand sichtbar (sicherer Ausgangszustand).
import { readFile } from 'node:fs/promises';

export const normUuid = (u) => {
  const s = String(u ?? '').toLowerCase().replace(/-/g, '');
  return /^[0-9a-f]{32}$/.test(s)
    ? `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20)}`
    : null;
};

export function parseSichtbarkeit(text) {
  const j = JSON.parse(text);
  if (!j || !Array.isArray(j.ausgeblendet)) throw new Error('„ausgeblendet“ fehlt');
  return new Set(j.ausgeblendet.map(normUuid).filter(Boolean));
}

export class Sichtbarkeit {
  constructor(quelle, { maxAlterMs = 10_000, holeUrl = (u) => fetch(u, { signal: AbortSignal.timeout(5000) }).then((r) => r.text()) } = {}) {
    this.quelle = quelle ?? null;
    this.maxAlterMs = maxAlterMs;
    this.holeUrl = holeUrl;
    this.ausgeblendet = null; // null = noch kein Stand
    this.geladen = 0;
  }

  // Lädt neu, wenn der Stand älter als maxAlterMs ist. Fehler behalten den letzten Stand.
  async lade(jetzt = Date.now()) {
    if (!this.quelle || jetzt - this.geladen < this.maxAlterMs) return;
    this.geladen = jetzt;
    try {
      const text = /^https?:\/\//i.test(this.quelle) ? await this.holeUrl(this.quelle) : await readFile(this.quelle, 'utf8');
      this.ausgeblendet = parseSichtbarkeit(text);
    } catch (e) {
      this.letzterFehler = e;
    }
  }

  istSichtbar(uuid) {
    const u = normUuid(uuid);
    if (!u || this.ausgeblendet === null) return false;
    return !this.ausgeblendet.has(u);
  }
}
