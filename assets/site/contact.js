// The contact page: the form, and behind it the field, every T turned to point at Send (it follows the pointer and
// returns). There is no server behind the form yet: Send opens the visitor's email app with the message written.
import { tfield, reduced } from '../system/tfield.js';
import { rel } from '../system/ignite.js';
const $ = (s, r = document) => r.querySelector(s);
const mobile = matchMedia('(max-width: 760px)').matches;
const TO = 'info@justech.uk';

{
  const box = $('.ctop'), send = $('#talk'), form = $('#form');
  const inside = (t, r) => t.cx > r.x && t.cx < r.x + r.w && t.cy > r.y && t.cy < r.y + r.h;
  let quiet = [], t;
  const field = tfield($('canvas', box), { cell: mobile ? 26 : 38, weight: 0.24, seed: [0.75, 0.6], mix: [0.86, 0.96], ink: 'oklch(0.7 0.15 298 / .5)', glow: 'oklch(0.86 0.1 300)', growMs: 900, pointer: 'follow',
    onLayout() { quiet = [rel($('h1', box), box), rel(form, box), rel($('.hnav', box), box)]; },
    mask: (x, y, tl) => (quiet.some(r => inside(tl, r)) ? 0.08 : 1),
    onGrown(f) { const b = rel(send, box); f.orient(b.cx, b.cy, { spread: 1.1 }); },
    onPointer(x, y, f) { if (t) return; t = setTimeout(() => (t = 0), 90); f.orient(x, y); } });
  box.addEventListener('pointerleave', () => { const b = rel(send, box); setTimeout(() => field.orient(b.cx, b.cy, { spread: 1.6 }), 120); });
  form.addEventListener('focusin', () => { const b = rel(send, box); field.orient(b.cx, b.cy, { spread: 2 }); });
}

// Send: check the fields, then open the visitor's email app with the message written out
$('#form').addEventListener('submit', e => {
  e.preventDefault();
  const f = e.target, bad = [...f.querySelectorAll('[required]')].filter(i => !i.value.trim() || (i.type === 'email' && !i.checkValidity()));
  f.querySelectorAll('label').forEach(l => l.classList.toggle('bad', bad.includes(l.querySelector('input, textarea'))));
  if (bad.length) { bad[0].focus(); return; }
  const v = n => f.elements[n].value.trim();
  const body = `${v('what')}\n\n${v('name')}${v('company') ? `, ${v('company')}` : ''}\n${v('email')}`;
  location.href = `mailto:${TO}?subject=${encodeURIComponent(`What I'm building · ${v('name')}`)}&body=${encodeURIComponent(body)}`;
});
