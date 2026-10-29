// The products showcase: three tabs, one moment each. Plays when it comes into view, advances on its own every
// 8 s until a visitor chooses a tab, and never moves under prefers-reduced-motion. Arrow keys move between tabs.
import { mount, play } from './screens.js?v=4d634567e024';
export function showcase(root, { onChange } = {}) {
  const tabs = [...root.querySelectorAll('[role=tab]')], lines = [...root.querySelectorAll('[data-line]')];
  const stage = mount(root.querySelector('[data-stage]'));
  const fit = () => stage.style.setProperty('--z', Math.min(1, stage.parentElement.clientWidth / 1040).toFixed(4));
  fit(); new ResizeObserver(fit).observe(stage.parentElement);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let i = 0, auto = !reduced, timer, seen = false;
  const go = (n, focus) => {
    i = (n + tabs.length) % tabs.length;
    tabs.forEach((t, k) => { t.setAttribute('aria-selected', k === i); t.tabIndex = k === i ? 0 : -1; t.style.removeProperty('--run'); });
    lines.forEach((l, k) => l.hidden = k !== i);
    if (focus) tabs[i].focus();
    play(stage, tabs[i].dataset.tab); onChange?.(tabs[i].dataset.tab, i);
    clearTimeout(timer);
    if (auto) { void tabs[i].offsetWidth; tabs[i].style.setProperty('--run', 'running'); timer = setTimeout(() => go(i + 1), 8000); }
  };
  tabs.forEach((t, k) => {
    t.addEventListener('click', () => { auto = false; go(k); });
    t.addEventListener('keydown', e => { const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key]; if (d) { auto = false; e.preventDefault(); go(i + d, true); } });
  });
  tabs.forEach((t, k) => { t.setAttribute('aria-selected', k === 0); t.tabIndex = k === 0 ? 0 : -1; });
  lines.forEach((l, k) => l.hidden = k !== 0);
  stage.querySelector('.moment').classList.add('active');
  new IntersectionObserver(([e], o) => { if (e.isIntersecting && !seen) { seen = true; o.disconnect(); go(0); } }, { threshold: 0.35 }).observe(stage);
  return { go, stage };
}
