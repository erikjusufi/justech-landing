// Ignition, the JusTech entrance: the letters rise, the T takes the light first and blooms, a spark of it falls to
// the field's seed, and the network grows from where it lands. Used by the hero and by every product's opening.
// The box carries [data-ignite]; its letters are .ch, the one that lights is .T; .drop is the spark.
// Under prefers-reduced-motion everything is simply there.
import { reduced } from './tfield.js?v=5b615a97f290';
export const wait = ms => new Promise(f => setTimeout(f, reduced ? 0 : ms));
export const rel = (el, box) => { const a = el.getBoundingClientRect(), b = box.getBoundingClientRect(); return { x: a.left - b.left, y: a.top - b.top, w: a.width, h: a.height, cx: a.left - b.left + a.width / 2, cy: a.top - b.top + a.height / 2 }; };

// `sparks` > 1 (round 15): the T throws several sparks, to several sides, and the field grows from every place they
// land at once (each tile from the nearest), instead of one spark to one seed.
export async function ignite({ box, T, drop, field, rise = 620, hold = 380, settle = 1400, onLand, sparks = 1 }) {
  // a new ignition cancels one still running, so pressing Play again many times never stacks them
  const run = box._run = (box._run || 0) + 1, stale = () => box._run !== run;
  box.classList.remove('lit-0', 'ignite', 'settle', 'lit'); field.hide(); drop.getAnimations().forEach(a => a.cancel());
  await wait(120); if (stale()) return; box.classList.add('lit-0');
  await wait(rise); if (stale()) return; box.classList.add('ignite');
  await wait(hold); if (stale()) return;
  const tr = rel(T, box), s = field.seedTile, from = { x: tr.cx, y: tr.y + tr.h * 0.86 };
  if (!reduced && s && sparks > 1) { await scatter(box, drop, field, from, sparks); if (stale()) return; }
  else if (!reduced && s) {
    const far = Math.hypot(s.cx - from.x, s.cy - from.y);
    await drop.animate([{ transform: `translate(${from.x}px, ${from.y}px) scale(.6)`, opacity: 0 }, { opacity: 1, offset: 0.15 }, { transform: `translate(${s.cx}px, ${s.cy}px) scale(1)`, opacity: 1 }],
      { duration: Math.min(520, 200 + far * 0.4), easing: 'cubic-bezier(.5,0,.9,.6)', fill: 'forwards' }).finished.catch(() => {});
    if (stale()) return;
    drop.animate([{ transform: `translate(${s.cx}px, ${s.cy}px) scale(1)`, opacity: 1 }, { transform: `translate(${s.cx}px, ${s.cy}px) scale(3)`, opacity: 0 }], { duration: 400, fill: 'forwards' });
  }
  field.grow(); box.classList.add('lit'); onLand?.(field);
  await wait(settle); if (stale()) return; box.classList.add('settle'); box.classList.remove('ignite');
}

// several sparks from the T, each on a slight curve to its own side; where they land the field is seeded
const SIDES = [[-150, 0.46], [-35, 0.5], [150, 0.4], [95, 0.34], [35, 0.44], [-95, 0.3], [180, 0.5]]; // degrees (0 = right, 90 = down), share of the box
async function scatter(box, drop, field, from, n) {
  const W = field.W, H = field.H, m = field.cell * 1.5, pts = [];
  SIDES.slice(0, n).forEach(([deg, k]) => {
    const a = (deg * Math.PI) / 180, d = Math.min(W, H) * k + Math.max(W, H) * k * 0.35;
    const x = Math.min(W - m, Math.max(m, from.x + Math.cos(a) * d)), y = Math.min(H - m, Math.max(m, from.y + Math.sin(a) * d));
    pts.push([x, y]);
    const mx = (from.x + x) / 2 - (y - from.y) * 0.18, my = (from.y + y) / 2 + (x - from.x) * 0.18, el = drop.cloneNode();
    box.append(el);
    el.animate([{ transform: `translate(${from.x}px, ${from.y}px) scale(.6)`, opacity: 0 }, { transform: `translate(${mx}px, ${my}px) scale(1)`, opacity: 1, offset: 0.5 },
      { transform: `translate(${x}px, ${y}px) scale(1)`, opacity: 1 }], { duration: 560, easing: 'cubic-bezier(.3,0,.6,1)', fill: 'forwards' }).finished
      .then(() => el.animate([{ transform: `translate(${x}px, ${y}px) scale(1)`, opacity: 1 }, { transform: `translate(${x}px, ${y}px) scale(3)`, opacity: 0 }], { duration: 400, fill: 'forwards' }).finished)
      .catch(() => {}).finally(() => el.remove());
  });
  await new Promise(f => setTimeout(f, 560));
  for (const t of field.tiles) t.d = Math.min(...pts.map(([x, y]) => Math.hypot(t.cx - x, t.cy - y)));
}
