FROM node:20.11-bookworm

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates gosu \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable \
  && corepack prepare yarn@4.8.1 --activate \
  && mkdir -p /workspace/ozone/node_modules /workspace/ozone/.next \
  && chown -R node:node /workspace

WORKDIR /workspace/ozone
