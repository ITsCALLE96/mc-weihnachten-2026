// Minimales NBT lesen/schreiben (gzip, Big Endian) – nur Node-Standardbibliothek.
// Werte behalten ihren Typ: { type: 'compound', value: {...} } usw., damit Schreiben verlustfrei bleibt.
import { gunzipSync, gzipSync } from 'node:zlib';

const TYPEN = ['end', 'byte', 'short', 'int', 'long', 'float', 'double', 'byteArray', 'string', 'list', 'compound', 'intArray', 'longArray'];

function leser(buf) {
  let p = 0;
  const r = {
    byte: () => buf.readInt8(p++),
    short: () => { const v = buf.readInt16BE(p); p += 2; return v; },
    int: () => { const v = buf.readInt32BE(p); p += 4; return v; },
    long: () => { const v = buf.readBigInt64BE(p); p += 8; return v; },
    float: () => { const v = buf.readFloatBE(p); p += 4; return v; },
    double: () => { const v = buf.readDoubleBE(p); p += 8; return v; },
    string: () => { const n = buf.readUInt16BE(p); p += 2; const s = buf.toString('utf8', p, p + n); p += n; return s; },
  };
  function wert(typ) {
    switch (typ) {
      case 'byteArray': { const n = r.int(); const v = Buffer.from(buf.subarray(p, p + n)); p += n; return v; }
      case 'intArray': { const n = r.int(); return Array.from({ length: n }, r.int); }
      case 'longArray': { const n = r.int(); return Array.from({ length: n }, r.long); }
      case 'list': {
        const elem = TYPEN[r.byte()]; const n = r.int();
        return { elem, items: Array.from({ length: n }, () => wert(elem)) };
      }
      case 'compound': {
        const o = {};
        for (;;) {
          const t = TYPEN[r.byte()];
          if (t === 'end') return o;
          const name = r.string();
          o[name] = { type: t, value: wert(t) };
        }
      }
      default: return r[typ]();
    }
  }
  return { wurzel() { const t = TYPEN[r.byte()]; const name = r.string(); return { name, type: t, value: wert(t) }; } };
}

export function leseNbt(datei) {
  const roh = datei[0] === 0x1f && datei[1] === 0x8b ? gunzipSync(datei) : datei;
  return leser(roh).wurzel();
}

export function schreibeNbt(wurzel) {
  const teile = [];
  const num = (n, f) => { const b = Buffer.alloc(n); f(b); teile.push(b); };
  const w = {
    byte: (v) => num(1, (b) => b.writeInt8(v)),
    short: (v) => num(2, (b) => b.writeInt16BE(v)),
    int: (v) => num(4, (b) => b.writeInt32BE(v)),
    long: (v) => num(8, (b) => b.writeBigInt64BE(BigInt(v))),
    float: (v) => num(4, (b) => b.writeFloatBE(v)),
    double: (v) => num(8, (b) => b.writeDoubleBE(v)),
    string: (v) => { const s = Buffer.from(v, 'utf8'); num(2, (b) => b.writeUInt16BE(s.length)); teile.push(s); },
  };
  function wert(typ, v) {
    switch (typ) {
      case 'byteArray': w.int(v.length); teile.push(Buffer.from(v)); break;
      case 'intArray': w.int(v.length); v.forEach(w.int); break;
      case 'longArray': w.int(v.length); v.forEach(w.long); break;
      case 'list': w.byte(TYPEN.indexOf(v.items.length ? v.elem : 'end')); w.int(v.items.length); v.items.forEach((i) => wert(v.elem, i)); break;
      case 'compound':
        for (const [name, kind] of Object.entries(v)) { w.byte(TYPEN.indexOf(kind.type)); w.string(name); wert(kind.type, kind.value); }
        w.byte(0);
        break;
      default: w[typ](v);
    }
  }
  w.byte(TYPEN.indexOf(wurzel.type)); w.string(wurzel.name); wert(wurzel.type, wurzel.value);
  return gzipSync(Buffer.concat(teile));
}

// Kurzschreibweise zum Bauen von Tags.
export const tag = (type, value) => ({ type, value });
