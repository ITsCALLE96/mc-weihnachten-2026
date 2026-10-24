// Statistikseite – eine Seite, Ansichten per Hash: #/, #/spieler, #/spieler/<name>, #/tagebuch[/<datum>]
// Daten: GET /api/daten (Vertrag: ../DATENFORMAT.md), live: EventSource /api/live

const FARBEN = ['diamant', 'gold', 'redstone', 'smaragd', 'amethyst', 'kupfer', 'lapis', 'schnee'];
const ZEILEN_ANFANG = 60;

let daten = null;
// 'season' = laufende Season, 'allzeit' = alle Seasons zusammen (Wahl bleibt im Browser gemerkt)
let ansicht = 'season';
try { if (localStorage.getItem('mc-statistik-ansicht') === 'allzeit') ansicht = 'allzeit'; } catch { /* ohne Speicher */ }
let online = new Set();
let ereignisse = [];
const profilZustand = { kategorie: 'alle', suche: '', alle: false };
const main = document.getElementById('inhalt');

// ---------- Formatierung ----------

const zahl = new Intl.NumberFormat('de-DE');
const zahl1 = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 });
const relativ = new Intl.RelativeTimeFormat('de', { numeric: 'auto' });
const datumKurz = new Intl.DateTimeFormat('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' });
const datumLang = new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
const uhrzeit = new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit' });

const fmt = {
  anzahl: (n) => zahl.format(n),
  zeit(ticks) {
    const min = Math.round(ticks / 1200);
    if (min < 60) return `${min} Min.`;
    const std = Math.floor(min / 60);
    if (std < 48) return `${std} Std.${min % 60 ? ` ${min % 60} Min.` : ''}`;
    const tage = Math.floor(std / 24);
    return `${tage} ${tage === 1 ? 'Tag' : 'Tage'} ${std % 24} Std.`;
  },
  minuten(min) { return fmt.zeit(min * 1200); },
  stunden: (ticks) => zahl.format(Math.round(ticks / 72000)),
  km: (cm) => (cm >= 10000000 ? zahl.format(Math.round(cm / 100000)) : zahl1.format(cm / 100000)),
  strecke(cm) {
    const m = cm / 100;
    return m < 1000 ? `${zahl.format(Math.round(m))} m` : `${zahl1.format(m / 1000)} km`;
  },
  schaden: (z) => `${zahl.format(Math.round(z / 20))} Herzen`,
  wert(einheit, roh) {
    if (einheit === 'zeit') return fmt.zeit(roh);
    if (einheit === 'strecke') return fmt.strecke(roh);
    if (einheit === 'schaden') return fmt.schaden(roh);
    return fmt.anzahl(roh);
  },
  vor(iso) {
    if (!iso) return 'nie';
    const s = Math.min(0, (new Date(iso) - Date.now()) / 1000);
    const stufen = [[60, 'second'], [3600, 'minute'], [86400, 'hour'], [604800, 'day'], [Infinity, 'week']];
    const teiler = { second: 1, minute: 60, hour: 3600, day: 86400, week: 604800 };
    for (const [grenze, einheit] of stufen) {
      if (Math.abs(s) < grenze) return relativ.format(Math.round(s / teiler[einheit]), einheit);
    }
    return '';
  },
};

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (z) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[z]);

function hash(text) {
  let h = 2166136261;
  for (const z of text) h = Math.imul(h ^ z.codePointAt(0), 16777619);
  return h >>> 0;
}
const farbeVon = (uuid) => FARBEN[hash(uuid) % (FARBEN.length - 1)];
const kopf = (uuid, groesse, alt = '') =>
  `<img src="/api/kopf/${encodeURIComponent(uuid)}.png" alt="${esc(alt)}" width="${groesse}" height="${groesse}" loading="lazy" decoding="async">`;
const profilLink = (name) => `#/spieler/${encodeURIComponent(name)}`;

