// JusTech landing, round 10: the hero, then the two halves of the offer (on the web, with Just App; AI and custom),
// then Jus. Round 10 keeps the T-field where it means something: the hero, the agent, the ordering.
import { tfield, reduced } from '../system/tfield.js';
import { ignite, rel, wait } from '../system/ignite.js';
import { mark, figure, box } from '../system/figures.js';
import { showcase } from '../shared/showcase.js';
const $ = (s, r = document) => r.querySelector(s);
const mobile = matchMedia('(max-width: 760px)').matches;
const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const SIG = { t: css('--sig-t'), hub: css('--sig-hub'), edge: css('--sig-edge') };
const LILAC = SIG.t;
const inside = (t, rs) => rs.some(r => t.cx > r.x && t.cx < r.x + r.w && t.cy > r.y && t.cy < r.y + r.h);
const pad = (r, p) => ({ x: r.x - p, y: r.y - p, w: r.w + 2 * p, h: r.h + 2 * p });
await document.fonts.ready;

// 1 · the hero: the ignition, the field at its densest, signals from many sources
{
  const hero = $('#hero'), h1 = $('.wm', hero), T = $('.T', h1), chs = [...h1.querySelectorAll('.ch')];
  const d = mobile ? { cell: 23, w: 0.27, hubs: 6 } : { cell: 38, w: 0.27, hubs: 11 }; // Densest, Erik's pick
  const word = () => { const a = rel(chs[0], hero), b = rel(chs[chs.length - 1], hero); return { x: a.x, y: a.y, w: b.x + b.w - a.x, h: a.h }; };
  const W = hero.clientWidth, H = hero.clientHeight, tr = rel(T, hero);
  const quietOf = () => [pad(word(), 10), pad(rel($('.lead', hero), hero), 14), pad(rel($('.cta', hero), hero), 14), rel($('.hnav', hero), hero)];
  let quiet = quietOf();
  // the type stays readable because the field goes quiet behind it; the seed sits at the foot, straight under the T
  const mask = (x, y, t) => (t.seed ? 1 : inside(t, quiet) ? 0.1 : 1) * Math.min(1, 0.45 + 0.55 * Math.max(x > 0.55 ? 1 : x / 0.55, y > 0.8 ? 1 : 0)) * Math.min(1, 0.35 + y * 2.2);
  const flash = () => { T.classList.add('flash'); setTimeout(() => T.classList.remove('flash'), 160); };
  // the sources, in turn: out of the T, back into it, hubs, the other letters, the edges, and wherever the pointer
  // has been. A signal that reaches a hub is sometimes passed on, so chains run across the field.
  const ORDER = ['t', 'hub', 'letter', 'edge', 'hub', 'back', 'pointer', 'hub', 'letter', 'edge', 't', 'hub', 'back', 'letter'];
  let n = 0, ptr = null, ptrAt = 0;
  hero.addEventListener('pointermove', e => { const b = hero.getBoundingClientRect(); ptr = [e.clientX - b.left, e.clientY - b.top]; ptrAt = e.timeStamp; }, { passive: true });
  const edgeTile = f => { for (let k = 0; k < 30; k++) { const side = Math.floor(Math.random() * 4), t = side === 0 ? f.at(f.cols - 2, Math.floor(Math.random() * (f.rows - 1))) : side === 1 ? f.at(Math.floor(Math.random() * (f.cols - 1)), f.rows - 2) : side === 2 ? f.at(Math.floor(Math.random() * (f.cols - 1)), 2) : f.at(0, Math.floor(f.rows * (0.5 + Math.random() * 0.5)));
    if (t && t.kind !== 'O' && mask(t.cx / f.W, t.cy / f.H, t) > 0.5) return t; } return null; };
  const spark = el => { el.classList.add('glint'); setTimeout(() => el.classList.remove('glint'), 220); };
  const from = f => {
    const s = ORDER[n++ % ORDER.length];
    if (s === 't') { flash(); return { tile: f.seedTile, color: SIG.t }; }
    if (s === 'back') { const p = f.path(f.seedTile, [10, 22]); return p && { path: p.reverse(), color: SIG.t, done: flash }; }
    if (s === 'hub' && f.hubs.length) { const h = f.hubs[Math.floor(Math.random() * f.hubs.length)]; return { tile: h, color: SIG.hub }; }
    if (s === 'letter') { // from just above one of the other letters, which glows as it goes
      const el = chs.filter(c => c !== T)[Math.floor(Math.random() * (chs.length - 1))], r = rel(el, hero), t = f.tileAt(r.cx, word().y - 10 - f.cell * 0.6);
      if (t && t.kind !== 'O') { spark(el); return { tile: t, color: SIG.hub, len: [8, 20] }; } }
    if (s === 'pointer' && ptr && performance.now() - ptrAt < 2500) { const t = f.tileAt(...ptr); if (t && t.kind !== 'O' && !inside(t, quiet)) return { tile: t, color: SIG.edge, len: [6, 14] }; }
    return { tile: edgeTile(f), color: SIG.edge, len: [14, 30] };
  };
  const relay = (end, f) => { if (end.hub && Math.random() < 0.55) setTimeout(() => f.send(f.path(end, [8, 18]), null, { color: SIG.hub }), 140); };
  const seedAt = c => [tr.cx / W, 1 - (c * 0.7) / H];
  const field = tfield($('canvas', hero), { cell: d.cell, weight: d.w, hubs: d.hubs, seed: seedAt(d.cell), autoGrow: false, ink: 'oklch(0.64 0.17 298 / .55)', glow: SIG.t, pointer: 'turn', lit: 0.008,
    onLayout() { quiet = quietOf(); }, hubOk: t => mask(t.cx / W, t.cy / H, t) > 0.8 && !inside(t, quiet.map(r => pad(r, d.cell))), mask,
    onClick: (x, y, f) => f.burst(f.tileAt(x, y), 5, { color: SIG.t, len: [6, 16] }),
    pulses: { every: 380, max: mobile ? 7 : 12, cap: mobile ? 12 : 20, len: [12, 30], ms: 72, trail: 3, from, onArrive: relay } });
  // round 10 · J3 in the word: the T stands as its left half, the right half falls into place a quarter turn at a time
  // and locks (the seam flashes), and only then does the T take the light. The halves are two copies of the glyph,
  // each clipped; once locked, the T is one glyph again, so no seam shows at rest. The copy is made here, so the
  // page's text stays "JusTech".
  const half = (cls, txt) => { const e = document.createElement('span'); e.className = `th ${cls}`; e.textContent = txt; return e; };
  if (!reduced) { const g = T.textContent; T.textContent = ''; T.append(half('a', g)); const b = half('b', g); b.setAttribute('aria-hidden', 'true'); T.append(b); }
  const FALL = 1450;
  const play = () => { if (!reduced) { hero.classList.remove('locked'); hero.classList.add('split'); setTimeout(() => { hero.classList.remove('split'); hero.classList.add('locked'); }, 120 + FALL); }
    return ignite({ box: hero, T, drop: $('.drop', hero), field, rise: FALL + 80, hold: 300 }); };
  play();
}


