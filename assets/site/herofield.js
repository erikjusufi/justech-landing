// The hero's field, shared by the landing's hero and the contact page (round 11): the ignition, the field at its
// densest, signals from many sources, and J3 in the lit T (its right half falls into place before it lights).
// `box` carries [data-ignite] and holds a canvas, a .drop and the letters (.ch, the one that lights .T); `quiet` are the
// elements the field goes quiet behind.
import { tfield, reduced } from '../system/tfield.js';
import { ignite, rel } from '../system/ignite.js';
const mobile = matchMedia('(max-width: 760px)').matches;
const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const inside = (t, rs) => rs.some(r => t.cx > r.x && t.cx < r.x + r.w && t.cy > r.y && t.cy < r.y + r.h);
const pad = (r, p) => ({ x: r.x - p, y: r.y - p, w: r.w + 2 * p, h: r.h + 2 * p });

export function heroField(box, { quiet: quietEls }) {
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
  if (!reduced) { const g = T.textContent; T.textContent = ''; T.append(half('a', g)); const b = half('b', g); b.setAttribute('aria-hidden', 'true'); T.append(b); }
  const FALL = 950;
  const play = () => { if (!reduced) { box.classList.add('split'); setTimeout(() => box.classList.remove('split'), 120 + FALL); }
    return ignite({ box, T, drop: box.querySelector('.drop'), field, rise: FALL + 60, hold: 280 }); };
  play();
  return { field, play };
}
