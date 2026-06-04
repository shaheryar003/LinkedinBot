# ==========================================
# 1. Build Backend
# ==========================================
FROM node:18-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npm run build

# ==========================================
# 2. Build Frontend
# ==========================================
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN mkdir -p public
ENV NEXT_PUBLIC_API_URL=""
RUN npm run build

# ==========================================
# 3. Final Production Runner Image
# ==========================================
FROM node:18-alpine AS runner
WORKDIR /app

# Install Puppeteer Chromium dependencies
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Puppeteer environment variables
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    NODE_ENV=production

# Copy backend built files and node_modules
COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules
COPY --from=backend-builder /app/backend/package*.json ./backend/

# Copy frontend standalone files and assets
COPY --from=frontend-builder /app/frontend/next.config.js ./frontend/
COPY --from=frontend-builder /app/frontend/public ./frontend/public
COPY --from=frontend-builder /app/frontend/.next/standalone ./frontend/
COPY --from=frontend-builder /app/frontend/.next/static ./frontend/.next/static

# Copy gateway.js to run both and act as proxy
COPY gateway.js ./

# Create log/screenshot directories
RUN mkdir -p backend/logs backend/screenshots

# Expose Render default port (we will run on process.env.PORT)
EXPOSE 10000

CMD ["node", "gateway.js"]
