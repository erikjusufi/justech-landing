// JusTech landing, round 10 (round 12: Jus rebuilt; round 11: the hero shared with the contact page, the web half fits one screen, the
// agent narrated, the page snaps to its parts): the hero, then the two halves of the offer (on the web, with Just App; AI and custom),
// then Jus. Round 10 keeps the T-field where it means something: the hero, the agent, the ordering.
import './mnav.js?v=dad1a7d7aa81'; // round 17e: the small navigation on phones
import { tfield, reduced } from '../system/tfield.js?v=dad1a7d7aa81';
import { ignite, rel, wait } from '../system/ignite.js?v=dad1a7d7aa81';
import { mark, figure, box } from '../system/figures.js?v=dad1a7d7aa81';
import { showcase } from '../shared/showcase.js?v=dad1a7d7aa81';
import { heroField } from './herofield.js?v=dad1a7d7aa81';
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


// 2 · Just App in glass: the chosen product's sign drawn above its line as the tabs change. Round 10: no field behind
// the glass any more, only the violet pool
{
  const sec = $('.glass');
  const m = mark($('.gmark canvas', sec), 'insight', { cell: mobile ? 8 : 10, speed: 0.58, area: mobile ? [0.18, 0.1, 0.82, 0.9] : [0.3, 0.1, 0.7, 0.9] });
  showcase(sec, { onChange(name) { m.play(name); }, auto: !mobile }); // round 17f: on a phone the visitor turns it
}