// Pixel-Symbole (8×8), X = gefüllt
const SYMBOLE = {
  tod: ['.XXXXXX.', 'XXXXXXXX', 'X..XX..X', 'X..XX..X', 'XXXXXXXX', '.XX..XX.', '.X.XX.X.', '........'],
  join: ['...XX...', '..XXXX..', '.XXXXXX.', 'XXXXXXXX', '...XX...', '...XX...', '...XX...', '...XX...'],
  quit: ['...XX...', '...XX...', '...XX...', '...XX...', 'XXXXXXXX', '.XXXXXX.', '..XXXX..', '...XX...'],
  fortschritt: ['...XX...', '...XX...', 'XXXXXXXX', '.XXXXXX.', '..XXXX..', '.XXXXXX.', '.XX..XX.', 'X......X'],
  start: ['........', '.XXXXXX.', '.X....X.', '.X.XX.X.', '.X.XX.X.', '.X....X.', '.XXXXXX.', '........'],
};
const SYMBOLFARBE = { tod: '#eef2ff', join: '#3ccf6e', quit: '#8c94c0', fortschritt: '#f6c744', start: '#4fd6dc', stopp: '#ef5a50' };
function symbol(typ) {
  const raster = SYMBOLE[typ] ?? SYMBOLE.start;
  let rects = '';
  raster.forEach((zeile, y) => [...zeile].forEach((z, x) => { if (z === 'X') rects += `<rect x="${x}" y="${y}" width="1" height="1"/>`; }));
  return `<svg viewBox="0 0 8 8" shape-rendering="crispEdges" fill="${SYMBOLFARBE[typ] ?? '#eef2ff'}" aria-hidden="true">${rects}</svg>`;
}

// ---------- Kennzahlen pro Spieler (für Profil und Ränge) ----------

const summe = (w, praefix) => Object.entries(w).reduce((s, [k, v]) => (k.startsWith(praefix) ? s + v : s), 0);
const PROFILZAHLEN = [
  { id: 'spielzeit', name: 'Spielzeit', farbe: 'gold', wert: (w) => w['custom:play_time'] ?? 0,
    zeige: (t) => (t >= 72000 ? `${fmt.stunden(t)} Std.` : fmt.zeit(t)) },
  { id: 'tode', name: 'Tode', farbe: 'redstone', wert: (w) => w['custom:deaths'] ?? 0, zeige: fmt.anzahl },
  { id: 'strecke', name: 'Unterwegs', farbe: 'diamant', zeige: fmt.strecke,
    wert: (w) => Object.entries(w).reduce((s, [k, v]) => (k.startsWith('custom:') && k.endsWith('_one_cm') && k !== 'custom:fall_one_cm' ? s + v : s), 0) },
  { id: 'abgebaut', name: 'Blöcke abgebaut', farbe: 'kupfer', wert: (w) => summe(w, 'mined:'), zeige: fmt.anzahl },
  { id: 'mobs', name: 'Mobs erledigt', farbe: 'smaragd', wert: (w) => w['custom:mob_kills'] ?? 0, zeige: fmt.anzahl },
  { id: 'diamanten', name: 'Diamanten', farbe: 'amethyst', wert: (w) => (w['mined:diamond_ore'] ?? 0) + (w['mined:deepslate_diamond_ore'] ?? 0), zeige: fmt.anzahl },
];

function rang(spieler, wertVon, uuid) {
  const eigen = wertVon(spieler.find((s) => s.uuid === uuid)?.werte ?? {});
  if (!eigen) return null;
  return 1 + spieler.filter((s) => wertVon(s.werte) > eigen).length;
}

// ---------- Rahmen ----------

function setzeTitel(teil) {
  const name = daten?.server?.name ?? 'Server';
  document.title = teil ? `${teil} · ${name}` : `Stats · ${name}`;
  for (const el of document.querySelectorAll('[data-servername]')) el.textContent = name;
}

function markiereNavi(bereich) {
  for (const a of document.querySelectorAll('[data-navi]')) {
    if (a.dataset.navi === bereich) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  }
}

const spielerVon = (uuid) => daten.spieler.find((s) => s.uuid === uuid);

// ---------- Season / Allzeit ----------

function zeitraumText() {
  const s = daten.server;
  if (s.ansicht === 'allzeit') return `Allzeit · ${s.seasons.length} Seasons`;
  return `Season ${s.seasonName}`;
}

function umschalter(stil = '') {
  if ((daten.server.seasons ?? []).length < 2) return '';
  const knopf = (wert, text) => `<button type="button" data-ansicht="${wert}" aria-pressed="${ansicht === wert}">${text}</button>`;
  return `<div class="umschalter${stil ? ` ${stil}` : ''}" role="group" aria-label="Zeitraum">${knopf('season', 'Diese Season')}${knopf('allzeit', 'Allzeit')}</div>`;
}

