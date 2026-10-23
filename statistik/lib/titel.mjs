// Bestenlisten, Sprüche und „Wusstest du?“-Fakten der Statistikseite.
// Ton: frech, aber lieb – gespottet wird nur über Rekorde, nie über wenig Spielzeit oder Anfänger.
//
// Werte-Schlüssel sind „kategorie:sache“ ohne „minecraft:“, z. B. „custom:play_time“, „mined:diamond_ore“.
// Ein Wert ist entweder ein Schlüssel oder eine Funktion (werte, hilfe) => Zahl.

export const ESSEN = [
  'apple', 'golden_apple', 'enchanted_golden_apple', 'bread', 'cookie', 'baked_potato', 'potato',
  'poisonous_potato', 'carrot', 'golden_carrot', 'beetroot', 'beetroot_soup', 'mushroom_stew', 'rabbit_stew',
  'suspicious_stew', 'cooked_beef', 'beef', 'cooked_porkchop', 'porkchop', 'cooked_chicken', 'chicken',
  'cooked_mutton', 'mutton', 'cooked_rabbit', 'rabbit', 'cooked_cod', 'cod', 'cooked_salmon', 'salmon',
  'tropical_fish', 'pufferfish', 'melon_slice', 'sweet_berries', 'glow_berries', 'pumpkin_pie', 'dried_kelp',
  'honey_bottle', 'chorus_fruit', 'rotten_flesh', 'spider_eye',
];

const summe = (werte, praefix) => {
  let s = 0;
  for (const [k, v] of Object.entries(werte)) if (k.startsWith(praefix)) s += v;
  return s;
};

export const WERT = {
  spielzeit: (w) => w['custom:play_time'] ?? 0,
  tode: (w) => w['custom:deaths'] ?? 0,
  diamanten: (w) => (w['mined:diamond_ore'] ?? 0) + (w['mined:deepslate_diamond_ore'] ?? 0),
  abgebaut: (w) => summe(w, 'mined:'),
  mobs: (w) => w['custom:mob_kills'] ?? 0,
  // alle Fortbewegungsarten außer Fallen
  strecke: (w) => {
    let s = 0;
    for (const [k, v] of Object.entries(w)) {
      if (k.startsWith('custom:') && k.endsWith('_one_cm') && k !== 'custom:fall_one_cm') s += v;
    }
    return s;
  },
  totems: (w) => w['used:totem_of_undying'] ?? 0,
  schaden: (w) => w['custom:damage_dealt'] ?? 0,
  mahlzeiten: (w) => ESSEN.reduce((s, e) => s + (w[`used:${e}`] ?? 0), 0) + (w['custom:eat_cake_slice'] ?? 0),
  glocke: (w) => w['custom:bell_ring'] ?? 0,
  fische: (w) => w['custom:fish_caught'] ?? 0,
  handel: (w) => w['custom:traded_with_villager'] ?? 0,
  gefallen: (w) => w['custom:fall_one_cm'] ?? 0,
  elytra: (w) => w['custom:aviate_one_cm'] ?? 0,
  schlaf: (w) => w['custom:sleep_in_bed'] ?? 0,
  wasser: (w) => (w['custom:swim_one_cm'] ?? 0) + (w['custom:walk_under_water_one_cm'] ?? 0) + (w['custom:walk_on_water_one_cm'] ?? 0),
  zucht: (w) => w['custom:animals_bred'] ?? 0,
  truhen: (w) => w['custom:open_chest'] ?? 0,
  spruenge: (w) => w['custom:jump'] ?? 0,
  kuchen: (w) => w['custom:eat_cake_slice'] ?? 0,
  schrott: (w) => w['mined:ancient_debris'] ?? 0,
  // gesetzte Blöcke: „benutzt“ zählt bei Blöcken das Platzieren; hilfe.istBlock kommt aus der Sprachdatei
  gebaut: (w, hilfe) => {
    let s = 0;
    for (const [k, v] of Object.entries(w)) if (k.startsWith('used:') && hilfe.istBlock(k.slice(5))) s += v;
    return s;
  },
};

