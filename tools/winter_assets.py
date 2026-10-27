# Holt gemeinfreie Wintergemälde von Wikimedia Commons, rechnet sie auf Minecraft-Gemälde um,
# legt sie ins Resourcepack und packt build/weihnachten-rp.zip (mit resourcepack-winter/) sowie
# build/weihnachten-rp-ohne-winter.zip (ohne quellen/ und *.md).
# Quellen landen in resourcepack/quellen/ (git-ignoriert), Ergebnisse unter resourcepack/assets/.
# Musik war bis 24.10. dabei und ist raus: die meisten Spieler hören eigene Musik.
# Aufruf: uv run --with pillow python tools/winter_assets.py
import hashlib
import time
import urllib.error
import urllib.parse
import urllib.request
import zipfile
from pathlib import Path

from PIL import Image

REPO = Path(__file__).resolve().parent.parent
RP = REPO / 'resourcepack'
WINTER = REPO / 'resourcepack-winter'  # von tools/texturen.mjs gebaut
QUELLEN = RP / 'quellen'
PX = 32  # Pixel je Block (Vanilla: 16)

# Kürzel → Commons-Dateiname (alle gemeinfrei bzw. CC0, siehe resourcepack/KANDIDATEN.md)
BILDER = {
    'jaeger': 'Pieter_Bruegel_the_Elder_-_Hunters_in_the_Snow_-_opt.jpg',
    'anbetung': 'The_adoration_of_the_magi_in_the_snow,_1563.jpg',
    'elster': 'Claude_Monet_-_The_Magpie_-_Google_Art_Project.jpg',
    'eisszene': 'Hendrick_Avercamp_-_Ice_Scene_-_785_-_Rijksmuseum.jpg',
    'schloss': 'Hendrick_Averkamp_A_Winter_Scene_with_Skaters_near_a_Castle.jpg',
    'eichbaum': 'Friedrich,_Caspar_David_-_Eichbaum_im_Schnee.jpg',
    'kirche': 'Winter_Landscape_by_Caspar_David_Friedrich.jpg',
    'huette': 'Caspar_David_Friedrich_-_Verschneite_Hütte.jpg',
    'julafton': 'Julaftonen_av_Carl_Larsson_1904.jpg',
    'julbord': 'Carl_Larsson_julbord_1904.jpg',
    'gauguin': 'Gauguin,_Paul_-_Christmas_Night_(The_Blessing_of_the_Oxen)_-_Google_Art_Project.jpg',
    'uhde': 'Fritz_von_Uhde_Heilige_Nacht.jpg',
    'repin': 'Yuri_Ilyich_Repin_-_Church_in_Kuokkala_on_Christmas_Night.jpg',
    'sisley': 'Alfred_Sisley_-_Snow_at_Louveciennes_-_Google_Art_Project.jpg',
    'argenteuil': 'Monet_Snow_at_Argenteuil_1875.jpg',
    'kustodiev': 'Winter._Kustodiev.jpg',
}

# Vanilla-Gemälde (Name, Breite, Höhe in Blöcken) → Motiv; earth/fire/water/wind sind nicht platzierbar.
GEMAELDE = {
    'fighters': (4, 2, 'eisszene'), 'changing': (4, 2, 'jaeger'), 'finding': (4, 2, 'anbetung'),
    'lowmist': (4, 2, 'elster'), 'passage': (4, 2, 'kirche'),
    'skeleton': (4, 3, 'jaeger'), 'donkey_kong': (4, 3, 'julafton'),
    'burning_skull': (4, 4, 'gauguin'), 'orb': (4, 4, 'schloss'), 'pigscene': (4, 4, 'uhde'),
    'pointer': (4, 4, 'argenteuil'), 'unpacked': (4, 4, 'kustodiev'),
    'courbet': (2, 1, 'eisszene'), 'creebet': (2, 1, 'elster'), 'pool': (2, 1, 'julbord'),
    'sea': (2, 1, 'kirche'), 'sunset': (2, 1, 'anbetung'),
    'baroque': (2, 2, 'gauguin'), 'bust': (2, 2, 'uhde'), 'humble': (2, 2, 'kustodiev'),
    'match': (2, 2, 'argenteuil'), 'skull_and_roses': (2, 2, 'huette'), 'stage': (2, 2, 'schloss'),
    'void': (2, 2, 'repin'), 'wither': (2, 2, 'julbord'),
    'bouquet': (3, 3, 'uhde'), 'cavebird': (3, 3, 'gauguin'), 'cotan': (3, 3, 'kustodiev'),
    'dennis': (3, 3, 'schloss'), 'endboss': (3, 3, 'repin'), 'fern': (3, 3, 'huette'),
    'owlemons': (3, 3, 'argenteuil'), 'sunflowers': (3, 3, 'julbord'), 'tides': (3, 3, 'sisley'),
    'backyard': (3, 4, 'eichbaum'), 'pond': (3, 4, 'sisley'),
    'alban': (1, 1, 'huette'), 'aztec': (1, 1, 'gauguin'), 'aztec2': (1, 1, 'elster'),
    'bomb': (1, 1, 'kustodiev'), 'kebab': (1, 1, 'uhde'), 'meditative': (1, 1, 'repin'),
    'plant': (1, 1, 'eichbaum'), 'wasteland': (1, 1, 'argenteuil'),
    'graham': (1, 2, 'eichbaum'), 'prairie_ride': (1, 2, 'repin'), 'wanderer': (1, 2, 'sisley'),
}

