# justech.uk on Coolify (erik-main, behind Cloudflare): the static site and its two endpoints in one small Node
# process with no dependencies (server/server.mjs). Coolify: build pack Dockerfile, port 8080; environment
# RESEND_API_KEY (a secret; until it is set, the form opens the visitor's email app), CONTACT_TO and CONTACT_FROM optional.
FROM node:22-alpine
WORKDIR /srv
COPY . /srv/site
RUN mv /srv/site/server/server.mjs /srv/server.mjs \
 && rm -rf /srv/site/server /srv/site/Dockerfile /srv/site/.dockerignore /srv/site/README.md
ENV NODE_ENV=production PORT=8080 SITE_ROOT=/srv/site
USER node
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1
CMD ["node", "/srv/server.mjs"]