// Einheiten zum Anzeigen: zeit = Ticks (20/s), strecke = cm, schaden = Zehntel halbe Herzen, anzahl = Stück
// Reihenfolge = Reihenfolge auf der Seite (die ersten neun wie bei CraftAttack)
export const BESTENLISTEN = [
  { id: 'dauerzocker', titel: 'Dauerzocker', unter: 'Meiste Spielzeit', wert: 'spielzeit', einheit: 'zeit' },
  { id: 'diamantenbank', titel: 'Diamantenbank', unter: 'Wer hat, der hat', wert: 'diamanten', einheit: 'anzahl' },
  { id: 'friedhof', titel: 'Friedhof', unter: 'Hier liegen sie. Immer wieder.', wert: 'tode', einheit: 'anzahl' },
  { id: 'abrissbirne', titel: 'Abrissbirne', unter: 'Meiste Blöcke abgebaut', wert: 'abgebaut', einheit: 'anzahl' },
  { id: 'monsterjaeger', titel: 'Monsterjäger', unter: 'Meiste Mobs erledigt', wert: 'mobs', einheit: 'anzahl' },
  { id: 'weltenbummler', titel: 'Weltenbummler', unter: 'Weiteste Strecke', wert: 'strecke', einheit: 'strecke' },
  { id: 'unsterblich', titel: 'Unsterblich', unter: 'Meiste Totems verbraucht', wert: 'totems', einheit: 'anzahl' },
  { id: 'kampfmaschine', titel: 'Kampfmaschine', unter: 'Meister Schaden ausgeteilt', wert: 'schaden', einheit: 'schaden' },
  { id: 'vielfrass', titel: 'Vielfraß', unter: 'Meiste Mahlzeiten verdrückt', wert: 'mahlzeiten', einheit: 'anzahl' },
  { id: 'baumeister', titel: 'Baumeister', unter: 'Meiste Blöcke gesetzt', wert: 'gebaut', einheit: 'anzahl' },
  { id: 'gloeckner', titel: 'Glöckner', unter: 'Dorfglocke im Dauereinsatz', wert: 'glocke', einheit: 'anzahl' },
  { id: 'angelkoenig', titel: 'Angelkönig', unter: 'Meiste Fische an Land gezogen', wert: 'fische', einheit: 'anzahl' },
  { id: 'haendler', titel: 'Händler', unter: 'Meiste Geschäfte mit Dorfbewohnern', wert: 'handel', einheit: 'anzahl' },
  { id: 'elytra', titel: 'Elytra-Ass', unter: 'Weiteste Strecke geflogen', wert: 'elytra', einheit: 'strecke' },
  { id: 'sturzflieger', titel: 'Sturzflieger', unter: 'Am tiefsten gefallen', wert: 'gefallen', einheit: 'strecke' },
  { id: 'wasserratte', titel: 'Wasserratte', unter: 'Weiteste Strecke im Wasser', wert: 'wasser', einheit: 'strecke' },
  { id: 'langschlaefer', titel: 'Langschläfer', unter: 'Am häufigsten ins Bett', wert: 'schlaf', einheit: 'anzahl' },
  { id: 'bauernhof', titel: 'Bauernhof', unter: 'Meiste Tiere gezüchtet', wert: 'zucht', einheit: 'anzahl' },
  { id: 'truhenwuehler', titel: 'Truhenwühler', unter: 'Meiste Truhen geöffnet', wert: 'truhen', einheit: 'anzahl' },
  { id: 'flummi', titel: 'Flummi', unter: 'Meiste Sprünge', wert: 'spruenge', einheit: 'anzahl' },
  { id: 'schatzsucher', titel: 'Schatzsucher', unter: 'Meiste Antiken Schrott gefunden', wert: 'schrott', einheit: 'anzahl' },
];

