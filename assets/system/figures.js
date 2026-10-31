// The product figures: each product has one shape the T-field turns itself into, and one way light runs through it.
//   Insight: a line found in the noise. The season, rising and easing; a signal runs it, and one drops from the
//            peak to the day that explains it (the screen's "why", tied to its event).
//   Content: a page being written. A margin, a heading, lines of text with ascenders and descenders, an image block;
//            the caret runs down the margin and out along each line.
//   Agent:   built for you. A request splits at a T to your data and the model, joins, is checked, answers.
//   Agentrun: an agent at work (round 11). A request comes in to the agent, which goes up to your data, your
//            systems and the model in turn, is checked against your rules, goes round again when it is not right
//            yet, and answers. The page sends the signal step by step and narrates it.
//   Ops:     checked every night (round 19). A steady pulse, a beat a night, tonight's in white; under tonight's beat
//            its checks (up, renewed, backed up, checked) hang down as branches, as the Ops screen lists them.
// `g` is the grid box the figure fills: { i0, i1, j0, j1 } in cells. Shapes are drawn from demo ideas, not data.
import { tfield, reduced } from './tfield.js?v=a31ae76f16f4';
const LILAC = 'oklch(0.86 0.1 300)', WHITE = '#f6f2fb', DIM = 'oklch(0.7 0.13 298 / .7)', ORCHID = 'oklch(0.8 0.14 322)';
const span = (a, b) => { const o = []; for (let k = a; a <= b ? k <= b : k >= b; k += a <= b ? 1 : -1) o.push(k); return o; };