// 3 · AI and custom: an agent at work. Round 11: the field carves an agent's loop (your data, your systems, the
// model, your rules, and the way round again), and one run is narrated step by step beside it: the signal goes to
// each station in turn, the station lights, and its line appears. Demo: the invented tour company.
{
  const sec = $('.built'), text = $('.btext', sec), list = $('.arun ol', sec), runBox = $('.arun', sec);
  const WHITE = '#fff', ORCHID = css('--sig-edge');
  // the run: each station, what happened there, and the colour of its signal
  const TEXT = [
    { s: 'A request', t: '“Which tours next week are under half full?”', c: WHITE },
    { s: 'Your data', t: 'Reads next week’s bookings: 14 tours, 3 under half full.', c: LILAC },
    { s: 'Your systems', t: 'Finds 212 past guests who booked tours like them.', c: LILAC },
    { s: 'The model', t: 'Drafts an offer for them: 20 % off.', c: WHITE },
    { s: 'Your rules', t: 'Offers stop at 15 %. Not right yet.', c: ORCHID, no: true },
    { s: 'Again', t: 'The model redrafts it at 10 %.', c: ORCHID },
    { s: 'Your rules', t: 'Within your rules.', c: WHITE, ok: true },
    { s: 'An answer', t: 'Three tours, one offer to 212 guests. Waiting for your yes.', c: WHITE },
  ];
  const line = x => { const li = document.createElement('li'); if (x.no) li.className = 'no'; if (x.ok) li.className = 'ok'; li.innerHTML = `<b>${x.s}</b><span>${x.t}</span>`; return li; };
  // until it plays, the run stands written out in full, so the panel is never empty (a render that does not scroll);
  // written before the field measures the part, so the part does not grow under it afterwards
  list.replaceChildren(...TEXT.map(line)); list.querySelectorAll('li').forEach(l => l.classList.add('shown'));
  // the figure takes the space left above the narrated run, with room for its labels (measured, so they never meet:
  // round 15 on a phone, between the words and the run; round 17d on a desktop too, beside the words, where at 1280×720
  // the fixed share put the loop's label on the run's header)
  const region = () => { const H = sec.clientHeight, r = rel(runBox, sec);
    if (!mobile) return [0.47, Math.max(0.1, 72 / H), 0.93, (r.y - 66) / H];
    const a = rel(text, sec); return [0.06, (a.y + a.h + 44) / H, 0.94, (r.y - 76) / H]; };
  let quiet = [], labels = [], dimAt = 0, fig = null, vis = false;
  let grown = false;
  const field = tfield($('canvas', sec), { cell: mobile ? 20 : 26, weight: 0.24, seed: [0.75, 0.3], mix: [0.72, 0.9], lit: 0, growMs: 700, ink: 'oklch(0.62 0.16 297 / .3)', glow: LILAC, tone: [0.4, 1],
    onLayout() { quiet = [pad(rel(text, sec), 18), pad(rel(runBox, sec), 12)]; },
    mask: (x, y, t, now) => { const dim = dimAt ? 1 - 0.88 * Math.min(1, Math.max(0, now - dimAt) / 700) : 1; return t.shape ? 1 : (inside(t, quiet) ? 0.05 : 1) * dim * Math.min(1, Math.min(x, 1 - x, y, 1 - y) * 8); },
    pulses: { every: 1e9, max: 0, cap: 4, ms: 34, trail: 3.4, blur: 12 },
    onGrown() { grown = true; fig = null; carve(); }, // after a re-layout (the part changed size) the figure is carved afresh
    after() { for (const l of labels) l.classList.toggle('on', l._t.heat > 0.45); return false; } });
  // the field grows as the part comes in; the figure is carved from it, and the run plays, once the figure is on screen
  function carve() {
      if (!grown || !vis || fig) return; const f = field;
      fig = figure(f, 'agentrun', box(f, region()), { speed: 0.6 }); dimAt = performance.now() + (reduced ? -1e5 : 300);
      labels.forEach(l => l.remove()); labels = [];
      for (const s of fig.labels) { const t = f.at(s.i, s.j), el = document.createElement('span'); el.className = 'stn'; el.textContent = s.l;
        const off = f.cell * 0.9, [dx, dy] = [[0, -1], [1, 0], [0, 1], [-1, 0]][s.d];
        el.style.left = `${t.cx + dx * off}px`; el.style.top = `${t.cy + dy * off}px`; el.style.setProperty('--tx', '-50%'); el.style.setProperty('--ty', dy > 0 ? '0%' : '-100%');
        sec.append(el); labels.push(el); el._t = t; setTimeout(() => el.classList.add('shown'), reduced ? 0 : 500);
        // a label at either end of the line stays inside the panel
        const r = el.getBoundingClientRect(), bb = sec.getBoundingClientRect(), push = Math.max(0, bb.left + 10 - r.left) - Math.max(0, r.right - (bb.right - 10));
        if (push) el.style.left = `${parseFloat(el.style.left) + push}px`; }
      run();
  }
  // round 17d: the figure is carved, and the run plays, only once it is on the screen: on a phone, when the run
  // under it comes onto the screen (before, it all played while the part had only begun to show)
  const watch = mobile ? runBox : sec, opts = mobile ? { threshold: 0 } : { threshold: 0.4 };
  new IntersectionObserver(([e]) => { vis = e.isIntersecting; carve(); }, opts).observe(watch);

  // one run, step by step: where the signal goes, what the station is, and what happened there
  const steps = g => {
    const { i0, i1, j1, jm, xa, xc, xs, tops } = g, at = c => c.map(([i, j]) => field.at(i, j)).filter(Boolean);
    const H = (a, b, j) => span(a, b).map(i => [i, j]), V = (i, a, b) => span(a, b).map(j => [i, j]);
    const up = k => V(xs[k], jm - 1, tops[k]), down = k => V(xs[k], tops[k], jm), along = (a, b) => H(a, b, jm);
    return [
      along(i0, xa), [...along(xa, xs[0]), ...up(0)], [...down(0), ...along(xs[0] + 1, xs[1]), ...up(1)], [...down(1), ...along(xs[1] + 1, xs[2]), ...up(2)],
      [...down(2), ...along(xs[2] + 1, xc)], [...V(xc, jm + 1, j1), ...H(xc - 1, xa, j1), ...V(xa, j1 - 1, jm), ...along(xa + 1, xs[2]), ...up(2)],
      [...down(2), ...along(xs[2] + 1, xc)], along(xc, i1),
    ].map((path, k) => ({ ...TEXT[k], p: at(path) }));
  };
  const until = () => new Promise(f => { const k = () => (vis ? f() : setTimeout(k, 300)); k(); });
  let running = false;
  async function run() {
    if (running) return; running = true;
    if (reduced) return; // the run stands written out in full
    const lis = [...list.children]; // the same lines every round, only dimmed and lit (round 17f: no longer replaced, which made them all blink)
    for (;;) {
      await until(); while (!fig) await wait(200); const S = steps(fig.geo); // fresh each round: the figure may have been carved again
      lis.forEach(l => l.classList.remove('shown', 'now', 'out'));
      await wait(600);
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

// 4 · Jus (round 12): the field fills the panel, loose, quiet behind the words and the cards. As the panel comes into
// view it falls into one weave (every arm meeting another) from the lilac dot outward; as the order reaches each card,
// (round 15: first the field is shown as it is, loose, every arm that meets nothing marked as a loose end and counted;
// after a beat the order comes, the count falls to none and the caption turns from how systems usually grow to ours)
// a signal runs to it along the weave and the card shows its fact: what the figure rests on, the zero struck out.
// Then signals keep leaving the dot, slowly: once everything joins, light can go anywhere.
{
  const sec = $('.order'), meter = $('.loose .lc b', sec), dot = $('.jus .dot', sec), cards = [...sec.querySelectorAll('.pc')];
  const ord = t => ((t.i + t.j) % 2 ? 2 : 0);
  const rect = el => { const b = el.getBoundingClientRect(), o = sec.getBoundingClientRect(); return { x: b.left - o.left, y: b.top - o.top, w: b.width, h: b.height }; };
  const d0 = rect(dot), o0 = sec.getBoundingClientRect();
  const from = [d0.x + d0.w / 2, d0.y + d0.h * 0.78], out = () => [d0.x + d0.w + field.cell * 0.9, from[1]]; // the order spreads from the dot; light leaves beside it
  // quiet behind each line of the words (not the whole block, so the field reaches in beside the short lines), the cards, the meter
  const lines = el => { const g = document.createRange(); g.selectNodeContents(el); const o = sec.getBoundingClientRect(); return [...g.getClientRects()].map(b => ({ x: b.left - o.left, y: b.top - o.top, w: b.width, h: b.height })); };
  const quiet = () => [...[...sec.querySelectorAll('.jus > *')].flatMap(lines).map(r => pad(r, 16)), ...cards.map(c => pad(rect(c), 10))];
  let rs = quiet(); addEventListener('resize', () => { rs = quiet(); });
  const pulses = { every: 1500, max: 0, cap: 4, ms: 70, trail: 3.2, blur: 12, from: f => ({ tile: f.tileAt(...out()), color: LILAC }) };
  const field = tfield($('canvas', sec), { cell: mobile ? 32 : 40, weight: 0.22, seed: [from[0] / o0.width, from[1] / o0.height], mix: [1, 1], ink: 'oklch(0.6 0.17 297 / .4)', glow: LILAC, lit: 0, growMs: 900, pulses,
    mask: (x, y, t) => (t && inside(t, rs) ? 0.07 : 1) * Math.min(1, Math.min(x, 1 - x, y, 1 - y) * 7),
    onLayout(f) { rs = quiet(); f.tiles.forEach(t => { t.th = t.rnd; }); },
    after(ctx, now, f) {
      // the loose ends: every arm, in view and out in the open, that meets no neighbour's arm, marked and counted
      let all = 0, met = 0; const bar = f.cell * 0.22, fade = looseAt ? Math.min(1, (now - looseAt) / 500) : 0, beat = 0.7 + 0.3 * Math.sin(now / 180);
      ctx.save(); ctx.fillStyle = SIG.edge; ctx.shadowColor = SIG.edge; ctx.shadowBlur = 8; const D = [[0, -1], [1, 0], [0, 1], [-1, 0]], open = t => t.cx < f.W && t.cy < f.H && !inside(t, rs);
      for (const t of f.tiles) { if (!open(t)) continue; const r = Math.round(t.shown);
        for (const a of [0, 1, 3]) { const dir = (a + ((r % 4) + 4)) % 4, ni = t.i + D[dir][0], nj = t.j + D[dir][1]; if (ni < 0 || nj < 0 || ni >= f.cols) continue; const n = f.tiles[nj * f.cols + ni]; if (!n || !open(n)) continue; all++;
          const nr = Math.round(n.shown); if ([0, 1, 3].map(b => (b + ((nr % 4) + 4)) % 4).includes((dir + 2) % 4)) met++;
          else if (fade) { ctx.globalAlpha = fade * beat; const x = t.cx + D[dir][0] * f.cell * 0.46, y = t.cy + D[dir][1] * f.cell * 0.46; ctx.fillRect(x - bar * 0.45, y - bar * 0.45, bar * 0.9, bar * 0.9); } } }
      ctx.restore();
      const v = String(all - met); if (meter.textContent !== v) meter.textContent = v;
      if (ordering && all === met) sec.classList.add('done');
      return fade > 0 && all > met; // keep the loose ends beating
    } });
  // the shortest walk along joined arms (the weave, once ordered) from a tile to another
  const walk = (a, b) => { const prev = new Map([[a, null]]), q = [a];
    while (q.length) { const t = q.shift(); if (t === b) break; for (const n of field.joined(t)) if (!prev.has(n) && (n === b || !inside(n, rs))) { prev.set(n, t); q.push(n); } }
    if (!prev.has(b)) return null; const out = []; for (let t = b; t; t = prev.get(t)) out.unshift(t); return out; };
  const SPEED = 0.75; // px per ms: how fast the order spreads from the dot
  let looseAt = 0, ordering = false;
  if (!reduced) sec.classList.add('armed');
  const order = () => {
    ordering = true; sec.classList.add('lit');
    for (const t of field.tiles) field.set(t, ord(t), reduced ? 0 : 250 + Math.hypot(t.cx - from[0], t.cy - from[1]) / SPEED + t.th * 160, 0.75);
    const last = reduced ? 0 : 250 + Math.hypot(field.W, field.H) / SPEED + 400;
    cards.forEach(c => {
      const r = rect(c), to = [mobile ? r.x + r.w * 0.5 : r.x - field.cell * 0.6, mobile ? r.y - field.cell * 0.6 : r.y + r.h / 2];
      const reach = reduced ? 0 : 250 + Math.hypot(to[0] - from[0], to[1] - from[1]) / SPEED + 200;
      setTimeout(() => {
        const path = reduced ? null : walk(field.tileAt(...out()), field.tileAt(...to));
        if (path) field.send(path, () => c.classList.add('on'), { color: LILAC, ms: 26 }); else c.classList.add('on');
      }, reach);
    });
    setTimeout(() => { pulses.max = reduced ? 0 : 2; field.kick(); }, last);
  };
  // the field as it is first, its loose ends counted, then (once the visitor has had a moment with it) the order
  new IntersectionObserver(([e], o) => { if (!e.isIntersecting) return; o.disconnect();
    if (reduced) { order(); sec.classList.add('done'); return; }
    looseAt = performance.now() + 500; field.kick(); setTimeout(order, 2300); }, { threshold: 0.55 }).observe(sec);
}

// 5 · the journey (round 11): the page settles on each of its parts (CSS scroll snapping, where they all fit); each part
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
  // round 17d: snap only where every part fits the screen (measured as they are, without snapping's full-screen height)
  const fit = () => {
    const root = document.documentElement; root.classList.remove('snapping');
    if (reduced) return;
    const all = [...document.querySelectorAll('.sec.snap')].every(s => s.getBoundingClientRect().height <= innerHeight);
    root.classList.toggle('snapping', all);
  };
  let t = 0; addEventListener('resize', () => { clearTimeout(t); t = setTimeout(fit, 200); }); fit();
}
