// The justech.uk server (round 17b): one small Node process, no dependencies, in its own Coolify app on erik-main
// behind Cloudflare. It serves the static site with its headers and caching and a 404 page, and two endpoints:
//   POST /api/contact  the contact form, mailed through Resend: RESEND_API_KEY required; CONTACT_TO (default
//                      info@justech.uk, Erik's inbox) and CONTACT_FROM (default JusTech <hello@notify.justech.uk>, the
//                      notify.justech.uk domain in Resend, EU) optional. Reply-To is the visitor. Until the key is set it
//                      answers 503 and the page opens the visitor's email app instead. The mail is branded HTML with
//                      a plain-text part, from the shared layout in server/mail (JustApp copies it, D-53). The visitor then
//                      gets one fixed thank-you (never their words), within limits (mayThank).
//   POST /api/e        JustInsight's same-origin proxy (justech-analytics INGEST-CONTRACT §5, ARCHITECTURE §1): the
//                      beacon goes to the collector with the visitor's address and country as X-JT-IP and
//                      X-JT-Country, from Cloudflare's CF-Connecting-IP and CF-IPCountry; always 204.
//   GET  /healthz      for the container's health check.
import { createServer } from 'node:http';
import { stat, readFile, readdir } from 'node:fs/promises';
import { join, normalize, extname, relative, sep } from 'node:path';
import { contactMail, thanksMail } from './mail/mail.mjs';

const ROOT = process.env.SITE_ROOT || '/srv/site';
// The port belongs to the image (EXPOSE and HEALTHCHECK say 8080), so the generic PORT is ignored: Coolify sets it from
// an app's variables, and on 29 Oct a PORT other than 8080 left the server listening where the health check never looked.
const PORT = Number(process.env.SITE_PORT || 8080);
const COLLECTOR = process.env.COLLECTOR_URL || 'https://insight.justech.uk/ingest';
const RESEND = process.env.RESEND_API_URL || 'https://api.resend.com/emails';

const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8' };
const SECURITY = { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin', 'X-Frame-Options': 'DENY',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()' };
// fonts never change; the tracker's URL carries its md5; CSS and JS are not fingerprinted, so an hour; pages revalidate
const cacheFor = p => p.startsWith('/assets/system/fonts/') || p === '/jt.js' ? 'public, max-age=31536000, immutable'
  : p.startsWith('/assets/') ? 'public, max-age=3600, stale-while-revalidate=86400'
  : p === '/og.png' || p === '/favicon.svg' ? 'public, max-age=86400' : 'public, max-age=0, must-revalidate';

const send = (res, status, headers = {}, body = '') => { res.writeHead(status, { ...SECURITY, ...headers }); res.end(body); };
const json = (res, status, error) => send(res, status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, JSON.stringify(error ? { error } : { ok: true }));
const body = (req, max) => new Promise((ok, no) => { const parts = []; let n = 0;
  req.on('data', c => { n += c.length; if (n > max) { no(new Error('too large')); req.removeAllListeners('data'); req.resume(); } else parts.push(c); });
  req.on('end', () => ok(Buffer.concat(parts))); req.on('error', no); });

// the contact form
const MAX = { name: 200, email: 200, company: 200, topic: 100, message: 5000 };
const clean = (v, n) => String(v ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, n);
// the mail is filled once at start, so a broken layout stops the server (and CI) instead of a visitor's message
contactMail({ name: 'Ana', email: 'ana@example.com', company: '', topic: '', message: 'check' }); const THANKS = thanksMail();
// the visitor's confirmation goes only after our own mail went, and only within limits, so the form cannot be used to
// send mail to strangers in any number: one per address a day, three per visitor an hour, thirty a day in all
const LIMIT = { address: 24 * 3600e3, ipPerHour: 3, perDay: 30 };
const sentTo = new Map(), sentFrom = new Map(); let day = '', today = 0;
function mayThank(email, ip, now = Date.now()) {
  const d = new Date(now).toISOString().slice(0, 10); if (d !== day) { day = d; today = 0; sentTo.clear(); }
  const a = email.toLowerCase(), hour = (sentFrom.get(ip) || []).filter(t => now - t < 3600e3);
  if (today >= LIMIT.perDay || now - (sentTo.get(a) || -Infinity) < LIMIT.address || hour.length >= LIMIT.ipPerHour) return false;
  today++; sentTo.set(a, now); sentFrom.set(ip, [...hour, now]); return true;
}
const resend = (key, mail) => fetch(RESEND, { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(10000),
  body: JSON.stringify({ from: process.env.CONTACT_FROM || 'JusTech <hello@notify.justech.uk>', ...mail }) });
