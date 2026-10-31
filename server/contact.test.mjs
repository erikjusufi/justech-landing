// The contact form against stand-ins for Resend, run with the real server: node server/contact.test.mjs (CI runs it).
// No mail leaves: RESEND_API_URL points at the stand-in. Not in the image (.dockerignore).
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const FORM = { name: 'Ana', email: 'ana@example.com', message: 'check', topic: 'Something else' };
let fail = 0, nextPort = 18100;
const check = (name, want, got) => { const ok = JSON.stringify(want) === JSON.stringify(got); if (!ok) fail = 1; console.log(`${ok ? 'ok   ' : 'FAIL '} ${name}${ok ? '' : `: expected ${JSON.stringify(want)}, got ${JSON.stringify(got)}`}`); };
const readBody = req => new Promise(ok => { let b = ''; req.on('data', c => b += c); req.on('end', () => ok(b)); });

// a stand-in: answers 200 and remembers what it was sent
function standIn(port) {
  const calls = [], srv = createServer(async (req, res) => { calls.push(await readBody(req)); res.writeHead(200, { 'Content-Type': 'application/json' }); res.end('{"id":"x"}'); });
  return new Promise(ok => srv.listen(port, '127.0.0.1', () => ok({ calls, close: () => srv.close() })));
}
// the real server with these variables, stopped when the callback is done
async function withServer(env, run) {
  const port = nextPort++, resendPort = nextPort++, resend = await standIn(resendPort);
  const p = spawn('node', [join(HERE, 'server.mjs')], { stdio: 'ignore', env: { PATH: process.env.PATH, SITE_ROOT: join(HERE, '..'), SITE_PORT: String(port), RESEND_API_KEY: 'test', RESEND_API_URL: `http://127.0.0.1:${resendPort}/`, ...env } });
  const base = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 50; i++) { try { await fetch(`${base}/healthz`); break; } catch { await new Promise(r => setTimeout(r, 100)); } }
  const post = (body = FORM, headers = {}) => fetch(`${base}/api/contact`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) }).then(r => r.status);
  try { await run({ post, resend, base }); } finally { p.kill(); resend.close(); }
}
const settle = () => new Promise(r => setTimeout(r, 200)); // the thank-you goes after the answer

await withServer({}, async ({ post, resend }) => {
  check('sends to our inbox', 200, await post()); await settle();
  check('no thank-you by default', 1, resend.calls.length);
});
await withServer({ CONTACT_THANKS: 'on' }, async ({ post, resend }) => {
  check('sends to our inbox, thank-you on', 200, await post()); await settle();
  check('with CONTACT_THANKS=on the visitor gets one too', 2, resend.calls.length);
});
process.exit(fail);
