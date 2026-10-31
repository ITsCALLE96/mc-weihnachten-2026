// Bestenlisten für Discord (Webhook-Nachricht) und die Hub-Text-Displays (Leitung/Pascal 31.10.).
// Quelle ist dieselbe Auswertung wie für die Seite (/api/daten, Ansicht „Diese Season“): ausgeblendete Spieler fehlen dort schon.
import { WERT } from './titel.mjs';
import { nachEinheit } from './format.mjs';

// hub: true = einer der 8 Hub-Plätze (Reihenfolge = Platz 1–8). Discord zeigt dieselben 8 Listen (Pascal 31.10.).
// Weltenbummler = alle Fortbewegungsarten (Laufen, Sprinten, Schwimmen, Boot, Elytra, Reittiere, Klettern, Fliegen …) außer Fallen.
export const ANZEIGE_LISTEN = [
  { id: 'spielzeit', titel: 'Dauerzocker', unter: 'Spielzeit', wert: 'spielzeit', einheit: 'zeit', symbol: '⏱️', hub: true },
  { id: 'spenden', titel: 'Weihnachtself', unter: 'Spenden für die Weihnachtsinsel', wert: 'spenden', einheit: 'anzahl', symbol: '🎁', hub: true },
  { id: 'abgebaut', titel: 'Abrissbirne', unter: 'Abgebaute Blöcke', wert: 'abgebaut', einheit: 'anzahl', symbol: '⛏️', hub: true },
  { id: 'mobs', titel: 'Monsterjäger', unter: 'Besiegte Monster', wert: 'mobs', einheit: 'anzahl', symbol: '⚔️', hub: true },
  { id: 'strecke', titel: 'Weltenbummler', unter: 'Zurückgelegte Strecke', wert: 'strecke', einheit: 'strecke', symbol: '🥾', hub: true },
  { id: 'tode', titel: 'Pechvogel', unter: 'Tode', wert: 'tode', einheit: 'anzahl', symbol: '💀', hub: true },
  { id: 'fortschritte', titel: 'Abenteurer', unter: 'Geschaffte Fortschritte', wert: 'fortschritte', einheit: 'anzahl', symbol: '🏆', hub: true },
  { id: 'diamanten', titel: 'Diamantenjäger', unter: 'Abgebaute Diamanterze', wert: 'diamanten', einheit: 'anzahl', symbol: '💎', hub: true },];

// daten = Antwort von Instanz.daten() → { season, seasonName, stand, listen: [{ id, titel, unter, symbol, einheit, hub, plaetze: [{ uuid, name, wert, text }] }] }
// Die UUID braucht nur die Grafik (Köpfe); für die Hub-Datei entfernt sie hubDatei().
export function baueBestenlisten(daten, { anzahl = 5 } = {}) {
  const listen = ANZEIGE_LISTEN.map((l) => {
    const plaetze = daten.spieler
      .map((s) => ({ uuid: s.uuid, name: s.name, wert: WERT[l.wert](s.werte, { istBlock: () => false }) || 0 }))
      .filter((p) => p.wert > 0)
      .sort((a, b) => b.wert - a.wert || a.name.localeCompare(b.name))
      .slice(0, anzahl)
      .map((p) => ({ ...p, text: nachEinheit(l.einheit, p.wert) }));
    return { id: l.id, titel: l.titel, unter: l.unter, symbol: l.symbol, einheit: l.einheit, hub: l.hub, plaetze };
  });
  return { season: daten.server.season, seasonName: daten.server.seasonName, stand: daten.server.stand, listen };
}

// Hub-Datei: wie bisher, ohne UUID und Einheit
export const hubDatei = (b) => ({ ...b, listen: b.listen.map(({ einheit, ...l }) => ({ ...l, plaetze: l.plaetze.map(({ uuid, ...p }) => p) })) });

// „Stand 31.10., 14:35 Uhr“ (deutsche Zeit)
export const standText = (iso) => `Stand ${new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(iso))} Uhr`;

export const BILD_NAME = 'bestenliste.png';

// Webhook-Nutzlast: kurzer Text über dem Bild (lib/grafik.mjs), keine Embeds (ein altes Embed wird beim Bearbeiten entfernt).
// Das Bild ersetzt beim Bearbeiten das alte (attachments). Erwähnungen sind abgeschaltet.
export function discordNachricht(b) {
  return {
    content: `**🎄 Bestenliste – ${b.seasonName ?? b.season}** · ${standText(b.stand)}
-# Wird laufend aktualisiert. Wer nicht in der Statistik auftauchen möchte, sagt im Discord Bescheid.`,
    embeds: [],
    allowed_mentions: { parse: [] },
    attachments: [{ id: 0, filename: BILD_NAME }],
  };
}
