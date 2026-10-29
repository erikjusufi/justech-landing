// POST /api/e: JustInsight's same-origin proxy (INGEST-CONTRACT §5, ARCHITECTURE §1 in justech-analytics). A
// Cloudflare Pages Function. Passes the tracker's beacon to the collector with the visitor's address and country as
// X-JT-IP and X-JT-Country (from Cloudflare's CF-Connecting-IP and CF-IPCountry, never our own view), and always
// answers 204: the beacon never sees an error.
const COLLECTOR = 'https://insight.justech.uk/ingest';

export async function onRequestPost({ request }) {
  try {
    const h = new Headers();
    for (const k of ['content-type', 'user-agent', 'accept-language', 'referer', 'origin']) { const v = request.headers.get(k); if (v) h.set(k, v); }
    h.set('X-JT-IP', request.headers.get('CF-Connecting-IP') || '');
    h.set('X-JT-Country', request.headers.get('CF-IPCountry') || '');
    await fetch(COLLECTOR, { method: 'POST', headers: h, body: await request.arrayBuffer() });
  } catch { /* the collector is down: the visitor never knows */ }
  return new Response(null, { status: 204 });
}

export const onRequest = () => new Response(null, { status: 204 });
