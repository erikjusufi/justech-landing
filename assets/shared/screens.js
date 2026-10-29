// The three product moments for the landing's showcase, built as DOM and SVG from demo data (the invented Adriatic
// Kayak Tours on demo.justech.uk; never a client's numbers). One idea per screen:
//   Insight: the plain-words sentence, and its "why" tied by a line to the event on the chart.
//   Content: an edit made inside the site's own look; what the site's style does not allow is locked, not broken.
//   Ops:     tonight's 03:00 checks, ticking through.
// Each direction styles them through the CSS custom properties in screens.css; play(name) runs a moment's motion.

const NS = 'http://www.w3.org/2000/svg';
const h = (tag, attrs = {}, ...kids) => {
  const e = tag.startsWith('svg:') ? document.createElementNS(NS, tag.slice(4)) : document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') e.setAttribute('class', v); else if (k === 'text') e.textContent = v; else if (k === 'html') e.innerHTML = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v);
  }
  for (const c of kids.flat()) if (c != null) e.append(c.nodeType ? c : document.createTextNode(c));
  return e;
};
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// 90 days, 28 Jul – 25 Oct 2026: the season peaks on 15 Aug and eases; the comparison period sits a little lower.
function series() {
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const cur = [], prev = [];
  for (let i = 0; i < 90; i++) {
    const season = 70 + 230 * Math.exp(-Math.pow((i - 18) / 22, 2)) + (i < 18 ? -40 * (1 - i / 18) : 0);
    const week = [1, 1.05, 1.08, 1.04, 0.98, 0.86, 0.9][i % 7];
    cur.push(Math.max(30, season * week + (rnd() - 0.5) * 34));
    prev.push(Math.max(25, (season * 0.84 + 6) * week + (rnd() - 0.5) * 30));
  }
  return { cur, prev };
}
const DAY = i => { const d = new Date(Date.UTC(2026, 6, 28 + i)); return `${d.getUTCDate()} ${d.toLocaleString('en-GB', { month: 'short', timeZone: 'UTC' })}`; };

const icon = {
  info: () => h('svg:svg', { viewBox: '0 0 16 16', class: 'ic' }, h('svg:circle', { cx: 8, cy: 8, r: 6.25 }), h('svg:path', { d: 'M8 7.2v3.6M8 5.2v.01' })),
  lock: () => h('svg:svg', { viewBox: '0 0 16 16', class: 'ic' }, h('svg:rect', { x: 3.5, y: 7, width: 9, height: 6.5, rx: 1.5 }), h('svg:path', { d: 'M5.5 7V5.2a2.5 2.5 0 0 1 5 0V7' })),
  check: () => h('svg:svg', { viewBox: '0 0 16 16', class: 'ic' }, h('svg:path', { d: 'M3.5 8.4l2.8 2.8 6.2-6.4' })),
  moon: () => h('svg:svg', { viewBox: '0 0 16 16', class: 'ic' }, h('svg:path', { d: 'M12.8 9.6A5.2 5.2 0 0 1 6.4 3.2a5.2 5.2 0 1 0 6.4 6.4z' })),
  cursor: () => h('svg:svg', { viewBox: '0 0 20 20', class: 'ptr' }, h('svg:path', { d: 'M4 2.5l11.5 7.2-5 1.2 3 5.6-2.3 1.2-3-5.6-4.2 3.2z' })),
};

