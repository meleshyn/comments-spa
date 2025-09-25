# ---- STAGE 1: PRUNER ----
# Creates a pruned copy of the project containing only what's necessary for `web`.
FROM node:22-alpine AS pruner
WORKDIR /app
RUN corepack enable

COPY . .
# Using `dlx` to run turbo without global installation
RUN pnpm dlx turbo prune --scope=web --docker


# ---- STAGE 2: BUILDER ----
# Builds the front-end application and all its dependencies.
FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable

# Copy files for installing dependencies
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
RUN pnpm install --frozen-lockfile

# Copy the pruned source code
COPY --from=pruner /app/out/full/ .

# Set environment variables for build
ENV VITE_API_URL="__VITE_API_URL__"
ENV VITE_RECAPTCHA_SITE_KEY="__VITE_RECAPTCHA_SITE_KEY__"

# Build `web` and all its internal dependencies (e.g., common packages)
RUN pnpm turbo run build --filter=web...


# ---- STAGE 3: RUNNER ----
# Final, ultra-lightweight image based on Nginx for serving static files.
FROM nginx:1.27-alpine-slim AS runner

# Copy only compiled static files from `builder` to Nginx directory
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Copy the entrypoint script
COPY --from=builder /app/apps/web/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]