export const FIGURES = {
  agent({ i0, i1, j0, j1 }) {
    const n = i1 - i0, jm = Math.round((j0 + j1) / 2), xa = i0 + Math.round(n * 0.2), xb = i0 + Math.round(n * 0.64), xd = Math.round((xa + xb) / 2), xc = i0 + Math.round(n * 0.82);
    const main1 = span(i0, xa).map(i => [i, jm]), main2 = span(xb, i1).map(i => [i, jm]);
    const arm = j => [...span(jm, j).map(jj => [xa, jj]), ...span(xa + 1, xb).map(i => [i, j]), ...span(j, jm).map(jj => [xb, jj]).slice(1)];
    const up = arm(j0), down = arm(j1);
    return {
      parts: [{ cells: main1, ink: LILAC, straight: 'I', step: 26 }, { cells: up, ink: LILAC, straight: 'I', step: 22, delay: main1.length * 26 }, { cells: down, ink: LILAC, straight: 'I', step: 22, delay: main1.length * 26 },
        { cells: main2, ink: LILAC, straight: 'I', step: 26, delay: (main1.length + up.length) * 22 }, { cells: [...main1, ...up.slice(1), ...main2.slice(1)] }, { cells: [...main1, ...down.slice(1), ...main2.slice(1)] }],
      routes: [{ part: 4, color: '#fff', ms: 40 }, { part: 5, color: LILAC, ms: 40 }, { part: 4, color: ORCHID, ms: 40 }, { part: 5, color: '#fff', ms: 40 }],
      stations: [[i0, jm], [xd, j0], [xd, j1], [xc, jm], [i1, jm]],
      labels: [{ i: i0, j: jm, l: 'A request', d: 2 }, { i: xd, j: j0, l: 'Your data', d: 0 }, { i: xd, j: j1, l: 'The model', d: 2 }, { i: xc, j: jm, l: 'Checked', d: 0 }, { i: i1, j: jm, l: 'An answer', d: 2 }],
      seed: main1[0],
    };
  },
  agentrun({ i0, i1, j0, j1 }) {
    const n = i1 - i0, jm = j0 + Math.round((j1 - j0) * 0.56), xa = i0 + Math.round(n * 0.16), xc = i0 + Math.round(n * 0.84);
    const xs = [0.35, 0.52, 0.69].map(f => i0 + Math.round(n * f)), tops = [j0, j0 + 2, j0];
    const H = (a, b, j) => span(a, b).map(i => [i, j]), V = (i, a, b) => span(a, b).map(j => [i, j]);
    const bus = H(i0, i1, jm), stems = xs.map((x, k) => V(x, jm, tops[k])), loop = [...V(xc, jm, j1), ...H(xc - 1, xa, j1), ...V(xa, j1 - 1, jm)];
    const lm = Math.round((xa + xc) / 2);
    return {
      parts: [{ cells: bus, ink: LILAC, straight: 'I', step: 22 }, ...stems.map((c, k) => ({ cells: c, ink: k === 2 ? WHITE : LILAC, straight: 'I', step: 34, delay: (xs[k] - i0) * 22 })),
        { cells: loop, ink: DIM, straight: 'I', step: 16, delay: n * 22 }],
      stations: [[i0, jm], [xa, jm], ...xs.map((x, k) => [x, tops[k]]), [xc, jm], [i1, jm], [lm, j1]],
      labels: [{ i: i0, j: jm, l: 'A request', d: 2 }, { i: xa, j: jm, l: 'The agent', d: 0 }, { i: xs[0], j: tops[0], l: 'Your data', d: 0 }, { i: xs[1], j: tops[1], l: 'Your systems', d: 0 },
        { i: xs[2], j: tops[2], l: 'The model', d: 0 }, { i: xc, j: jm, l: 'Your rules', d: 0 }, { i: i1, j: jm, l: 'An answer', d: 2 }, { i: lm, j: j1, l: 'Not right yet: again', d: 2 }],
      geo: { i0, i1, j0, j1, jm, xa, xc, xs, tops }, seed: bus[0],
    };
  },
  insight({ i0, i1, j0, j1 }) {
    const jb = j1, top = j0, R = Math.max(2, jb - 2 - top), n = i1 - i0;
    // the season: climbs to a peak a third of the way in, eases, with a weekly wobble (demo shape, not data)
    const v = x => (x < 0.32 ? 0.1 + 0.85 * Math.exp(-(((x - 0.32) / 0.15) ** 2)) : 0.42 + 0.53 * Math.exp(-(((x - 0.32) / 0.2) ** 2))) + 0.06 * Math.sin(x * 23);
    const row = i => jb - 2 - Math.round(Math.max(0, Math.min(1, v((i - i0) / n))) * R);
    const line = []; let j = row(i0); line.push([i0, j]);
    for (let i = i0 + 1; i <= i1; i++) { const jn = row(i); line.push([i, j]); while (j !== jn) { j += Math.sign(jn - j); line.push([i, j]); } }
    let ip = i0; for (let i = i0; i <= i1; i++) if (row(i) < row(ip)) ip = i;
    const drop = span(row(ip), jb).map(jj => [ip, jj]), base = span(i0, i1).map(i => [i, jb]);
    return {
      parts: [{ cells: line, ink: LILAC, stem: 2, step: 22, delay: 0 }, { cells: drop, ink: WHITE, straight: 'I', step: 40, delay: line.length * 22 + 100 }, { cells: base, ink: DIM, straight: 'I', stem: 0, step: 10, delay: 200 }],
      routes: [{ part: 0, color: LILAC, ms: 46 }, { part: 1, color: '#fff', ms: 90, hit: true }, { part: 2, color: DIM, ms: 60 }, { part: 0, color: '#fff', ms: 52 }],
      stations: [[ip, jb]], seed: line[0],
    };
  },
  content({ i0, i1, j0, j1 }) {
    const w = i1 - i0, img = w >= 12, ie = img ? i1 - Math.max(4, Math.round(w * 0.3)) : i1; // the image block's left edge
    const rows = span(j0, j1).filter((_, k) => k % 2 === 0), lens = [0.86, 0.97, 0.92, 0.58, 0.95, 0.88, 0.4, 0.9, 0.7];
    const margin = span(rows[0], rows[rows.length - 1]).map(j => [i0, j]);
    const lines = rows.map((j, k) => { const right = k > 0 && k < 4 && img ? ie - 2 : i1; return span(i0, i0 + Math.max(2, Math.round((right - i0) * lens[k % lens.length]))).map(i => [i, j]); });
    const parts = [{ cells: margin, ink: DIM, straight: 'I', step: 30, delay: 0 }];
    let at = 120; lines.forEach((cells, k) => { parts.push({ cells, ink: k === 0 ? WHITE : LILAC, stem: t => (k === 0 ? 0 : t.rnd < 0.5 ? 0 : 2), step: 18, delay: at }); at += cells.length * 18 * 0.6; });
    if (img && rows.length > 3) { const a = rows[1], b = rows[3]; const ring = [...span(ie, i1).map(i => [i, a]), ...span(a + 1, b).map(j => [i1, j]), ...span(i1 - 1, ie).map(i => [i, b]), ...span(b - 1, a).map(j => [ie, j])];
      parts.push({ cells: ring, ink: ORCHID, straight: 'I', stem: 2, step: 14, delay: 300 }); }
    const routes = [{ part: 0, color: DIM, ms: 70 }]; lines.forEach((_, k) => routes.push({ part: k + 1, color: k === 0 ? '#fff' : LILAC, ms: 40 }));
    if (img && rows.length > 3) routes.splice(3, 0, { part: parts.length - 1, color: ORCHID, ms: 50 });
    return { parts, routes, seed: margin[0] };
  },
  // round 19 (Erik: the loop was much weaker than Insight's line and Content's page): a steady pulse, one beat a night,
  // tonight's in white; from tonight's beat the night's checks hang down, one branch each (up, renewed, backed up,
  // checked), as on the Ops screen. Small, it is still a pulse with a comb under its last beat
  ops({ i0, i1, j0, j1 }) {
    const n = i1 - i0, h = j1 - j0, jb = j0 + Math.max(3, Math.min(Math.round(h * 0.4), h - 10)), jd = Math.min(j1, jb + Math.max(1, Math.round(h * 0.06)));
    const xt = i1 - Math.max(5, Math.round(n * 0.16)), p = Math.max(5, Math.round(n / 5.5));
    const H = (a, b, j) => span(a, b).map(i => [i, j]), V = (i, a, b) => span(a, b).map(j => [i, j]);
    // a beat as a heart monitor draws it, on the grid: a small rise, the spike up, down past the line, back
    const ja = jb - Math.max(1, Math.round((jb - j0) * 0.18)), jt = j0 + Math.round((jb - j0) * 0.15);
    const beat = x => [...V(x, jb, ja), ...V(x + 1, ja, jb), ...V(x + 2, jb, jt), ...V(x + 3, jt, jd), ...V(x + 4, jd, jb)];
    const xs = []; for (let x = i0 + Math.max(2, Math.round(p * 0.5)); x + 4 < xt - 2; x += p) xs.push(x);
    const past = []; let at = i0;
    for (const x of xs) { past.push(...H(at, x - 1, jb), ...beat(x)); at = x + 5; }
    past.push(...H(at, xt - 1, jb));
    const tonight = [...beat(xt), ...H(xt + 5, i1, jb)];
    const k = Math.max(0, Math.min(4, Math.floor((j1 - jd - 1) / 2))), rows = k ? span(1, k).map(r => jd + 1 + Math.round(r * (j1 - jd - 1) / k)) : [], L = Math.max(2, Math.round(n * 0.12));
    const spine = k ? V(xt + 3, jd + 1, rows[k - 1]) : [], branches = rows.map(j => H(xt + 3, xt + 3 - L, j).slice(1));
    const words = ['up', 'renewed', 'backed up', 'checked'], whole = [...past, ...tonight];
    const parts = [{ cells: past, ink: LILAC, straight: 'I', step: 12, delay: 0 }, { cells: tonight, ink: WHITE, straight: 'I', step: 26, delay: past.length * 12 },
      ...(k ? [{ cells: spine, ink: DIM, straight: 'I', step: 30, delay: past.length * 12 + 200 }] : []),
      ...branches.map((c, r) => ({ cells: c, ink: ORCHID, straight: 'I', step: 30, delay: past.length * 12 + 260 + r * 160 })), { cells: whole }];
    const P = parts.length - 1;
    return {
      parts,
      routes: [{ part: P, color: '#fff', ms: 30 }, ...(k ? [{ part: 2, color: ORCHID, ms: 60 }] : []), { part: P, color: LILAC, ms: 34 }, ...branches.map((_, r) => ({ part: 3 + r, color: '#fff', ms: 80 }))],
      stations: [...xs.map(x => [x + 2, jt]), [xt + 2, jt], ...rows.map(j => [xt + 3 - L, j])],
      // the checks are named only when all four fit
      labels: [{ i: xt + 2, j: jt, l: 'tonight', d: 0 }, ...(k === 4 ? rows.map((j, r) => ({ i: xt + 3 - L, j, l: words[r], d: 3 })) : [])],
      seed: whole[0],
    };
  },
};

