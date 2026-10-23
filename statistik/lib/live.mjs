// Live-Verteiler: liest latest.log mit (Abfrage jede Sekunde, Rotation wird erkannt) und meldet Statistikänderungen.
// Ereignisse: 'ereignis' (öffentliche Form), 'online' ({ online: [uuid] }), 'daten' (leer).
import { EventEmitter } from 'node:events';
import { statSync, openSync, readSync, closeSync, readFileSync } from 'node:fs';
import { erzeugeParser, zaehleTagwechsel } from './log.mjs';
import { ereignisseAusRoh, oeffentlichesEreignis, versteckteNamenRegex } from './auswertung.mjs';
import { berlinDatum, addiereTage } from './zeit.mjs';
import { normUuid } from './sichtbarkeit.mjs';

export class LiveHub extends EventEmitter {
  constructor(instanz, { intervallMs = 1000, datenAbstandMs = 30_000 } = {}) {
    super();
    this.instanz = instanz;
    this.intervallMs = intervallMs;
    this.datenAbstandMs = datenAbstandMs;
    this.online = new Set();
    this.zustand = null; // { pos, ino, birth, parser, rest }
    this.zusatzNamen = new Map();
    this.sig = null;
    this.letztesDaten = 0;
    this.datenOffen = false;
    this.timer = null;
    this.laeuft = false;
  }

  async start() {
    try {
      const d = await this.instanz.daten();
      this.online = new Set(d.server.online);
    } catch { /* ohne Startstand */ }
    this.sig = this.instanz.statistikSignatur();
    this.beginneDatei(false);
    this.timer = setInterval(() => { this.tick().catch(() => {}); }, this.intervallMs);
    this.timer.unref?.();
  }

  stop() { clearInterval(this.timer); this.timer = null; }

  // Datei neu aufsetzen; mitSenden = Inhalt als neue Ereignisse behandeln (nach Rotation)
  beginneDatei(mitSenden) {
    const pfad = this.instanz.latestPfad();
    let st;
    try { st = statSync(pfad); } catch { this.zustand = null; return; }
    const text = readFileSync(pfad, 'utf8');
    const zeilen = text.split('\n');
    const datum = addiereTage(berlinDatum(st.mtimeMs), -zaehleTagwechsel(zeilen));
    const parser = erzeugeParser({ datum, todeMuster: this.instanz.uebersetzer.todeMuster });
    const ende = text.lastIndexOf('\n') + 1;
    const vollstaendig = text.slice(0, ende).split('\n').slice(0, -1);
    this.zustand = { pos: Buffer.byteLength(text.slice(0, ende)), ino: st.ino, birth: st.birthtimeMs, parser };
    // Parser immer durchlaufen lassen (Datumszustand), gesendet wird nur nach einer Rotation
    if (mitSenden) this.verarbeite(vollstaendig);
    else for (const z of vollstaendig) parser(z);
  }

  async tick() {
    if (this.laeuft) return;
    this.laeuft = true;
    try {
      await this.instanz.sichtbarkeit.lade();
      this.pruefeLog();
      this.pruefeStatistik();
    } finally { this.laeuft = false; }
  }

  pruefeLog() {
    const pfad = this.instanz.latestPfad();
    let st;
    try { st = statSync(pfad); } catch { this.zustand = null; return; }
    const z = this.zustand;
    if (!z) { this.beginneDatei(true); return; }
    if (st.size < z.pos || st.birthtimeMs !== z.birth || st.ino !== z.ino) { this.beginneDatei(true); return; }
    if (st.size === z.pos) return;
    const fd = openSync(pfad, 'r');
    let buf;
    try {
      buf = Buffer.alloc(st.size - z.pos);
      readSync(fd, buf, 0, buf.length, z.pos);
    } finally { closeSync(fd); }
    const letzterUmbruch = buf.lastIndexOf(0x0a);
    if (letzterUmbruch < 0) return; // Zeile noch nicht komplett
    z.pos += letzterUmbruch + 1;
    this.verarbeite(buf.subarray(0, letzterUmbruch).toString('utf8').split('\n'));
  }

  verarbeite(zeilen) {
    const roh = [];
    for (const zeile of zeilen) {
      const e = this.zustand.parser(zeile);
      if (e) roh.push(e);
    }
    if (!roh.length) return;
    this.instanz.vergissCache();
    for (const e of roh) if (e.typ === 'uuid') { const u = normUuid(e.uuid); if (u) this.zusatzNamen.set(u, e.name); }
    const sichtbar = (u) => this.instanz.sichtbarkeit.istSichtbar(u);
    const namen = this.instanz.namenKarte();
    for (const [u, n] of this.zusatzNamen) if (!namen.has(u)) namen.set(u, n);
    const namenZuUuid = new Map([...namen].map(([u, n]) => [n.toLowerCase(), u]));
    const versteckt = versteckteNamenRegex(namen, sichtbar);
    const vorher = [...this.online].sort().join();
    for (const e of ereignisseAusRoh(roh, { namenZuUuid, uebersetzer: this.instanz.uebersetzer })) {
      if (e.typ === 'join' && e.uuid && sichtbar(e.uuid)) this.online.add(e.uuid);
      else if (e.typ === 'quit' && e.uuid) this.online.delete(e.uuid);
      else if (e.typ === 'start' || e.typ === 'stopp') this.online.clear();
      const o = oeffentlichesEreignis(e, { sichtbar, versteckteNamen: versteckt });
      if (o) this.emit('ereignis', o);
    }
    if ([...this.online].sort().join() !== vorher) this.emit('online', { online: [...this.online] });
  }

  pruefeStatistik() {
    const sig = this.instanz.statistikSignatur();
    if (sig !== this.sig) { this.sig = sig; this.datenOffen = true; }
    if (this.datenOffen && Date.now() - this.letztesDaten >= this.datenAbstandMs) {
      this.datenOffen = false;
      this.letztesDaten = Date.now();
      this.instanz.vergissCache();
      this.emit('daten');
    }
  }
}
