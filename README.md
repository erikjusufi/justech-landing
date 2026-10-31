# justech.uk

The JusTech site: the landing, a page for each product (JustInsight, JustContent, JustOps), the contact form and a 404
page. Static files, no build step to serve them; served by a small Node server in a container (below).

It is built from the design rounds in the justech-analytics repository: `docs/research/landing-r17-2026-10-30/build.py`
writes these files from the draft there (design system in `docs/research/landing-r8-2026-10-28/system/`). Change
the draft and rebuild, rather than editing here, so the two do not drift.

Fonts are SIL OFL and self-hosted (licences in `assets/system/fonts/`). Product screens use demo data only.

## How it runs (Coolify on erik-main, behind Cloudflare)

`Dockerfile`: one small Node process with no dependencies (`server/server.mjs`) serves the static files with their
security headers and caching (fonts for a year, CSS and JS for an hour), `404.html` for any address that is not here,
and:

- `POST /api/contact`: the contact form, mailed through Resend from the `notify.justech.uk` domain (EU, eu-west-1),
  Reply-To the visitor, to info@justech.uk. Environment: `RESEND_API_KEY` (a secret; required); `CONTACT_TO`
  (default info@justech.uk) and `CONTACT_FROM` (default `JusTech <hello@notify.justech.uk>`) optional. Until the key
  is set it answers 503 and the form opens the visitor's email app instead.
- `POST /api/e`: JustInsight's same-origin proxy to `insight.justech.uk/ingest`, with `X-JT-IP` and `X-JT-Country`
  from Cloudflare's `CF-Connecting-IP` and `CF-IPCountry`. `jt.js` is the tracker, byte for byte. The pages carry its
  tag once the site's key from JustApp Admin is put in `insight.json` beside `build.py` and the site is rebuilt.
- `GET /healthz`: the container's health check.

Only the built site enters the image: `.dockerignore` leaves everything out and lets in the site's own entries (a new
page directory is added there), and the server serves only the files of a known type it finds under the site at start.
Coolify's own `docker-compose.yaml` and `.env` in the build context therefore stay out (30 Oct: the compose file
answered 200); CI builds the image with such files present and fails if any is inside or served.

Coolify: build pack **Dockerfile**, port **8080**. The port is fixed by the image (`SITE_PORT`, default 8080); a
generic `PORT` variable is ignored.

Run it locally: `SITE_ROOT=$PWD node server/server.mjs`. Check a running server: `sh server/check.sh <base URL>`
(CI runs it on the image for every PR and on main: `.github/workflows/image.yml`). Changes reach main by PR with that
job green.
