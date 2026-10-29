# justech.uk

The JusTech site: the landing, a page for each product (JustInsight, JustContent, JustOps), the contact form and a 404
page. Static files, no build step to serve them; made for Cloudflare Pages.

It is built from the design rounds in the justech-analytics repository: `docs/research/landing-r17-2026-10-30/build.py`
writes these files from the draft there (design system in `docs/research/landing-r8-2026-10-28/system/`). Change
the draft and rebuild, rather than editing here, so the two do not drift.

Fonts are SIL OFL and self-hosted (licences in `assets/system/fonts/`). Product screens use demo data only.

## On Cloudflare Pages

- `_headers`: security headers, and caching (fonts for a year, CSS and JS for an hour).
- `404.html`: served for any address that is not here.
- `functions/api/contact.js`: the contact form, mailed through Resend. Set in Pages → Settings → Variables and secrets:
  `RESEND_API_KEY` (a secret; required), and optionally `CONTACT_TO` (default info@justech.uk) and `CONTACT_FROM`
  (default `JusTech site <site@justech.uk>`; its domain must be verified in Resend). Until the key is set, Send opens
  the visitor's email app, as before.
- `functions/api/e.js`: JustInsight's same-origin proxy to `insight.justech.uk/ingest`. `jt.js` is the tracker,
  byte for byte. The pages carry the tracker's tag once the site's key from JustApp Admin is put in
  `insight.json` beside `build.py` and the site is rebuilt.