async function wechsleAnsicht(neu) {
  if (neu === ansicht) return;
  ansicht = neu;
  try { localStorage.setItem('mc-statistik-ansicht', neu); } catch { /* ohne Speicher */ }
  const y = window.scrollY;
  try { await laden(); } catch { return; }
  zeichne();
  window.scrollTo(0, y);
}

// ---------- Übersicht ----------

function ansichtUebersicht() {
  const g = daten.gesamt;
  const s = daten.server;
  main.innerHTML = `
    <section class="himmel">
      <canvas class="schnee" aria-hidden="true"></canvas>
      <div class="himmel-text">
        <h1 class="riese">Stats<span class="unter">${esc(s.name)} · ${esc(zeitraumText())}</span></h1>
        <p class="lead">Wer ist drauf, wer führt – und wer liegt schon wieder auf dem Friedhof.</p>
        <p class="status" data-status></p>
        ${umschalter()}
        ${s.testmodus ? '<br><span class="testhinweis">Testdaten – Spieler und Werte sind erfunden</span>' : ''}
      </div>
    </section>

    <section class="band band-tiefer" aria-label="Auf einen Blick">
      <div class="band-innen kennzahlen">
        <div class="zahlblock f-smaragd"><b data-online-zahl>${online.size}</b><span>Gerade online</span></div>
        <div class="zahlblock f-gold"><b>${fmt.stunden(g.spielzeit)}</b><span>Stunden gespielt</span></div>
        <div class="zahlblock f-redstone"><b>${fmt.anzahl(g.tode)}</b><span>Tode</span></div>
        <div class="zahlblock f-diamant"><b>${fmt.km(g.strecke)}</b><span>Kilometer unterwegs</span></div>
      </div>
    </section>

    <section class="band band-dunkel">
      <div class="band-innen">
        <div class="titel-zeile"><h2 class="titel">Live</h2><p>Was gerade auf dem Server passiert – ohne Neuladen.</p></div>
        <div class="live">
          <div class="kasten"><h3><span class="punkt" data-online-punkt></span>Gerade online</h3><div data-online></div></div>
          <div class="kasten"><h3>Letzte Ereignisse</h3><ol class="ereignisse" data-ereignisse></ol></div>
        </div>
      </div>
    </section>

    ${daten.fakten.length ? `
    <section class="band band-gold">
      <div class="band-innen">
        <div class="titel-zeile"><h2 class="titel">Wusstest du?</h2></div>
        <div class="fakt">
          <p class="fakt-text" data-fakt aria-live="polite"></p>
          <button class="knopf" type="button" data-naechster-fakt ${daten.fakten.length < 2 ? 'disabled' : ''}>Noch einer</button>
        </div>
      </div>
    </section>` : ''}

    <section class="band band-dunkel">
      <div class="band-innen">
        <div class="titel-zeile"><h2 class="titel">Bestenlisten</h2><p>Top 10 · Name anklicken für die ganze Spielerseite.</p></div>
        <div class="listen">${daten.bestenlisten.map(bestenliste).join('')}</div>
      </div>
    </section>

    ${daten.tage.length ? `
    <section class="band band-tiefer">
      <div class="band-innen">
        <div class="titel-zeile"><h2 class="titel">Spielzeit pro Tag</h2><p>Alle zusammen. Tag anklicken für das Tagebuch: wer war wann online.</p></div>
        ${tagesSaeulen(daten.tage)}
      </div>
    </section>` : ''}
  `;
  zeigeStatus();
  zeigeOnline();
  zeigeEreignisse();
  zeigeFakt();
  startSchnee(main.querySelector('.schnee'));
}

function bestenliste(liste, i) {
  const farbe = FARBEN[i % FARBEN.length];
  const zeilen = liste.eintraege.map((e, platz) => {
    const sp = spielerVon(e.uuid);
    if (!sp) return '';
    return `<li><a href="${profilLink(sp.name)}">
      <span class="platz">${platz + 1}</span>${kopf(sp.uuid, platz ? 24 : 40)}
      <span class="name">${esc(sp.name)}</span><span class="wert">${esc(fmt.wert(liste.einheit, e.wert))}</span></a></li>`;
  }).join('');
  return `<article class="liste f-${farbe}"><h3>${esc(liste.titel)}</h3><p class="unter">${esc(liste.unter)}</p><ol>${zeilen}</ol></article>`;
}

