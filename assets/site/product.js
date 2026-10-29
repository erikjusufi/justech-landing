// A JusTech product page, round 9 (round 10: the field around the figure fades almost away, so the figure is what
// you see): the product's opening (its figure carved from the field), what it does, its
// screen, the other two products as lockups, and the close. The page's product is <body data-prod>.
import './mnav.js?v=a1ecf188836a'; // round 17e: the small navigation on phones
import { tfield, reduced } from '../system/tfield.js?v=a1ecf188836a';
import { ignite, rel } from '../system/ignite.js?v=a1ecf188836a';
import { FIGURES, figure, box, mark } from '../system/figures.js?v=a1ecf188836a';
import { mount, play as playScreen } from '../shared/screens.js?v=a1ecf188836a';
const $ = (s, r = document) => r.querySelector(s);
const mobile = matchMedia('(max-width: 760px)').matches;
const LILAC = getComputedStyle(document.documentElement).getPropertyValue('--sig-t').trim();
const inside = (t, rs) => rs.some(r => t.cx > r.x && t.cx < r.x + r.w && t.cy > r.y && t.cy < r.y + r.h);
const pad = (r, p) => ({ x: r.x - p, y: r.y - p, w: r.w + 2 * p, h: r.h + 2 * p });
await document.fonts.ready;

// 1 · the opening: the t of Just ignites, its spark lands where the figure begins, the figure is carved as the field grows
for (const sec of document.querySelectorAll('.prod')) {
  const name = sec.dataset.prod, canvas = $('canvas', sec), T = $('.T', sec), text = $('.ptext', sec);
  const cell = mobile ? 22 : 32, W = sec.clientWidth, H = sec.clientHeight;
  // the figure fills the right of the first screen (the lower half on a phone), clear of the name and the buttons
  const region = mobile ? { insight: [0.06, 0.56, 0.94, 0.93], content: [0.08, 0.54, 0.92, 0.95], ops: [0.28, 0.57, 0.72, 0.9] }[name]
                        : { insight: [0.46, 0.1, 0.95, 0.86], content: [0.48, 0.08, 0.94, 0.9], ops: [0.52, 0.14, 0.9, 0.84] }[name];
  const g = box({ cell, W, H }, region), [si, sj] = FIGURES[name](g).seed;
  let quiet = [], dimAt = 0, fig = null, labels = [];
  // round 8b: drawn about three times faster. The figure is carved the moment the spark lands, while the field is
  // still growing out of that point, so the two arrive together (about 1.5 s from the spark to the finished figure)
  const field = tfield(canvas, { cell, weight: 0.24, seed: [((si + 0.5) * cell) / W, ((sj + 0.5) * cell) / H], autoGrow: false, mix: [0.72, 0.9], lit: 0, growMs: 650,
    ink: 'oklch(0.62 0.16 297 / .42)', glow: 'oklch(0.86 0.1 300)', tone: [0.4, 1],
    onLayout() { quiet = [pad(rel(text, sec), 18)]; },
    mask: (x, y, t, now) => { const dim = dimAt ? 1 - 0.86 * Math.min(1, Math.max(0, now - dimAt) / 600) : 1; return t.shape || t.seed ? 1 : (inside(t, quiet) ? 0.07 : 1) * dim * Math.min(1, Math.min(x, 1 - x, y, 1 - y) * 8); },
    pulses: { every: name === 'ops' ? 700 : 600, max: name === 'ops' ? 3 : 2, ms: 44, trail: 3.4, blur: 12 },
    // the stations' names light while a job is passing
    after() { for (const l of labels) l.classList.toggle('on', l._t.heat > 0.45); return false; } });
  const carve = f => {
    fig = figure(f, name, box(f, region), { speed: 0.72 }); // round 11: a little slower again
    dimAt = performance.now() + (reduced ? -1e5 : 400);
    for (const s of fig.labels || []) { const t = f.at(s.i, s.j), el = document.createElement('span'); el.className = 'stn'; el.textContent = s.l;
      const off = f.cell * 0.9, [dx, dy] = [[0, -1], [1, 0], [0, 1], [-1, 0]][s.d];
      el.style.left = `${t.cx + dx * off}px`; el.style.top = `${t.cy + dy * off}px`; el.style.setProperty('--tx', dx > 0 ? '0%' : dx < 0 ? '-100%' : '-50%'); el.style.setProperty('--ty', dy > 0 ? '0%' : dy < 0 ? '-100%' : '-50%');
      sec.append(el); labels.push(el); el._t = t; setTimeout(() => el.classList.add('shown'), reduced ? 0 : 450); }
  };
  const play = () => { field.restore(); dimAt = 0; fig = null; labels.forEach(l => l.remove()); labels = []; return ignite({ box: sec, T, drop: $('.drop', sec), field, rise: 320, hold: 220, settle: 1000, onLand: carve }); };
  play();
}


// 2 · the screen, in glass: plays when it comes into view
{
  const holder = $('[data-stage]'), stage = mount(holder), name = document.body.dataset.prod;
  const fit = () => stage.style.setProperty('--z', Math.min(1, holder.parentElement.clientWidth / 1040).toFixed(4));
  fit(); new ResizeObserver(fit).observe(holder.parentElement);
  stage.querySelector(`[data-moment="${name}"]`).classList.add('active');
  new IntersectionObserver(([e], o) => { if (e.isIntersecting) { o.disconnect(); playScreen(stage, name); } }, { threshold: 0.35 }).observe(stage);
}

// 3 · the other two products, as lockups
for (const el of document.querySelectorAll('.lockup')) { const m = mark($('canvas', el), el.dataset.prod, { cell: mobile ? 9 : 10, speed: 0.58 }); el.addEventListener('pointerenter', () => m.play()); }
