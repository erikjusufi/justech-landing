// JusTech landing, round 10 (round 11: the hero shared with the contact page, the web half fits one screen, the
// agent narrated, the page snaps to its parts): the hero, then the two halves of the offer (on the web, with JustApp; AI and custom),
// then Jus. Round 10 keeps the T-field where it means something: the hero, the agent, the ordering.
import { tfield, reduced } from '../system/tfield.js';
import { ignite, rel, wait } from '../system/ignite.js';
import { mark, figure, box } from '../system/figures.js';
import { showcase } from '../shared/showcase.js';
import { heroField } from './herofield.js';
const $ = (s, r = document) => r.querySelector(s);
const mobile = matchMedia('(max-width: 760px)').matches;
const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const SIG = { t: css('--sig-t'), hub: css('--sig-hub'), edge: css('--sig-edge') };
const LILAC = SIG.t;
const inside = (t, rs) => rs.some(r => t.cx > r.x && t.cx < r.x + r.w && t.cy > r.y && t.cy < r.y + r.h);
const span = (a, b) => { const o = []; for (let k = a; a <= b ? k <= b : k >= b; k += a <= b ? 1 : -1) o.push(k); return o; };
const pad = (r, p) => ({ x: r.x - p, y: r.y - p, w: r.w + 2 * p, h: r.h + 2 * p });
await document.fonts.ready;

// 1 · the hero (herofield.js, shared with the contact page)
heroField($('#hero'), { quiet: [$('#hero .wm'), $('#hero .lead'), $('#hero .cta'), $('#hero .hnav')] });


// 2 · JustApp in glass: the chosen product's sign drawn above its line as the tabs change. Round 10: no field behind
// the glass any more, only the violet pool
{
  const sec = $('.glass');
  const m = mark($('.gmark canvas', sec), 'insight', { cell: mobile ? 8 : 10, speed: 0.58, area: mobile ? [0.18, 0.1, 0.82, 0.9] : [0.3, 0.1, 0.7, 0.9] });
  showcase(sec, { onChange(name) { m.play(name); } });
}

