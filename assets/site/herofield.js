// The hero's field, shared by the landing's hero and the contact page (round 11): the ignition, the field at its
// densest, signals from many sources, and J3 in the lit T (its right half falls into place before it lights).
// `box` carries [data-ignite] and holds a canvas, a .drop and the letters (.ch, the one that lights .T); `quiet` are the
// elements the field goes quiet behind.
import { tfield, reduced } from '../system/tfield.js';
import { ignite, rel, wait } from '../system/ignite.js';
const mobile = matchMedia('(max-width: 760px)').matches;
const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const inside = (t, rs) => rs.some(r => t.cx > r.x && t.cx < r.x + r.w && t.cy > r.y && t.cy < r.y + r.h);
const pad = (r, p) => ({ x: r.x - p, y: r.y - p, w: r.w + 2 * p, h: r.h + 2 * p });

export function heroField(box, { quiet: quietEls, sparks = 5 }) {
  const SIG = { t: css('--sig-t'), hub: css('--sig-hub'), edge: css('--sig-edge') };
  const T = box.querySelector('.T'), chs = [...box.querySelectorAll('.ch')];
  const d = mobile ? { cell: 23, w: 0.27, hubs: 6 } : { cell: 38, w: 0.27, hubs: 11 }; // Densest, Erik's pick
  const W = box.clientWidth, H = box.clientHeight, tr = rel(T, box);
  const quietOf = () => quietEls.map(el => pad(rel(el, box), el.matches('nav') ? 0 : 12));
  let quiet = quietOf();
  // the type stays readable because the field goes quiet behind it; the seed sits at the foot, straight under the T
  const mask = (x, y, t) => (t.seed ? 1 : inside(t, quiet) ? 0.1 : 1) * Math.min(1, 0.45 + 0.55 * Math.max(x > 0.55 ? 1 : x / 0.55, y > 0.8 ? 1 : 0)) * Math.min(1, 0.35 + y * 2.2);
  const flash = () => { T.classList.add('flash'); setTimeout(() => T.classList.remove('flash'), 160); };
  // the sources, in turn: out of the T, back into it, hubs, the other letters, the edges, and wherever the pointer
  // has been. A signal that reaches a hub is sometimes passed on, so chains run across the field.
  const ORDER = ['t', 'hub', 'letter', 'edge', 'hub', 'back', 'pointer', 'hub', 'letter', 'edge', 't', 'hub', 'back', 'letter'];
  let n = 0, ptr = null, ptrAt = 0;
  box.addEventListener('pointermove', e => { const b = box.getBoundingClientRect(); ptr = [e.clientX - b.left, e.clientY - b.top]; ptrAt = e.timeStamp; }, { passive: true });
  const edgeTile = f => { for (let k = 0; k < 30; k++) { const side = Math.floor(Math.random() * 4), t = side === 0 ? f.at(f.cols - 2, Math.floor(Math.random() * (f.rows - 1))) : side === 1 ? f.at(Math.floor(Math.random() * (f.cols - 1)), f.rows - 2) : side === 2 ? f.at(Math.floor(Math.random() * (f.cols - 1)), 2) : f.at(0, Math.floor(f.rows * (0.5 + Math.random() * 0.5)));
    if (t && t.kind !== 'O' && mask(t.cx / f.W, t.cy / f.H, t) > 0.5) return t; } return null; };
  const spark = el => { el.classList.add('glint'); setTimeout(() => el.classList.remove('glint'), 220); };
  const from = f => {
    const s = ORDER[n++ % ORDER.length];
    if (s === 't') { flash(); return { tile: f.seedTile, color: SIG.t }; }
    if (s === 'back') { const p = f.path(f.seedTile, [10, 22]); return p && { path: p.reverse(), color: SIG.t, done: flash }; }
    if (s === 'hub' && f.hubs.length) { const h = f.hubs[Math.floor(Math.random() * f.hubs.length)]; return { tile: h, color: SIG.hub }; }
    if (s === 'letter') { // from just above one of the other letters, which glows as it goes
      const el = chs.filter(c => c !== T)[Math.floor(Math.random() * (chs.length - 1))], r = rel(el, box), t = f.tileAt(r.cx, r.y - 10 - f.cell * 0.6);
      if (t && t.kind !== 'O') { spark(el); return { tile: t, color: SIG.hub, len: [8, 20] }; } }
    if (s === 'pointer' && ptr && performance.now() - ptrAt < 2500) { const t = f.tileAt(...ptr); if (t && t.kind !== 'O' && !inside(t, quiet)) return { tile: t, color: SIG.edge, len: [6, 14] }; }
    return { tile: edgeTile(f), color: SIG.edge, len: [14, 30] };
  };
  const relay = (end, f) => { if (end.hub && Math.random() < 0.55) setTimeout(() => f.send(f.path(end, [8, 18]), null, { color: SIG.hub }), 140); };
  const seedAt = c => [tr.cx / W, 1 - (c * 0.7) / H];
  const field = tfield(box.querySelector(':scope > canvas'), { cell: d.cell, weight: d.w, hubs: d.hubs, seed: seedAt(d.cell), autoGrow: false, ink: 'oklch(0.64 0.17 298 / .55)', glow: SIG.t, pointer: 'turn', lit: 0.008,
    onLayout() { quiet = quietOf(); }, hubOk: t => mask(t.cx / W, t.cy / H, t) > 0.8 && !inside(t, quiet.map(r => pad(r, d.cell))), mask,
    onClick: (x, y, f) => f.burst(f.tileAt(x, y), 5, { color: SIG.t, len: [6, 16] }),
    pulses: { every: 380, max: mobile ? 7 : 12, cap: mobile ? 12 : 20, len: [12, 30], ms: 72, trail: 3, from, onArrive: relay } });
  // J3 in the word: the T stands as its left half, the right half falls into place turning as it comes, locks (the
  // seam flashes), and only then does the T take the light. The halves are two copies of the glyph, each clipped;
  // once locked the T is one glyph again, so no seam shows at rest. The copy is made here, so the page's text stays.
  // Round 11: faster (0.9 s) and smooth: one fall with gravity, the turn finished just before it lands.
  const half = (cls, txt) => { const e = document.createElement('span'); e.className = `th ${cls}`; e.textContent = txt; return e; };
  // Round 15: where the word starts as the mark (.xm, the landing), the mark comes apart into the word instead, and
  // J3 is left out; either way the T then throws several sparks, and the field grows from where they land.
  const mark = box.querySelector('.xm');
  if (!reduced && !mark && box.hasAttribute('data-j3')) { const g = T.textContent; T.textContent = ''; T.append(half('a', g)); const b = half('b', g); b.setAttribute('aria-hidden', 'true'); T.append(b); }
  const FALL = 950;
  const play = async () => {
    if (mark) { box.classList.add('early'); if (!reduced) await fromMark(box, mark, chs); return ignite({ box, T, drop: box.querySelector('.drop'), field, rise: 40, hold: 220, sparks }); }
    if (!reduced) { box.classList.add('split'); setTimeout(() => box.classList.remove('split'), 120 + FALL); }
    return ignite({ box, T, drop: box.querySelector('.drop'), field, rise: FALL + 60, hold: 280, sparks }); };
  play();
  return { field, play };
}

