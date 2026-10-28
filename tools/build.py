#!/usr/bin/env python3
"""KATMAN web sitesini Claude Design canvas'ından ("Katman Website") derler.

Kullanım:
  python3 build.py <canvas project klasörü> <blob klasörü> <dc-runtime.js> <statik dosyalar> <seo dosyaları> <plex-mono fontları> <çıktı>

- Canvas sayfalarını (.dc.html) temiz adresli statik HTML'e çevirir (index.html, urunler.html, konfigurator.html …).
- /_blob/ görsellerini WebP'ye, fontları WOFF2'ye çevirip assets/ altına koyar.
- Sayfalar arası linkleri temiz adreslere (/urunler, /konfigurator …) çevirir.
- Statik dosyaları (api/form.js, vercel.json, rehber …) ve SEO dosyalarını (favicon, sitemap, robots, OG görseli) kopyalar.
Mobil kopyalar (Mobile*.dc.html) derlenmez: masaüstü sayfaları zaten responsive.
"""
import os, re, sys, shutil, io
from PIL import Image

PROJECT, BLOBS, RUNTIME, STATIC, SEO, PLEX, OUT = sys.argv[1:8]

PAGES = [  # canvas dosyası, çıktı dosyası, adres
    ('Main', 'index', '/'),
    ('Urunler', 'urunler', '/urunler'),
    ('Product', 'konfigurator', '/konfigurator'),
    ('Teknoloji', 'teknoloji', '/teknoloji'),
    ('Galeri', 'galeri', '/galeri'),
    ('Hakkimizda', 'hakkimizda', '/hakkimizda'),
    ('Iletisim', 'iletisim', '/iletisim'),
    ('Kvkk', 'kvkk', '/kvkk'),
]
ROUTE = {src: url for src, _, url in PAGES}
NAV = [('Ana Sayfa', '/'), ('Ürünler', '/urunler'), ("Kendi KATMAN'ını Oluştur", '/konfigurator'), ('Teknoloji', '/teknoloji'),
       ('Galeri', '/galeri'), ('Hakkımızda', '/hakkimizda'), ('İletişim', '/iletisim')]

if os.path.exists(OUT):
    for n in os.listdir(OUT):
        if n == '.git':
            continue
        p = os.path.join(OUT, n)
        shutil.rmtree(p) if os.path.isdir(p) else os.remove(p)
os.makedirs(OUT, exist_ok=True)
A = os.path.join(OUT, 'assets')
os.makedirs(os.path.join(A, 'img'), exist_ok=True)
os.makedirs(os.path.join(A, 'fonts'), exist_ok=True)

blob_files = {f.split('.')[0]: f for f in os.listdir(BLOBS)}
converted = {}
stats = [0, 0]


def blob_url(bid):
    if bid in converted:
        return converted[bid]
    fn = blob_files.get(bid)
    if not fn:
        raise SystemExit('Eksik blob: ' + bid)
    src = os.path.join(BLOBS, fn)
    ext = fn.rsplit('.', 1)[-1].lower()
    stats[0] += os.path.getsize(src)
    if ext in ('png', 'jpg', 'jpeg', 'webp'):
        im = Image.open(src)
        if im.width > 2400:
            im = im.resize((2400, round(im.height * 2400 / im.width)), Image.LANCZOS)
        has_alpha = im.mode in ('RGBA', 'LA') or (im.mode == 'P' and 'transparency' in im.info)
        im = im.convert('RGBA' if has_alpha else 'RGB')
        dst = os.path.join(A, 'img', bid + '.webp')
        im.save(dst, 'WEBP', quality=82, method=6)
        url = '/assets/img/' + bid + '.webp'
    elif ext in ('ttf', 'otf'):
        from fontTools.ttLib import TTFont
        f = TTFont(src)
        f.flavor = 'woff2'
        dst = os.path.join(A, 'fonts', bid + '.woff2')
        f.save(dst)
        url = '/assets/fonts/' + bid + '.woff2'
    else:
        dst = os.path.join(A, 'img', fn)
        shutil.copy(src, dst)
        url = '/assets/img/' + fn
    stats[1] += os.path.getsize(dst)
    converted[bid] = url
    return url


# runtime (adında içerik özeti: assets/ bir yıl önbelleklenir, değişince adı da değişir) + Plex Mono
import hashlib
_rt = open(RUNTIME, 'rb').read()
RT_NAME = 'dc-runtime-' + hashlib.sha1(_rt).hexdigest()[:10] + '.js'
open(os.path.join(A, RT_NAME), 'wb').write(_rt)
# çerez onayı + GA4 (tools/katman-consent.js); adında içerik özeti
_ck = open(os.path.join(STATIC, 'tools', 'katman-consent.js'), 'rb').read()
CK_NAME = 'katman-consent-' + hashlib.sha1(_ck).hexdigest()[:10] + '.js'
open(os.path.join(A, CK_NAME), 'wb').write(_ck)
from fontTools.ttLib import TTFont
for w in ('400', '500'):
    f = TTFont(os.path.join(PLEX, f'IBMPlexMono-{w}.ttf'))
    f.flavor = 'woff2'
    f.save(os.path.join(A, 'fonts', f'IBMPlexMono-{w}.woff2'))
