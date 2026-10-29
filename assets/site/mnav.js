// The small navigation for phones and narrow screens (round 17e, Erik: "a small navbar through the whole site, so the
// other pages are easy to reach"), shared by every page. Below 1020px the page's own nav keeps the mark, Talk to us
// and a Menu button. Once that nav has scrolled away, a slim bar comes down with the same Menu, and the menu holds every
// page: Home, the three products of Just App with their lines, Talk to us and Sign in. Links are resolved from the
// page's own Home link, so this works at any depth (and on the 404 page).
const nav = document.querySelector('.hnav');
if (nav) {
  const home = new URL(nav.querySelector('.brand').getAttribute('href'), location.href), at = p => new URL(p, home).href;
  const here = location.pathname.replace(/index\.html$/, '');
  const cur = href => new URL(href).pathname === here ? ' aria-current="page"' : '';
  const PRODUCTS = [['insight/', 'Just Insight', 'What happened on your site, and why, in plain words.'],
    ['content/', 'Just Content', 'Change your site yourself, in its own look, without breaking it.'],
    ['ops/', 'Just Ops', 'Your site up, renewed and backed up, checked every night.']];
  const icon = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 6h14M3 10h14M3 14h14"/></svg>';
  const mark = nav.querySelector('.brand svg')?.outerHTML.replace('#mark-on-violet', '#mark') || '';
  const title = { [at('./')]: 'Home', [at('contact/')]: 'Talk to us', ...Object.fromEntries(PRODUCTS.map(([p, n]) => [at(p), n])) }[location.href.split('#')[0].replace(/index\.html$/, '')] || '';

  // the Menu button in the page's own nav
  const open = document.createElement('button');
  open.className = 'mbtn'; open.type = 'button'; open.setAttribute('aria-controls', 'menu'); open.setAttribute('aria-expanded', 'false');
  open.innerHTML = `${icon}<span class="sr">Menu</span>`;
  nav.append(open);

  // the bar that comes down once the page's nav is gone
  const bar = document.createElement('div');
  bar.className = 'mbar'; bar.setAttribute('aria-hidden', 'true');
  bar.innerHTML = `<a class="brand" href="${at('./')}" tabindex="-1">${mark}<span>JusTech</span></a><span class="where">${title}</span>
    <a class="btn b-light" href="${at('contact/')}" tabindex="-1">Talk to us</a>
    <button class="mbtn" type="button" aria-controls="menu" aria-expanded="false" tabindex="-1">${icon}<span class="sr">Menu</span></button>`;

  // the menu: every page
  const menu = document.createElement('nav');
  menu.className = 'msheet'; menu.id = 'menu'; menu.setAttribute('aria-label', 'Menu'); menu.hidden = true;
  menu.innerHTML = `<a class="mi" href="${at('./')}"${cur(at('./'))}>Home</a>
    <p class="mk">Just App</p>
    ${PRODUCTS.map(([p, n, l]) => `<a class="mi mp" href="${at(p)}"${cur(at(p))}><b>${n}</b><span>${l}</span></a>`).join('')}
    <div class="ma"><a class="btn b-light" href="${at('contact/')}">Talk to us</a><a class="btn b-glass" href="https://app.justech.uk">Sign in to Just App</a></div>`;
  const shade = document.createElement('div'); shade.className = 'mshade'; shade.hidden = true;
  document.body.append(bar, shade, menu);

  const buttons = [open, bar.querySelector('.mbtn')];
  let last = null;
  const set = on => {
    menu.hidden = shade.hidden = !on; document.documentElement.classList.toggle('menu-open', on);
    buttons.forEach(b => b.setAttribute('aria-expanded', String(on)));
    if (on) { last = document.activeElement; menu.querySelector('a').focus(); } else last?.focus?.();
  };
  buttons.forEach(b => b.addEventListener('click', () => set(menu.hidden)));
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
