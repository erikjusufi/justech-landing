// The 404 page (round 17): the hero's field, as on the contact page; the T of "This" lights and the field grows
import './mnav.js?v=1cd391dc2ca6'; // round 17e: the small navigation on phones
import { heroField } from './herofield.js?v=1cd391dc2ca6';
const $ = (s, r = document) => r.querySelector(s);
await document.fonts.ready;
const box = $('.ctop');
heroField(box, { quiet: [$('h1', box), $('.lead', box), $('.cta', box), document.querySelector('.hnav')] });