PLEX_CSS = ('<style>@font-face{font-family:"IBM Plex Mono";src:url("/assets/fonts/IBMPlexMono-400.woff2") format("woff2");font-weight:400;font-display:swap}'
            '@font-face{font-family:"IBM Plex Mono";src:url("/assets/fonts/IBMPlexMono-500.woff2") format("woff2");font-weight:500 700;font-display:swap}</style>')

TPL_FIX = ('<script>(function(){var x=document.querySelector("x-dc");if(!x)return;'
           'var d=Object.getOwnPropertyDescriptor(Element.prototype,"innerHTML");'
           'Object.defineProperty(x,"innerHTML",{configurable:true,get:function(){return d.get.call(this)'
           '.replace(/ data-k-(src|href|d|transform)="\\{\\{/g,\' $1="{{\')},set:function(v){d.set.call(this,v)}})})();</script>')

link_re = re.compile(r'(?<![\w-])(Main|Urunler|Product|Teknoloji|Galeri|Hakkimizda|Iletisim|Kvkk)\.dc\.html')

for src, out, url in PAGES:
    s = open(os.path.join(PROJECT, src + '.dc.html'), encoding='utf-8').read()
    k = '<script src="./support.js"></script>'
    assert s.count(k) == 1, src
    pre = ''.join(f'<link rel="preload" href="/assets/fonts/{fid}.woff2" as="font" type="font/woff2" crossorigin>\n' for fid in ('66096ca68e67965985d268e1ce59cb5b', '97231e0de623b2d24619c38cee435b7d'))
    s = s.replace(k, pre + f'<script>window.__resources={{}}</script><script src="/assets/{CK_NAME}" defer></script><script src="/assets/{RT_NAME}"></script>')
    # JavaScript kapalıysa / tarayıcı içeriği çizemezse: başlık, açıklama ve menü
    h1 = re.sub(r'<[^>]+>', ' ', re.search(r'<h1[^>]*>(.*?)</h1>', s, re.S).group(1))
    h1 = re.sub(r'\s+', ' ', h1).strip()
    desc = re.search(r'<meta name="description" content="([^"]*)"', s).group(1)
    nav = ' · '.join(f'<a href="{u}">{n}</a>' for n, u in NAV)
    s = s.replace('<body>', f'<body>\n<noscript><div style="max-width:720px;margin:48px auto;padding:0 24px;font-family:sans-serif"><p><strong>{h1}</strong></p><p>{desc}</p><p>{nav}</p><p>Bize <a href="mailto:info@katmanaudio.com">info@katmanaudio.com</a> adresinden ulaşabilirsiniz.</p></div></noscript>', 1)
    # Şablon değerleri: <x-dc> içindeki src/href/d/transform="{{…}}" tarayıcı ayrıştırırken istenip 404 üretmesin.
    # Öznitelik adı data-k-src/data-k-href yapılır; motor şablonu okurken (x-dc.innerHTML) asıl adlar geri verilir.
    i0 = s.index('<x-dc>'); i1 = s.index('</x-dc>')
    blk = re.sub(r'(\s)(src|href|d|transform)="(\{\{[^"]*\}\})"', r'\1data-k-\2="\3"', s[i0:i1])
    s = s[:i0] + blk + '</x-dc>' + TPL_FIX + s[i1 + len('</x-dc>'):]
    assert not re.search(r'(?<![\w-])(?:src|href|d|transform)="\{\{', s), src
    s, n = re.subn(r'<link rel="stylesheet" href="https://fonts\.googleapis\.com/css2\?family=IBM\+Plex\+Mono[^"]*">', PLEX_CSS, s)
    s = re.sub(r'/_blob/([0-9a-f]{32})', lambda m: blob_url(m.group(1)), s)
    s = link_re.sub(lambda m: ROUTE[m.group(1)], s)
    s = s.replace("font-weight:400}", "font-weight:400;font-display:swap}").replace("font-weight:500}", "font-weight:500;font-display:swap}").replace("font-weight:700}", "font-weight:700;font-display:swap}")
    assert '/_blob/' not in s and '.dc.html' not in s, src
    assert s.count('googletagmanager.com') == 0 and s.count('katman-consent-') == 1, src
    open(os.path.join(OUT, out + '.html'), 'w', encoding='utf-8').write(s)
    print('sayfa', out + '.html', '←', src + '.dc.html')

# statik dosyalar ve SEO dosyaları
for base in (STATIC, SEO):
    for root, dirs, files in os.walk(base):
        for fn in files:
            p = os.path.join(root, fn)
            rel = os.path.relpath(p, base)
            dst = os.path.join(OUT, rel)
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            shutil.copy(p, dst)

print(f'görseller+fontlar: {stats[0]//1024} KB → {stats[1]//1024} KB, {len(converted)} dosya')
