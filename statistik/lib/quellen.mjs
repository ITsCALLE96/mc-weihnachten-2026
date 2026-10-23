// Lesende Seite: Instanzordner (Logs, usercache, Statistiken) → Eingaben für die Auswertung.
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { parseLog, logDatumAusDateiname } from './log.mjs';
import { erzeugeUebersetzer } from './uebersetzung.mjs';
import { leseStatistiken, leseUsercache, weltOrdner, statistikSignatur } from './spieler.mjs';
import { ereignisseAusRoh, werteAus, erzeugeHilfe } from './auswertung.mjs';
import { berlinDatum } from './zeit.mjs';
import { normUuid } from './sichtbarkeit.mjs';

const SECHS_STUNDEN = 6 * 3600 * 1000;

export class Instanz {
  constructor({ instanz, archiv = null, sichtbarkeit, sprache, optionen = {}, jetzt = () => Date.now(), datenAlterMs = 5000 }) {
    this.instanz = instanz;
    this.archiv = archiv;
    this.sichtbarkeit = sichtbarkeit;
    this.sprache = sprache;
    this.optionen = optionen;
    this.jetzt = jetzt;
    this.datenAlterMs = datenAlterMs;
    this.uebersetzer = erzeugeUebersetzer(sprache);
    this.hilfe = erzeugeHilfe(sprache);
    this.welt = weltOrdner(instanz);
    this.gzCache = new Map();
    this.cache = null;
  }

  logOrdner() {
    const o = [join(this.instanz, 'logs')];
    if (this.archiv) o.push(join(this.archiv, 'logs', 'paper'), join(this.archiv, 'logs'));
    return o.filter((p) => existsSync(p));
  }

  latestPfad() { return join(this.instanz, 'logs', 'latest.log'); }

  // Rohereignisse aller Logs (gz-Dateien werden einmal geparst und gemerkt)
  leseRoh() {
    const roh = [];
    const gesehen = new Set();
    for (const ordner of this.logOrdner()) {
      for (const f of readdirSync(ordner).sort()) {
        const datum = logDatumAusDateiname(f);
        if (!datum || !f.endsWith('.gz')) continue;
        const pfad = join(ordner, f);
        if (gesehen.has(pfad)) continue;
        gesehen.add(pfad);
        let st;
        try { st = statSync(pfad); } catch { continue; }
        const sig = `${st.mtimeMs}:${st.size}`;
        let e = this.gzCache.get(pfad);
        if (!e || e.sig !== sig) {
          try {
            e = { sig, roh: parseLog(gunzipSync(readFileSync(pfad)).toString('utf8'), { datum, todeMuster: this.uebersetzer.todeMuster }) };
          } catch { e = { sig, roh: [] }; }
          this.gzCache.set(pfad, e);
        }
        roh.push(...e.roh);
      }
    }
    let latestMtime = null;
    const lp = this.latestPfad();
    if (existsSync(lp)) {
      try {
        const st = statSync(lp);
        latestMtime = st.mtimeMs;
        roh.push(...parseLog(readFileSync(lp, 'utf8'), { endDatum: berlinDatum(st.mtimeMs), todeMuster: this.uebersetzer.todeMuster }));
      } catch { /* weiter ohne latest.log */ }
    }
    // Duplikate (Archiv + Instanz überlappen) entfernen, stabil nach Zeit sortieren
    const einmalig = new Map();
    for (const e of roh) {
      const k = `${e.zeit}|${e.typ}|${e.name ?? ''}|${e.titel ?? ''}|${e.schluessel ?? ''}|${e.args?.join(',') ?? ''}`;
      if (!einmalig.has(k)) einmalig.set(k, e);
    }
    return { roh: [...einmalig.values()].sort((a, b) => a.zeit - b.zeit), latestMtime };
  }

  // uuid → Name aus usercache und „UUID of player“-Logzeilen
  namenKarte(roh = []) {
    const karte = leseUsercache(this.instanz);
    for (const e of roh) {
      if (e.typ !== 'uuid') continue;
      const u = normUuid(e.uuid);
      if (u) karte.set(u, e.name);
    }
    return karte;
  }

  statistikSignatur() { return statistikSignatur(this.welt); }

  async daten() {
    const jetzt0 = this.jetzt();
    if (this.cache && jetzt0 - this.cache.zeit < this.datenAlterMs) return this.cache.wert;
    await this.sichtbarkeit.lade(jetzt0);
    const { roh, latestMtime } = this.leseRoh();
    const namen = this.namenKarte(roh);
    const namenZuUuid = new Map([...namen].map(([u, n]) => [n.toLowerCase(), u]));
    const ereignisse = ereignisseAusRoh(roh, { namenZuUuid, uebersetzer: this.uebersetzer });
    const letztesEreignis = roh.length ? roh[roh.length - 1].zeit : 0;
    const jetzt = Math.max(jetzt0, latestMtime ?? 0, letztesEreignis);
    const ss = [...roh].reverse().find((e) => e.typ === 'start' || e.typ === 'stopp');
    const laeuft = ss?.typ !== 'stopp' && latestMtime !== null && jetzt - latestMtime < SECHS_STUNDEN;
    const wert = werteAus({
      statistiken: leseStatistiken(this.welt),
      namen,
      ereignisse,
      sichtbar: (u) => this.sichtbarkeit.istSichtbar(u),
      sprache: this.sprache,
      optionen: this.optionen,
      jetzt,
      laeuft,
    });
    this.cache = { zeit: jetzt0, wert };
    return wert;
  }

  vergissCache() { this.cache = null; }
}
