#!/usr/bin/env node
// HTTP-Dienst der Statistikseite (nur 127.0.0.1). Vertrag: DATENFORMAT.md
// node statistik/dienst.mjs --instanz <ordner> --archiv <archivwurzel> --sichtbarkeit <datei> --sprache <datei> [--season <kennung>] [--testmodus]
import http from 'node:http';
import { readFileSync, mkdirSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { Instanz } from './lib/quellen.mjs';
import { Sichtbarkeit, normUuid } from './lib/sichtbarkeit.mjs';
import { LiveHub } from './lib/live.mjs';
import { kopfPngAusSkin, pixelGesicht, holeSkinVonMojang } from './lib/kopf.mjs';
export { holeSkinVonMojang };

const hier = dirname(fileURLToPath(import.meta.url));

export const TYPEN = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif',
  '.ico': 'image/x-icon', '.ttf': 'font/ttf', '.otf': 'font/otf', '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8', '.webmanifest': 'application/manifest+json', '.map': 'application/json',
};

const TAG_MS = 24 * 3600 * 1000;

export async function starteDienst(opt) {
  const sichtbarkeit = opt.sichtbarkeitObjekt ?? new Sichtbarkeit(opt.sichtbarkeit);
  const sprache = opt.spracheObjekt ?? (opt.sprache ? JSON.parse(readFileSync(opt.sprache, 'utf8')) : { de: {}, en: {} });
  const instanz = new Instanz({
    instanz: opt.instanz, archiv: opt.archiv ?? null, season: opt.season ?? null, sichtbarkeit, sprache,
    ...(opt.allzeitOhne !== undefined ? { allzeitOhne: String(opt.allzeitOhne).split(',').map((x) => x.trim()).filter(Boolean) } : {}),
    optionen: { name: opt.name, seasonName: opt.seasonName, testmodus: !!opt.testmodus },
  });
  const web = resolve(opt.web ?? join(hier, 'web'));
  const cache = resolve(opt.cache ?? join(tmpdir(), 'mc-statistik-kopf'));
  const holeSkin = opt.holeSkin ?? holeSkinVonMojang;
  const hub = new LiveHub(instanz, opt.live ?? {});
  await sichtbarkeit.lade();
  await hub.start();

  const clients = new Set();
  const sende = (ev, daten) => {
    const text = `event: ${ev}\ndata: ${JSON.stringify(daten ?? {})}\n\n`;
    for (const res of clients) res.write(text);
  };
  hub.on('ereignis', (e) => sende('ereignis', e));
  hub.on('online', (o) => sende('online', o));
  hub.on('daten', () => sende('daten', {}));
  const herz = setInterval(() => { for (const res of clients) res.write(': herz\n\n'); }, 20_000);
  herz.unref();

  // --- Kopfbilder ---
  const imFlug = new Map();
  const fehler = new Map(); // uuid → Zeit des letzten Fehlschlags
  async function kopf(uuid) {
    if (opt.testmodus) return { png: pixelGesicht(uuid), alter: 3600 };
    mkdirSync(cache, { recursive: true });
    const datei = join(cache, `${uuid}.png`);
    try {
      if (Date.now() - statSync(datei).mtimeMs < TAG_MS) return { png: readFileSync(datei), alter: 3600 };
    } catch { /* kein Cache */ }
    if (Date.now() - (fehler.get(uuid) ?? 0) < 10 * 60_000) return { png: pixelGesicht(uuid), alter: 300 };
    if (!imFlug.has(uuid)) {
      imFlug.set(uuid, (async () => {
        try {
          const png = kopfPngAusSkin(await holeSkin(uuid));
          writeFileSync(datei, png);
          return { png, alter: 3600 };
        } catch {
          fehler.set(uuid, Date.now());
          try { return { png: readFileSync(datei), alter: 300 }; } catch { return { png: pixelGesicht(uuid), alter: 300 }; }
        } finally { imFlug.delete(uuid); }
      })());
    }
    return imFlug.get(uuid);
  }

  const json = (res, status, wert) => {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    res.end(JSON.stringify(wert));
  };
  const nichtGefunden = (res) => { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('Nicht gefunden'); };

  async function statisch(pfadname, res) {
    let rel;
    try { rel = decodeURIComponent(pfadname); } catch { return nichtGefunden(res); }
    if (rel.includes('\0') || rel.split(/[\\/]/).includes('..')) return nichtGefunden(res);
    let datei = resolve(web, `.${rel.startsWith('/') ? rel : `/${rel}`}`);
    if (datei !== web && !datei.startsWith(web + sep)) return nichtGefunden(res);
    try {
      let st = await stat(datei);
      if (st.isDirectory()) { datei = join(datei, 'index.html'); st = await stat(datei); }
      if (!st.isFile()) return nichtGefunden(res);
      const inhalt = await readFile(datei);
      const typ = TYPEN[extname(datei).toLowerCase()] ?? 'application/octet-stream';
      res.writeHead(200, {
        'Content-Type': typ, 'X-Content-Type-Options': 'nosniff',
        // Seite, Skript und Stil immer neu prüfen (Updates sofort sichtbar), Schrift/Bilder dürfen liegen bleiben
        'Cache-Control': /^text\/(html|css|javascript)/.test(typ) ? 'no-cache' : 'public, max-age=86400',
      });
      res.end(inhalt);
    } catch { nichtGefunden(res); }
  }

  const server = http.createServer(async (req, res) => {
    try {
      if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
      const pfadname = new URL(req.url, 'http://x').pathname;
      if (pfadname === '/api/gesund') { res.writeHead(200, { 'Content-Type': 'text/plain' }); return res.end('ok'); }
      if (pfadname === '/api/daten') {
        const ansicht = new URL(req.url, 'http://x').searchParams.get('ansicht') === 'allzeit' ? 'allzeit' : 'season';
        return json(res, 200, await instanz.daten({ ansicht }));
      }
      if (pfadname === '/api/live') {
        res.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-store', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
        res.write(`retry: 3000\nevent: online\ndata: ${JSON.stringify({ online: [...hub.online] })}\n\n`);
        clients.add(res);
        req.on('close', () => clients.delete(res));
        return;
      }
      const k = /^\/api\/kopf\/([0-9a-fA-F-]{32,36})\.png$/.exec(pfadname);
      if (k) {
        const uuid = normUuid(k[1]);
        await sichtbarkeit.lade();
        const bekannt = uuid && sichtbarkeit.istSichtbar(uuid)
          && ((await instanz.daten()).spieler.some((s) => s.uuid === uuid) || (await instanz.daten({ ansicht: 'allzeit' })).spieler.some((s) => s.uuid === uuid));
        if (!bekannt) return nichtGefunden(res);
        const { png, alter } = await kopf(uuid);
        res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': `public, max-age=${alter}`, 'X-Content-Type-Options': 'nosniff' });
        return res.end(png);
      }
      if (pfadname.startsWith('/api/')) return nichtGefunden(res);
      return statisch(pfadname, res);
    } catch (e) {
      if (!res.headersSent) { res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' }); }
      res.end('Interner Fehler');
      console.error(e);
    }
  });

  await new Promise((ok, fehl) => { server.once('error', fehl); server.listen(opt.port ?? 8080, '127.0.0.1', ok); });
  return {
    server, hub, instanz, port: server.address().port,
    async schliesse() {
      hub.stop(); clearInterval(herz);
      for (const res of clients) res.end();
      server.closeAllConnections?.();
      await new Promise((ok) => server.close(ok));
    },
  };
}

// --- CLI ---
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const opt = {};
  const a = process.argv.slice(2);
  const hilfe = { '--season-name': 'seasonName', '--allzeit-ohne': 'allzeitOhne' };
  for (let i = 0; i < a.length; i++) {
    if (!a[i].startsWith('--')) continue;
    const name = hilfe[a[i]] ?? a[i].slice(2);
    if (name === 'testmodus') opt.testmodus = true;
    else opt[name] = a[++i];
  }
  if (!opt.instanz) { console.error('Aufruf: node statistik/dienst.mjs --instanz <ordner> [--sichtbarkeit <datei|url>] [--sprache <datei>] [--testmodus]'); process.exit(1); }
  if (opt.port !== undefined) opt.port = Number(opt.port);
  if (!opt.sichtbarkeit) console.warn('Hinweis: ohne --sichtbarkeit ist niemand sichtbar.');
  if (opt.sprache && !existsSync(opt.sprache)) console.warn(`Hinweis: ${opt.sprache} fehlt – erst „node statistik/sprache.mjs“ ausführen.`);
  const d = await starteDienst(opt);
  console.log(`Statistikdienst läuft auf http://127.0.0.1:${d.port}/${opt.testmodus ? ' (Testmodus)' : ''}`);
}
