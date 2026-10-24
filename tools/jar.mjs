// Liest Dateien aus einer Jar/Zip (nur Node-Standardbibliothek, ohne Entpacken).
import { readFileSync } from 'node:fs';
import { inflateRawSync } from 'node:zlib';

export function oeffneJar(pfad) {
  const buf = readFileSync(pfad);
  // Ende des zentralen Verzeichnisses suchen (Signatur 0x06054b50)
  let ende = buf.length - 22;
  while (ende >= 0 && buf.readUInt32LE(ende) !== 0x06054b50) ende--;
  if (ende < 0) throw new Error(`${pfad}: keine Zip-Datei`);
  const anzahl = buf.readUInt16LE(ende + 10);
  let pos = buf.readUInt32LE(ende + 16);
  const eintraege = new Map();
  for (let i = 0; i < anzahl; i++) {
    const methode = buf.readUInt16LE(pos + 10);
    const groesse = buf.readUInt32LE(pos + 20);
    const nameLen = buf.readUInt16LE(pos + 28);
    const extraLen = buf.readUInt16LE(pos + 30);
    const kommLen = buf.readUInt16LE(pos + 32);
    const offset = buf.readUInt32LE(pos + 42);
    const name = buf.toString('utf8', pos + 46, pos + 46 + nameLen);
    eintraege.set(name, { methode, groesse, offset });
    pos += 46 + nameLen + extraLen + kommLen;
  }
  return {
    namen: () => [...eintraege.keys()],
    liesBinaer(name) {
      const e = eintraege.get(name);
      if (!e) return undefined;
      const start = e.offset + 30 + buf.readUInt16LE(e.offset + 26) + buf.readUInt16LE(e.offset + 28);
      const daten = buf.subarray(start, start + e.groesse);
      return e.methode === 8 ? inflateRawSync(daten) : daten;
    },
    lies(name) {
      return this.liesBinaer(name)?.toString('utf8');
    },
  };
}

const ADV = 'data/minecraft/advancement/';

// Alle Vanilla-Fortschritte (ohne Rezepte) als Map id → JSON, z. B. "story/mine_stone".
export function vanillaFortschritte(pfad) {
  const jar = oeffneJar(pfad);
  const ergebnis = new Map();
  for (const name of jar.namen()) {
    if (!name.startsWith(ADV) || !name.endsWith('.json') || name.startsWith(ADV + 'recipes/')) continue;
    ergebnis.set(name.slice(ADV.length, -5), JSON.parse(jar.lies(name)));
  }
  return ergebnis;
}
