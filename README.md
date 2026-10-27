# katman-web

katmanaudio.com · KATMAN modüler Hi-Fi rack web sitesi.

Statik sayfalar + Vercel fonksiyonu (`api/form.js`). Derleme adımı yok; depo olduğu gibi yayınlanır.

Kurulum, alan adı, form e-postası, DNS ve SEO ayarları için: [YAYIN-REHBERI.md](YAYIN-REHBERI.md)

Sayfalar Claude Design'daki "Katman Website" canvas'ından `tools/build.py` ile derlenir; sayfa HTML'lerini
elle düzenleme, değişikliği canvas'ta yapıp yeniden derle.
