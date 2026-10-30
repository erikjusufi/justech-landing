// JusTech mail: fill the shared layout (layout.html and layout.txt beside this file) and build the pieces that go in it.
// No dependencies. JustApp copies this folder (D-53) and builds its own notices with the same pieces.
import { readFileSync } from 'node:fs';

const at = name => readFileSync(new URL(name, import.meta.url), 'utf8');
const LAYOUT = { html: at('./layout.html'), text: at('./layout.txt') };
export const MARK_URL = 'https://justech.uk/assets/system/mail-mark.png';

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
// {{x}} is escaped (HTML only), {{{x}}} goes in as it is; a name the values lack is an error, never an empty hole
const fill = (t, v, html) => t.replace(/\{\{\{(\w+)\}\}\}|\{\{(\w+)\}\}/g, (_, raw, e) => {
  const k = raw || e; if (!(k in v)) throw new Error(`mail: no value for ${k}`); return raw || !html ? String(v[k]) : esc(v[k]); });

const FONT = "-apple-system,'Segoe UI',Helvetica,Arial,sans-serif";
// the pieces, each as { html, text }
export const rows = list => ({
  html: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 22px;border-collapse:collapse;">${list.map(([k, v, href]) =>
    `<tr><td style="padding:8px 14px 8px 0;border-bottom:1px solid #ebe7f2;font-family:${FONT};font-size:13px;color:#7a7289;width:96px;vertical-align:top;">${esc(k)}</td>` +
    `<td style="padding:8px 0;border-bottom:1px solid #ebe7f2;font-family:${FONT};font-size:15px;color:#17141d;">${href ? `<a href="${esc(href)}" style="color:#6231ba;text-decoration:none;">${esc(v)}</a>` : esc(v)}</td></tr>`).join('')}</table>`,
  text: list.map(([k, v]) => `${k}: ${v}`).join('\n') });
export const quote = s => ({
  html: `<div style="margin:0;padding:14px 18px;background:#f7f5fb;border-left:3px solid #d0b2ff;border-radius:0 8px 8px 0;font-family:${FONT};font-size:15px;line-height:1.55;color:#17141d;">${esc(s).replace(/\r?\n/g, '<br>')}</div>`,
  text: s });
export const para = s => ({ html: `<p style="margin:0 0 16px;font-family:${FONT};font-size:15px;line-height:1.55;color:#17141d;">${esc(s)}</p>`, text: s });

// a whole mail: { subject, html, text } for Resend
export function compose({ subject, kicker, title, preheader = '', parts, footer }) {
  const content = { html: parts.map(p => p.html).join('\n      '), text: parts.map(p => p.text).join('\n\n') };
  const v = { kicker, title, preheader, footer, mark_url: MARK_URL };
  return { subject, html: fill(LAYOUT.html, { ...v, content: content.html }, true), text: fill(LAYOUT.text, { ...v, content: '\n' + content.text }, false) };
}

// the contact form's mail to our inbox (the visitor's words go to us only, never back to them)
export const contactMail = f => compose({
  subject: `${f.topic || 'Enquiry'} · ${f.name}${f.company ? ` (${f.company})` : ''}`,
  kicker: 'Talk to us · justech.uk', title: f.topic || 'Enquiry', preheader: `${f.name}: ${f.message.slice(0, 90)}`,
  parts: [rows([['Name', f.name], ...(f.company ? [['Company', f.company]] : []), ['Email', f.email, `mailto:${f.email}`]]), quote(f.message)],
  footer: `Sent from the form on justech.uk. Reply to answer ${f.name} directly.` });

// the visitor's confirmation (Erik, 30 Oct): one fixed text for everyone, never their name or their words, so a
// stranger's address typed into the form can receive nothing but this; the server limits how often it goes
export const thanksMail = () => compose({
  subject: 'We have your message · JusTech',
  kicker: 'justech.uk', title: 'Thank you for your enquiry.', preheader: 'We will answer as soon as we can, from info@justech.uk.',
  parts: [para('We have received your message and will answer as soon as we can, from info@justech.uk.'),
    para('If you did not write to us, please ignore this e-mail.')],
  footer: 'You receive this because this address was entered in the contact form on justech.uk.' });
