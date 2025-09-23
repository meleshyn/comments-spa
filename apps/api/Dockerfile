# ---- Base ----
FROM node:22-alpine AS base
WORKDIR /app

# Install pnpm and turbo
RUN npm install -g pnpm turbo


# ---- Pruner ----
# Prune the monorepo to only include dependencies for the "api" app
FROM base AS pruner
COPY . .
RUN turbo prune --scope=api --docker


# ---- Builder ----
# Build the "api" app and its dependencies
FROM base AS builder

# Copy the pruned lockfile and workspace config
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the pruned source code
COPY --from=pruner /app/out/full/ .

# Give execute permissions to the entrypoint script
RUN chmod +x /app/apps/api/entrypoint.sh

# Build the app
RUN pnpm turbo run build --filter=api


# ---- Runner ----
# Create the final, minimal production image
FROM node:22-slim AS runner
WORKDIR /app

# Copy production dependencies from the builder stage
COPY --from=builder /app/ .

# Create a directory for the files to be modified.
RUN mkdir /app/writable
RUN chown node:node /app/writable

USER node

WORKDIR /app/apps/api

ENTRYPOINT ["./entrypoint.sh"]

CMD ["node", "dist/main.js"]