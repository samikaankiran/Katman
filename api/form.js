// Katman web formları → e-posta (Vercel Function)
//
// Sitedeki üç form buraya gönderilir: teklif (Kendi Katman'ını Oluştur),
// iletişim mesajı ve özel ölçü talebi (İletişim sayfası). Gelen her talep,
// Resend üzerinden info@katmanaudio.com adresine e-posta olarak iletilir.
// "Yanıtla" dediğinizde müşterinin kendi e-posta adresine yanıt gider.
//
// Vercel → Project → Settings → Environment Variables:
//   RESEND_API_KEY  (zorunlu)  Resend panelinden alınan API anahtarı
//   MAIL_TO         (isteğe bağlı) Varsayılan: info@katmanaudio.com
//   MAIL_FROM       (isteğe bağlı) Varsayılan: Katman Web <form@katmanaudio.com>

const MAIL_TO = process.env.MAIL_TO || 'info@katmanaudio.com';
const MAIL_FROM = process.env.MAIL_FROM || 'Katman Web <form@katmanaudio.com>';
const RESEND_URL = process.env.RESEND_API_URL || 'https://api.resend.com/emails';

const ALLOWED_HOSTS = [/^katmanaudio\.com$/, /^www\.katmanaudio\.com$/, /\.vercel\.app$/, /^localhost(:\d+)?$/, /^127\.0\.0\.1(:\d+)?$/];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TYPES = { teklif: 'Teklif talebi', iletisim: 'İletişim mesajı', 'ozel-olcu': 'Özel ölçü talebi' };

const clip = (v, n = 300) => String(v == null ? '' : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, n);
const esc = (v) => String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const oneLine = (v) => clip(v).replace(/[\r\n]+/g, ' ');

function hostOf(url) {
  try { return new URL(url).host; } catch (e) { return ''; }
}

function readBody(req) {
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body);
  if (typeof req.body === 'string') { try { return Promise.resolve(JSON.parse(req.body)); } catch (e) { return Promise.resolve(null); } }
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (c) => { raw += c; if (raw.length > 20000) req.destroy(); });
    req.on('end', () => { try { resolve(JSON.parse(raw || '{}')); } catch (e) { resolve(null); } });
    req.on('error', () => resolve(null));
  });
}

function validate(d) {
  const type = clip(d.type, 20);
  if (!TYPES[type]) return 'type';
  if (clip(d.name, 120).length < 2) return 'name';
  if (!EMAIL_RE.test(clip(d.email, 200))) return 'email';
  if (d.kvkk !== true) return 'kvkk';
  if (type === 'teklif' && clip(d.phone, 40).replace(/\D/g, '').length < 7) return 'phone';
  if (type === 'iletisim' && clip(d.message, 5000).length < 2) return 'message';
  if (type === 'ozel-olcu') {
    const n = Number(d.shelfCount);
    if (!(n >= 1 && n <= 4)) return 'shelfCount';
    if (!(Number(d.widthMm) > 0) || !(Number(d.depthMm) > 0)) return 'size';
  }
  return '';
}

function rowsFor(d) {
  const rows = [['Ad Soyad', clip(d.name, 120)], ['E-posta', clip(d.email, 200)]];
  if (d.phone) rows.push(['Telefon', clip(d.phone, 40)]);
  if (d.type === 'teklif') {
    if (d.city) rows.push(['Şehir', clip(d.city, 80)]);
    const summary = Array.isArray(d.summary) ? d.summary.slice(0, 20) : [];
    if (!summary.some((r) => Array.isArray(r) && r[0] === 'Model')) rows.push(['Model', clip(d.model, 40)]);
    rows.push(['Teklif kodu', clip(d.code, 200)]);
    summary.forEach((r) => {
      if (Array.isArray(r)) rows.push([clip(r[0], 60), clip(r[1], 200)]);
    });
  }
  if (d.type === 'ozel-olcu') {
    rows.push(['Raf sayısı', String(Number(d.shelfCount))],
      ['Raf genişliği', Number(d.widthMm) + ' mm'],
      ['Raf derinliği', Number(d.depthMm) + ' mm'],
      ['Raf aralıkları', Array.isArray(d.spacingMm) && d.spacingMm.length ? d.spacingMm.slice(0, 8).map(Number).join(' / ') + ' mm' : '—']);
  }
  return rows;
}