function tagesSaeulen(tage, uuid) {
  // In „Allzeit“ liegen Wochen ohne Server zwischen den Seasons – leere Tage weglassen
  if (ansicht === 'allzeit') tage = tage.filter((t) => Object.keys(t.min).length);
  if (!tage.length) return '<p class="leer">Noch keine Spielzeit.</p>';
  const werte = tage.map((t) => (uuid ? t.min[uuid] ?? 0 : Object.values(t.min).reduce((a, b) => a + b, 0)));
  const max = Math.max(1, ...werte);
  const saeulen = tage.map((t, i) => {
    const d = new Date(`${t.datum}T12:00:00`);
    const we = d.getDay() === 0 || d.getDay() === 6;
    const titel = `${datumKurz.format(d)}: ${werte[i] ? fmt.minuten(werte[i]) : 'niemand online'}`;
    return `<a class="tag${we ? ' wochenende' : ''}" href="#/tagebuch/${t.datum}" title="${esc(titel)}" aria-label="${esc(titel)}">
      <span class="saeule" style="height:${(werte[i] / max) * 100}%"></span><small>${d.getDate()}.</small></a>`;
  }).join('');
  const summeMin = werte.reduce((a, b) => a + b, 0);
  const bester = werte.indexOf(Math.max(...werte));
  return `<div class="tage">${saeulen}</div>
    <p class="tage-legende">${summeMin ? `Insgesamt ${esc(fmt.minuten(summeMin))}. Stärkster Tag: ${esc(datumLang.format(new Date(`${tage[bester].datum}T12:00:00`)))} mit ${esc(fmt.minuten(werte[bester]))}.` : 'Noch keine Spielzeit.'}</p>`;
}

function zeigeStatus() {
  const el = main.querySelector('[data-status]');
  if (!el) return;
  const koepfe = [...online].slice(0, 8).map((u) => spielerVon(u)).filter(Boolean)
    .map((sp) => kopf(sp.uuid, 24, sp.name)).join('');
  el.innerHTML = `<span class="punkt${online.size ? ' an' : ''}"></span>
    <span>${online.size ? `${online.size} ${online.size === 1 ? 'Spieler' : 'Spieler'} online` : 'Gerade niemand online'}</span>
    ${koepfe ? `<span class="status-koepfe">${koepfe}</span>` : ''}
    <span>Stand: ${esc(fmt.vor(daten.server.stand))}</span>`;
}

function zeigeOnline() {
  const el = main.querySelector('[data-online]');
  if (!el) return;
  const zahlEl = main.querySelector('[data-online-zahl]');
  if (zahlEl) zahlEl.textContent = online.size;
  main.querySelector('[data-online-punkt]')?.classList.toggle('an', online.size > 0);
  const liste = [...online].map(spielerVon).filter(Boolean);
  el.innerHTML = liste.length
    ? `<ul class="online-liste">${liste.map((sp) => `<li><a href="${profilLink(sp.name)}">${kopf(sp.uuid, 32)}${esc(sp.name)}</a></li>`).join('')}</ul>`
    : '<p class="leer">Gerade ist niemand online. Die Welt schläft.</p>';
}

function ereignisZeile(e, neu = false) {
  const d = new Date(e.zeit);
  const heute = new Date().toDateString() === d.toDateString();
  const zeit = heute ? uhrzeit.format(d) : `${datumKurz.format(d)}`;
  return `<li${neu ? ' class="neu"' : ''}>${symbol(e.typ)}<span>${esc(e.text)}</span><time datetime="${esc(e.zeit)}">${esc(zeit)}</time></li>`;
}

function zeigeEreignisse() {
  const el = main.querySelector('[data-ereignisse]');
  if (!el) return;
  el.innerHTML = ereignisse.length ? ereignisse.slice(0, 12).map((e) => ereignisZeile(e)).join('') : '<li class="leer">Noch nichts passiert.</li>';
}

let faktIndex = -1;
function zeigeFakt() {
  const el = main.querySelector('[data-fakt]');
  if (!el || !daten.fakten.length) return;
  let neu = Math.floor(Math.random() * daten.fakten.length);
  if (daten.fakten.length > 1 && neu === faktIndex) neu = (neu + 1) % daten.fakten.length;
  faktIndex = neu;
  el.textContent = daten.fakten[neu];
  el.classList.remove('wechsel');
  void el.offsetWidth;
  el.classList.add('wechsel');
}

// ---------- Spielerliste ----------