// The mark comes apart into the word (round 15). The mark stands between where the J and the T will be; its tile
// gives way, and its two letters turn the word's colours (the J white, the T lilac); the J goes left and the T right,
// each to its letter, which takes over as it arrives; u and s open up in the gap between them, and e, c, h follow the T.
// The letters are hidden by CSS until then ([data-mark] .ch), so nothing shows before the mark.
async function fromMark(box, mark, chs) {
  const [J, u, s, T, ...rest] = chs, tile = mark.querySelector('.xt'), pj = mark.querySelector('.pj'), pt = mark.querySelector('.pt');
  const unit = mark.getBoundingClientRect().width / 100; // px per mark unit
  const shift = (part, letter) => { const a = part.getBoundingClientRect(), b = letter.getBoundingClientRect(); return [(b.left + b.width / 2 - (a.left + a.width / 2)) / unit, 0]; };
  const glow = mark.animate([{ filter: 'brightness(1)' }, { filter: 'brightness(1.15) drop-shadow(0 0 6px rgba(214,196,255,.8))', offset: 0.35 }, { filter: 'brightness(1)' }], { duration: 520 });
  await glow.finished.catch(() => {});
  // the tile gives way; the letters take the word's colours
  tile.animate([{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(1.08)' }], { duration: 320, easing: 'ease-in', fill: 'forwards' });
  pj.querySelector('path').animate([{ fill: 'oklch(0.62 0.2 300)' }, { fill: '#f1edf7' }], { duration: 320, fill: 'forwards' });
  pt.querySelector('path').animate([{ fill: 'oklch(0.46 0.2 293)' }, { fill: 'oklch(0.86 0.09 300)' }], { duration: 320, fill: 'forwards' });
  await wait(200);
  // apart: J left, T right, and each letter takes over from its part as it arrives
  const [jx] = shift(pj, J), [tx] = shift(pt, T), move = { duration: 620, easing: 'cubic-bezier(.55,0,.25,1)', fill: 'forwards' };
  pj.animate([{ transform: 'translate(0,0)' }, { transform: `translate(${jx}px, 0)` }], move);
  pt.animate([{ transform: 'translate(0,0)' }, { transform: `translate(${tx}px, 0)` }], move);
  const show = (el, delay, from = 'scale(.7)') => el.animate([{ opacity: 0, transform: from }, { opacity: 1, transform: 'none' }], { duration: 420, delay, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'both' });
  for (const [part, letter] of [[pj, J], [pt, T]]) { part.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, delay: 480, fill: 'forwards' }); show(letter, 440, 'none'); }
  show(u, 300); show(s, 260);
  rest.forEach((el, k) => show(el, 420 + k * 60, 'translateX(-.25em)'));
  await wait(420 + rest.length * 60 + 160);
  mark.style.visibility = 'hidden';
}
