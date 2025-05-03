# Stage 1: Install dependencies
FROM node:20 AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
# RUN apk add --no-cache libc6-compat # Uncomment if using Alpine and facing native dependency issues
WORKDIR /app

# Copy package.json and lock file
COPY package.json package-lock.json ./
# Install dependencies using npm ci for consistency
RUN npm ci

# Stage 2: Build the application
FROM node:20 AS builder
WORKDIR /app

# Copy dependencies from the 'deps' stage
COPY --from=deps /app/node_modules ./node_modules
# Copy the rest of the application code
COPY . .

# Ensure Prisma schema is available for generation
# Prisma generate might need DB access if schema relies on enums from DB,
# but usually doesn't require connection string for client generation itself.
# If needed, pass via --build-arg and ARG in Dockerfile securely.
# For now, assume generate works without it.
COPY prisma ./prisma
RUN npx prisma generate

# Build the Next.js application (uses the script from package.json)
# Ensure build doesn't require runtime env vars not available here.
# NEXTAUTH_URL is often needed at build time if absolute URLs are generated.
# Pass it as a build argument if necessary:
# ARG NEXTAUTH_URL
# ENV NEXTAUTH_URL=$NEXTAUTH_URL
RUN npm run build
# If NEXTAUTH_URL was passed: RUN NEXTAUTH_URL=$NEXTAUTH_URL npm run build

# Stage 3: Production image
FROM node:20-alpine AS runner
# Use Alpine for smaller final image
WORKDIR /app

# Install required OpenSSL library
RUN apk add --no-cache openssl

ENV NODE_ENV production
# Uncomment the following line in case you want to disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED 1

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application artifacts from the 'builder' stage
# Copy the standalone server output
COPY --from=builder /app/.next/standalone ./
# Copy static assets
COPY --from=builder /app/.next/static ./.next/static
# Copy public assets
COPY --from=builder /app/public ./public

# Set the correct ownership for the copied files
# (chown might not be available on minimal alpine, adjust if needed)
# RUN chown -R nextjs:nodejs /app/.next
USER nextjs

EXPOSE 3000

ENV PORT 3000
# Set HOSTNAME required by Next.js standalone mode to listen on all interfaces
ENV HOSTNAME "0.0.0.0"

# Run the Node server (entrypoint for standalone output)
CMD ["node", "server.js"]