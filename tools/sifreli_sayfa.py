#!/usr/bin/env python3
"""Bir HTML sayfasını şifreleyip şifre sorduran tek bir sayfaya çevirir.

Depo herkese açık olduğu için asıl sayfa depoya düz metin olarak girmez:
AES-256-GCM ile şifrelenir, anahtar şifreden PBKDF2-SHA256 (600.000 tur) ile türetilir.
Tarayıcı şifreyi alır, WebCrypto ile çözer ve sayfayı aynı adreste açar.

Kullanım:
  KATMAN_SAYFA_SIFRE='...' python3 tools/sifreli_sayfa.py kaynak.html ayak-3d.html
"""
import base64, json, os, sys
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes

ITER = 600_000

def main():
    src, out = sys.argv[1], sys.argv[2]
    pw = os.environ.get("KATMAN_SAYFA_SIFRE")
    if not pw:
        sys.exit("KATMAN_SAYFA_SIFRE ortam değişkeni gerekli")
    html = open(src, encoding="utf-8").read().encode("utf-8")
    salt, iv = os.urandom(16), os.urandom(12)
    key = PBKDF2HMAC(hashes.SHA256(), 32, salt, ITER).derive(pw.encode("utf-8"))
    ct = AESGCM(key).encrypt(iv, html, None)
    b = lambda x: base64.b64encode(x).decode()
    payload = json.dumps({"s": b(salt), "i": b(iv), "n": ITER, "c": b(ct)})
    page = SABLON.replace("__PAYLOAD__", payload)
    open(out, "w", encoding="utf-8").write(page)
    print(f"{out}: {len(page)//1024} KB")

SABLON = r"""<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow, noarchive">
<title>KATMAN</title>
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<style>
  :root { --bg:#14120f; --fg:#ece6dc; --mut:#8f877b; --line:#3a352e; --acc:#c9a46a; }
  * { box-sizing:border-box; }
  html,body { margin:0; height:100%; background:var(--bg); color:var(--fg);
    font:15px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  main { min-height:100%; display:grid; place-items:center; padding:24px 16px; }
  form { width:100%; max-width:340px; display:grid; gap:14px; }
  h1 { margin:0 0 6px; font-size:13px; letter-spacing:.28em; font-weight:600; }
  p { margin:0; color:var(--mut); font-size:13px; }
  input[type=password] { width:100%; padding:12px 14px; font:inherit; color:var(--fg);
    background:transparent; border:1px solid var(--line); border-radius:6px; }
  input[type=password]:focus { outline:none; border-color:var(--acc); }
  label { display:flex; gap:8px; align-items:center; color:var(--mut); font-size:13px; }
  button { padding:12px 14px; font:inherit; font-weight:600; color:var(--bg); background:var(--fg);
    border:0; border-radius:6px; cursor:pointer; }
  button[disabled] { opacity:.6; cursor:default; }
  .hata { color:#e08a7a; min-height:1.2em; }
</style>
</head>
<body>
<main>
  <form id="f" autocomplete="on">
    <div><h1>KATMAN</h1><p>Bu sayfa özeldir.</p></div>
    <input id="p" type="password" name="password" placeholder="Şifre" autocomplete="current-password" required autofocus>
    <label><input id="h" type="checkbox" checked> Bu cihazda hatırla</label>
    <button id="b" type="submit">Aç</button>
    <p class="hata" id="e" role="alert"></p>
  </form>
</main>
<script>
const V = __PAYLOAD__;
const ANAHTAR = 'katman-ozel-sifre';
const d64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
async function coz(pw) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey({ name:'PBKDF2', salt:d64(V.s), iterations:V.n, hash:'SHA-256' },
    base, { name:'AES-GCM', length:256 }, false, ['decrypt']);
  const pt = await crypto.subtle.decrypt({ name:'AES-GCM', iv:d64(V.i) }, key, d64(V.c));
  return new TextDecoder().decode(pt);
}
function ac(html) { document.open(); document.write(html); document.close(); }
const f = document.getElementById('f'), p = document.getElementById('p'),
      b = document.getElementById('b'), e = document.getElementById('e'), h = document.getElementById('h');
f.addEventListener('submit', async ev => {
  ev.preventDefault(); e.textContent = ''; b.disabled = true; b.textContent = 'Açılıyor…';
  try {
    const html = await coz(p.value);
    try { h.checked ? localStorage.setItem(ANAHTAR, p.value) : localStorage.removeItem(ANAHTAR); } catch (x) {}
    ac(html);
  } catch (x) {
    e.textContent = 'Şifre yanlış.'; b.disabled = false; b.textContent = 'Aç'; p.select();
  }
});
(async () => {
  let k = null; try { k = localStorage.getItem(ANAHTAR); } catch (x) {}
  if (!k) return;
  try { ac(await coz(k)); } catch (x) { try { localStorage.removeItem(ANAHTAR); } catch (y) {} }
})();
</script>
</body>
</html>
"""

if __name__ == "__main__":
    main()
