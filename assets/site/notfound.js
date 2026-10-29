// The 404 page (round 17): the hero's field, as on the contact page; the T of "This" lights and the field grows
import './mnav.js?v=d550cc9b314e'; // round 17e: the small navigation on phones
import { heroField } from './herofield.js?v=d550cc9b314e';
const $ = (s, r = document) => r.querySelector(s);
await document.fonts.ready;
const box = $('.ctop');
heroField(box, { quiet: [$('h1', box), $('.lead', box), $('.cta', box), document.querySelector('.hnav')] });
