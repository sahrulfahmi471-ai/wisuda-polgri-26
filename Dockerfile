# Production Dockerfile for Wisuda Scanner Application
FROM node:20-alpine

# Install dumb-init to handle PID 1 and process termination properly
RUN apk add --no-cache dumb-init

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Copy package descriptors first for caching
COPY package*.json ./
COPY proyek/package*.json ./proyek/

# Install dependencies
RUN npm install --omit=dev && \
    if [ -f ./proyek/package.json ]; then cd proyek && npm install --omit=dev && cd ..; fi

# Copy application source code
COPY . .

# Expose web & socket port
EXPOSE 3000

# Health check probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/api/health || exit 1

# Start container with dumb-init
USER node
CMD ["dumb-init", "node", "server.js"]