// carve product `name` into `field` inside grid box `g`, and point its signals along the figure
export function figure(field, name, g, { delay = 0, speed = 1 } = {}) {
  const f = FIGURES[name](g);
  // speed scales the drawing: 0.4 draws it in 40 % of the time
  f.parts.forEach(p => { p.delay = (p.delay || 0) * speed + delay; p.step = (p.step ?? 26) * speed; p.settle = 150 + 120 * speed; });
  const tiles = field.carve(f.parts);
  for (const [i, j] of f.stations || []) { const t = field.at(i, j); if (t) { t.hub = t.station = true; t.phase = 0; } }
  let k = 0;
  const P = field.opt.pulses;
  if (P) P.from = () => { const r = f.routes[k++ % f.routes.length]; return { path: tiles[r.part], color: r.color, ms: r.ms }; };
  return { ...f, tiles };
}

// a grid box from fractions of the field: [x0, y0, x1, y1]
export const box = (field, [x0, y0, x1, y1]) => { const c = field.cell; return { i0: Math.floor((x0 * field.W) / c), j0: Math.floor((y0 * field.H) / c), i1: Math.floor((x1 * field.W) / c), j1: Math.floor((y1 * field.H) / c) }; };

// a product's mark: its figure alone, small, beside its name (a lockup), drawn fast. The field around it stays
// faint, so the figure reads as a sign. `play(name)` draws another product's figure in the same place.
// `area` ([x0, y0, x1, y1] of the canvas) keeps the figure to part of it, so the field spreads around a small sign
export function mark(canvas, name, { cell = 11, speed = 0.42, weight = 0.26, ink = 'oklch(0.62 0.16 297 / .3)', pulses = true, area = null } = {}) {
  let current = name, fade = 0;
  const f = tfield(canvas, { cell, weight, autoGrow: false, mix: [0.7, 0.88], lit: 0, growMs: 420, ink, glow: LILAC, tone: [0.4, 1], seed: [0.5, 0.5],
    // the figure at full strength; the rest a faint ground that fades out at the edges
    mask: (x, y, t, now) => (t.shape ? 1 : 0.55 - 0.3 * Math.min(1, (now - fade) / 500)) * (t.shape ? 1 : Math.min(1, Math.min(x, 1 - x, y, 1 - y) * 5)),
    pulses: pulses ? { every: 700, max: 2, ms: 34, trail: 3, blur: 8 } : null });
  const g = () => area ? box(f, area) : ({ i0: 1, j0: 1, i1: Math.max(4, Math.floor(f.W / cell) - 2), j1: Math.max(4, Math.floor(f.H / cell) - 2) });
  const draw = (n, delay = 0) => { current = n; fade = performance.now(); return figure(f, n, g(), { speed, delay }); };
  let seen = false;
  new IntersectionObserver(([e]) => { if (e.isIntersecting && !seen) { seen = true; f.grow(); draw(current, reduced ? 0 : 60); } }, { threshold: 0.5 }).observe(canvas);
  return { field: f, play(n = current) { if (!seen) { current = n; return; } f.restore({ step: 2 }); setTimeout(() => draw(n), reduced ? 0 : 160); } };
}
