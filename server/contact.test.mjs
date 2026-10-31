// The contact form against stand-ins for Resend and Turnstile, run with the real server: node server/contact.test.mjs (CI runs it).
// No mail leaves: RESEND_API_URL and TURNSTILE_VERIFY_URL point at the stand-ins. Not in the image (.dockerignore).
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const FORM = { name: 'Ana', email: 'ana@example.com', message: 'check', topic: 'Something else' };
let fail = 0, nextPort = 18100;
const check = (name, want, got) => { const ok = JSON.stringify(want) === JSON.stringify(got); if (!ok) fail = 1; console.log(`${ok ? 'ok   ' : 'FAIL '} ${name}${ok ? '' : `: expected ${JSON.stringify(want)}, got ${JSON.stringify(got)}`}`); };
const readBody = req => new Promise(ok => { let b = ''; req.on('data', c => b += c); req.on('end', () => ok(b)); });

// a stand-in: remembers what it was sent and answers with reply(body), by default 200
function standIn(port, reply = () => ({ id: 'x' })) {
  const calls = [], srv = createServer(async (req, res) => { const b = await readBody(req); calls.push(b); res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(reply(b))); });
  return new Promise(ok => srv.listen(port, '127.0.0.1', () => ok({ calls, close: () => srv.close() })));
}
// the real server with these variables, stopped when the callback is done
async function withServer(env, run) {
  const port = nextPort++, resendPort = nextPort++, verifyPort = nextPort++, resend = await standIn(resendPort);
  const verify = await standIn(verifyPort, b => ({ success: JSON.parse(b).response === 'good' }));
  const p = spawn('node', [join(HERE, 'server.mjs')], { stdio: 'ignore', env: { PATH: process.env.PATH, SITE_ROOT: join(HERE, '..'), SITE_PORT: String(port), RESEND_API_KEY: 'test', RESEND_API_URL: `http://127.0.0.1:${resendPort}/`, TURNSTILE_VERIFY_URL: `http://127.0.0.1:${verifyPort}/`, ...env } });
  const base = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 50; i++) { try { await fetch(`${base}/healthz`); break; } catch { await new Promise(r => setTimeout(r, 100)); } }
  const post = (body = FORM, headers = {}) => fetch(`${base}/api/contact`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) }).then(r => r.status);
  try { await run({ post, resend, verify, base }); } finally { p.kill(); resend.close(); verify.close(); }
}
const settle = () => new Promise(r => setTimeout(r, 200)); // the thank-you goes after the answer

const from = ip => ({ 'CF-Connecting-IP': ip });
const LIVE = { TURNSTILE_SITE_KEY: 'site', TURNSTILE_SECRET_KEY: 'secret' };

await withServer({}, async ({ post, resend, base }) => {
  check('sends to our inbox', 200, await post()); await settle();
  check('no thank-you by default', 1, resend.calls.length);
  check('no site key while Turnstile is not live', { turnstile: null }, await fetch(`${base}/api/contact/config`).then(r => r.json()));
  check('the contact page allows no third party', false, (await fetch(`${base}/contact/`)).headers.get('content-security-policy').includes('challenges.cloudflare.com'));
});
await withServer({ CONTACT_THANKS: 'on' }, async ({ post, resend }) => {
  check('sends, thank-you on but no Turnstile', 200, await post()); await settle();
  check('no thank-you without Turnstile', 1, resend.calls.length);
});
await withServer({ TURNSTILE_SITE_KEY: 'site' }, async ({ post, base }) => {
  check('the site key alone is not live', { turnstile: null }, await fetch(`${base}/api/contact/config`).then(r => r.json()));
  check('the form still works', 200, await post());
});
await withServer({}, async ({ post, resend }) => {
  const a = []; for (let i = 0; i < 6; i++) a.push(await post(FORM, from('192.0.2.1')));
  check('five an hour per address, then 429', [200, 200, 200, 200, 200, 429], a);
  check('another address is not held back', 200, await post(FORM, from('192.0.2.2')));
  const bad = []; for (let i = 0; i < 8; i++) bad.push(await post({ ...FORM, email: 'x' }, from('192.0.2.3')));
  check('a bad form does not use up the hour', [422], [...new Set(bad)]);
  check('and that address can still send', 200, await post(FORM, from('192.0.2.3')));
  check('nothing over the limit reached Resend', 7, resend.calls.length);
});
await withServer({}, async ({ post, resend }) => {
  const a = []; for (let i = 0; i < 51; i++) a.push(await post(FORM, from(`198.51.100.${i}`)));
  check('fifty a day in all', [50, 1], [a.filter(x => x === 200).length, a.filter(x => x === 429).length]);
  check('the 51st did not reach Resend', 50, resend.calls.length);
});
await withServer(LIVE, async ({ post, resend, verify, base }) => {
  check('the page gets the site key', { turnstile: 'site' }, await fetch(`${base}/api/contact/config`).then(r => r.json()));
  check('the contact page allows Turnstile', true, (await fetch(`${base}/contact/`)).headers.get('content-security-policy').includes('frame-src https://challenges.cloudflare.com'));
  check('other pages do not', false, (await fetch(`${base}/`)).headers.get('content-security-policy').includes('challenges.cloudflare.com'));
  check('no token, no send', 403, await post(FORM, from('203.0.113.1')));
  check('no token does not ask Cloudflare', 0, verify.calls.length);
  check('a failed check, no send', 403, await post({ ...FORM, turnstile: 'bad' }, from('203.0.113.2')));
  check('nothing reached Resend', 0, resend.calls.length);
  check('a passed check sends', 200, await post({ ...FORM, turnstile: 'good' }, from('203.0.113.3'))); await settle();
  check('Cloudflare gets the secret, the token and the address', { secret: 'secret', response: 'good', remoteip: '203.0.113.3' }, JSON.parse(verify.calls.at(-1)));
  check('no thank-you without CONTACT_THANKS', 1, resend.calls.length);
});
await withServer({ ...LIVE, CONTACT_THANKS: 'on' }, async ({ post, resend }) => {
  check('Turnstile live, thank-you on', 200, await post({ ...FORM, turnstile: 'good' })); await settle();
  check('the visitor gets one too', 2, resend.calls.length);
});
await withServer({ ...LIVE, TURNSTILE_VERIFY_URL: 'http://127.0.0.1:9/' }, async ({ post, resend }) => {
  check('Cloudflare unreachable, no send', 502, await post({ ...FORM, turnstile: 'good' }));
  check('nothing reached Resend', 0, resend.calls.length);
});
process.exit(fail);
