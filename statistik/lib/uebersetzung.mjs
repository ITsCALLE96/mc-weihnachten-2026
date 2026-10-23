// Übersetzung englischer Paper-Logzeilen (Tod, Fortschritt) nach Deutsch über die Vorlagen aus sprache.json.
// en: "death.attack.mob": "%1$s was slain by %2$s"  →  Regex  →  de: "%1$s wurde von %2$s erschlagen"

const NAME = '[A-Za-z0-9_.]{2,24}';
const maskiere = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Zerlegt eine Vorlage in Text- und Platzhalterteile: [{ text } | { arg: 1 }]
export function zerlegeVorlage(vorlage) {
  const teile = [];
  let frei = 0;
  let rest = vorlage;
  const re = /%(?:(\d+)\$)?s/;
  for (let m = re.exec(rest); m; m = re.exec(rest)) {
    if (m.index > 0) teile.push({ text: rest.slice(0, m.index) });
    teile.push({ arg: m[1] ? Number(m[1]) : ++frei });
    rest = rest.slice(m.index + m[0].length);
  }
  if (rest) teile.push({ text: rest });
  return teile;
}

// Füllt eine Vorlage mit Argumenten (args[0] = %1$s)
export function fuelle(vorlage, args) {
  return zerlegeVorlage(vorlage).map((t) => (t.text ?? args[t.arg - 1] ?? '')).join('');
}

// Alle Todesvorlagen als Regex; spezifischere (mehr feste Zeichen) zuerst
export function baueTodeMuster(en) {
  const muster = [];
  for (const [schluessel, vorlage] of Object.entries(en)) {
    if (!schluessel.startsWith('death.') || schluessel.endsWith('.link') || schluessel === 'death.attack.message_too_long') continue;
    const teile = zerlegeVorlage(vorlage);
    if (!teile.some((t) => t.arg === 1)) continue;
    const festeZeichen = teile.reduce((s, t) => s + (t.text?.length ?? 0), 0);
    if (festeZeichen < 5) continue;
    const reihenfolge = [];
    const quelle = teile.map((t) => {
      if (t.text !== undefined) return maskiere(t.text);
      reihenfolge.push(t.arg);
      return t.arg === 1 ? `(${NAME})` : '(.+?)';
    }).join('');
    muster.push({ schluessel, regex: new RegExp(`^${quelle}$`), reihenfolge, festeZeichen });
  }
  return muster.sort((a, b) => b.festeZeichen - a.festeZeichen);
}

export function erkenneTod(text, muster) {
  for (const m of muster) {
    const t = m.regex.exec(text);
    if (!t) continue;
    const args = [];
    m.reihenfolge.forEach((nr, i) => { args[nr - 1] = t[i + 1]; });
    return { schluessel: m.schluessel, args };
  }
  return null;
}

const DEFAULT_ART = {
  made: (n, t) => `${n} hat den Fortschritt [${t}] erzielt`,
  challenge: (n, t) => `${n} hat die Herausforderung [${t}] abgeschlossen`,
  goal: (n, t) => `${n} hat das Ziel [${t}] erreicht`,
};

export function erzeugeUebersetzer(sprache) {
  const en = sprache?.en ?? {};
  const de = sprache?.de ?? {};
  const todeMuster = baueTodeMuster(en);

  // englischer Anzeigename → deutscher (Entities vor Gegenständen vor Blöcken)
  const namen = new Map();
  for (const pre of ['entity.minecraft.', 'item.minecraft.', 'block.minecraft.']) {
    for (const [k, v] of Object.entries(en)) {
      if (k.startsWith(pre) && typeof de[k] === 'string' && !namen.has(v)) namen.set(v, de[k]);
    }
  }
  const titel = new Map();
  for (const [k, v] of Object.entries(en)) {
    if (k.startsWith('advancements.') && k.endsWith('.title') && typeof de[k] === 'string' && !titel.has(v)) titel.set(v, de[k]);
  }

  const argDeutsch = (a) => {
    const g = /^\[(.*)\]$/.exec(a);
    if (g) return `[${namen.get(g[1]) ?? g[1]}]`;
    return namen.get(a) ?? a;
  };

  return {
    todeMuster,
    erkenneTod: (text) => erkenneTod(text, todeMuster),
    // Argument 1 (Spielername) bleibt unverändert
    todDeutsch(schluessel, args) {
      const vorlage = de[schluessel] ?? en[schluessel];
      if (!vorlage) return null;
      return fuelle(vorlage, args.map((a, i) => (i === 0 ? a : argDeutsch(a))));
    },
    fortschrittDeutsch(art, name, titelEn) {
      return (DEFAULT_ART[art] ?? DEFAULT_ART.made)(name, titel.get(titelEn) ?? titelEn);
    },
    argDeutsch,
  };
}
