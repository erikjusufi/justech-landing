// The small navigation for phones and narrow screens (round 17e, Erik: "a small navbar through the whole site, so the
// other pages are easy to reach"), shared by every page. Below 1020px the page's own nav keeps the mark and a Menu
// button; once that nav has scrolled away, a slim bar comes down with the mark, where you are, and the same Menu.
// Round 17f (Erik): no Talk to us beside Menu. Round 18 (Erik): the menu opens on the T field sending pulses and
// nothing else; Home first; Just App's three products grouped on a lighter panel, each with its own figure in small
// beside its name and its line, and Sign in in the panel's head, since it signs in to Just App; then Talk to us. The
// whole menu fits a small phone without scrolling. Links resolve from the page's own Home link, so this works at any
// depth (and the 404 page). The footer's field (round 18) is drawn here too, as the one module every page shares.
import { tfield, reduced } from '../system/tfield.js?v=dad1a7d7aa81';
import { mark } from '../system/figures.js?v=dad1a7d7aa81';

const nav = document.querySelector('.hnav');
if (nav) {
  const home = new URL(nav.querySelector('.brand').getAttribute('href'), location.href), at = p => new URL(p, home).href;
  const page = location.href.split(/[?#]/)[0].replace(/index\.html$/, '');
  const cur = href => href === page ? ' aria-current="page"' : '';
  const PRODUCTS = [['insight', 'Just Insight', 'What happened on your site, and why, in plain words.'],
    ['content', 'Just Content', 'Change your site yourself, in its own look, without breaking it.'],
    ['ops', 'Just Ops', 'Your site up, renewed and backed up, checked every night.']];
  const prod = PRODUCTS.find(([p]) => at(`${p}/`) === page);
  const where = prod ? prod[1] : page === at('./') ? 'JusTech' : page === at('contact/') ? 'Talk to us' : document.title.split(' · ')[0];
  const icon = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 6h14M3 10h14M3 14h14"/></svg>';
  const mark0 = nav.querySelector('.brand svg')?.outerHTML.replace('#mark-on-violet', '#mark') || '';

  // the Menu button in the page's own nav
  const open = document.createElement('button');
  open.className = 'mbtn'; open.type = 'button'; open.setAttribute('aria-controls', 'menu'); open.setAttribute('aria-expanded', 'false');
  open.innerHTML = `${icon}<span class="sr">Menu</span>`;
  nav.append(open);

  // the bar that comes down once the page's nav is gone
  const bar = document.createElement('div');
  bar.className = 'mbar'; bar.setAttribute('aria-hidden', 'true');
  bar.innerHTML = `<a class="brand" href="${at('./')}" tabindex="-1">${mark0}<span>JusTech</span></a><span class="where">${page === at('./') ? '' : where}</span>
    <button class="mbtn" type="button" aria-controls="menu" aria-expanded="false" tabindex="-1">${icon}<span class="sr">Menu</span></button>`;

  // the menu
  const menu = document.createElement('nav');
  menu.className = 'msheet'; menu.id = 'menu'; menu.setAttribute('aria-label', 'Menu'); menu.hidden = true;
  const go = '<svg viewBox="0 0 16 16"><path d="M7 3H12.5v10H7M2.5 8h7M7 5.5 9.5 8 7 10.5"/></svg>';
  menu.innerHTML = `<div class="mhead"><canvas aria-hidden="true"></canvas>
      <button class="mclose" type="button"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15"/></svg><span class="sr">Close the menu</span></button></div>
    <a class="mi" href="${at('./')}"${cur(at('./'))}>Home</a>
    <div class="mapp" role="group" aria-labelledby="mapp-k"><p class="mapph"><span id="mapp-k">Just App</span><a class="msign" href="https://app.justech.uk">Sign in ${go}</a></p>
      ${PRODUCTS.map(([p, n, l]) => `<a class="mp" href="${at(`${p}/`)}"${cur(at(`${p}/`))}><canvas data-prod="${p}" aria-hidden="true"></canvas><span><b>${n}</b>${l}</span></a>`).join('')}</div>
    <a class="mi" href="${at('contact/')}"${cur(at('contact/'))}>Talk to us</a>`;
  const shade = document.createElement('div'); shade.className = 'mshade'; shade.hidden = true;
  document.body.append(bar, shade, menu);

  // the T visuals, made the first time the menu opens (their canvases have a size only then); they draw only while shown
  let viz = null;
  const visual = () => {
    if (viz) return; const c = menu.querySelector('.mhead canvas');
    viz = tfield(c, { cell: 14, weight: 0.27, hubs: 3, seed: [0.4, 0.5], mix: [0.66, 0.84], ink: 'oklch(0.64 0.17 298 / .5)', glow: 'oklch(0.85 0.12 300)', lit: 0.01, growMs: 600,
      mask: x => Math.min(1, Math.max(0, (0.86 - x) * 4)), pulses: reduced ? null : { every: 520, max: 4, len: [6, 14], ms: 60, trail: 2.6 } });
    menu.querySelectorAll('.mp canvas').forEach(el => mark(el, el.dataset.prod, { cell: 4, speed: 0.6 }));
  };

  const buttons = [open, bar.querySelector('.mbtn')];
  let last = null;
  const set = on => {
    menu.hidden = shade.hidden = !on; document.documentElement.classList.toggle('menu-open', on);
    buttons.forEach(b => b.setAttribute('aria-expanded', String(on)));
    if (on) { last = document.activeElement; visual(); menu.querySelector('a').focus(); } else last?.focus?.();
  };
  buttons.forEach(b => b.addEventListener('click', () => set(menu.hidden)));
  menu.querySelector('.mclose').addEventListener('click', () => set(false));
  shade.addEventListener('click', () => set(false));
  menu.addEventListener('click', e => { if (e.target.closest('a')) set(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) set(false); });

  // the bar shows while the page's nav is off screen
  new IntersectionObserver(([e]) => {
    const show = !e.isIntersecting;
    bar.classList.toggle('on', show); bar.setAttribute('aria-hidden', String(!show));
    bar.querySelectorAll('a, button').forEach(el => el.tabIndex = show ? 0 : -1);
  }).observe(nav);
}

// the footer's field: faint, still until it is seen, then pulses running (none under reduced motion)
const foot = document.querySelector('.foot canvas');
if (foot) new IntersectionObserver(([e], io) => { if (!e.isIntersecting) return; io.disconnect();
  tfield(foot, { cell: innerWidth < 761 ? 20 : 24, weight: 0.24, hubs: 3, seed: [0.8, 0.3], mix: [0.7, 0.9], ink: 'oklch(0.62 0.16 297 / .26)', glow: 'oklch(0.85 0.12 300)', lit: 0, growMs: 900,
    mask: x => Math.min(1, Math.max(0, (x - 0.3) * 2.2)), pulses: reduced ? null : { every: 1400, max: 3, len: [6, 16], ms: 70, trail: 2.6 } });
}, { rootMargin: '0px 0px 120px' }).observe(foot);