function ansichtSpieler() {
  const liste = [...daten.spieler].sort((a, b) => (b.werte['custom:play_time'] ?? 0) - (a.werte['custom:play_time'] ?? 0));
  main.innerHTML = `
    <section class="band band-dunkel">
      <div class="band-innen">
        <div class="titel-zeile"><h1 class="titel">Spieler</h1><p>${liste.length} Spieler, sortiert nach Spielzeit · ${esc(zeitraumText())}.</p></div>
        ${umschalter()}
        <ul class="spielerraster">${liste.map((sp) => `
          <li><a href="${profilLink(sp.name)}">${kopf(sp.uuid, 56)}
            <span><b>${esc(sp.name)}</b>
            <small><span class="punkt${online.has(sp.uuid) ? ' an' : ''}"></span>${online.has(sp.uuid) ? 'online' : esc(fmt.zeit(sp.werte['custom:play_time'] ?? 0))}</small></span>
          </a></li>`).join('')}
        </ul>
      </div>
    </section>`;
}

// ---------- Profil ----------

function ansichtProfil(name) {
  const sp = daten.spieler.find((s) => s.name.toLowerCase() === name.toLowerCase());
  if (!sp) {
    main.innerHTML = `<section class="band band-dunkel"><div class="band-innen">
      <h1 class="titel">Nicht gefunden</h1>
      <p class="lead">Einen Spieler „${esc(name)}“ gibt es hier nicht – vielleicht hat er sich ausgeblendet.</p>
      <p class="mehr"><a class="knopf hell" href="#/spieler">Alle Spieler</a></p></div></section>`;
    return;
  }
  setzeTitel(sp.name);
  const farbe = farbeVon(sp.uuid);
  const sprueche = daten.sprueche[sp.uuid] ?? [];
  const titelVon = Object.fromEntries(daten.bestenlisten.map((l) => [l.id, l.titel]));
  const istOnline = online.has(sp.uuid);
  const zahlen = PROFILZAHLEN.map((z) => {
    const w = z.wert(sp.werte);
    const r = rang(daten.spieler, z.wert, sp.uuid);
    return `<div class="zahlblock f-${z.farbe}"><b>${esc(z.zeige(w))}</b><span>${esc(z.name)}${r ? `<br><em>Platz ${r} von ${daten.spieler.length}</em>` : ''}</span></div>`;
  }).join('');

  main.innerHTML = `
    <section class="band f-${farbe}">
      <div class="band-innen">
        <a class="zurueck" href="#/spieler">← Alle Spieler</a>
        <div class="profil-kopf">
          ${kopf(sp.uuid, 168, `Kopf von ${sp.name}`)}
          <div>
            <h1>${esc(sp.name)}</h1>
            <p class="meta">
              <span><span class="punkt${istOnline ? ' an' : ''}"></span>${istOnline ? 'Gerade online' : `Zuletzt online ${esc(fmt.vor(sp.zuletzt))}`}</span>
              ${sp.erstesMal ? `<span>Dabei seit ${esc(datumLang.format(new Date(sp.erstesMal)))}</span>` : ''}
            </p>
            ${umschalter('hell')}
          </div>
        </div>
      </div>
    </section>

    ${sprueche.length ? `
    <section class="band band-dunkel">
      <div class="band-innen">
        <div class="titel-zeile"><h2 class="titel">Was man so hört</h2></div>
        <ul class="sprueche">${sprueche.map((s, i) => `
          <li class="f-${FARBEN[(i + 1) % FARBEN.length]}"><small>${esc(titelVon[s.liste] ?? '')}${s.rang ? ` · Platz ${s.rang}` : ''}</small>${esc(s.text)}</li>`).join('')}
        </ul>
      </div>
    </section>` : ''}

    <section class="band band-tiefer">
      <div class="band-innen">
        <div class="titel-zeile"><h2 class="titel">Auf einen Blick</h2></div>
        <div class="profilzahlen">${zahlen}</div>
      </div>
    </section>

    ${daten.tage.length ? `
    <section class="band band-dunkel">
      <div class="band-innen">
        <div class="titel-zeile"><h2 class="titel">Spielzeit pro Tag</h2></div>
        ${tagesSaeulen(daten.tage, sp.uuid)}
      </div>
    </section>` : ''}

    <section class="band band-tiefer">
      <div class="band-innen">
        <div class="titel-zeile"><h2 class="titel">Alle Werte</h2><p>Alles, was Minecraft mitzählt – mit Platz unter allen Spielern.</p></div>
        <div class="werte-werkzeuge" data-werkzeuge></div>
        <div data-werte></div>
      </div>
    </section>`;
  zeigeWerkzeuge(sp);
  zeigeWerte(sp);
}

