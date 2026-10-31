# justech.uk on Coolify (erik-main, behind Cloudflare): the static site and its two endpoints in one small Node
# process with no dependencies (server/server.mjs). Coolify: build pack Dockerfile, port 8080 (fixed here: the server
# ignores a generic PORT); environment RESEND_API_KEY (a secret; until it is set, the form opens the visitor's email
# app), CONTACT_TO (default info@justech.uk) and CONTACT_FROM optional; TURNSTILE_SITE_KEY with the secret TURNSTILE_SECRET_KEY
# turn the form's check on; CONTACT_THANKS=on, with Turnstile live, the visitor's thank-you mail.
FROM node:22-alpine
WORKDIR /srv
# .dockerignore lets in only the built site and its server, so nothing Coolify writes into the build context (its
# docker-compose.yaml, .env) is in the image; the server then serves only the files it finds here at start
COPY . /srv/site
RUN mv /srv/site/server/server.mjs /srv/server.mjs && mv /srv/site/server/mail /srv/mail && rm -rf /srv/site/server
ENV NODE_ENV=production SITE_PORT=8080 SITE_ROOT=/srv/site
USER node
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1
CMD ["node", "/srv/server.mjs"]
