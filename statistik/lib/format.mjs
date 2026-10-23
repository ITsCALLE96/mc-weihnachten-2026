// Formatierer für Sprüche und Fakten (deutsch). Rohwerte: zeit = Ticks (20/s), strecke = cm, schaden = Zehntelpunkte.
export function anzahl(n) {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function zeit(ticks) {
  const sek = Math.floor(ticks / 20);
  const min = Math.floor(sek / 60);
  const std = Math.floor(min / 60);
  if (std >= 24) {
    const tage = Math.floor(std / 24);
    return `${tage} ${tage === 1 ? 'Tag' : 'Tage'} ${std % 24} Std.`;
  }
  if (std >= 1) return `${std} Std. ${min % 60} Min.`;
  if (min >= 1) return `${min} Min.`;
  return `${sek} Sek.`;
}

export function strecke(cm) {
  const m = cm / 100;
  if (m < 1000) return `${anzahl(m)} m`;
  return `${(m / 1000).toFixed(1).replace('.', ',')} km`;
}

// Schaden in Herzen (Zehntelpunkte ÷ 20)
export function schaden(roh) {
  return `${anzahl(roh / 20)} Herzen`;
}

export const fmt = { zeit, strecke, anzahl, schaden };
export const nachEinheit = (einheit, wert) => (fmt[einheit] ?? anzahl)(wert);
