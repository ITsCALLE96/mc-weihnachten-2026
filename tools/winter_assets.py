# Holt gemeinfreie Wintergemälde und freie Wintermusik von Wikimedia Commons,
# rechnet sie auf Minecraft-Gemälde- bzw. .ogg-Format um und legt sie ins Resourcepack.
# Quellen landen in resourcepack/quellen/ (git-ignoriert), Ergebnisse unter resourcepack/assets/.
# Aufruf: uv run --with pillow --with imageio-ffmpeg python tools/winter_assets.py
import json
import subprocess
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image
import imageio_ffmpeg

REPO = Path(__file__).resolve().parent.parent
RP = REPO / 'resourcepack'
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

# Kürzel → (Commons-Datei, Namensnennung)
MUSIK = {
    'gymnopedie': ('Satie_Gymnopedie_No_2_performed_by_Michael_Laucke.flac', 'Erik Satie, Gymnopédie No. 2, gespielt von Michael Laucke – gemeinfrei'),
    'clair_de_lune': ('Clair_de_lune_(Claude_Debussy)_Suite_bergamasque.ogg', 'Claude Debussy, Clair de lune – gemeinfrei'),
    'jingle_bells': ('Jingle_Bells_(Calm)_(ISRC_USUAN1100188).mp3', '„Jingle Bells (Calm)“ Kevin MacLeod (incompetech.com), CC BY 3.0'),
    'angels': ('Angels_We_Have_Heard_On_High_(piano)_(Kevin_MacLeod)_(ISRC_USUAN1100329).oga', '„Angels We Have Heard on High“ Kevin MacLeod (incompetech.com), CC BY 3.0'),
    'stille_nacht': ('Silent_Night_Librivox_2009.ogg', 'Silent Night, LibriVox 2009 – CC0'),
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

    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    musik = RP / 'assets/weihnachten/sounds/music'
    musik.mkdir(parents=True, exist_ok=True)
    for name, (datei, _) in MUSIK.items():
        ziel = musik / f'{name}.ogg'
        if not ziel.exists():
            subprocess.run([ffmpeg, '-y', '-loglevel', 'error', '-i', str(hole(datei)), '-vn', '-ac', '2',
                            '-c:a', 'libvorbis', '-q:a', '3', str(ziel)], check=True)
    eintraege = [{'name': f'weihnachten:music/{n}', 'stream': True, 'volume': 0.4} for n in MUSIK]
    ereignisse = ['music.game', 'music.menu'] + [f'music.overworld.{b}' for b in (
        'badlands bamboo_jungle cherry_grove deep_dark desert dripstone_caves flower_forest forest frozen_peaks '
        'grove jagged_peaks jungle lush_caves meadow old_growth_taiga snowy_slopes sparse_jungle stony_peaks '
        'sulfur_caves swamp').split()]
    sounds = {e: {'replace': True, 'sounds': eintraege} for e in ereignisse}
    (RP / 'assets/minecraft/sounds.json').write_text(json.dumps(sounds, indent=2) + '\n', encoding='utf-8')
    print(f'{len(GEMAELDE)} Gemälde, {len(MUSIK)} Musikstücke für {len(ereignisse)} Musik-Ereignisse')


if __name__ == '__main__':
    main()
