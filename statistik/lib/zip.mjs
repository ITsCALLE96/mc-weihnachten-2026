// Minimaler ZIP-Leser: zentrales Verzeichnis lesen, einen Eintrag mit inflateRaw entpacken.
import { readFileSync } from 'node:fs';
import { inflateRawSync, crc32 } from 'node:zlib';

export function liesZipEintrag(zipPfad, eintragName) {
  const buf = readFileSync(zipPfad);
  return liesEintragAusPuffer(buf, eintragName);
}

export function liesEintragAusPuffer(buf, eintragName) {
  // End-of-Central-Directory-Satz (PK\5\6) von hinten suchen
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 22 - 65535); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('Kein ZIP (EOCD fehlt)');
  const anzahl = buf.readUInt16LE(eocd + 10);
  let pos = buf.readUInt32LE(eocd + 16);
  for (let n = 0; n < anzahl; n++) {
    if (buf.readUInt32LE(pos) !== 0x02014b50) throw new Error('Zentrales Verzeichnis defekt');
    const methode = buf.readUInt16LE(pos + 10);
    const crc = buf.readUInt32LE(pos + 16);
    const gepackt = buf.readUInt32LE(pos + 20);
    const laenge = buf.readUInt32LE(pos + 24);
    const nameLen = buf.readUInt16LE(pos + 28);
    const extraLen = buf.readUInt16LE(pos + 30);
    const kommLen = buf.readUInt16LE(pos + 32);
    const lokal = buf.readUInt32LE(pos + 42);
    const name = buf.toString('utf8', pos + 46, pos + 46 + nameLen);
    if (name === eintragName) {
      const lNameLen = buf.readUInt16LE(lokal + 26);
      const lExtraLen = buf.readUInt16LE(lokal + 28);
      const start = lokal + 30 + lNameLen + lExtraLen;
      const roh = buf.subarray(start, start + gepackt);
      const daten = methode === 0 ? roh : inflateRawSync(roh);
      if (daten.length !== laenge) throw new Error('ZIP-Eintrag hat falsche Länge');
      if (crc32(daten) !== crc) throw new Error('ZIP-Eintrag: CRC-Fehler');
      return daten;
    }
    pos += 46 + nameLen + extraLen + kommLen;
  }
  throw new Error(`ZIP-Eintrag nicht gefunden: ${eintragName}`);
}
