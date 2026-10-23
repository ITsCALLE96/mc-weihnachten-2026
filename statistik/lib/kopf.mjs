// Kopfbilder: PNG lesen/schreiben (nur node:zlib), Gesicht + Hut aus einem Skin schneiden, Pixelgesicht für den Testmodus.
import { deflateSync, inflateSync, crc32 } from 'node:zlib';
import { createHash } from 'node:crypto';

const SIGNATUR = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function chunk(typ, daten) {
  const kopf = Buffer.alloc(8);
  kopf.writeUInt32BE(daten.length, 0);
  kopf.write(typ, 4, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([kopf.subarray(4), daten])) >>> 0, 0);
  return Buffer.concat([kopf, daten, crc]);
}

// rgba: Buffer b*h*4 → PNG (RGBA, 8 Bit)
export function kodierePng(rgba, b, h) {
  const roh = Buffer.alloc((b * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    roh[y * (b * 4 + 1)] = 0;
    rgba.copy(roh, y * (b * 4 + 1) + 1, y * b * 4, (y + 1) * b * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(b, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([SIGNATUR, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(roh)), chunk('IEND', Buffer.alloc(0))]);
}

// PNG → { b, h, rgba }. Unterstützt 8 Bit, nicht verschachtelt, Farbtypen 0, 2, 3, 4, 6.
export function dekodierePng(png) {
  if (!png.subarray(0, 8).equals(SIGNATUR)) throw new Error('Kein PNG');
  let pos = 8;
  let b = 0; let h = 0; let typ = 0; let tiefe = 0; let interlace = 0;
  let palette = null; let trans = null;
  const idat = [];
  while (pos + 8 <= png.length) {
    const len = png.readUInt32BE(pos);
    const name = png.toString('ascii', pos + 4, pos + 8);
    const d = png.subarray(pos + 8, pos + 8 + len);
    if (name === 'IHDR') { b = d.readUInt32BE(0); h = d.readUInt32BE(4); tiefe = d[8]; typ = d[9]; interlace = d[12]; }
    else if (name === 'PLTE') palette = d;
    else if (name === 'tRNS') trans = d;
    else if (name === 'IDAT') idat.push(d);
    else if (name === 'IEND') break;
    pos += 12 + len;
  }
  if (tiefe !== 8 || interlace !== 0) throw new Error('PNG-Variante nicht unterstützt');
  const kanaele = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[typ];
  if (!kanaele) throw new Error('PNG-Farbtyp nicht unterstützt');
  const roh = inflateSync(Buffer.concat(idat));
  const zeile = b * kanaele;
  const px = Buffer.alloc(zeile * h);
  for (let y = 0; y < h; y++) {
    const f = roh[y * (zeile + 1)];
    for (let x = 0; x < zeile; x++) {
      const v = roh[y * (zeile + 1) + 1 + x];
      const a = x >= kanaele ? px[y * zeile + x - kanaele] : 0;
      const o = y > 0 ? px[(y - 1) * zeile + x] : 0;
      const c = x >= kanaele && y > 0 ? px[(y - 1) * zeile + x - kanaele] : 0;
      let r;
      if (f === 0) r = v;
      else if (f === 1) r = v + a;
      else if (f === 2) r = v + o;
      else if (f === 3) r = v + ((a + o) >> 1);
      else if (f === 4) {
        const p = a + o - c; const pa = Math.abs(p - a); const pb = Math.abs(p - o); const pc = Math.abs(p - c);
        r = v + (pa <= pb && pa <= pc ? a : pb <= pc ? o : c);
      } else throw new Error('PNG-Filter unbekannt');
      px[y * zeile + x] = r & 255;
    }
  }
  const rgba = Buffer.alloc(b * h * 4);
  for (let i = 0; i < b * h; i++) {
    let r; let g; let bl; let al = 255;
    if (typ === 6) { [r, g, bl, al] = [px[i * 4], px[i * 4 + 1], px[i * 4 + 2], px[i * 4 + 3]]; }
    else if (typ === 2) { [r, g, bl] = [px[i * 3], px[i * 3 + 1], px[i * 3 + 2]]; }
    else if (typ === 0) { r = g = bl = px[i]; }
    else if (typ === 4) { r = g = bl = px[i * 2]; al = px[i * 2 + 1]; }
    else { const p = px[i]; r = palette[p * 3]; g = palette[p * 3 + 1]; bl = palette[p * 3 + 2]; al = trans && p < trans.length ? trans[p] : 255; }
    rgba[i * 4] = r; rgba[i * 4 + 1] = g; rgba[i * 4 + 2] = bl; rgba[i * 4 + 3] = al;
  }
  return { b, h, rgba };
}

// 8×8-Gesicht (Skin-Ebene bei 8,8) mit Hut-Ebene (40,8) darüber → RGBA 8×8
export function gesichtAusSkin({ b, h, rgba }) {
  if (b < 64 || h < 16) throw new Error('Skin zu klein');
  const mass = b / 64; // HD-Skins
  const aus = Buffer.alloc(8 * 8 * 4);
  const hole = (sx, sy) => {
    const i = ((Math.floor(sy * mass)) * b + Math.floor(sx * mass)) * 4;
    return [rgba[i], rgba[i + 1], rgba[i + 2], rgba[i + 3]];
  };
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const [r, g, bl] = hole(8 + x, 8 + y);
      const [hr, hg, hb, ha] = hole(40 + x, 8 + y);
      const t = ha / 255;
      const o = (y * 8 + x) * 4;
      aus[o] = Math.round(r * (1 - t) + hr * t);
      aus[o + 1] = Math.round(g * (1 - t) + hg * t);
      aus[o + 2] = Math.round(bl * (1 - t) + hb * t);
      aus[o + 3] = 255;
    }
  }
  return aus;
}

// Nächster-Nachbar-Vergrößerung
export function hochskalieren(rgba, b, h, faktor) {
  const aus = Buffer.alloc(b * faktor * h * faktor * 4);
  for (let y = 0; y < h * faktor; y++) {
    for (let x = 0; x < b * faktor; x++) {
      rgba.copy(aus, (y * b * faktor + x) * 4, (Math.floor(y / faktor) * b + Math.floor(x / faktor)) * 4, (Math.floor(y / faktor) * b + Math.floor(x / faktor)) * 4 + 4);
    }
  }
  return aus;
}

export const kopfPngAusSkin = (skinPng) => kodierePng(hochskalieren(gesichtAusSkin(dekodierePng(skinPng)), 8, 8, 8), 64, 64);

// Pixelgesicht aus der UUID (Testmodus, kein Netzzugriff)
export function pixelGesicht(uuid) {
  const hash = createHash('sha256').update(String(uuid)).digest();
  const haut = [[255, 220, 177], [241, 194, 125], [198, 134, 66], [141, 85, 36], [224, 172, 105]][hash[0] % 5];
  const haar = [[60, 40, 20], [20, 20, 20], [200, 160, 60], [150, 60, 30], [230, 230, 230], [90, 60, 140]][hash[1] % 6];
  const auge = [[40, 90, 200], [60, 150, 60], [90, 60, 30], [60, 60, 60]][hash[2] % 4];
  const rgba = Buffer.alloc(8 * 8 * 4);
  const setze = (x, y, [r, g, b]) => { const o = (y * 8 + x) * 4; rgba[o] = r; rgba[o + 1] = g; rgba[o + 2] = b; rgba[o + 3] = 255; };
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) setze(x, y, y < 2 || ((x === 0 || x === 7) && y < 4 + (hash[3] % 2)) ? haar : haut);
  for (const x of [1, 2, 5, 6]) setze(x, 4, x === 1 || x === 6 ? [255, 255, 255] : auge);
  for (const x of [3, 4]) setze(x, 5, [Math.round(haut[0] * 0.85), Math.round(haut[1] * 0.85), Math.round(haut[2] * 0.85)]);
  for (const x of [2, 3, 4, 5]) setze(x, 6, [150, 70, 60]);
  return kodierePng(hochskalieren(rgba, 8, 8, 8), 64, 64);
}
