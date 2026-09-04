#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$SCRIPT_DIR"
COMPOSE_FILE="$APP_DIR/deploy/docker-compose.yml"
CONTAINER_NAME="data-overview-dev"

export WEB_PORT="${WEB_PORT:-80}"
export NGINX_ENV="${NGINX_ENV:-dev}"

on_error() {
  echo "[ERROR] 部署失败，输出最近的容器日志：" >&2
  docker compose -f "$COMPOSE_FILE" logs --tail=100 dashboard 2>/dev/null || true
}
trap on_error ERR

echo "[1/5] 检查部署文件和运行环境"
command -v docker >/dev/null || { echo "未安装 Docker" >&2; exit 1; }
docker compose version >/dev/null || { echo "未安装 Docker Compose V2" >&2; exit 1; }
test -f "$APP_DIR/index.html" || { echo "缺少 $APP_DIR/index.html" >&2; exit 1; }
test -f "$APP_DIR/config/dashboard-labels.json" || { echo "缺少运行时文案配置" >&2; exit 1; }
test -f "$APP_DIR/deploy/nginx.${NGINX_ENV}.conf" || { echo "缺少 nginx.${NGINX_ENV}.conf" >&2; exit 1; }
docker compose -f "$COMPOSE_FILE" config --quiet

echo "[2/5] 拉取 Web 镜像"
docker compose -f "$COMPOSE_FILE" pull dashboard

echo "[3/5] 更新容器"
docker compose -f "$COMPOSE_FILE" up -d --force-recreate --remove-orphans dashboard

echo "[4/5] 等待健康检查"
for attempt in $(seq 1 45); do
  status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$CONTAINER_NAME" 2>/dev/null || true)"
  if [ "$status" = "healthy" ]; then
    break
  fi
  if [ "$status" = "unhealthy" ] || [ "$status" = "exited" ] || [ "$status" = "dead" ]; then
    echo "容器状态异常：$status" >&2
    exit 1
  fi
  if [ "$attempt" -eq 45 ]; then
    echo "等待容器健康检查超时，当前状态：$status" >&2
    exit 1
  fi
  sleep 2
done

echo "[5/5] 验证页面和 API 代理"
curl --fail --silent --show-error "http://127.0.0.1:${WEB_PORT}/health" >/dev/null
curl --fail --silent --show-error "http://127.0.0.1:${WEB_PORT}/" >/dev/null
curl --fail --silent --show-error "http://127.0.0.1:${WEB_PORT}/config/dashboard-labels.json" >/dev/null
curl --fail --silent --show-error "http://127.0.0.1:${WEB_PORT}/api/bi/data-source" >/dev/null

trap - ERR
echo "部署成功：端口 ${WEB_PORT}，Nginx 环境 ${NGINX_ENV}"
docker compose -f "$COMPOSE_FILE" ps