async function contact(req, res) {
  const origin = req.headers.origin;
  if (origin) { try { if (new URL(origin).host !== req.headers.host) return json(res, 403, 'origin'); } catch { return json(res, 403, 'origin'); } }
  if ((req.headers['content-type'] || '').split(';')[0].trim() !== 'application/json') return json(res, 415, 'type');
  let d; try { d = JSON.parse((await body(req, 32 * 1024)).toString('utf8')); } catch { return json(res, 400, 'body'); }
  if (clean(d.website, 200)) return json(res, 200); // the field only bots fill: thank them and drop it
  const f = Object.fromEntries(Object.entries(MAX).map(([k, n]) => [k, clean(d[k], n)]));
  if (!f.name || !f.message || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(f.email)) return json(res, 422, 'fields');
  const key = process.env.RESEND_API_KEY, to = process.env.CONTACT_TO || 'info@justech.uk';
  if (!key) return json(res, 503, 'not configured');
  const mail = contactMail(f); // the branded HTML and its plain text (server/mail)
  try {
    const r = await resend(key, { to: [to], reply_to: f.email, subject: mail.subject, html: mail.html, text: mail.text });
    if (r.ok) {
      if (mayThank(f.email, req.headers['cf-connecting-ip'] || req.socket.remoteAddress || ''))
        resend(key, { to: [f.email], reply_to: to, subject: THANKS.subject, html: THANKS.html, text: THANKS.text })
          .then(t => t.ok || console.error('thanks: resend answered', t.status)).catch(e => console.error('thanks: resend unreachable', e.message));
      return json(res, 200);
    }
    console.error('contact: resend answered', r.status, (await r.text()).slice(0, 300));
  } catch (e) { console.error('contact: resend unreachable', e.message); }
  return json(res, 502, 'send');
}

// JustInsight's proxy: the beacon never sees an error
async function beacon(req, res) {
  try {
    const b = await body(req, 16 * 1024), h = { 'X-JT-IP': req.headers['cf-connecting-ip'] || '', 'X-JT-Country': req.headers['cf-ipcountry'] || '' };
    for (const k of ['content-type', 'user-agent', 'accept-language', 'referer', 'origin']) if (req.headers[k]) h[k] = req.headers[k];
    await fetch(COLLECTOR, { method: 'POST', headers: h, body: b, signal: AbortSignal.timeout(5000) });
  } catch { /* the collector is down or the body too large: the visitor never knows */ }
  send(res, 204, { 'Cache-Control': 'no-store' });
}

// the static site, as an allowlist: the files of a type in TYPES found under ROOT at start, never a dotfile or anything
// under server/ (30 Oct: Coolify's docker-compose.yaml was in the build context and answered 200); a file that appears
// later, or of any other type, is a 404
async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    const full = join(dir, e.name);
    if (e.isDirectory()) out.push(...await walk(full)); else if (e.isFile() && TYPES[extname(e.name)]) out.push('/' + relative(ROOT, full).split(sep).join('/'));
  }
  return out;
}
const SITE = new Set((await walk(ROOT)).filter(p => !p.startsWith('/server/')));
const DIRS = new Set([...SITE].filter(p => p.endsWith('/index.html')).map(p => p.slice(0, -'index.html'.length)));
async function file(req, res) {
  let p; try { p = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch { return send(res, 400); }
  p = normalize(p);
  if (!p.endsWith('/') && DIRS.has(p + '/')) return send(res, 301, { Location: p + '/' + (new URL(req.url, 'http://x').search) });
  if (p.endsWith('/')) p += 'index.html';
  if (!SITE.has(p)) return notFound(req, res);
  const full = join(ROOT, p), s = await stat(full).catch(() => null);
  if (!s?.isFile()) return notFound(req, res);
  const mod = new Date(Math.floor(s.mtimeMs / 1000) * 1000), since = Date.parse(req.headers['if-modified-since'] || '');
  const headers = { 'Content-Type': TYPES[extname(full)] || 'application/octet-stream', 'Cache-Control': cacheFor(p), 'Last-Modified': mod.toUTCString() };
  if (since && mod.getTime() <= since) return send(res, 304, headers);
  send(res, 200, { ...headers, 'Content-Length': s.size }, req.method === 'HEAD' ? '' : await readFile(full));
}
async function notFound(req, res) {
  const page = await readFile(join(ROOT, '404.html')).catch(() => 'Not found');
  send(res, 404, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }, req.method === 'HEAD' ? '' : page);
}

createServer(async (req, res) => {
  try {
    const path = (req.url || '/').split('?')[0];
    if (path === '/healthz') return send(res, 200, { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' }, 'ok');
    if (path === '/api/contact') return req.method === 'POST' ? await contact(req, res) : json(res, 405, 'method');
    if (path === '/api/e') return req.method === 'POST' ? await beacon(req, res) : send(res, 204);
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, { Allow: 'GET, HEAD' });
    await file(req, res);
  } catch (e) { console.error(e); if (!res.headersSent) send(res, 500); else res.end(); }
}).listen(PORT, () => console.log(`justech.uk on :${PORT}, serving ${ROOT}`));