function insight() {
  const { cur, prev } = series();
  const W = 760, H = 250, max = 340;
  const x = i => (i / 89) * W, y = v => H - (v / max) * H;
  const line = a => a.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');
  const ev = 6; // 3 Aug: the booking form moved onto the tour pages
  const svg = h('svg:svg', { viewBox: `0 -6 ${W} ${H + 34}`, class: 'chart', 'aria-hidden': 'true', preserveAspectRatio: 'none' },
    ...[0, 150, 300].map(v => h('svg:line', { x1: 0, x2: W, y1: y(v), y2: y(v), class: 'grid' })),
    h('svg:path', { d: `${line(cur)}L${W},${H}L0,${H}Z`, class: 'area' }),
    h('svg:path', { d: line(prev), class: 'comp' }),
    h('svg:path', { d: line(cur), class: 'line', pathLength: 1 }),
    h('svg:circle', { cx: x(ev), cy: H, r: 5, class: 'event' }),
    h('svg:circle', { cx: x(37), cy: H, r: 4, class: 'event hollow' }),
    h('svg:circle', { cx: x(61), cy: H, r: 4, class: 'event hollow' }),
    ...[0, 15, 30, 45, 60, 75].map(i => h('svg:text', { x: x(i), y: H + 22, class: 'axis' }, DAY(i))));
  const kpiSpark = cur.filter((_, i) => i % 3 === 0);
  const sx = i => (i / (kpiSpark.length - 1)) * 200, sy = v => 40 - (v / max) * 40;
  return h('div', { class: 'moment m-insight', 'data-moment': 'insight' },
    h('div', { class: 'layer panel chart-panel' },
      h('div', { class: 'p-head' }, h('span', { class: 'p-title', text: 'Visits per day' }),
        h('span', { class: 'legend' }, h('i', { class: 'k-line' }), 'this period', h('i', { class: 'k-comp' }), 'the 90 days before')),
      svg,
      h('div', { class: 'tip', style: `--fx:${(x(ev) / W).toFixed(4)}` }, h('b', { text: '3 Aug · counts from here' }), 'Booking form moved onto the tour pages')),
    h('div', { class: 'layer panel sentence' },
      h('div', { class: 'crumb', text: 'Insight · demo.justech.uk · Overview' }),
      h('p', { class: 'say' }, 'August carried the season: visits peaked on 15 Aug and have eased since. Contacts rose more than visits, ',
        h('mark', { class: 'why', text: 'since the booking form moved onto the tour pages.' })),
      h('div', { class: 'basis', text: '28 Jul – 25 Oct 2026 · compared with the 90 days before' })),
    h('div', { class: 'layer panel kpi' },
      h('div', { class: 'k-label' }, 'Contacts', icon.info()),
      h('div', { class: 'k-fig', 'data-count': '214', text: '214' }),
      h('div', { class: 'k-chg' }, '▲ 24 % ', h('span', { text: 'vs the 90 days before' })),
      h('svg:svg', { viewBox: '0 0 200 42', class: 'spark', 'aria-hidden': 'true', preserveAspectRatio: 'none' },
        h('svg:path', { d: kpiSpark.map((v, i) => `${i ? 'L' : 'M'}${sx(i).toFixed(1)},${sy(v * 0.92).toFixed(1)}`).join(''), class: 'comp' }),
        h('svg:path', { d: kpiSpark.map((v, i) => `${i ? 'L' : 'M'}${sx(i).toFixed(1)},${sy(v).toFixed(1)}`).join(''), class: 'line', pathLength: 1 }))),
    h('svg:svg', { class: 'link', viewBox: '0 0 1040 600', 'aria-hidden': 'true', preserveAspectRatio: 'none' },
      h('svg:path', { d: 'M300,196 C300,300 250,330 252,522', class: 'tie', pathLength: 1 })));
}

function content() {
  return h('div', { class: 'moment m-content', 'data-moment': 'content' },
    h('div', { class: 'layer site' },
      h('div', { class: 'site-bar' }, h('b', { text: 'Adriatic Kayak Tours' }), h('span', { text: 'Tours' }), h('span', { text: 'Rentals' }), h('span', { text: 'About' }), h('span', { class: 'site-cta', text: 'Book' })),
      h('div', { class: 'site-hero' },
        h('div', { class: 'sea', 'aria-hidden': 'true' }, h('i'), h('i'), h('i')),
        h('div', { class: 'site-copy' },
          h('div', { class: 'site-kicker', text: 'Half day · from Pula' }),
          h('div', { class: 'site-h edit-target' }, h('span', { class: 'typed', text: 'Sea caves at dawn' }), h('i', { class: 'caret' })),
          h('div', { class: 'site-p', text: 'Three hours along the cliffs, into two caves you can only reach from the water.' }),
          h('div', { class: 'site-price' }, 'From ', h('b', { class: 'price', text: '€65' }))))),
    h('div', { class: 'layer toolbar' },
      h('span', { class: 'tb-label', text: 'Site style' }),
      h('span', { class: 'chip on', text: 'Heading' }), h('span', { class: 'chip', text: 'Lead' }), h('span', { class: 'chip', text: 'Price' }),
      h('span', { class: 'sep' }), h('span', { class: 'chip locked' }, icon.lock(), 'Colour')),
    h('div', { class: 'layer panel refuse' }, icon.lock(), h('span', {}, h('b', { text: 'Colours come from your site.' }), ' The style keeps every page in its own look.')),
    h('div', { class: 'layer panel draft' },
      h('div', { class: 'd-head' }, h('span', { class: 'dot warn' }), h('b', { text: 'Draft' }), h('span', { class: 'muted', text: 'Tours › Sea caves' })),
      h('div', { class: 'd-row r1' }, h('span', { class: 'muted', text: 'Title' }), h('span', {}, h('s', { text: 'at dawn' }), ' at sunrise')),
      h('div', { class: 'd-row r2' }, h('span', { class: 'muted', text: 'Price' }), h('span', {}, h('s', { text: '€65' }), ' €70')),
      h('div', { class: 'd-act' }, h('span', { class: 'btn', text: 'Preview' }), h('span', { class: 'btn primary', text: 'Publish' }))),
    h('div', { class: 'layer pointer', 'aria-hidden': 'true' }, icon.cursor()));
}

