# ==========================================
# Apna Scheduler OS - Multi-stage Dockerfile
# ==========================================

# Stage 1: Build Frontend
FROM node:22-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Stage 2: Production Server
FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

# Install server dependencies
COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev

# Copy server code
COPY server/ ./server/

# Copy built frontend assets into server public folder if serving unified
COPY --from=client-builder /app/client/dist ./server/public

WORKDIR /app/server
EXPOSE 5000

CMD ["node", "src/server.js"]