function zeigeWerkzeuge(sp) {
  const el = main.querySelector('[data-werkzeuge]');
  const vorhanden = new Set(Object.keys(sp.werte).map((k) => k.split(':')[0]));
  const kats = Object.entries(daten.kategorien).filter(([k]) => vorhanden.has(k));
  if (!kats.some(([k]) => k === profilZustand.kategorie)) profilZustand.kategorie = 'alle';
  el.innerHTML = [['alle', 'Alle'], ...kats].map(([k, n]) =>
    `<button class="chip" type="button" data-kategorie="${esc(k)}" aria-pressed="${profilZustand.kategorie === k}">${esc(n)}</button>`).join('')
    + `<input class="suche" type="search" placeholder="Suchen, z. B. Diamant" aria-label="Werte durchsuchen" value="${esc(profilZustand.suche)}" data-suche>`;
  el.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-kategorie]');
    if (!b) return;
    profilZustand.kategorie = b.dataset.kategorie;
    profilZustand.alle = false;
    for (const c of el.querySelectorAll('[data-kategorie]')) c.setAttribute('aria-pressed', c === b);
    zeigeWerte(sp);
  });
  el.querySelector('[data-suche]').addEventListener('input', (ev) => {
    profilZustand.suche = ev.target.value;
    profilZustand.alle = false;
    zeigeWerte(sp);
  });
}

function zeigeWerte(sp) {
  const el = main.querySelector('[data-werte]');
  const suche = profilZustand.suche.trim().toLowerCase();
  const reihen = Object.entries(sp.werte)
    .filter(([k, v]) => v > 0 && (profilZustand.kategorie === 'alle' || k.startsWith(`${profilZustand.kategorie}:`)))
    .map(([k, v]) => ({ k, v, name: daten.namen[k] ?? k.split(':')[1].replaceAll('_', ' '), kat: daten.kategorien[k.split(':')[0]] ?? '' }))
    .filter((r) => !suche || r.name.toLowerCase().includes(suche) || r.kat.toLowerCase().includes(suche))
    .sort((a, b) => a.kat.localeCompare(b.kat, 'de') || b.v - a.v);
  if (!reihen.length) {
    el.innerHTML = '<p class="leer">Dazu gibt es keine Werte.</p>';
    return;
  }
  const sichtbar = profilZustand.alle ? reihen : reihen.slice(0, ZEILEN_ANFANG);
  const anzahlMit = (k) => daten.spieler.filter((s) => (s.werte[k] ?? 0) > 0).length;
  el.innerHTML = `
    <div class="tabelle-huelle"><table>
      <thead><tr><th scope="col">Wert</th><th scope="col" class="zahl">Zahl</th><th scope="col" class="zahl">Platz</th></tr></thead>
      <tbody>${sichtbar.map((r) => {
        const p = rang(daten.spieler, (w) => w[r.k] ?? 0, sp.uuid);
        return `<tr><td>${esc(r.name)}<span class="kat">${esc(r.kat)}</span></td>
          <td class="zahl">${esc(fmt.wert(daten.einheiten[r.k], r.v))}</td>
          <td class="zahl${p === 1 ? ' rang-1' : ''}">${p} von ${anzahlMit(r.k)}</td></tr>`;
      }).join('')}</tbody>
    </table></div>
    ${reihen.length > sichtbar.length ? `<p class="mehr"><button class="knopf hell" type="button" data-alle>Alle ${reihen.length} zeigen</button></p>` : ''}`;
  el.querySelector('[data-alle]')?.addEventListener('click', () => { profilZustand.alle = true; zeigeWerte(sp); });
}

// ---------- Tagebuch ----------

const MS_STUNDE = 3600000;
// Ein Spielabend läuft von 06:00 bis 06:00 am Folgetag
const abendStart = (datum) => new Date(`${datum}T06:00:00`).getTime();

