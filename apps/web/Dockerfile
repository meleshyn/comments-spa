# ---- Base ----
FROM node:22-alpine AS base
WORKDIR /app

# Install pnpm and turbo
RUN npm install -g pnpm turbo


# ---- Pruner ----
# Prune the monorepo to only include dependencies for the "web" app
FROM base AS pruner
COPY . .
RUN turbo prune --scope=web --docker


# ---- Builder ----
# Build the "web" app and its dependencies
FROM base AS builder

# Copy the pruned lockfile and workspace config
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the pruned source code
COPY --from=pruner /app/out/full/ .

# Environment variables
ARG VITE_API_URL
ARG VITE_RECAPTCHA_SITE_KEY
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_RECAPTCHA_SITE_KEY=${VITE_RECAPTCHA_SITE_KEY}

# Build the app
RUN pnpm turbo run build --filter=web


# ---- Runner ----
# Create the final, minimal production image
FROM node:22-slim AS runner
WORKDIR /app

# Install `serve` to run the static site
RUN npm install -g serve

# Copy built static files from the builder stage
COPY --from=builder /app/apps/web/dist /app/public

USER node

EXPOSE 3000

CMD ["serve", "-s", "public", "-l", "3000"]
