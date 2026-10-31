// The privacy page (round 20): text to read, so the field in its head is ambient only, drawn once and still (Erik's
// attention levels: nothing here asks to be looked at but the words)
import './mnav.js?v=83a88a260e81';
import { tfield } from '../system/tfield.js?v=83a88a260e81';
await document.fonts.ready;
const c = document.querySelector('.legal-top canvas');
tfield(c, { cell: innerWidth < 761 ? 23 : 38, weight: 0.27, hubs: 4, seed: [0.85, 0.9], mix: [0.6, 0.9], ink: 'oklch(0.8 0.1 300 / .22)', glow: 'oklch(0.9 0.08 300)', lit: 0, growMs: 900,
  mask: x => Math.min(1, Math.max(0, (x - 0.45) * 2.4)), pulses: null });