def hole(datei, breite=None):
    ziel = QUELLEN / (datei if not breite else f'{breite}px-{datei}')
    if ziel.exists():
        return ziel
    url = 'https://commons.wikimedia.org/wiki/Special:FilePath/' + urllib.parse.quote(datei)
    if breite:
        url += f'?width={breite}'
    anfrage = urllib.request.Request(url, headers={'User-Agent': 'ITsCALLE96/mc-weihnachten-2026 (Resourcepack-Bau)'})
    for versuch in range(5):  # Commons drosselt viele Abrufe hintereinander (HTTP 429)
        try:
            with urllib.request.urlopen(anfrage) as antwort:
                ziel.write_bytes(antwort.read())
            return ziel
        except urllib.error.HTTPError as e:
            if e.code != 429 or versuch == 4:
                raise
            time.sleep(15 * (versuch + 1))


# Rand, der vor dem Zuschnitt weg muss (Anteil je Seite): Rahmenkanten der Scans, das runde Avercamp-Bild auf sein inneres Quadrat.
RAND = {'schloss': 0.15, 'repin': 0.08}


def zuschneiden(bild, verhaeltnis, rand=0.03):
    b, h = bild.size
    bild = bild.crop((round(b * rand), round(h * rand), round(b * (1 - rand)), round(h * (1 - rand))))
    b, h = bild.size
    if b / h > verhaeltnis:
        nb = round(h * verhaeltnis)
        return bild.crop(((b - nb) // 2, 0, (b - nb) // 2 + nb, h))
    nh = round(b / verhaeltnis)
    return bild.crop((0, (h - nh) // 2, b, (h - nh) // 2 + nh))


def main():
    QUELLEN.mkdir(parents=True, exist_ok=True)
    bilder = {k: Image.open(hole(d, 1600)).convert('RGB') for k, d in BILDER.items()}
    ordner = RP / 'assets/minecraft/textures/painting'
    ordner.mkdir(parents=True, exist_ok=True)
    for name, (b, h, motiv) in GEMAELDE.items():
        bild = zuschneiden(bilder[motiv], b / h, RAND.get(motiv, 0.03)).resize((b * PX, h * PX), Image.LANCZOS)
        bild.save(ordner / f'{name}.png', optimize=True)

    print(f'{len(GEMAELDE)} Gemälde')
    # Pflicht-Pack mit Winterteil (Saison) und dieselbe Basis ohne Winterteil (nach der Saison).
    for name, ordner in [('weihnachten-rp', [RP, WINTER]), ('weihnachten-rp-ohne-winter', [RP])]:
        zipdatei = REPO / f'build/{name}.zip'
        zipdatei.parent.mkdir(exist_ok=True)
        dateien = {}
        for wurzel in ordner:  # später gewinnt: Winter überschreibt gleichnamige Basisdateien
            for datei in sorted(wurzel.rglob('*')):
                teil = datei.relative_to(wurzel)
                if datei.is_file() and teil.parts[0] != 'quellen' and datei.suffix != '.md':
                    dateien[teil.as_posix()] = datei
        with zipfile.ZipFile(zipdatei, 'w', zipfile.ZIP_DEFLATED) as z:
            for teil, datei in sorted(dateien.items()):
                z.write(datei, teil)
        sha1 = hashlib.sha1(zipdatei.read_bytes()).hexdigest()
        print(f'{zipdatei} ({zipdatei.stat().st_size / 1e6:.1f} MB, SHA1 {sha1})')

if __name__ == '__main__':
    main()