function ansichtTagebuch(datum) {
  // nur Tage, zu denen Sitzungen geliefert werden (der Dienst schickt die letzten 30 Tage)
  const mitSitzung = new Set(daten.sitzungen.map((s) => s.start.slice(0, 10)));
  const tage = daten.tage.filter((t) => Object.values(t.min).some((m) => m > 0) && mitSitzung.has(t.datum)).map((t) => t.datum);
  if (!tage.length) {
    main.innerHTML = '<section class="band band-dunkel"><div class="band-innen"><h1 class="titel">Tagebuch</h1><p class="lead">Noch keine Sitzungen.</p></div></section>';
    return;
  }
  if (!tage.includes(datum)) datum = tage.at(-1);
  const i = tage.indexOf(datum);
  const von = abendStart(datum);
  const bis = von + 24 * MS_STUNDE;
  const jetzt = Date.now();

  const proSpieler = new Map();
  for (const s of daten.sitzungen) {
    const a = new Date(s.start).getTime();
    const e = s.ende ? new Date(s.ende).getTime() : jetzt;
    if (e <= von || a >= bis) continue;
    if (!proSpieler.has(s.uuid)) proSpieler.set(s.uuid, []);
    proSpieler.get(s.uuid).push({ a: Math.max(a, von), e: Math.min(e, bis), laeuft: !s.ende });
  }
  const zeilen = [...proSpieler].map(([uuid, sitz]) => ({ sp: spielerVon(uuid), sitz })).filter((z) => z.sp)
    .sort((x, y) => Math.min(...x.sitz.map((s) => s.a)) - Math.min(...y.sitz.map((s) => s.a)));

  let a0 = Math.min(...zeilen.flatMap((z) => z.sitz.map((s) => s.a)));
  let e0 = Math.max(...zeilen.flatMap((z) => z.sitz.map((s) => s.e)));
  a0 = Math.floor(a0 / MS_STUNDE) * MS_STUNDE;
  e0 = Math.max(Math.ceil(e0 / MS_STUNDE) * MS_STUNDE, a0 + 4 * MS_STUNDE);
  const spanne = e0 - a0;
  const stunden = spanne / MS_STUNDE;
  const schmal = matchMedia('(max-width: 560px)').matches;
  const schritt = stunden > (schmal ? 6 : 10) ? (schmal && stunden > 12 ? 3 : 2) : 1;
  const pos = (t) => ((t - a0) / spanne) * 100;

  let marken = '';
  for (let t = a0; t <= e0; t += schritt * MS_STUNDE) marken += `<span style="left:${pos(t)}%">${new Date(t).getHours()}</span>`;

  main.innerHTML = `
    <section class="band band-dunkel">
      <div class="band-innen">
        <div class="titel-zeile"><h1 class="titel">Tagebuch</h1><p>Wer war wann online – ein Spielabend geht bis 6 Uhr morgens.</p></div>
        <div class="tagwahl">
          <a class="knopf hell" href="#/tagebuch/${tage[i - 1] ?? ''}" ${i ? '' : 'aria-disabled="true" tabindex="-1" style="visibility:hidden"'} aria-label="Vorheriger Tag">←</a>
          <strong>${esc(datumLang.format(new Date(`${datum}T12:00:00`)))}</strong>
          <a class="knopf hell" href="#/tagebuch/${tage[i + 1] ?? ''}" ${i < tage.length - 1 ? '' : 'aria-disabled="true" tabindex="-1" style="visibility:hidden"'} aria-label="Nächster Tag">→</a>
        </div>
        <div class="zeitachse" style="--stunde:${100 / stunden}%">
          <div class="zeitachse-kopf"><span>Spieler</span><div class="stunden">${marken}</div><span>Summe</span></div>
          ${zeilen.map(({ sp, sitz }) => {
            const farbe = farbeVon(sp.uuid);
            const min = Math.round(sitz.reduce((s, x) => s + (x.e - x.a), 0) / 60000);
            return `<div class="zeitachse-zeile">
              <a href="${profilLink(sp.name)}">${kopf(sp.uuid, 24, sp.name)}<span>${esc(sp.name)}</span></a>
              <div class="bahn">${sitz.map((x) => `<span class="sitzung f-${farbe}${x.laeuft ? ' laeuft' : ''}" style="left:${pos(x.a)}%;width:${pos(x.e) - pos(x.a)}%"
                title="${esc(`${uhrzeit.format(new Date(x.a))}–${x.laeuft ? 'jetzt' : uhrzeit.format(new Date(x.e))}`)}"></span>`).join('')}</div>
              <span class="summe">${esc(fmt.minuten(min))}</span>
            </div>`;
          }).join('')}
        </div>
      </div>
    </section>`;
}

// ---------- Schnee ----------

