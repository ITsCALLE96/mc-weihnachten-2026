// Sitzungen (Join bis Quit) und Spielminuten pro Tag.
import { berlinDatum, addiereTage, tagesStart } from './zeit.mjs';

// ereignisse: nach Zeit sortiert, Typen join/quit (mit uuid), start/stopp.
// laeuft: Server läuft noch → offene Sitzungen bleiben offen (ende null); sonst enden sie beim letzten Ereignis.
// Rückgabe: [{ uuid, start, ende|null }] in ms
export function baueSitzungen(ereignisse, { laeuft = true } = {}) {
  const offen = new Map(); // uuid → start
  const aus = [];
  let letzte = null; // Zeit des vorigen Ereignisses
  const schliesse = (uuid, ende) => {
    const start = offen.get(uuid);
    offen.delete(uuid);
    if (ende > start) aus.push({ uuid, start, ende });
  };
  for (const e of ereignisse) {
    if (e.typ === 'join' && e.uuid) {
      // Join ohne Quit davor: Absturz/Logverlust – alte Sitzung endet beim letzten bekannten Ereignis
      if (offen.has(e.uuid)) schliesse(e.uuid, letzte ?? e.zeit);
      offen.set(e.uuid, e.zeit);
    } else if (e.typ === 'quit' && e.uuid) {
      if (offen.has(e.uuid)) schliesse(e.uuid, e.zeit);
    } else if (e.typ === 'stopp') {
      for (const u of [...offen.keys()]) schliesse(u, e.zeit);
    } else if (e.typ === 'start') {
      // Start ohne vorherigen Stopp: Absturz – offene Sitzungen enden beim letzten bekannten Ereignis
      for (const u of [...offen.keys()]) schliesse(u, letzte ?? e.zeit);
    }
    letzte = e.zeit;
  }
  for (const u of [...offen.keys()]) {
    if (laeuft) { aus.push({ uuid: u, start: offen.get(u), ende: null }); offen.delete(u); } else schliesse(u, letzte);
  }
  return aus.sort((a, b) => a.start - b.start || (a.uuid < b.uuid ? -1 : 1));
}

// Spielminuten je Tag (Europe/Berlin), Sitzungen über Mitternacht werden geteilt.
// Alle Tage von `von` (Standard: erster Sitzungstag) bis zum Tag von `jetzt`.
export function tageAusSitzungen(sitzungen, { jetzt, von } = {}) {
  const sek = new Map(); // datum → { uuid → Sekunden }
  let erster = null;
  for (const s of sitzungen) {
    const ende = s.ende ?? jetzt;
    if (ende <= s.start) continue;
    let tag = berlinDatum(s.start);
    if (erster === null || tag < erster) erster = tag;
    for (;;) {
      const naechster = addiereTage(tag, 1);
      const grenze = tagesStart(naechster);
      const bis = Math.min(ende, grenze);
      const von_ = Math.max(s.start, tagesStart(tag));
      const eintrag = sek.get(tag) ?? {};
      eintrag[s.uuid] = (eintrag[s.uuid] ?? 0) + (bis - von_) / 1000;
      sek.set(tag, eintrag);
      if (ende <= grenze) break;
      tag = naechster;
    }
  }
  const start = von ?? erster;
  if (!start) return [];
  const letzter = berlinDatum(jetzt);
  const tage = [];
  for (let d = start; d <= letzter; d = addiereTage(d, 1)) {
    const min = {};
    for (const [u, s] of Object.entries(sek.get(d) ?? {})) {
      const m = Math.round(s / 60);
      if (m > 0) min[u] = m;
    }
    tage.push({ datum: d, min });
  }
  return tage;
}
