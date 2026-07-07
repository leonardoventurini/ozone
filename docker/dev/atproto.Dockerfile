FROM node:24-bookworm

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates git gosu jq postgresql-client redis-tools rsync \
  && rm -rf /var/lib/apt/lists/*

ENV PNPM_HOME=/home/node/.local/share/pnpm
ENV PATH="${PNPM_HOME}:${PATH}"

RUN corepack enable \
  && corepack prepare pnpm@11.5.2 --activate \
  && mkdir -p /workspace/atproto/node_modules /home/node/.local/share/pnpm \
  && chown -R node:node /workspace /home/node/.local

WORKDIR /workspace/atproto