function startSchnee(canvas) {
  if (!canvas) return;
  const ruhig = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ctx = canvas.getContext('2d');
  let flocken = [];
  const dpr = Math.min(devicePixelRatio || 1, 2);
  function groesse() {
    const r = canvas.getBoundingClientRect();
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
    const anzahl = Math.round((r.width * r.height) / 9000);
    flocken = Array.from({ length: anzahl }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      g: (Math.random() < 0.7 ? 2 : 4) * dpr, v: (0.15 + Math.random() * 0.35) * dpr, p: Math.random() * Math.PI * 2,
    }));
  }
  function malen() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const f of flocken) {
      ctx.fillStyle = f.g > 2 * dpr ? 'rgba(238,242,255,0.55)' : 'rgba(238,242,255,0.3)';
      ctx.fillRect(Math.round(f.x), Math.round(f.y), f.g, f.g);
    }
  }
  function schritt() {
    if (!canvas.isConnected) return;
    for (const f of flocken) {
      f.y += f.v;
      f.p += 0.01;
      f.x += Math.sin(f.p) * 0.2 * dpr;
      if (f.y > canvas.height) { f.y = -f.g; f.x = Math.random() * canvas.width; }
    }
    malen();
    requestAnimationFrame(schritt);
  }
  groesse();
  if (ruhig) { malen(); return; }
  new ResizeObserver(groesse).observe(canvas);
  requestAnimationFrame(schritt);
}

// ---------- Ablauf ----------

function zeichne({ fokus = false } = {}) {
  if (!daten) return;
  const teile = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
  setzeTitel('');
  if (teile[0] === 'spieler' && teile[1]) { markiereNavi('spieler'); ansichtProfil(teile[1]); }
  else if (teile[0] === 'spieler') { markiereNavi('spieler'); setzeTitel('Spieler'); ansichtSpieler(); }
  else if (teile[0] === 'tagebuch') { markiereNavi('tagebuch'); setzeTitel('Tagebuch'); ansichtTagebuch(teile[1]); }
  else { markiereNavi('uebersicht'); ansichtUebersicht(); }
  if (fokus) { window.scrollTo(0, 0); main.focus({ preventScroll: true }); }
}

async function laden() {
  const antwort = await fetch(`/api/daten?ansicht=${ansicht}`, { cache: 'no-store' });
  if (!antwort.ok) throw new Error(`HTTP ${antwort.status}`);
  daten = await antwort.json();
  online = new Set(daten.server.online);
  ereignisse = daten.ereignisse;
}

let neuLadenGeplant = null;
function neuLaden() {
  clearTimeout(neuLadenGeplant);
  neuLadenGeplant = setTimeout(async () => {
    try {
      const y = window.scrollY;
      await laden();
      const aktiv = document.activeElement?.matches?.('[data-suche]');
      if (aktiv) return; // nicht unter den Fingern wegrendern
      zeichne();
      window.scrollTo(0, y);
    } catch { /* nächster Versuch beim nächsten Signal */ }
  }, 300);
}

function liveVerbinden() {
  if (!('EventSource' in window)) return;
  const quelle = new EventSource('/api/live');
  quelle.addEventListener('ereignis', (ev) => {
    const e = JSON.parse(ev.data);
    ereignisse = [e, ...ereignisse].slice(0, 50);
    const el = main.querySelector('[data-ereignisse]');
    if (el) {
      el.querySelector('.leer')?.remove();
      el.insertAdjacentHTML('afterbegin', ereignisZeile(e, true));
      while (el.children.length > 12) el.lastElementChild.remove();
    }
  });
  quelle.addEventListener('online', (ev) => {
    online = new Set(JSON.parse(ev.data).online);
    zeigeOnline();
    zeigeStatus();
  });
  quelle.addEventListener('daten', neuLaden);
}

main.addEventListener('click', (ev) => {
  if (ev.target.closest('[data-naechster-fakt]')) zeigeFakt();
  const umschalt = ev.target.closest('[data-ansicht]');
  if (umschalt) wechsleAnsicht(umschalt.dataset.ansicht);
});
addEventListener('hashchange', () => zeichne({ fokus: true }));

try {
  await laden();
  zeichne();
  liveVerbinden();
  setInterval(zeigeStatus, 30000);
} catch (fehler) {
  main.innerHTML = `<section class="band band-dunkel"><div class="band-innen">
    <p class="fehler">Die Statistik konnte gerade nicht geladen werden (${esc(fehler.message)}). Bitte in ein paar Minuten neu laden.</p></div></section>`;
}