// 2 · Just App in glass: the chosen product's sign drawn above its line as the tabs change. Round 10: no field behind
// the glass any more, only the violet pool
{
  const sec = $('.glass');
  const m = mark($('.gmark canvas', sec), 'insight', { cell: mobile ? 8 : 10 });
  showcase(sec, { onChange(name) { m.play(name); } });
}

// 3 · built for you: the field carves an agent (a request splits at a T to your data and to the model, joins at a
// T, is checked, and answers); signals run it, and each station lights as one passes
{
  const sec = $('.built'), text = $('.btext', sec), region = mobile ? [0.12, 0.6, 0.88, 0.86] : [0.52, 0.22, 0.9, 0.78];
  let quiet = [], labels = [], dimAt = 0;
  const field = tfield($('canvas', sec), { cell: mobile ? 22 : 30, weight: 0.24, seed: [0.75, 0.5], mix: [0.72, 0.9], lit: 0, growMs: 700, ink: 'oklch(0.62 0.16 297 / .32)', glow: LILAC, tone: [0.4, 1],
    onLayout() { quiet = [pad(rel(text, sec), 18)]; },
    mask: (x, y, t, now) => { const dim = dimAt ? 1 - 0.86 * Math.min(1, Math.max(0, now - dimAt) / 700) : 1; return t.shape ? 1 : (inside(t, quiet) ? 0.06 : 1) * dim * Math.min(1, Math.min(x, 1 - x, y, 1 - y) * 8); },
    pulses: { every: 650, max: 4, ms: 42, trail: 3.4, blur: 12 },
    onGrown(f) {
      const fig = figure(f, 'agent', box(f, region), { speed: 0.5 }); dimAt = performance.now() + (reduced ? -1e5 : 300);
      labels.forEach(l => l.remove()); labels = [];
      for (const s of fig.labels) { const t = f.at(s.i, s.j), el = document.createElement('span'); el.className = 'stn'; el.textContent = s.l;
        const off = f.cell * 0.9, [dx, dy] = [[0, -1], [1, 0], [0, 1], [-1, 0]][s.d];
        el.style.left = `${t.cx + dx * off}px`; el.style.top = `${t.cy + dy * off}px`; el.style.setProperty('--tx', '-50%'); el.style.setProperty('--ty', dy > 0 ? '0%' : '-100%');
        sec.append(el); labels.push(el); el._t = t; setTimeout(() => el.classList.add('shown'), reduced ? 0 : 500);
        // a label at either end of the line stays inside the panel
        const r = el.getBoundingClientRect(), bb = sec.getBoundingClientRect(), push = Math.max(0, bb.left + 10 - r.left) - Math.max(0, r.right - (bb.right - 10));
        if (push) el.style.left = `${parseFloat(el.style.left) + push}px`; }
    },
    after() { for (const l of labels) l.classList.toggle('on', l._t.heat > 0.45); return false; } });
}