function ops() {
  const nights = Array.from({ length: 30 }, (_, i) => i === 11 ? 'warn' : 'ok');
  const rows = [
    ['ok', 'Site up', '99.97 % over 30 days'],
    ['ok', 'Certificate', 'renewed 2 Oct · valid 61 days'],
    ['ok', 'Backup', '3 h old · restore tested Sunday'],
    ['ok', 'Domain', 'renews in 212 days'],
    ['warn', 'Updates', '2 waiting · applied Tue 03:00'],
  ];
  return h('div', { class: 'moment m-ops', 'data-moment': 'ops' },
    h('div', { class: 'layer panel nights' },
      h('div', { class: 'p-head' }, h('span', { class: 'p-title', text: 'Every night at 03:00' }), h('span', { class: 'muted mono', text: 'demo.justech.uk · last 30 nights' })),
      h('div', { class: 'strip' }, ...nights.map((s, i) => h('i', { class: `n ${s}`, style: `--i:${i}`, title: s === 'warn' ? '8 Oct: backup storage slow, finished 03:41' : '' }))),
      h('div', { class: 'strip-axis mono' }, h('span', { text: '27 Sep' }), h('span', { text: 'tonight' }))),
    h('div', { class: 'layer panel tonight' },
      h('div', { class: 'p-head' }, icon.moon(), h('span', { class: 'p-title', text: 'Tonight' }), h('span', { class: 'muted mono run', text: '03:00:12' })),
      ...rows.map(([s, k, v], i) => h('div', { class: 'o-row', style: `--i:${i}` },
        h('span', { class: `st ${s}` }, h('i', { class: 'dot' }), h('span', { class: 'spin' })),
        h('b', { text: k }), h('span', { class: 'muted', text: v }),
        h('span', { class: `word ${s}`, text: s === 'ok' ? 'ok' : 'waiting' })))),
    h('div', { class: 'layer panel quiet' }, h('span', { class: 'dot ok' }), 'All checks passed. Nothing needs you this morning.'));
}

export function mount(root) {
  const stage = h('div', { class: 'stage' }, insight(), content(), ops());
  root.append(stage);
  return stage;
}

function tie(m) {
  const stage = m.closest('.stage'), path = m.querySelector('.tie'), svg = m.querySelector('.link');
  if (!path || !svg.getClientRects().length) return;
  const s = stage.getBoundingClientRect(), z = s.width / stage.offsetWidth || 1;
  const r = [...m.querySelector('.why').getClientRects()].pop(), e = m.querySelector('.event').getBoundingClientRect();
  const ax = (r.right - 14 - s.left) / z, ay = (r.bottom - s.top) / z + 3;
  const bx = (e.left + e.width / 2 - s.left) / z, by = (e.top - s.top) / z - 4;
  svg.setAttribute('viewBox', `0 0 ${stage.offsetWidth} ${stage.offsetHeight}`);
  path.setAttribute('d', `M${ax},${ay} C${ax},${ay + (by - ay) * 0.55} ${bx},${by - (by - ay) * 0.45} ${bx},${by}`);
}

// Each moment's motion; the CSS reads data-play and the phase classes. Reduced motion: the final frame, at once.
const timers = new WeakMap();
export function play(stage, name) {
  for (const t of timers.get(stage) || []) clearTimeout(t);
  const T = []; timers.set(stage, T);
  const at = (ms, fn) => T.push(setTimeout(fn, reduced() ? 0 : ms));
  stage.querySelectorAll('.moment').forEach(m => { m.classList.toggle('active', m.dataset.moment === name); m.removeAttribute('data-play'); m.className = m.className.replace(/\bp\d\b/g, '').trim(); });
  const m = stage.querySelector(`[data-moment="${name}"]`);
  void m.offsetWidth; m.dataset.play = '';
  const phase = (ms, n) => at(ms, () => m.classList.add(`p${n}`));
  if (name === 'insight') {
    tie(m);
    phase(0, 1); phase(700, 2); phase(1300, 3);
    const f = m.querySelector('.k-fig'); const to = +f.dataset.count;
    if (!reduced()) { const t0 = performance.now() + 500; const tick = now => { const k = Math.min(1, Math.max(0, (now - t0) / 650)); f.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(tick); }; f.textContent = '0'; requestAnimationFrame(tick); }
  }
  if (name === 'content') {
    const typed = m.querySelector('.typed'), price = m.querySelector('.price');
    typed.textContent = 'Sea caves at dawn'; price.textContent = '€65';
    phase(0, 1);
    if (reduced()) { typed.textContent = 'Sea caves at sunrise'; price.textContent = '€70'; phase(0, 2); phase(0, 3); phase(0, 4); return; }
    const del = 'dawn'.length, add = 'sunrise';
    for (let i = 1; i <= del; i++) at(700 + i * 70, () => typed.textContent = 'Sea caves at ' + 'dawn'.slice(0, del - i));
    for (let i = 1; i <= add.length; i++) at(1050 + i * 75, () => typed.textContent = 'Sea caves at ' + add.slice(0, i));
    phase(1650, 2);
    at(2100, () => price.textContent = '€70'); phase(2100, 3);
    phase(2900, 4);
  }
  if (name === 'ops') { phase(0, 1); phase(600, 2); phase(1500, 3); }
}