function buildMail(d) {
  const label = TYPES[d.type];
  const rows = rowsFor(d);
  const message = d.type === 'iletisim' ? clip(d.message, 5000) : '';
  const subject = d.type === 'teklif'
    ? `${label} · ${oneLine(d.model) || 'Katman'} · ${oneLine(d.name)}`
    : `${label} · ${oneLine(d.name)}`;
  const when = new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' });

  const text = [label, ''].concat(rows.map((r) => `${r[0]}: ${r[1]}`), message ? ['', 'Mesaj:', message] : [], ['', `Gönderim: ${when} · katmanaudio.com${clip(d.page, 100)}`]).join('\n');

  const tr = rows.map((r) => `<tr><td style="padding:8px 16px 8px 0;border-top:1px solid #d3cfc9;font:500 12px/16px ui-monospace,Menlo,monospace;letter-spacing:.06em;text-transform:uppercase;color:#3e3e3e;vertical-align:top;white-space:nowrap">${esc(r[0])}</td><td style="padding:8px 0;border-top:1px solid #d3cfc9;font:400 15px/22px -apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#000">${esc(r[1])}</td></tr>`).join('');
  const html = `<!doctype html><html lang="tr"><body style="margin:0;background:#eeece9;padding:32px 16px">
<div style="max-width:600px;margin:0 auto">
<p style="margin:0 0 4px;font:500 12px/16px ui-monospace,Menlo,monospace;letter-spacing:.08em;text-transform:uppercase;color:#3e3e3e">KATMAN · Web formu</p>
<h1 style="margin:0 0 24px;font:700 24px/30px -apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#000">${esc(label)}</h1>
<table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse">${tr}</table>
${message ? `<p style="margin:24px 0 8px;font:500 12px/16px ui-monospace,Menlo,monospace;letter-spacing:.06em;text-transform:uppercase;color:#3e3e3e">Mesaj</p><p style="margin:0;white-space:pre-wrap;font:400 15px/24px -apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#000">${esc(message)}</p>` : ''}
<p style="margin:32px 0 0;font:400 12px/18px -apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#3e3e3e">${esc(when)} · katmanaudio.com${esc(clip(d.page, 100))}<br>Bu e-postayı yanıtladığınızda yanıtınız doğrudan ${esc(clip(d.email, 200))} adresine gider.</p>
</div></body></html>`;
  return { subject, text, html };
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'method' });
  }

  const origin = req.headers.origin || req.headers.referer || '';
  const host = hostOf(origin);
  if (origin && !ALLOWED_HOSTS.some((re) => re.test(host))) return res.status(403).json({ ok: false, error: 'origin' });

  const d = await readBody(req);
  if (!d || typeof d !== 'object') return res.status(400).json({ ok: false, error: 'body' });

  // Spam süzgeci: gizli alan doluysa ya da form çok hızlı gönderildiyse sessizce "tamam" de.
  if (clip(d.website, 200) || (typeof d.t === 'number' && d.t < 2500)) return res.status(200).json({ ok: true });

  const bad = validate(d);
  if (bad) return res.status(400).json({ ok: false, error: bad });

  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY tanımlı değil');
    return res.status(500).json({ ok: false, error: 'config' });
  }

  const mail = buildMail(d);
  try {
    const r = await fetch(RESEND_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: MAIL_FROM, to: [MAIL_TO], reply_to: clip(d.email, 200), subject: mail.subject, text: mail.text, html: mail.html })
    });
    if (!r.ok) {
      console.error('Resend hatası', r.status, (await r.text()).slice(0, 500));
      return res.status(502).json({ ok: false, error: 'send' });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Gönderim hatası', e && e.message);
    return res.status(502).json({ ok: false, error: 'send' });
  }
};
