FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
ARG BUILD_MODE=test
RUN npm run build:web -- --mode "$BUILD_MODE"

FROM nginx:1.27-alpine
ARG NGINX_CONFIG=nginx.test.conf
COPY deploy/ /tmp/nginx/
RUN cp "/tmp/nginx/${NGINX_CONFIG}" /etc/nginx/conf.d/default.conf \
    && rm -rf /tmp/nginx
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/health || exit 1
