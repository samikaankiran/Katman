/* KATMAN · çerez onayı + Google Analytics 4 (gtag.js)
 * - Onay verilmeden gtag.js yüklenmez, Google'a istek gitmez, çerez oluşmaz.
 * - Google Consent Mode v2 varsayılanları "denied"; kabulde yalnızca analytics_storage "granted" olur.
 * - Reklam depolaması / reklam sinyalleri hiçbir durumda açılmaz.
 * - Tercih tarayıcıda (localStorage) saklanır; footer'daki "Çerez Tercihleri" bağlantısı bandı yeniden açar.
 * - window.katmanTrack(ad, parametreler): yalnızca onay varsa GA4'e etkinlik gönderir; kişisel veri gönderilmez.
 * Derleme (tools/build.py) bu dosyayı assets/katman-consent-<özet>.js olarak her sayfaya bir kez ekler.
 */
(function () {
  'use strict';
  if (window.__katmanConsent) return; // aynı sayfada iki kez çalışmasın
  window.__katmanConsent = true;

  var GA_ID = 'G-25K0M2TFDG';
  var KEY = 'katman_cerez_tercihi';
  var VER = 1;
  var PROD = /(^|\.)katmanaudio\.com$/.test(location.hostname);
  var DEBUG = !PROD || /[?&]ga_debug=1\b/.test(location.search);

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    functionality_storage: 'granted',
    security_storage: 'granted'
  });

  function readChoice() {
    try {
      var v = JSON.parse(localStorage.getItem(KEY) || 'null');
      return v && v.v === VER && (v.a === 'granted' || v.a === 'denied') ? v.a : null;
    } catch (e) { return null; }
  }
  function saveChoice(a) {
    try { localStorage.setItem(KEY, JSON.stringify({ v: VER, a: a, t: new Date().toISOString().slice(0, 10) })); } catch (e) {}
  }

  var choice = readChoice();
  var loaded = false;

  function loadGA() {
    window['ga-disable-' + GA_ID] = false;
    gtag('consent', 'update', { analytics_storage: 'granted' });
    if (loaded) return;
    loaded = true;
    gtag('js', new Date());
    var cfg = { allow_google_signals: false, allow_ad_personalization_signals: false };
    if (DEBUG) cfg.debug_mode = true;
    gtag('config', GA_ID, cfg); // sayfa görüntülemesini (page_view) bir kez gönderir
    if (!document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) {
      var s = document.createElement('script');
      s.async = true;
      s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_ID);
      document.head.appendChild(s);
    }
  }

  function clearGACookies() {
    var names = document.cookie.split(';').map(function (c) { return c.split('=')[0].trim(); })
      .filter(function (n) { return n === '_ga' || n.indexOf('_ga_') === 0 || n === '_gid' || n === '_gat'; });
    var host = location.hostname, parts = host.split('.'), domains = ['', host];
    for (var i = 0; i < parts.length - 1; i++) domains.push('.' + parts.slice(i).join('.'));
    names.forEach(function (n) {
      domains.forEach(function (d) {
        document.cookie = n + '=; Max-Age=0; path=/' + (d ? '; domain=' + d : '');
      });
    });
  }

  function deny() {
    gtag('consent', 'update', { analytics_storage: 'denied' });
    window['ga-disable-' + GA_ID] = true;
    clearGACookies();
  }

  function setChoice(a) {
    choice = a;
    saveChoice(a);
    if (a === 'granted') loadGA(); else deny();
    hideBanner();
  }

  // Konfigüratör vb. etkinlikler: yalnızca onay varsa gönderilir
  window.katmanTrack = function (name, params) {
    if (choice !== 'granted' || !loaded) return false;
    var p = {};
    if (params) for (var k in params) if (Object.prototype.hasOwnProperty.call(params, k) && params[k] !== undefined && params[k] !== null) {
      var v = params[k];
      p[k] = typeof v === 'string' ? v.slice(0, 100) : v;
    }
    gtag('event', name, p);
    return true;
  };

  if (choice === 'granted') loadGA();

  // ---- Onay bandı ----
  var CSS = '' +
    '.k-ck{position:fixed;left:0;right:0;bottom:0;z-index:2147483000;background:#000;color:#eeece9;border-top:1px solid #323232;' +
    'font-family:"Archivo Semi Expanded","Archivo",sans-serif;-webkit-font-smoothing:antialiased}' +
    '.k-ck[hidden]{display:none}' +
    '.k-ck-in{max-width:1312px;margin:0 auto;padding:24px 32px;box-sizing:border-box;display:flex;align-items:center;gap:24px 48px;flex-wrap:wrap}' +
    '.k-ck-tx{flex:1 1 520px;min-width:0;display:flex;flex-direction:column;gap:8px}' +
    '.k-ck-lb{font-family:"IBM Plex Mono",ui-monospace,Menlo,monospace;font-size:12px;line-height:16px;font-weight:500;letter-spacing:.08em;text-transform:uppercase;color:#eeece9}' +
    '.k-ck p{margin:0;font-size:14px;line-height:20px;font-weight:500;color:#eeece9}' +
    '.k-ck a{color:#eeece9;text-decoration:underline;text-underline-offset:3px}' +
    '.k-ck-bt{display:flex;gap:12px;flex:0 0 auto}' +
    '.k-ck button{appearance:none;-webkit-appearance:none;margin:0;min-width:148px;height:48px;padding:0 24px;border:1px solid #eeece9;border-radius:0;' +
    'background:#eeece9;color:#000;font-family:"Archivo Semi Expanded","Archivo",sans-serif;font-size:15px;font-weight:600;cursor:pointer;transition:background .2s,color .2s}' +
    '.k-ck button:hover{background:#000;color:#eeece9}' +
    '.k-ck button:focus-visible{outline:2px solid #86c8ee;outline-offset:2px}' +
    '.k-ck-cur{font-family:"IBM Plex Mono",ui-monospace,Menlo,monospace;font-size:12px;line-height:16px;color:#bdbab5}' +
    '@media (max-width:720px){.k-ck-in{padding:20px 24px 24px;gap:16px}.k-ck-tx{flex-basis:100%}.k-ck-bt{width:100%}.k-ck button{flex:1 1 0;min-width:0}}';

  var el = null;
  function buildBanner() {
    if (el) return el;
    var st = document.createElement('style');
    st.textContent = CSS;
    document.head.appendChild(st);
    el = document.createElement('section');
    el.className = 'k-ck';
    el.id = 'cerez-tercihleri';
    el.setAttribute('aria-label', 'Çerez tercihleri');
    el.hidden = true;
    el.innerHTML =
      '<div class="k-ck-in">' +
        '<div class="k-ck-tx">' +
          '<span class="k-ck-lb">Çerez Tercihleri</span>' +
          '<p>İzin verirseniz, sitenin nasıl kullanıldığını anlamak için Google Analytics analitik çerezlerini kullanırız. ' +
          'Reklam çerezi kullanmayız; adınız, e-posta adresiniz veya mesajınız gibi form bilgileri analitiğe gönderilmez. ' +
          'Tercihinizi sayfanın altındaki “Çerez Tercihleri” bağlantısından istediğiniz zaman değiştirebilirsiniz. ' +
          'Ayrıntılar: <a href="/kvkk">KVKK Aydınlatma Metni</a>.</p>' +
          '<span class="k-ck-cur" hidden></span>' +
        '</div>' +
        '<div class="k-ck-bt">' +
          '<button type="button" data-k-ck="denied">Reddet</button>' +
          '<button type="button" data-k-ck="granted">Kabul Et</button>' +
        '</div>' +
      '</div>';
    el.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('button[data-k-ck]') : null;
      if (b) setChoice(b.getAttribute('data-k-ck'));
    });
    document.body.appendChild(el);
    return el;
  }

  var lastFocus = null;
  function showBanner(fromLink) {
    var b = buildBanner();
    var cur = b.querySelector('.k-ck-cur');
    if (choice) {
      cur.textContent = 'Mevcut tercihiniz: ' + (choice === 'granted' ? 'Kabul edildi' : 'Reddedildi');
      cur.hidden = false;
    } else cur.hidden = true;
    b.hidden = false;
    if (fromLink) {
      lastFocus = document.activeElement;
      var first = b.querySelector('button');
      if (first) first.focus({ preventScroll: true });
    }
  }
  function hideBanner() {
    if (el) el.hidden = true;
    if (lastFocus && lastFocus.focus) { try { lastFocus.focus({ preventScroll: true }); } catch (e) {} }
    lastFocus = null;
    if (location.hash === '#cerez-tercihleri' && history.replaceState) history.replaceState(null, '', location.pathname + location.search);
  }

  // Footer'daki "Çerez Tercihleri" bağlantısı (href="#cerez-tercihleri")
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href="#cerez-tercihleri"]') : null;
    if (!a) return;
    e.preventDefault();
    showBanner(true);
  });

  function init() {
    if (!choice || location.hash === '#cerez-tercihleri') showBanner(location.hash === '#cerez-tercihleri');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