// Sprüche nach Schwellen (Wert in Roh-Einheit). Es gilt die höchste erreichte Schwelle.
// {n} = formatierter Wert. Nur Rekord-Spott, keine Witze über niedrige Werte.
const STUNDE = 20 * 60 * 60;
const KM = 100 * 1000;
export const SPRUECHE = {
  spielzeit: [
    [10 * STUNDE, '{n} gespielt – das ist schon kein Hobby mehr, das ist ein Nebenjob.'],
    [50 * STUNDE, '{n} gespielt. Die Familie hat eine Vermisstenanzeige aufgegeben.'],
    [150 * STUNDE, '{n} gespielt. Ab hier zahlt man eigentlich Miete auf dem Server.'],
  ],
  tode: [
    [10, '{n} Mal gestorben – der Friedhof hat eine Stammkundenkarte ausgestellt.'],
    [50, '{n} Tode. Der Respawn-Knopf ist schon ganz abgegriffen.'],
    [150, '{n} Tode. Ein eigener Friedhof wurde beantragt.'],
  ],
  diamanten: [
    [20, '{n} Diamanten abgebaut – irgendwer muss ja die Wirtschaft ankurbeln.'],
    [100, '{n} Diamanten. Die Bank fragt nach Anlagetipps.'],
    [300, '{n} Diamanten. Der Rest des Servers schürft offiziell nur noch Stein.'],
  ],
  abgebaut: [
    [5000, '{n} Blöcke abgebaut – die Spitzhacke hat Überstunden angemeldet.'],
    [50000, '{n} Blöcke abgebaut. Die Welt hat jetzt deutlich mehr Löcher.'],
    [200000, '{n} Blöcke. Geologen sprechen von einer neuen Erdepoche.'],
  ],
  mobs: [
    [100, '{n} Mobs erledigt – die Zombies erzählen sich Gruselgeschichten über dich.'],
    [1000, '{n} Mobs erledigt. Creeper explodieren inzwischen vorsorglich woanders.'],
  ],
  strecke: [
    [50 * KM, '{n} unterwegs – einmal quer durchs Ruhrgebiet, nur mit mehr Creepern.'],
    [500 * KM, '{n} zurückgelegt. Das ist Berlin–München, zu Fuß, in Klötzchen.'],
    [2000 * KM, '{n}. Die Schuhe wurden bereits dreimal neu besohlt.'],
  ],
  totems: [
    [1, '{n} Totem verbraucht – einmal dem Tod von der Schippe gesprungen.'],
    [5, '{n} Totems verbraucht. Der Tod hat langsam keine Lust mehr.'],
  ],
  mahlzeiten: [
    [200, '{n} Mahlzeiten verdrückt – das Hungerbalken-Problem ist gelöst.'],
    [1000, '{n} Mahlzeiten. Die Kühe auf dem Server haben eine Gewerkschaft gegründet.'],
  ],
  glocke: [
    [50, '{n} Mal die Glocke geläutet – im Dorf ist an Schlaf nicht mehr zu denken.'],
    [500, '{n} Mal die Glocke geläutet. Die Dorfbewohner haben gekündigt.'],
  ],
  fische: [
    [50, '{n} Fische geangelt – Petri Heil, aber bitte auch mal wieder Bergbau.'],
    [300, '{n} Fische. Im Ozean wird es langsam leer.'],
  ],
  handel: [
    [50, '{n} Geschäfte mit Dorfbewohnern – die Smaragde fließen.'],
    [500, '{n} Geschäfte. Die Dorfbewohner nennen dich nur noch „Chef“.'],
  ],
  elytra: [
    [10 * KM, '{n} mit der Elytra geflogen – Lufthansa hat angefragt.'],
    [100 * KM, '{n} in der Luft. Bodenkontakt nur noch zum Tanken.'],
  ],
  gefallen: [
    [2 * KM, '{n} gefallen – die Schwerkraft grüßt freundlich.'],
    [10 * KM, '{n} im freien Fall. Der Boden kennt dich schon persönlich.'],
  ],
  wasser: [
    [5 * KM, '{n} im Wasser – zur Hälfte Fisch.'],
    [30 * KM, '{n} geschwommen. Kiemen sind beantragt.'],
  ],
  schlaf: [
    [30, '{n} Mal ins Bett – Phantome kennen dich nur vom Hörensagen.'],
    [150, '{n} Mal geschlafen. Der Wecker ist dein Endgegner.'],
  ],
  zucht: [
    [100, '{n} Tiere gezüchtet – Bauer sucht Frau, Server sucht Platz.'],
    [500, '{n} Tiere. Die Weide ist offiziell eine Großstadt.'],
  ],
  truhen: [
    [500, '{n} Truhen geöffnet – Ordnung ist das halbe Leben, die andere Hälfte ist Suchen.'],
    [3000, '{n} Truhen geöffnet. Irgendwo ist das Item bestimmt.'],
  ],
  spruenge: [
    [5000, '{n} Sprünge – Hüpfen spart keine Zeit, aber es macht Spaß.'],
    [30000, '{n} Sprünge. Die Knie haben eine Pause beantragt.'],
  ],
  kuchen: [
    [20, '{n} Stück Kuchen – jeder Tag ist ein Geburtstag.'],
  ],
  schrott: [
    [16, '{n} Antiker Schrott – das Netherit-Set ist so gut wie fertig.'],
    [64, '{n} Antiker Schrott. Der Nether hat Löcher wie ein Schweizer Käse.'],
  ],
  gebaut: [
    [5000, '{n} Blöcke gesetzt – hier entsteht was Großes.'],
    [50000, '{n} Blöcke gesetzt. Der Bauantrag kam erst hinterher.'],
  ],
};