// 4 · Jus, over order: round 10 puts it in a panel, the field only on the side away from the text, and the field
// falls into one weave (every arm meeting another) once, as the panel comes into view; no more scrolling through it
{
  const sec = $('.order'), meter = $('.meter b', sec);
  const ord = t => ((t.i + t.j) % 2 ? 2 : 0);
  const side = mobile ? (x, y) => Math.min(1, Math.max(0, (y - 0.56) * 6)) : (x, y) => Math.min(1, Math.max(0, (x - 0.5) * 5));
  const field = tfield($('canvas', sec), { cell: mobile ? 36 : 48, weight: 0.22, seed: [mobile ? 0.5 : 0.78, mobile ? 0.8 : 0.5], mix: [1, 1], ink: 'oklch(0.6 0.17 297 / .38)', glow: LILAC, lit: 0, growMs: 900,
    mask: (x, y) => side(x, y) * Math.min(1, Math.min(x, 1 - x, y, 1 - y) * 6),
    onLayout(f) { f.tiles.forEach(t => { t.th = t.rnd; }); },
    after(ctx, now, f) {
      // the figure: the share of arms, in view, that meet a neighbour's arm
      let all = 0, met = 0; const D = [[0, -1], [1, 0], [0, 1], [-1, 0]];
      for (const t of f.tiles) { if (t.cx > f.W || t.cy > f.H || side(t.cx / f.W, t.cy / f.H) < 0.5) continue; const r = Math.round(t.shown);
        for (const a of [0, 1, 3]) { const dir = (a + ((r % 4) + 4)) % 4, n = f.tiles[(t.j + D[dir][1]) * f.cols + t.i + D[dir][0]]; if (t.i + D[dir][0] < 0 || t.j + D[dir][1] < 0 || !n || n.cx > f.W + f.cell || n.cy > f.H + f.cell || side(n.cx / f.W, n.cy / f.H) < 0.5) continue; all++;
          const nr = Math.round(n.shown); if ([0, 1, 3].map(b => (b + ((nr % 4) + 4)) % 4).includes((dir + 2) % 4)) met++; } }
      const v = `${Math.round((100 * met) / Math.max(1, all))} %`; if (meter.textContent !== v) meter.textContent = v;
    } });
  const order = () => { for (const t of field.tiles) field.set(t, ord(t), reduced ? 0 : 500 + t.th * 2200, 0.7); };
  new IntersectionObserver(([e], o) => { if (e.isIntersecting) { o.disconnect(); order(); } }, { threshold: 0.5 }).observe(sec);
}
