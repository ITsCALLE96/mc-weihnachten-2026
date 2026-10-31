// Bestenlisten für Discord (Webhook-Nachricht) und die Hub-Text-Displays (Leitung/Pascal 31.10.).
// Quelle ist dieselbe Auswertung wie für die Seite (/api/daten, Ansicht „Diese Season“): ausgeblendete Spieler fehlen dort schon.
import { WERT } from './titel.mjs';
import { nachEinheit } from './format.mjs';

// hub: true = einer der 8 Hub-Plätze (Reihenfolge = Platz 1–8). Händler gibt es nur im Discord (Pascal 31.10.).
// Weltenbummler = alle Fortbewegungsarten (Laufen, Sprinten, Schwimmen, Boot, Elytra, Reittiere, Klettern, Fliegen …) außer Fallen.
export const ANZEIGE_LISTEN = [
  { id: 'spielzeit', titel: 'Dauerzocker', unter: 'Spielzeit', wert: 'spielzeit', einheit: 'zeit', symbol: '⏱️', hub: true },
  { id: 'spenden', titel: 'Weihnachtself', unter: 'Spenden für die Weihnachtsinsel', wert: 'spenden', einheit: 'anzahl', symbol: '🎁', hub: true },
  { id: 'abgebaut', titel: 'Abrissbirne', unter: 'Abgebaute Blöcke', wert: 'abgebaut', einheit: 'anzahl', symbol: '⛏️', hub: true },
  { id: 'mobs', titel: 'Monsterjäger', unter: 'Besiegte Monster', wert: 'mobs', einheit: 'anzahl', symbol: '⚔️', hub: true },
  { id: 'strecke', titel: 'Weltenbummler', unter: 'Zurückgelegte Strecke', wert: 'strecke', einheit: 'strecke', symbol: '🥾', hub: true },
  { id: 'tode', titel: 'Pechvogel', unter: 'Tode', wert: 'tode', einheit: 'anzahl', symbol: '💀', hub: true },
  { id: 'fortschritte', titel: 'Abenteurer', unter: 'Geschaffte Fortschritte', wert: 'fortschritte', einheit: 'anzahl', symbol: '🏆', hub: true },
  { id: 'diamanten', titel: 'Diamantenjäger', unter: 'Abgebaute Diamanterze', wert: 'diamanten', einheit: 'anzahl', symbol: '💎', hub: true },
  { id: 'handel', titel: 'Händler', unter: 'Handel mit Dorfbewohnern', wert: 'handel', einheit: 'anzahl', symbol: '💰', hub: false },
];

// daten = Antwort von Instanz.daten() → { season, seasonName, stand, listen: [{ id, titel, unter, symbol, hub, plaetze: [{ name, wert, text }] }] }
export function baueBestenlisten(daten, { anzahl = 5 } = {}) {
  const listen = ANZEIGE_LISTEN.map((l) => {
    const plaetze = daten.spieler
      .map((s) => ({ name: s.name, wert: WERT[l.wert](s.werte, { istBlock: () => false }) || 0 }))
      .filter((p) => p.wert > 0)
      .sort((a, b) => b.wert - a.wert || a.name.localeCompare(b.name))
      .slice(0, anzahl)
      .map((p) => ({ ...p, text: nachEinheit(l.einheit, p.wert) }));
    return { id: l.id, titel: l.titel, unter: l.unter, symbol: l.symbol, hub: l.hub, plaetze };
  });
  return { season: daten.server.season, seasonName: daten.server.seasonName, stand: daten.server.stand, listen };
}

// Discord-Markdown in Namen entschärfen (Minecraft-Namen dürfen _ enthalten)
const ohneMarkdown = (s) => s.replace(/([\\_*~`|>#[\]()-])/g, '\\$1');

const MEDAILLE = ['🥇', '🥈', '🥉'];

// Webhook-Nutzlast (eine Nachricht mit einem Embed, Felder je Liste). Erwähnungen sind abgeschaltet.
export function discordNachricht(b) {
  const fields = b.listen.map((l) => ({
    name: `${l.symbol} ${l.titel}`,
    value: `*${l.unter}*\n${l.plaetze.length
      ? l.plaetze.map((p, i) => `${MEDAILLE[i] ?? `${i + 1}.`} ${ohneMarkdown(p.name)} – ${p.text}`).join('\n')
      : 'noch niemand'}`.slice(0, 1024),
    inline: true,
  }));
  return {
    content: '',
    allowed_mentions: { parse: [] },
    embeds: [{
      title: `Bestenliste – ${b.seasonName}`,
      description: 'Wird stündlich aktualisiert. Wer nicht in der Statistik auftauchen möchte, sagt im Discord Bescheid.',
      color: 0x2f8f5b,
      fields,
      footer: { text: 'Stand' },
      timestamp: new Date(b.stand).toISOString(),
    }],
  };
}
