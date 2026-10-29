// The contact page: the form, on the hero's field. Round 17: Send posts the form to /api/contact (a Cloudflare Pages
// Function that mails it through Resend); if that cannot take it (not deployed, not configured, offline), Send falls
// back to what it did before: the visitor's email app opens with the message written.
import './mnav.js?v=a1ecf188836a'; // round 17e: the small navigation on phones
import { heroField } from './herofield.js?v=a1ecf188836a';
const $ = (s, r = document) => r.querySelector(s);
const TO = 'info@justech.uk';
await document.fonts.ready;

// round 11: the same field as the hero (herofield.js): the T of "Tell" takes its other half, lights, and the field
// grows from its spark, signals running from many sources; it goes quiet behind the title, the form and the nav
{
  const box = $('.ctop');
  heroField(box, { quiet: [$('h1', box), $('#form', box), $('.hnav', box)] });
}

// Send: check the fields, post them, and say what happened; the email app only if the post does not go through
const form = $('#form'), note = $('#note'), btn = $('#talk');
form.addEventListener('submit', async e => {
  e.preventDefault();
  const f = e.target, bad = [...f.querySelectorAll('[required]')].filter(i => !i.value.trim() || (i.type === 'email' && !i.checkValidity()));
  f.querySelectorAll(':scope > label').forEach(l => l.classList.toggle('bad', bad.includes(l.querySelector('input, textarea'))));
  if (bad.length) { bad[0].focus(); return; }
  const v = n => f.elements[n].value.trim();
  const data = { name: v('name'), email: v('email'), company: v('company'), topic: v('topic'), message: v('what'), website: v('website') };
  btn.disabled = true; btn.firstChild.textContent = 'Sending ';
  let ok = false;
  try { const r = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); ok = r.ok; } catch { ok = false; }
  btn.disabled = false; btn.firstChild.textContent = 'Send ';
  if (ok) { form.hidden = true; const s = $('#sent'); s.hidden = false; s.focus(); return; }
  note.innerHTML = `Our form could not send it, so your email app opens with the message ready. Or write to <a href="mailto:${TO}">${TO}</a>.`;
  const body = `${data.topic}\n\n${data.message}\n\n${data.name}${data.company ? `, ${data.company}` : ''}\n${data.email}`;
  location.href = `mailto:${TO}?subject=${encodeURIComponent(`${data.topic} · ${data.name}`)}&body=${encodeURIComponent(body)}`;
});
