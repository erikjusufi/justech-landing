// POST /api/contact: the contact form (contact/), mailed through Resend. A Cloudflare Pages Function.
// Settings (Pages → Settings → Variables and secrets):
//   RESEND_API_KEY  required, a secret
//   CONTACT_TO      optional, default info@justech.uk
//   CONTACT_FROM    optional, default "JusTech site <site@justech.uk>"; its domain must be verified in Resend
// Until RESEND_API_KEY is set this answers 503, and the page falls back to opening the visitor's email app.
const MAX = { name: 200, email: 200, company: 200, topic: 100, message: 5000 };
const json = (status, error) => new Response(JSON.stringify(error ? { error } : { ok: true }), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
const clean = (v, n) => String(v ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, n);

export async function onRequestPost({ request, env }) {
  // only from our own pages
  const origin = request.headers.get('Origin');
  if (origin && new URL(origin).host !== new URL(request.url).host) return json(403, 'origin');
  if ((request.headers.get('Content-Type') || '').split(';')[0] !== 'application/json') return json(415, 'type');
  let d; try { d = await request.json(); } catch { return json(400, 'body'); }
  if (clean(d.website, 200)) return json(200); // the field only bots fill: thank them and drop it
  const f = Object.fromEntries(Object.entries(MAX).map(([k, n]) => [k, clean(d[k], n)]));
  if (!f.name || !f.message || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(f.email)) return json(422, 'fields');
  if (!env.RESEND_API_KEY) return json(503, 'not configured');
  const text = `${f.topic || 'Enquiry'}\n\n${f.message}\n\n${f.name}${f.company ? `, ${f.company}` : ''}\n${f.email}\n\nSent from the form on justech.uk`;
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: env.CONTACT_FROM || 'JusTech site <site@justech.uk>', to: [env.CONTACT_TO || 'info@justech.uk'], reply_to: f.email,
        subject: `${f.topic || 'Enquiry'} · ${f.name}${f.company ? ` (${f.company})` : ''}`, text }) });
    return r.ok ? json(200) : json(502, 'send');
  } catch { return json(502, 'send'); }
}

export const onRequest = () => json(405, 'method');
