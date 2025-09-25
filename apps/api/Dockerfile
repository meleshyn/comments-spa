# ---- STAGE 1: PRUNER ----
# Creates a pruned copy of the project containing only what's necessary for the 'api'.
FROM node:22-alpine AS pruner
WORKDIR /app
RUN corepack enable

COPY . .
RUN pnpm dlx turbo prune --scope=api --docker


# ---- STAGE 2: BUILDER ----
# Builds the application and all its dependencies.
FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable

COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
RUN pnpm install --frozen-lockfile

COPY --from=pruner /app/out/full/ .
RUN pnpm turbo run build --filter=api...


# ---- STAGE 3: RUNNER ----
# Builds the final image with the minimal size
FROM node:22-alpine AS runner
WORKDIR /app

# Set the environment variable
ENV NODE_ENV=production
ENV PORT=3000
RUN corepack enable

# Copy the package.json and lock-files
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml

# Install the production dependencies
RUN pnpm install --prod --frozen-lockfile

# Copy the built code
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/packages ./packages

# TODO: Refactor this
# Copy the migrations, drizzle.config.ts and schema.ts
COPY --from=builder /app/apps/api/migrations ./apps/api/migrations
COPY --from=builder /app/apps/api/drizzle.config.ts ./apps/api/drizzle.config.ts
COPY --from=builder /app/apps/api/src/db/schema.ts ./apps/api/src/db/schema.ts

# Copy the entrypoint script
COPY --from=builder /app/apps/api/entrypoint.sh ./apps/api/entrypoint.sh
RUN chmod +x /app/apps/api/entrypoint.sh

# Create the writable directory
RUN mkdir /app/writable
RUN chown node:node /app/writable

# Set the GCS key file path
ENV GCS_KEY_FILE=/app/writable/gcs-credentials.json

# Set the user to node
USER node

EXPOSE 3000

WORKDIR /app/apps/api

ENTRYPOINT ["./entrypoint.sh"]
CMD ["node", "dist/main.js"]