// 3 · AI and custom: an agent at work. Round 11: the field carves an agent's loop (your data, your systems, the
// model, your rules, and the way round again), and one run is narrated step by step beside it: the signal goes to
// each station in turn, the station lights, and its line appears. Demo: the invented tour company.
{
  const sec = $('.built'), text = $('.btext', sec), list = $('.run ol', sec), runBox = $('.run', sec);
  const region = mobile ? [0.07, 0.46, 0.9, 0.62] : [0.47, 0.11, 0.93, 0.48];
  const WHITE = '#fff', ORCHID = css('--sig-edge');
  let quiet = [], labels = [], dimAt = 0, fig = null, vis = false;
  const field = tfield($('canvas', sec), { cell: mobile ? 20 : 26, weight: 0.24, seed: [0.75, 0.3], mix: [0.72, 0.9], lit: 0, growMs: 700, ink: 'oklch(0.62 0.16 297 / .3)', glow: LILAC, tone: [0.4, 1],
    onLayout() { quiet = [pad(rel(text, sec), 18), pad(rel(runBox, sec), 12)]; },
    mask: (x, y, t, now) => { const dim = dimAt ? 1 - 0.88 * Math.min(1, Math.max(0, now - dimAt) / 700) : 1; return t.shape ? 1 : (inside(t, quiet) ? 0.05 : 1) * dim * Math.min(1, Math.min(x, 1 - x, y, 1 - y) * 8); },
    pulses: { every: 1e9, max: 0, cap: 4, ms: 34, trail: 3.4, blur: 12 },
    onGrown(f) {
      fig = figure(f, 'agentrun', box(f, region), { speed: 0.6 }); dimAt = performance.now() + (reduced ? -1e5 : 300);
      labels.forEach(l => l.remove()); labels = [];
      for (const s of fig.labels) { const t = f.at(s.i, s.j), el = document.createElement('span'); el.className = 'stn'; el.textContent = s.l;
        const off = f.cell * 0.9, [dx, dy] = [[0, -1], [1, 0], [0, 1], [-1, 0]][s.d];
        el.style.left = `${t.cx + dx * off}px`; el.style.top = `${t.cy + dy * off}px`; el.style.setProperty('--tx', '-50%'); el.style.setProperty('--ty', dy > 0 ? '0%' : '-100%');
        sec.append(el); labels.push(el); el._t = t; setTimeout(() => el.classList.add('shown'), reduced ? 0 : 500);
        // a label at either end of the line stays inside the panel
        const r = el.getBoundingClientRect(), bb = sec.getBoundingClientRect(), push = Math.max(0, bb.left + 10 - r.left) - Math.max(0, r.right - (bb.right - 10));
        if (push) el.style.left = `${parseFloat(el.style.left) + push}px`; }
      run();
    },
    after() { for (const l of labels) l.classList.toggle('on', l._t.heat > 0.45); return false; } });
  new IntersectionObserver(([e]) => { vis = e.isIntersecting; }, { threshold: 0.3 }).observe(sec);

  // one run, step by step: where the signal goes, what the station is, and what happened there
  const steps = g => {
    const { i0, i1, j1, jm, xa, xc, xs, tops } = g, at = c => c.map(([i, j]) => field.at(i, j)).filter(Boolean);
    const H = (a, b, j) => span(a, b).map(i => [i, j]), V = (i, a, b) => span(a, b).map(j => [i, j]);
    const up = k => V(xs[k], jm - 1, tops[k]), down = k => V(xs[k], tops[k], jm), along = (a, b) => H(a, b, jm);
    return [
      { p: along(i0, xa), s: 'A request', t: '“Which tours next week are under half full?”', c: WHITE },
      { p: [...along(xa, xs[0]), ...up(0)], s: 'Your data', t: 'Reads next week’s bookings: 14 tours, 3 under half full.', c: LILAC },
      { p: [...down(0), ...along(xs[0] + 1, xs[1]), ...up(1)], s: 'Your systems', t: 'Finds 212 past guests who booked tours like them.', c: LILAC },
      { p: [...down(1), ...along(xs[1] + 1, xs[2]), ...up(2)], s: 'The model', t: 'Drafts an offer for them: 20 % off.', c: WHITE },
      { p: [...down(2), ...along(xs[2] + 1, xc)], s: 'Your rules', t: 'Offers stop at 15 %. Not right yet.', c: ORCHID, no: true },
      { p: [...V(xc, jm + 1, j1), ...H(xc - 1, xa, j1), ...V(xa, j1 - 1, jm), ...along(xa + 1, xs[2]), ...up(2)], s: 'Again', t: 'The model redrafts it at 10 %.', c: ORCHID },
      { p: [...down(2), ...along(xs[2] + 1, xc)], s: 'Your rules', t: 'Within your rules.', c: WHITE, ok: true },
      { p: along(xc, i1), s: 'An answer', t: 'Three tours, one offer to 212 guests. Waiting for your yes.', c: WHITE },
    ].map(x => ({ ...x, p: at(x.p) }));
  };
  const line = x => { const li = document.createElement('li'); if (x.no) li.className = 'no'; if (x.ok) li.className = 'ok'; li.innerHTML = `<b>${x.s}</b><span>${x.t}</span>`; return li; };
  const until = () => new Promise(f => { const k = () => (vis ? f() : setTimeout(k, 300)); k(); });
  let running = false;
  async function run() {
    if (running) return; running = true;
    const S = steps(fig.geo);
    if (reduced) { list.replaceChildren(...S.map(line)); list.querySelectorAll('li').forEach(l => l.classList.add('shown')); return; }
    for (;;) {
      list.replaceChildren(...S.map(line)); const lis = [...list.children];
      for (let k = 0; k < S.length; k++) {
        await until();
        lis.forEach(l => l.classList.remove('now')); lis[k].classList.add('shown', 'now');
        await new Promise(done => field.send(S[k].p, done, { color: S[k].c, ms: 30 }));
        await wait(S[k].no ? 900 : 450);
      }
      lis.forEach(l => l.classList.remove('now'));
      await wait(4200); await until();
      lis.forEach(l => l.classList.add('out')); await wait(500);
    }
  }
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

// 5 · the journey (round 11): the page settles on each of its parts (CSS scroll snapping, desktop only); each part
// rises into view once; the rail beside the page says where you are and takes you to the others
{
  const parts = ['web', 'built', 'jus'].map(id => document.getElementById(id)), rail = $('.rail'), links = [...rail.querySelectorAll('a')];
  const rv = [...document.querySelectorAll('.rv')];
  if (reduced) rv.forEach(e => e.classList.add('in'));
  else { const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }); rv.forEach(e => io.observe(e)); }
  const where = () => {
    const mid = innerHeight * 0.45; let cur = -1;
    parts.forEach((p, k) => { const b = p.getBoundingClientRect(); if (b.top < mid && b.bottom > mid) cur = k; });
    links.forEach((a, k) => a.toggleAttribute('aria-current', k === cur));
    rail.classList.toggle('shown', $('#hero').getBoundingClientRect().bottom < innerHeight * 0.5 && $('.foot').getBoundingClientRect().top > innerHeight * 0.6);
  };
  addEventListener('scroll', where, { passive: true }); where();
}
