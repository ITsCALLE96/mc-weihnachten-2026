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
import { leseFortschritte, leseSpenden, ergaenzeWerte } from './zusatz.mjs';
import { leseLive, mitLive } from './livewerte.mjs';
import { aktuelleSeason, seasonsImArchiv, seasonName, letzterSchnappschuss, seasonSignatur, summiereStatistiken } from './seasons.mjs';

const SECHS_STUNDEN = 6 * 3600 * 1000;

export class Instanz {
  // archiv = Wurzel des Archivs (mit SEASON und je Season einem Ordner); season = feste Kennung statt <archiv>/SEASON
  // allzeitOhne = Seasons, die nicht in „Allzeit“ zählen (Standard: testlauf)
  constructor({ instanz, archiv = null, season = null, allzeitOhne = ['testlauf'], sichtbarkeit, sprache, optionen = {}, jetzt = () => Date.now(), datenAlterMs = 5000 }) {
    this.instanz = instanz;
    this.archiv = archiv;
    this.festeSeason = season;
    this.allzeitOhne = new Set(allzeitOhne);
    this.vergangenCache = new Map();
    this.sichtbarkeit = sichtbarkeit;
    this.sprache = sprache;
    this.optionen = optionen;
    this.jetzt = jetzt;
    this.datenAlterMs = datenAlterMs;
    this.uebersetzer = erzeugeUebersetzer(sprache);
    this.hilfe = erzeugeHilfe(sprache);
    this.welt = weltOrdner(instanz);
    this.gzCache = new Map();
    this.cache = new Map();
  }

  season() {
    return this.festeSeason ?? (this.archiv && aktuelleSeason(this.archiv)) ?? 'weihnachten-2026';
  }

  // Logs der laufenden Season: Instanz + <archiv>/<season>/logs/paper
  logOrdner() {
    const o = [join(this.instanz, 'logs')];
    if (this.archiv) o.push(join(this.archiv, this.season(), 'logs', 'paper'));
    return o.filter((p) => existsSync(p));
  }

  // Abgeschlossene Seasons, die in „Allzeit“ zählen
  vergangeneSeasons() {
    const aktuell = this.season();
    return seasonsImArchiv(this.archiv).filter((id) => id !== aktuell && !this.allzeitOhne.has(id));
  }

  // Eine abgeschlossene Season: letzter Schnappschuss + Logs (gemerkt, solange sich nichts ändert)
  vergangen(id) {
    const ordner = join(this.archiv, id);
    const sig = seasonSignatur(ordner);
    const alt = this.vergangenCache.get(id);
    if (alt && alt.sig === sig) return alt.wert;
    const schnapp = letzterSchnappschuss(ordner);
    const { roh } = this.leseRoh([join(ordner, 'logs', 'paper')], false);
    const statistiken = ergaenzeWerte(schnapp?.statistiken ?? new Map(), { fortschritte: schnapp?.fortschritte, spenden: schnapp?.spenden });
    const wert = { statistiken, namen: schnapp?.namen ?? new Map(), roh };
    this.vergangenCache.set(id, { sig, wert });
    return wert;
  }

  seasonListe() {
    const aktuell = this.season();
    const ids = [...new Set([...this.vergangeneSeasons(), aktuell])];
    return ids.map((id) => ({ id, name: id === aktuell && this.optionen.seasonName ? this.optionen.seasonName : seasonName(id, this.archiv), aktuell: id === aktuell }));
  }

  latestPfad() { return join(this.instanz, 'logs', 'latest.log'); }

  // Rohereignisse aller Logs (gz-Dateien werden einmal geparst und gemerkt)
  leseRoh(ordnerListe = this.logOrdner(), mitLatest = true) {
    const roh = [];
    const gesehen = new Set();
    for (const ordner of ordnerListe.filter((p) => existsSync(p))) {
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
    if (mitLatest && existsSync(lp)) {
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

  // ansicht: 'season' (laufende Season) oder 'allzeit' (laufende + abgeschlossene Seasons summiert)
  async daten({ ansicht = 'season' } = {}) {
    if (ansicht !== 'allzeit') ansicht = 'season';
    const jetzt0 = this.jetzt();
    const alt = this.cache.get(ansicht);
    if (alt && jetzt0 - alt.zeit < this.datenAlterMs) return alt.wert;
    await this.sichtbarkeit.lade(jetzt0);
    const { roh: rohAktuell, latestMtime } = this.leseRoh();
    let roh = rohAktuell;
    // Online-Spieler: Live-Werte aus dem laufenden SMP (sonst bis zu 5 Minuten alt)
    const live = leseLive(this.instanz, { jetzt: jetzt0 });
    let statistiken = mitLive(ergaenzeWerte(leseStatistiken(this.welt), { fortschritte: leseFortschritte(this.welt), spenden: leseSpenden(this.instanz) }), live);
    let namen = this.namenKarte(rohAktuell);
    for (const [u, l] of live) if (l.name && !namen.has(u)) namen.set(u, l.name);
    const seasons = this.seasonListe();
    if (ansicht === 'allzeit') {
      const alte = this.vergangeneSeasons().map((id) => this.vergangen(id));
      statistiken = summiereStatistiken([...alte.map((a) => a.statistiken), statistiken]);
      const alleNamen = new Map();
      for (const a of alte) for (const [u, n] of a.namen) alleNamen.set(u, n);
      for (const a of alte) for (const e of a.roh) if (e.typ === 'uuid') { const u = normUuid(e.uuid); if (u) alleNamen.set(u, e.name); }
      for (const [u, n] of namen) alleNamen.set(u, n);
      namen = alleNamen;
      roh = [...alte.flatMap((a) => a.roh), ...rohAktuell].sort((a, b) => a.zeit - b.zeit);
    }
    const namenZuUuid = new Map([...namen].map(([u, n]) => [n.toLowerCase(), u]));
    const ereignisse = ereignisseAusRoh(roh, { namenZuUuid, uebersetzer: this.uebersetzer });
    const letztesEreignis = roh.length ? roh[roh.length - 1].zeit : 0;
    const jetzt = Math.max(jetzt0, latestMtime ?? 0, letztesEreignis);
    const ss = [...roh].reverse().find((e) => e.typ === 'start' || e.typ === 'stopp');
    const laeuft = ss?.typ !== 'stopp' && latestMtime !== null && jetzt - latestMtime < SECHS_STUNDEN;
    const wert = werteAus({
      statistiken,
      namen,
      ereignisse,
      sichtbar: (u) => this.sichtbarkeit.istSichtbar(u),
      sprache: this.sprache,
      optionen: { ...this.optionen, season: this.season(), seasons, ansicht },
      jetzt,
      laeuft,
    });
    this.cache.set(ansicht, { zeit: jetzt0, wert });
    return wert;
  }

  vergissCache() { this.cache.clear(); }
}
