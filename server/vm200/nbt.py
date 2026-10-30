"""Minimaler NBT-Leser/-Schreiber (gzip, Java-Edition, big-endian) ohne externe Pakete – für spieler-reset.py.
Abbild: Compound → dict (Reihenfolge bleibt), List → NbtList(typ, werte), Zahlen als (typ, wert)-Tupel, damit beim Schreiben nichts den Typ wechselt."""
import gzip
import io
import struct

END, BYTE, SHORT, INT, LONG, FLOAT, DOUBLE, BYTE_ARRAY, STRING, LIST, COMPOUND, INT_ARRAY, LONG_ARRAY = range(13)
_FMT = {BYTE: ">b", SHORT: ">h", INT: ">i", LONG: ">q", FLOAT: ">f", DOUBLE: ">d"}


class NbtList(list):
    def __init__(self, typ, werte=()):
        super().__init__(werte)
        self.typ = typ


def _str(f):
    n = struct.unpack(">H", f.read(2))[0]
    return f.read(n).decode("utf-8", "surrogatepass")


def _payload(f, t):
    if t in _FMT:
        fmt = _FMT[t]
        return (t, struct.unpack(fmt, f.read(struct.calcsize(fmt)))[0])
    if t == BYTE_ARRAY:
        n = struct.unpack(">i", f.read(4))[0]
        return (t, f.read(n))
    if t == STRING:
        return _str(f)
    if t == LIST:
        et = f.read(1)[0]
        n = struct.unpack(">i", f.read(4))[0]
        return NbtList(et, [_payload(f, et) for _ in range(n)])
    if t == COMPOUND:
        d = {}
        while True:
            ct = f.read(1)[0]
            if ct == END:
                return d
            name = _str(f)                     # erst der Name, dann der Wert (Auswertungsreihenfolge!)
            d[name] = _payload(f, ct)
    if t in (INT_ARRAY, LONG_ARRAY):
        n = struct.unpack(">i", f.read(4))[0]
        fmt = ">%d%s" % (n, "i" if t == INT_ARRAY else "q")
        return (t, list(struct.unpack(fmt, f.read(struct.calcsize(fmt)))))
    raise ValueError("unbekannter NBT-Typ %d" % t)


def _typ(w):
    if isinstance(w, tuple):
        return w[0]
    if isinstance(w, str):
        return STRING
    if isinstance(w, NbtList):
        return LIST
    if isinstance(w, dict):
        return COMPOUND
    raise TypeError(type(w))


def _wstr(f, s):
    b = s.encode("utf-8", "surrogatepass")
    f.write(struct.pack(">H", len(b)) + b)


def _wpayload(f, w):
    t = _typ(w)
    if t in _FMT:
        f.write(struct.pack(_FMT[t], w[1]))
    elif t == BYTE_ARRAY:
        f.write(struct.pack(">i", len(w[1])) + w[1])
    elif t == STRING:
        _wstr(f, w)
    elif t == LIST:
        f.write(bytes([w.typ if w else (w.typ or END)]))
        f.write(struct.pack(">i", len(w)))
        for x in w:
            _wpayload(f, x)
    elif t == COMPOUND:
        for k, v in w.items():
            f.write(bytes([_typ(v)]))
            _wstr(f, k)
            _wpayload(f, v)
        f.write(bytes([END]))
    elif t in (INT_ARRAY, LONG_ARRAY):
        f.write(struct.pack(">i", len(w[1])))
        f.write(struct.pack(">%d%s" % (len(w[1]), "i" if t == INT_ARRAY else "q"), *w[1]))


def lesen(pfad):
    with gzip.open(pfad, "rb") as g:
        f = io.BytesIO(g.read())
    t = f.read(1)[0]
    name = _str(f)
    return name, _payload(f, t)


def schreiben(pfad, name, wurzel):
    f = io.BytesIO()
    f.write(bytes([COMPOUND]))
    _wstr(f, name)
    _wpayload(f, wurzel)
    with gzip.open(pfad, "wb") as g:
        g.write(f.getvalue())
