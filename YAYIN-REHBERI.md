# Katman web sitesi · yayın rehberi

Bu depo katmanaudio.com'un yayına hazır halidir. Sayfalar statik HTML, formlar ise
Vercel üzerinde çalışan küçük bir fonksiyonla (`api/form.js`) e-postaya dönüşür.

## Klasör yapısı

| Yol | Ne |
|---|---|
| `index.html`, `urunler.html`, `konfigurator.html` (eski adı `kendi-katmanini-olustur.html`), `teknoloji.html`, `galeri.html`, `hakkimizda.html`, `iletisim.html`, `kvkk.html`, `404.html` | Sayfalar. Adres çubuğunda `.html` görünmez (`/urunler`). |
| `assets/img` | WebP'ye çevrilmiş görseller (20 MB → 1,8 MB) |
| `assets/fonts` | Archivo ve IBM Plex Mono (siteden yüklenir, Google Fonts'a gitmez) |
| `assets/dc-runtime-*.js` | Sayfaları çalıştıran tasarım motoru |
| `api/form.js` | Teklif, iletişim ve özel ölçü formlarını info@katmanaudio.com'a gönderir |
| `sitemap.xml`, `robots.txt`, `images/katman-og.jpg`, ikonlar | SEO ve paylaşım önizlemeleri (aşağıdaki SEO bölümüne bak) |
| `vercel.json` | Temiz adresler, önbellek ve güvenlik başlıkları |

## 1 · GitHub ve Vercel

1. github.com'da hesap aç (varsa geç). **New repository** → ad: `katman-web` → **Private** → Create.
2. Bu klasörün içeriğini depoya yükle (Claude doğrudan yükleyebilir; ya da GitHub Desktop ile).
3. vercel.com → **Continue with GitHub** ile giriş yap.
4. **Add New… → Project** → `katman-web` deposunu **Import** et.
   - Framework Preset: **Other**
   - Build Command: boş · Output Directory: boş (kök klasör)
5. **Deploy**. Birkaç saniyede `katman-web-xxxx.vercel.app` adresinde yayında olur.

Bundan sonra depoya her yükleme otomatik olarak yeniden yayınlanır.

## 2 · Form e-postaları (Resend)

1. resend.com'da hesap aç → **Domains → Add Domain** → `katmanaudio.com`, bölge: **EU (Ireland)**.
2. Resend'in gösterdiği 3 kaydı GoDaddy DNS'e ekle (aşağıdaki tabloda "Resend" satırları). **Verify**.
3. **API Keys → Create API Key** (Sending access, yalnızca bu domain).
4. Vercel → Project → **Settings → Environment Variables**:
   - `RESEND_API_KEY` = az önce aldığın anahtar
   - (isteğe bağlı) `MAIL_TO` = info@katmanaudio.com
5. Vercel → **Deployments → … → Redeploy** (anahtar ancak yeni yayında devreye girer).

Gelen e-postada **Yanıtla** dediğinde yanıt doğrudan müşterinin adresine gider.
Ücretsiz plan: ayda 3.000, günde 100 e-posta.

## 3 · Alan adı (GoDaddy → Vercel)

1. Vercel → Project → **Settings → Domains** → `katmanaudio.com` ekle. `www.katmanaudio.com`'u da ekle ve
   ana adrese yönlendir (Vercel bunu önerir).
2. Vercel'in kartında gösterdiği A ve CNAME değerlerini GoDaddy → **Alan Adım → DNS** ekranına gir.
3. GoDaddy'nin varsayılan `@` A kaydını ("Parked") ve `www` CNAME kaydını sil.

## 4 · E-posta (info@katmanaudio.com → Gmail)

Workattack için kullanılan Google Workspace'e Katman'ı ikinci alan adı olarak eklemek,
info@ adresini mevcut Gmail kutusuna ek maliyetsiz bağlar:

1. admin.google.com → **Hesap → Alan adları → Alan adlarını yönet → Alan adı ekle**
   → `katmanaudio.com` → **İkincil alan adı**.
2. Google'ın verdiği TXT doğrulama kaydını GoDaddy'ye ekle → doğrula.
3. GoDaddy'de eski e-posta MX kayıtlarını sil, Google MX kaydını ekle (tabloda).
4. admin.google.com → **Dizin → Kullanıcılar → (kendi kullanıcın) → Alternatif e-posta ekle**
   → `info` · alan adı `katmanaudio.com`.
5. Gmail → **Ayarlar → Hesaplar → Postayı farklı gönder → Başka bir e-posta adresi ekle**
   → `Katman <info@katmanaudio.com>`. Aynı hesabın takma adı olduğu için SMTP ya da doğrulama istemez.
   Yanıt verirken "Kimden" kısmından seçilir.
6. admin.google.com → **Uygulamalar → Google Workspace → Gmail → E-postanın kimliğini doğrula**
   → katmanaudio.com için DKIM anahtarı oluştur → TXT kaydını GoDaddy'ye ekle → **Kimlik doğrulamayı başlat**.

GoDaddy'deki e-posta paketi MX değiştikten sonra posta almaz; içinde mesaj yoksa iptal edilebilir.

## DNS kayıtlarının son hali (GoDaddy)

| Tip | Ad | Değer | Ne için |
|---|---|---|---|
| A | @ | Vercel kartındaki değer (çoğunlukla `76.76.21.21`) | Site |
| CNAME | www | Vercel kartındaki değer | Site |
| MX | @ | `smtp.google.com` · öncelik 1 | Gmail |
| TXT | @ | `v=spf1 include:_spf.google.com ~all` | Gmail SPF |
| TXT | @ | `google-site-verification=…` (Google verir) | Workspace doğrulama |
| TXT | google._domainkey | Google Admin'in verdiği DKIM | Gmail DKIM |
| TXT | resend._domainkey | Resend'in verdiği değer | Form e-postası DKIM |
| MX | send | Resend'in verdiği değer | Form e-postası |
| TXT | send | Resend'in verdiği SPF | Form e-postası |
| TXT | _dmarc | `v=DMARC1; p=none; rua=mailto:info@katmanaudio.com` | Teslim güvenilirliği |

`@` alanında tek bir SPF (`v=spf1 …`) kaydı olmalı. GoDaddy'nin eski SPF kaydı varsa onu sil.

## 5 · Yayın sonrası

1. search.google.com/search-console → **Alan adı** mülkü → `katmanaudio.com` → TXT kaydını GoDaddy'ye ekle.
2. **Site haritaları** → `sitemap.xml` gönder. (İndekslenme süresi Google'a bağlıdır; garanti edilemez.)
3. Üç formu canlı sitede bir kez dene; e-postaların info@'ya geldiğini kontrol et.
4. Paylaşım kartını kontrol et: developers.facebook.com/tools/debug ve LinkedIn Post Inspector'a ana sayfa adresini gir.

## Yayına almadan önce mutlaka

- KVKK sayfasındaki şirket unvanı ve adresi tasarımda dolduruldu (MEDYARAT YAPIM YAYIN REKLAMCILIK LTD. ŞTİ.,
  Kuleli Cad. No:16/2 Çengelköy, İstanbul). Metni bir hukukçuya kontrol ettirmeni öneririz.

## SEO ve meta (SEO brief'ine göre uygulandı · 28 Ekim 2026)

Kaynak: "KATMAN SEO & Meta Uygulama Briefi". Canvas'taki 8 sayfanın `<head>` bölümünde `<!-- SEO -->` bloğu var;
derlemede olduğu gibi taşınmalı. Mobil kopyalar (Mobile-*.dc.html) aynı bloğu ve canonical'ı taşır, ayrı sayfa değildir.

| Canvas dosyası | Adres (canonical) | Title |
|---|---|---|
| Main | `https://katmanaudio.com/` | KATMAN \| Modüler Hi-Fi Rack ve Ses Sistemi Mobilyaları |
| Urunler | `/urunler` | Modüler Hi-Fi Rack Sistemleri \| KATMAN |
| Product | `/konfigurator` | Kendi Hi-Fi Rack Sisteminizi Tasarlayın \| KATMAN |
| Teknoloji | `/teknoloji` | Hi-Fi Rack Teknolojisi ve Tasarım Detayları \| KATMAN |
| Galeri | `/galeri` | Galeri: Yaşam Alanlarında Hi-Fi Rack \| KATMAN |
| Hakkimizda | `/hakkimizda` | KATMAN Hakkında \| Tasarım ve Hi-Fi Kültürü |
| Iletisim | `/iletisim` | İletişim ve Özel Ölçü Talebi \| KATMAN |
| Kvkk | `/kvkk` | KVKK Aydınlatma Metni \| KATMAN |

Bloktaki etiketler: viewport, description, `robots: index, follow`, canonical, theme-color, favicon bağlantıları,
Open Graph, X (Twitter) kartı. Ana sayfada ayrıca Organization ve WebSite JSON-LD.
Ana sayfa og:title: "KATMAN | Designed for Sound. Made for Living."; diğer sayfalarda title ile aynı.
H1'ler bilerek değiştirilmedi (Kaan'ın kararı): sayfalardaki mevcut hero başlıkları korunuyor.

Sayfa içinde: her sayfada `<main id="icerik">` (header ve footer dışında), ilk görsel `fetchpriority="high"`,
alttaki görseller `loading="lazy"`. Carousel görselleri bilerek lazy değil (kaydırınca boş kare görünmesin).

### Depoda
- **Adres değişikliği (yapıldı):** konfigüratör sayfası `konfigurator.html` (`/konfigurator`); tüm linkler buna göre derlendi.
  `vercel.json` eski `/kendi-katmanini-olustur` adresini kalıcı olarak `/konfigurator`'a yönlendirir.
- **Kök dosyalar (depoda):** `favicon.ico`, `favicon.svg`, `apple-touch-icon.png`, `icon-512.png` (JSON-LD logosu),
  `images/katman-og.jpg` (1200×630, koyu zemin, logo + "Designed for Sound. Made for Living."), `sitemap.xml`, `robots.txt`.
- sitemap.xml yalnızca var olan 8 adresi içerir.

### Bilerek yapılmayanlar (brief gereği)
- `/urunler/kat1–kat4` ürün detay sayfaları ve Product JSON-LD: sayfalar henüz yok, uydurulmadı.
  KAT1–KAT4 / raf sayısı eşleşmesi mevcut veride doğru (KAT1 = 1 kat … KAT4 = 4 kat).
- Fiyat, stok, puan, yorum ve performans verisi eklenmedi.
- İngilizce sayfa, `/en` rotası ve hreflang: ikinci aşama.

### Bilinen açık nokta
- Ana sayfa ve Hakkımızda H1'i aynı ("Her Şey Bir Katmanla Başlar."). Brief her sayfaya benzersiz H1 istiyor;
  istenirse Hakkımızda H1'i değiştirilebilir.

## Siteyi güncellemek

Tasarım kaynağı Claude Design'daki "Katman Website" canvas'ıdır. Değişikliği orada yap,
Claude'dan bu depoyu yeniden derlemesini iste (`tools/build.py`); Vercel yüklemeyi görüp siteyi yeniler.
