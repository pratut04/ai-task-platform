# ── Stage 1: Build ────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json tsconfig.json tsconfig.node.json vite.config.ts tailwind.config.js postcss.config.js ./
RUN npm ci
COPY src ./src
COPY public ./public
COPY index.html ./
RUN npm run build

# ── Stage 2: Production (Nginx) ───────────────────────────────────────────
FROM nginx:1.25-alpine AS production

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built frontend
COPY --from=builder /app/dist /usr/share/nginx/html

# Non-root user
RUN addgroup -g 101 -S nginx-group && \
    chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

USER nginx

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
