// The site's navigation, shared by every page. Round 19 (Erik): the page's own nav follows the scroll at every width
// instead of a second bar coming down on phones: over the hero it is the hero's nav; once the page moves it becomes a
// glass bar in the page's frame (on wide screens with the part you are in and a line for how far down you are). Below
// 1020px it keeps the mark and Menu (top right). The menu opens on where you are (the page, and on the landing the
// part) over the T field sending pulses; then Home; JusT App's three products on one lighter panel, each with its
// figure in small, its name and its line, Sign in in the panel's head; then Contact. It fits a small phone without
// scrolling. Links resolve from the page's own Home link, so this works at any depth (and the 404 page). The footer's
// field is drawn here too, as the one module every page shares.
import { tfield, reduced } from '../system/tfield.js?v=5eb8acd169a7';
import { mark } from '../system/figures.js?v=5eb8acd169a7';

const nav = document.querySelector('.hnav');
if (nav) {
  const home = new URL(nav.querySelector('.brand').getAttribute('href'), location.href), at = p => new URL(p, home).href;
  const page = location.href.split(/[?#]/)[0].replace(/index\.html$/, '');
  const cur = href => href === page ? ' aria-current="page"' : '';
  const PRODUCTS = [['insight', 'JusT Insight', 'What happened on your site, and why, in plain words.'],
    ['content', 'JusT Content', 'Change your site yourself, in its own look, without breaking it.'],
    ['ops', 'JusT Ops', 'Your site up, renewed and backed up, checked every night.']];
  const jt = s => s.replace(/^JusT /, 'Jus<span class="t">T</span> '); // the T in the accent colour, wherever the name stands
  const prod = PRODUCTS.find(([p]) => at(`${p}/`) === page);
  const landing = page === at('./');
  const where = prod ? prod[1] : landing ? 'Home' : page === at('contact/') ? 'Talk to us' : document.title.split(' · ')[0];
  const icon = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 6h14M3 10h14M3 14h14"/></svg>';
  const mark0 = nav.querySelector('.brand svg')?.outerHTML.replace('#mark-on-violet', '#mark') || '';

  // the Menu button in the page's own nav
  const open = document.createElement('button');
  open.className = 'mbtn'; open.type = 'button'; open.setAttribute('aria-controls', 'menu'); open.setAttribute('aria-expanded', 'false');
  open.innerHTML = `${icon}<span class="sr">Menu</span>`;
  nav.append(open);

  // the menu
  const menu = document.createElement('nav');
  menu.className = 'msheet'; menu.id = 'menu'; menu.setAttribute('aria-label', 'Menu'); menu.hidden = true;
  const HOME = '<svg viewBox="0 0 20 20"><path d="M3.5 9 10 3.5 16.5 9v7.5h-4.5v-5h-4v5H3.5z"/></svg>';
  const TALK = '<svg viewBox="0 0 20 20"><path d="M3.5 4.5h13v9h-7l-4 3v-3h-2z"/></svg>';
  const go = '<svg viewBox="0 0 16 16"><path d="M7 3H12.5v10H7M2.5 8h7M7 5.5 9.5 8 7 10.5"/></svg>';
  menu.innerHTML = `<div class="mhead"><canvas aria-hidden="true"></canvas><p class="mname"><span translate="no">${prod ? jt('JusT App') : 'JusTech'}</span><b>${jt(where)}</b></p>
      <button class="mclose" type="button"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15"/></svg><span class="sr">Close the menu</span></button></div>
    <a class="mi" href="${at('./')}"${cur(at('./'))}><i aria-hidden="true">${HOME}</i>Home</a>
    <div class="mapp" role="group" aria-labelledby="mapp-k"><p class="mapph"><span id="mapp-k" translate="no">${jt('JusT App')}</span><a class="msign" href="https://app.justech.uk">Sign in ${go}</a></p>
      ${PRODUCTS.map(([p, n, l]) => `<a class="mp" href="${at(`${p}/`)}"${cur(at(`${p}/`))}><canvas data-prod="${p}" aria-hidden="true"></canvas><span><b translate="no">${jt(n)}</b>${l}</span></a>`).join('')}</div>
    <p class="mk">Contact</p>
    <a class="mi" href="${at('contact/')}"${cur(at('contact/'))}><i aria-hidden="true">${TALK}</i>Talk to us</a>`;
  const shade = document.createElement('div'); shade.className = 'mshade'; shade.hidden = true;
  document.body.append(shade, menu);

  // the T visuals, made the first time the menu opens (their canvases have a size only then); they draw only while shown
  let viz = null;
  const visual = () => {
    if (viz) return; const c = menu.querySelector('.mhead canvas');
    viz = tfield(c, { cell: 14, weight: 0.27, hubs: 3, seed: [0.4, 0.5], mix: [0.66, 0.84], ink: 'oklch(0.64 0.17 298 / .5)', glow: 'oklch(0.85 0.12 300)', lit: 0.01, growMs: 600,
      mask: x => Math.max(0, Math.min(1, (x - 0.3) * 3, (0.9 - x) * 5)), pulses: reduced ? null : { every: 520, max: 4, len: [6, 14], ms: 60, trail: 2.6 } });
    menu.querySelectorAll('.mp canvas').forEach(el => mark(el, el.dataset.prod, { cell: 4, speed: 0.6 }));
  };

  const buttons = [open];
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

  // the nav follows the page: it leaves the hero for the body (it is fixed from the first paint, so nothing moves; out
  // of the hero's stacking it stays above the parts), and turns into the glass bar once the page has moved
  document.body.prepend(nav);
  const root = document.documentElement, rail = document.querySelector('.rail');
  const part = document.createElement('span'); part.className = 'npart'; part.setAttribute('aria-hidden', 'true');
  nav.querySelector('.acts')?.before(part);
  const mname = menu.querySelector('.mname b');
  let tick = 0;
  const onScroll = () => { tick = 0; const y = scrollY, max = root.scrollHeight - innerHeight;
    root.classList.toggle('stuck', y > 8); nav.style.setProperty('--p', max > 0 ? Math.min(1, y / max).toFixed(4) : 0); };
  addEventListener('scroll', () => { if (!tick) tick = requestAnimationFrame(onScroll); }, { passive: true }); onScroll();
  // on the landing, the part you are in (the rail knows it): beside the nav's links, and in the menu's head
  let shown = null;
  if (rail) new MutationObserver(() => { const a = rail.querySelector('a[aria-current]'), name = a ? a.textContent.replace(/^\d+ · /, '') : '';
    part.textContent = name; part.classList.toggle('on', !!name); if (landing) mname.textContent = name || where;
    // a cue as a new part begins: the progress line beats once (round 20)
    if (name && name !== shown && shown !== null && !reduced) { nav.classList.remove('beat'); void nav.offsetWidth; nav.classList.add('beat'); }
    shown = name;
  }).observe(rail, { subtree: true, attributes: true, attributeFilter: ['aria-current'] });
}

// the footer's field: faint, still until it is seen, then pulses running (none under reduced motion)
const foot = document.querySelector('.foot canvas');
if (foot) new IntersectionObserver(([e], io) => { if (!e.isIntersecting) return; io.disconnect();
  tfield(foot, { cell: innerWidth < 761 ? 20 : 24, weight: 0.24, hubs: 3, seed: [0.8, 0.3], mix: [0.7, 0.9], ink: 'oklch(0.62 0.16 297 / .26)', glow: 'oklch(0.85 0.12 300)', lit: 0, growMs: 900,
    mask: x => Math.min(1, Math.max(0, (x - 0.3) * 2.2)), pulses: reduced ? null : { every: 1400, max: 3, len: [6, 16], ms: 70, trail: 2.6 } });
}, { rootMargin: '0px 0px 120px' }).observe(foot);
