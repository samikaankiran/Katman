/* KATMAN · çerez onayı + Google Analytics 4 (gtag.js)
 * - Onay verilmeden gtag.js yüklenmez, Google'a istek gitmez, çerez oluşmaz.
 * - Google Consent Mode v2 varsayılanları "denied"; kabulde yalnızca analytics_storage "granted" olur.
 *   Reklam depolaması / reklam sinyalleri hiçbir durumda açılmaz.
 * - Gönderim kalkanı: onay yoksa ya da geri çekildiyse, kuyrukta bekleyen etkinlikler dahil
 *   Google Analytics'e giden her istek (sendBeacon, fetch, XHR, görsel) tarayıcıda engellenir.
 * - Ölçüm kimliği yalnızca katmanaudio.com'da kullanılır. Önizleme / yerel adreslerde ve canlıda ?ga_test=1 ile
 *   "test modu" çalışır: hiçbir veri Google'a gitmez, etkinlikler konsola ve window.__katmanEvents'e yazılır.
 *   GA_ID_TEST doldurulursa test modu ayrı bir GA4 test mülküne (debug_mode ile) gönderir.
 * - Tercih tarayıcıda (localStorage) saklanır; footer'daki "Çerez Tercihleri" bağlantısı bandı yeniden açar.
 * - window.katmanTrack(ad, parametreler): yalnızca onay varsa etkinlik gönderir; kişisel veri gönderilmez.
 * Derleme (tools/build.py) bu dosyayı assets/ altına içerik özetli adla kopyalar ve her sayfaya bir kez ekler.
 */
(function () {
  'use strict';
  if (window.__katmanConsent) return; // aynı sayfada iki kez çalışmasın
  window.__katmanConsent = true;

  var GA_ID_LIVE = 'G-25K0M2TFDG'; // yalnızca katmanaudio.com
  var GA_ID_TEST = '';             // ayrı GA4 test mülkü (boşsa test modunda hiçbir şey gönderilmez)
  var KEY = 'katman_cerez_tercihi';
  var VER = 1;

  var PROD = /(^|\.)katmanaudio\.com$/.test(location.hostname);
  var TESTQ = /[?&]ga_test=1\b/.test(location.search);
  var MODE = PROD && !TESTQ ? 'live' : (GA_ID_TEST ? 'test' : 'dry');
  var GA_ID = MODE === 'live' ? GA_ID_LIVE : (MODE === 'test' ? GA_ID_TEST : '');

  var choice = readChoice();

  // ---- Gönderim kalkanı (gtag.js'den önce kurulur) ----
  var GA_URL = /^https?:\/\/([^/?#]*\.)?(google-analytics\.com|analytics\.google\.com|doubleclick\.net)(\/|$)|^https?:\/\/([^/?#]*\.)?googletagmanager\.com\/(?!gtag\/js)/i;
  function blocked(u) {
    try { u = String(u && u.url ? u.url : u || ''); } catch (e) { return false; }
    if (!GA_URL.test(u)) return false;
    if (choice !== 'granted' || !GA_ID) return true;
    var m = /[?&]tid=([^&#]+)/.exec(u);
    return !!(m && decodeURIComponent(m[1]) !== GA_ID);
  }
  try {
    if (navigator.sendBeacon) {
      var sb = navigator.sendBeacon;
      navigator.sendBeacon = function (u, d) { return blocked(u) ? true : sb.call(navigator, u, d); };
    }
    if (window.fetch) {
      var f0 = window.fetch;
      window.fetch = function (input) {
        if (blocked(input)) return Promise.resolve(typeof Response === 'function' ? new Response(null, { status: 204 }) : undefined);
        return f0.apply(this, arguments);
      };
    }
    var xo = XMLHttpRequest.prototype.open, xs = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function (m, u) { this.__kU = u; return xo.apply(this, arguments); };
    XMLHttpRequest.prototype.send = function () { if (blocked(this.__kU)) { try { this.abort(); } catch (e) {} return; } return xs.apply(this, arguments); };
    var d = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
    if (d && d.set) Object.defineProperty(HTMLImageElement.prototype, 'src', {
      configurable: true, enumerable: d.enumerable, get: d.get,
      set: function (v) { if (blocked(v)) return; d.set.call(this, v); }
    });
  } catch (e) {}

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

  // test modu: hiçbir şey gönderilmez, konsola ve window.__katmanEvents'e yazılır
  window.__katmanEvents = [];
  function dryLog(name, params) {
    window.__katmanEvents.push({ name: name, params: params || {}, t: Date.now() });
    try { console.info('[KATMAN GA4 · test modu, gönderilmedi]', name, params || {}); } catch (e) {}
  }

  var loaded = false;
  function loadGA() {
    if (MODE === 'dry') { if (!loaded) { loaded = true; dryLog('page_view', { page_location: location.pathname }); } return; }
    window['ga-disable-' + GA_ID] = false;
    gtag('consent', 'update', { analytics_storage: 'granted' });
    if (loaded) return;
    loaded = true;
    gtag('js', new Date());
    var cfg = { allow_google_signals: false, allow_ad_personalization_signals: false };
    if (MODE === 'test') cfg.debug_mode = true;
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
      domains.forEach(function (dm) {
        document.cookie = n + '=; Max-Age=0; path=/' + (dm ? '; domain=' + dm : '');
      });
    });
  }

  function deny() {
    if (GA_ID) {
      gtag('consent', 'update', { analytics_storage: 'denied' });
      window['ga-disable-' + GA_ID] = true;
    }
    clearGACookies();
  }

  function setChoice(a) {
    choice = a; // kalkan bu andan itibaren bekleyen istekleri de engeller
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
    if (MODE === 'dry') { dryLog(name, p); return true; }
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