// Platz 1 einer Bestenliste bekommt immer einen eigenen Spruch, auch unter allen Schwellen
export const PLATZ_EINS = '{titel} des Servers – Platz 1 mit {n}.';

// „Wusstest du?“-Fakten. Jede Funktion bekommt { gesamt, spieler, fmt } und liefert Text oder null.
// gesamt: Summen über alle sichtbaren Spieler je WERT-Name, spieler: [{ name, w: { WERT-Name: Zahl } }]
// fmt: { zeit(roh), strecke(roh), anzahl(n) }
const bester = (spieler, wert) => spieler.reduce((b, s) => (s.w[wert] > (b?.w[wert] ?? 0) ? s : b), null);
export const FAKTEN = [
  ({ gesamt, fmt }) => gesamt.strecke >= 585 * KM
    ? `Zusammen seid ihr ${fmt.strecke(gesamt.strecke)} unterwegs gewesen – weiter als von Berlin nach München.`
    : gesamt.strecke > 0 ? `Zusammen seid ihr ${fmt.strecke(gesamt.strecke)} unterwegs gewesen.` : null,
  ({ gesamt, fmt }) => gesamt.spielzeit > 0
    ? `Alle zusammen habt ihr ${fmt.zeit(gesamt.spielzeit)} gespielt – das sind ${fmt.anzahl(Math.round(gesamt.spielzeit / (20 * 60 * 60 * 24)))} Tage am Stück.`
    : null,
  ({ gesamt, fmt }) => gesamt.tode > 0 ? `Auf dem Server wurde ${fmt.anzahl(gesamt.tode)} Mal gestorben. Ruhet in Frieden.` : null,
  ({ spieler, fmt }) => {
    const b = bester(spieler, 'glocke');
    return b ? `${b.name} hat die Dorfglocke ${fmt.anzahl(b.w.glocke)} Mal geläutet. Die Nachbarn sind informiert.` : null;
  },
  ({ spieler, fmt }) => {
    const b = bester(spieler, 'truhen');
    return b ? `${b.name} hat ${fmt.anzahl(b.w.truhen)} Truhen geöffnet – ob das gesuchte Item je gefunden wurde, ist unklar.` : null;
  },
  ({ gesamt, fmt }) => gesamt.diamanten > 0 ? `Insgesamt wurden ${fmt.anzahl(gesamt.diamanten)} Diamanten abgebaut.` : null,
  ({ gesamt, fmt }) => gesamt.mahlzeiten > 0 ? `Ihr habt zusammen ${fmt.anzahl(gesamt.mahlzeiten)} Mahlzeiten gegessen. Guten Appetit!` : null,
  ({ spieler, fmt }) => {
    const b = bester(spieler, 'spruenge');
    return b ? `${b.name} ist ${fmt.anzahl(b.w.spruenge)} Mal gesprungen. Gehen wäre auch gegangen.` : null;
  },
  ({ gesamt, fmt }) => gesamt.abgebaut > 0
    ? `${fmt.anzahl(gesamt.abgebaut)} abgebaute Blöcke – damit könnte man ${fmt.anzahl(Math.floor(gesamt.abgebaut / 64))} volle Stapel füllen.`
    : null,
  ({ gesamt, fmt }) => gesamt.fische > 0 ? `${fmt.anzahl(gesamt.fische)} Fische wurden geangelt. Der Ozean fühlt sich beobachtet.` : null,
];
