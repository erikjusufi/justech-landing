// The contact page: the form, on the hero's field. There is no server behind the form yet: Send opens the visitor's
// email app with the message written.
import { heroField } from './herofield.js';
const $ = (s, r = document) => r.querySelector(s);
const TO = 'info@justech.uk';
await document.fonts.ready;

// round 11: the same field as the hero (herofield.js): the T of "Tell" takes its other half, lights, and the field
// grows from its spark, signals running from many sources; it goes quiet behind the title, the form and the nav
{
  const box = $('.ctop');
  heroField(box, { quiet: [$('h1', box), $('#form', box), $('.hnav', box)] });
}

// Send: check the fields, then open the visitor's email app with the message written out
$('#form').addEventListener('submit', e => {
  e.preventDefault();
  const f = e.target, bad = [...f.querySelectorAll('[required]')].filter(i => !i.value.trim() || (i.type === 'email' && !i.checkValidity()));
  f.querySelectorAll(':scope > label').forEach(l => l.classList.toggle('bad', bad.includes(l.querySelector('input, textarea'))));
  if (bad.length) { bad[0].focus(); return; }
  const v = n => f.elements[n].value.trim();
  const body = `${v('topic')}\n\n${v('what')}\n\n${v('name')}${v('company') ? `, ${v('company')}` : ''}\n${v('email')}`;
  location.href = `mailto:${TO}?subject=${encodeURIComponent(`${v('topic')} · ${v('name')}`)}&body=${encodeURIComponent(body)}`;
});
