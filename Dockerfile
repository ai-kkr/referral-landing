# syntax=docker/dockerfile:1
FROM node:22-bookworm-slim AS build

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
ARG VITE_GOOGLE_OAUTH_CLIENT_ID=880442601175-qq11oc9mhh7m4h08tngh2bad65497rog.apps.googleusercontent.com
ARG VITE_TESTFLIGHT_URL=https://testflight.apple.com/join/RcxSZjuP
ARG VITE_KKR_API_BASE=https://kkr-travel-production.up.railway.app

ENV VITE_GOOGLE_OAUTH_CLIENT_ID=$VITE_GOOGLE_OAUTH_CLIENT_ID \
    VITE_TESTFLIGHT_URL=$VITE_TESTFLIGHT_URL \
    VITE_KKR_API_BASE=$VITE_KKR_API_BASE

RUN pnpm build

FROM caddy:2.9-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv/www
EXPOSE 80
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
