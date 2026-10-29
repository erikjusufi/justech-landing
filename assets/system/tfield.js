// The T-field, the one engine of the JusTech look: a grid of T junctions (with a few straights and gaps for air)
// drawn on a canvas. A T is three arms from a centre, so where two neighbours' arms meet the letters join into one
// network. Everything the brand moves is a way of moving this field: growing it from a seed, turning its tiles,
// sending light along its paths (signals, the picture of AI at work), carving a shape into it (a product's figure),
// pointing every stem at one place, ordering it, showing it through type.
// Nothing runs while the canvas is off screen; under prefers-reduced-motion it is drawn complete and still.
//
// Round 8 adds: signals from many sources, each with its own colour (`pulses.from` may return a tile, or
// { tile | path, color }); hubs, tiles with a lit centre that emit and receive; `carve`, which turns tiles along
// grid paths so their arms join into a figure, and `restore`, which lets it go; `burst`; `recell`.
const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]]; // 0 up, 1 right, 2 down, 3 left
const BASE = { T: [0, 1, 3], I: [0, 2], O: [] }; // at rot 0 the T is ⊥: its stem (arm 0) points up
export const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

export function tfield(canvas, o = {}) {
  const opt = { cell: 56, weight: 0.22, seed: [0.5, 0.5], ink: '#fff', glow: '#fff', tone: [0.35, 0.9], mix: [0.66, 0.84], lit: 0.03, hubs: 0, hubOk: null,
    mask: null, growMs: 1500, rand: 11, pointer: null, pulses: null, before: null, after: null, autoGrow: true, ...o };
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, cols = 0, rows = 0, tiles = [], t0 = Infinity, raf = 0, visible = false, dpr = Math.min(2, devicePixelRatio || 1);
  let rnd; const r = () => (rnd = (rnd * 16807) % 2147483647) / 2147483647;
  const pulses = []; let lastSpawn = 0, grown = false;
  const at = (i, j) => (i >= 0 && j >= 0 && i < cols && j < rows ? tiles[j * cols + i] : null);
  const arms = (t, rot = t.rot) => BASE[t.kind].map(a => (a + ((rot % 4) + 4)) % 4);
  const lastRot = t => (t.q.length ? t.q[t.q.length - 1].to ?? t.rot : t.rot);
  const near = (cur, to) => { let d = (((to - cur) % 4) + 4) % 4; if (d === 3) d = -1; return cur + d; }; // the shortest turn

  function layout() {
    const b = canvas.getBoundingClientRect(); W = b.width; H = b.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const c = typeof opt.cell === 'function' ? opt.cell(W) : opt.cell; api.cell = c;
    cols = Math.ceil(W / c) + 1; rows = Math.ceil(H / c) + 1; rnd = opt.rand; tiles = []; pulses.length = 0;
    const sx = opt.seed[0] * W, sy = opt.seed[1] * H;
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const x = r(), kind = x < opt.mix[0] ? 'T' : x < opt.mix[1] ? 'I' : 'O', rot = Math.floor(r() * 4);
      const cx = i * c + c / 2, cy = j * c + c / 2;
      tiles.push({ i, j, cx, cy, kind, kind0: kind, rot, shown: rot, home: rot, tone: opt.tone[0] + r() * (opt.tone[1] - opt.tone[0]), lit: r() < opt.lit, d: Math.hypot(cx - sx, cy - sy), heat: 0, q: [], rnd: r() });
    }
    api.tiles = tiles; api.cols = cols; api.rows = rows; api.W = W; api.H = H;
    const s = api.tileAt(sx, sy); if (s) { s.kind = s.kind0 = 'T'; s.rot = s.shown = s.home = 2; s.seed = true; api.seedTile = s; } // a T, upright
    // hubs: a few Ts with a lit centre, spread out, that send signals and catch them
    api.hubs = [];
    for (let n = 0, tries = 0; n < opt.hubs && tries < 400; tries++) {
      const t = tiles[Math.floor(r() * tiles.length)];
      if (t.kind !== 'T' || t.seed || t.hub || t.cx > W || t.cy > H || (opt.hubOk && !opt.hubOk(t, api))) continue;
      if (api.hubs.some(h => Math.hypot(h.cx - t.cx, h.cy - t.cy) < c * 5)) continue;
      t.hub = true; t.phase = r() * 7; api.hubs.push(t); n++;
    }
    opt.onLayout?.(api);
  }

  function frame(now) {
    raf = 0; const c = api.cell, half = c / 2, bar = c * opt.weight, maxD = Math.hypot(W, H);
    const k = t0 === Infinity ? -1 : reduced ? 1e9 : now - t0; let busy = false;
    ctx.clearRect(0, 0, W, H);
    opt.before?.(ctx, now, api);
    for (const t of tiles) {
      while (t.q.length && t.q[0].at <= now) {
        const e = t.q.shift(); if (e.to !== undefined) t.rot = e.to; else t.rot += e.by;
        if (e.kind) t.kind = e.kind; if ('ink' in e) t.ink = e.ink; if (e.heat) { t.heat = Math.max(t.heat, e.heat); t.hc = e.hc; }
      }
      if (t.q.length) busy = true;
      const p = Math.min(1, Math.max(0, (k - (t.d / maxD) * opt.growMs) / 420));
      if (p < 1) busy = true; if (p <= 0) continue;
      if (t.shown !== t.rot) { t.shown += (t.rot - t.shown) * (reduced ? 1 : 0.16); if (Math.abs(t.rot - t.shown) < 0.004) t.shown = t.rot; else busy = true; }
      if (t.heat > 0.004) { t.heat *= 0.955; busy = true; } else t.heat = 0;
      if (t.kind === 'O') continue;
      const m = opt.mask ? opt.mask(t.cx / W, t.cy / H, t, now) : 1; if (m <= 0.01) continue;
      const e = 1 - Math.pow(1 - p, 3), L = half * e + 0.5;
      ctx.save(); ctx.translate(t.cx, t.cy); ctx.rotate((t.shown * Math.PI) / 2);
      // one path per tile, filled once: the arms are a union, never darker where they cross
      ctx.beginPath();
      for (const a of BASE[t.kind]) { const [dx, dy] = DIRS[a];
        if (dx) ctx.rect(dx > 0 ? -bar / 2 : -L, -bar / 2, L + bar / 2, bar); else ctx.rect(-bar / 2, dy > 0 ? -bar / 2 : -L, bar, L + bar / 2); }
      const hot = t.lit || t.seed;
      ctx.globalAlpha = m * (hot || t.ink ? 1 : t.tone); ctx.fillStyle = hot ? opt.glow : t.ink || opt.ink; ctx.fill();
      if (t.heat > 0.01 && !hot) { ctx.globalAlpha = m * Math.min(1, t.heat); ctx.fillStyle = t.hc || opt.glow; ctx.fill(); }
      if (t.hub && p >= 1) { // the lit centre, breathing, brighter when a signal leaves or arrives
        const b = 0.45 + 0.25 * Math.sin(now / 900 + t.phase), s = bar * (1.5 + 0.6 * t.heat);
        ctx.globalAlpha = m * Math.min(1, b + t.heat); ctx.fillStyle = '#fff'; ctx.shadowColor = opt.glow; ctx.shadowBlur = 8 + 14 * t.heat; ctx.fillRect(-s / 2, -s / 2, s, s); busy = true;
      }
      ctx.restore();
    }
    if (!grown && k >= 0) { if (k > opt.growMs + 420) { grown = true; opt.onGrown?.(api); } busy = true; } // keep going until grown, so onGrown always fires
    if (opt.pulses && grown && !reduced) { busy = true; drawPulses(now, bar); }
    if (opt.after && opt.after(ctx, now, api)) busy = true;
    ctx.globalAlpha = 1;
    if (busy && visible) raf = requestAnimationFrame(frame);
  }

  // signals: light that runs along connected arms, tile centre to tile centre, warming each tile it passes
  function drawPulses(now, bar) {
    const P = opt.pulses, c = api.cell;
    if (now - lastSpawn > (P.every ?? 700) && pulses.length < (P.max ?? 4)) {
      lastSpawn = now; let f = P.from?.(api);
      if (f !== undefined && f !== null && !f.cx && !f.path && !f.tile) f = null;
      const src = f && (f.path || f.tile) ? f : { tile: f };
      const path = src.path || api.path(src.tile, src.len || P.len);
      if (path) { path.forEach(p => p.warm = 0); pulses.push({ path, t: now, color: src.color, ms: src.ms, done: src.done }); if (path[0].hub) path[0].heat = 1; }
    }
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.shadowBlur = P.blur ?? 14;
    const trail = c * (P.trail ?? 2.6);
    for (let n = pulses.length - 1; n >= 0; n--) {
      const u = pulses[n], col = u.color || P.color || opt.glow, speed = c / (u.ms ?? P.ms ?? 110), s = (now - u.t) * speed, L = (u.path.length - 1) * c;
      if (s - trail > L) { pulses.splice(n, 1); const end = u.path[u.path.length - 1]; end.heat = 1; end.hc = col; u.done?.(end); P.onArrive?.(end, api, u); continue; }
      ctx.strokeStyle = col; ctx.shadowColor = col;
      const k = Math.min(u.path.length - 1, Math.floor(s / c)); for (let m = 0; m <= k; m++) if (!u.path[m].warm) { u.path[m].warm = 1; u.path[m].heat = Math.max(u.path[m].heat, P.heat ?? 0.9); u.path[m].hc = col; }
      const seg = 6; ctx.lineWidth = bar * (P.width ?? 0.62);
      for (let q = 0; q < seg; q++) {
        const a = Math.max(0, s - trail + (trail * q) / seg), b = Math.min(L, s - trail + (trail * (q + 1)) / seg); if (b <= a) continue;
        ctx.globalAlpha = ((q + 1) / seg) ** 2; ctx.beginPath(); const pa = point(u.path, a, c), pb = point(u.path, b, c); ctx.moveTo(pa[0], pa[1]);
        for (let m = Math.ceil(a / c); m < b / c; m++) ctx.lineTo(u.path[m].cx, u.path[m].cy); ctx.lineTo(pb[0], pb[1]); ctx.stroke();
      }
      if (s <= L) { const h = point(u.path, s, c); ctx.globalAlpha = 1; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(h[0], h[1], bar * 0.42, 0, 7); ctx.fill(); }
    }
    ctx.restore();
  }
  const point = (path, s, c) => { const m = Math.min(path.length - 2, Math.floor(s / c)), f = s / c - m, a = path[m], b = path[m + 1] || a; return [a.cx + (b.cx - a.cx) * f, a.cy + (b.cy - a.cy) * f]; };

  const api = {
    tiles, cell: 0, hubs: [], at,
    kick() { if (!raf && visible) raf = requestAnimationFrame(frame); },
    grow() { t0 = performance.now(); grown = false; api.kick(); },
    show() { t0 = -1e9; grown = false; api.kick(); },
    hide() { t0 = Infinity; grown = false; pulses.length = 0; api.kick(); },
    recell(c) { opt.cell = c; const g = grown; layout(); if (g) t0 = -1e9; api.kick(); },
    tileAt(x, y) { const c = api.cell; return at(Math.floor(x / c), Math.floor(y / c)); },
    // a tile already turning twice takes no more turns, so fast clicks cannot pile them up
    turn(t, by = 1, delay = 0, heat = 0) { if (!t || t.kind === 'O' || t.seed || t.shape || t.q.length > 2) return; t.q.push({ at: performance.now() + delay, by, heat }); api.kick(); },
    set(t, to, delay = 0, heat = 0) { if (!t || t.kind === 'O') return; t.q.push({ at: performance.now() + delay, to: near(lastRot(t), to), heat }); api.kick(); },
    // every tile within reach turns a quarter, in a ring that runs outward at `speed` px per ms
    ripple(x, y, { reach = 1e9, speed = 0.9, heat = 0.8 } = {}) { for (const t of tiles) { const d = Math.hypot(t.cx - x, t.cy - y); if (d < reach) api.turn(t, 1, d / speed, heat * (1 - d / reach) ** 0.5); } },
    // point every T's stem (arm 0) at a place; straights lie along the line to it
    orient(x, y, { delay = 0, spread = 0 } = {}) { for (const t of tiles) { if (t.kind === 'O' || t.seed || t.shape) continue; const a = Math.atan2(y - t.cy, x - t.cx); const dir = (Math.round(a / (Math.PI / 2)) + 5) % 4; api.set(t, t.kind === 'I' ? dir % 2 : dir, delay + (spread ? Math.hypot(t.cx - x, t.cy - y) / spread : 0)); } },
    home(delay = 0) { for (const t of tiles) api.set(t, t.home, delay + t.rnd * 300); },
    // the network as it stands: a neighbour is joined when its arm meets ours
    joined(t) { const out = []; for (const a of arms(t)) { const n = at(t.i + DIRS[a][0], t.j + DIRS[a][1]); if (n && n.kind !== 'O' && arms(n).includes((a + 2) % 4)) out.push(n); } return out; },
    // a walk along joined arms, preferring to go straight, never revisiting; null if it dies too young
    path(from, [lo, hi] = [6, 16]) {
      for (let tries = 0; tries < 14; tries++) {
        let t = from || tiles[Math.floor(Math.random() * tiles.length)]; if (!t || t.kind === 'O') continue;
        const seen = new Set([t]), path = [t], want = lo + Math.floor(Math.random() * (hi - lo + 1)); let prev = null;
        while (path.length < want) {
          const ns = api.joined(t).filter(n => !seen.has(n) && (!opt.mask || opt.mask(n.cx / W, n.cy / H, n, 0) > 0.15)); if (!ns.length) break;
          const straight = prev && ns.find(n => n.i - t.i === t.i - prev.i && n.j - t.j === t.j - prev.j);
          const n = straight && Math.random() < 0.55 ? straight : ns[Math.floor(Math.random() * ns.length)];
          prev = t; t = n; seen.add(t); path.push(t);
        }
        if (path.length >= Math.min(lo, 4)) { path.forEach(p => p.warm = 0); return path; }
      }
      return null;
    },
    // a hard ceiling on signals in flight: clicks can never pile them up
    send(path, done, { color, ms } = {}) { if (path?.length > 1 && pulses.length < (opt.pulses?.cap ?? 18)) { path.forEach(p => p.warm = 0); pulses.push({ path, t: performance.now(), done, color, ms }); api.kick(); } },
    // several signals at once from one tile, each taking its own way out
    burst(t, n = 4, o = {}) { for (let k = 0; k < n; k++) api.send(api.path(t, o.len || [5, 12]), null, o); if (t) { t.heat = 1; t.hc = o.color; } },
    // carve a figure: `parts` are { cells, ink, straight, stem, delay, step, hc }, each `cells` a list of [i, j] grid
    // cells, every step to a neighbour. Each tile on the figure becomes the piece whose arms reach its neighbours on
    // it, across all parts (a straight where it runs straight if `straight` is 'I'; otherwise a T, its spare arm
    // pointing `stem`, a direction or a function of the tile, where there is a choice). Tiles turn in order, `step`
    // ms apart, each taking the look of the first part that claims it. Returns each part as tiles, to send signals along.
    carve(parts) {
      const need = new Map(), order = [], now = performance.now();
      parts.forEach(pt => { const p = pt.cells; for (let n = 0; n < p.length; n++) {
        const t = at(p[n][0], p[n][1]); if (!t) continue;
        if (!need.has(t)) { need.set(t, new Set()); order.push([t, pt, (pt.delay || 0) + n * (pt.step ?? 26)]); }
        for (const q of [p[n - 1], p[n + 1]]) if (q) { const a = DIRS.findIndex(d => d[0] === q[0] - p[n][0] && d[1] === q[1] - p[n][1]); if (a >= 0) need.get(t).add(a); }
      } });
      for (const [t, pt, when] of order) {
        const S = need.get(t), st = typeof pt.stem === 'function' ? pt.stem(t) : pt.stem; let kind = 'T', rot;
        if (pt.straight === 'I' && S.size === 2 && (S.has(0) === S.has(2)) && !(typeof pt.stem === 'function' && st != null)) { kind = 'I'; rot = S.has(0) ? 0 : 1; }
        else { const ok = [0, 1, 2, 3].filter(r => !S.has((r + 2) % 4)); rot = ok.includes(st) ? st : ok[0] ?? 0; }
        // each tile becomes its piece a quarter turn short, then turns into place, so the figure is seen to be
        // assembled from the field's own Ts rather than drawn over it
        const to = near(lastRot(t), rot);
        t.shape = true; t.q.push({ at: now + when, to: to - 1, kind, ink: pt.ink ?? null, heat: (pt.heat ?? 0.9) * 0.5, hc: pt.hc }, { at: now + when + (pt.settle ?? 150), to, heat: pt.heat ?? 0.9, hc: pt.hc });
      }
      api.kick();
      return parts.map(pt => pt.cells.map(c => at(c[0], c[1])).filter(Boolean));
    },
    // let a carved figure go: every tile on it goes back to what it was, from the far end inward
    restore({ step = 8 } = {}) { const now = performance.now(); let k = 0; for (const t of tiles) if (t.shape) { t.shape = false; if (t.station) t.hub = t.station = false; t.q.length = 0; t.q.push({ at: now + (k++ % 40) * step, to: near(t.rot, t.home), kind: t.kind0, ink: null }); } pulses.length = 0; api.kick(); },
    recolor(ink, glow) { opt.ink = ink; opt.glow = glow; api.kick(); },
    opt,
  };

  layout();
  if (opt.pointer && !reduced) {
    let last = null;
    addEventListener('pointermove', e => {
      const b = canvas.getBoundingClientRect(), x = e.clientX - b.left, y = e.clientY - b.top;
      if (x < 0 || y < 0 || x > W || y > H) return;
      opt.onPointer?.(x, y, api);
      if (opt.pointer === 'turn') { const t = api.tileAt(x, y); if (t && t !== last) { api.turn(t, 1, 0, 0.7); last = t; } }
    }, { passive: true });
    let lastClick = 0;
    if (opt.pointer === 'turn') canvas.parentElement.addEventListener('click', e => { if (e.target.closest('a, button') || e.timeStamp - lastClick < 280) return; lastClick = e.timeStamp; const b = canvas.getBoundingClientRect(), x = e.clientX - b.left, y = e.clientY - b.top;
      api.ripple(x, y, { reach: api.cell * 7 }); opt.onClick?.(x, y, api); });
  }
  let first = true;
  new ResizeObserver(() => { if (first) { first = false; return; } const g = grown; layout(); if (g) { t0 = -1e9; grown = false; } api.kick(); }).observe(canvas);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) { if (opt.autoGrow && !api.started) { api.started = true; api.grow(); } api.kick(); } }).observe(canvas);
  return api;
}
