#!/bin/sh
set -eu
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
NAME=data-overview-offline
command -v docker >/dev/null 2>&1 || { echo "Docker is required."; exit 1; }
docker info >/dev/null
[ "$(docker info --format '{{.OSType}}')" = "linux" ] || { echo "Linux Docker server required."; exit 1; }
ARCH=$(docker info --format '{{.Architecture}}')
case "$ARCH" in
  x86_64|amd64) ARCH=amd64 ;;
  aarch64|arm64) ARCH=arm64 ;;
  *) echo "Unsupported Docker architecture: $ARCH"; exit 1 ;;
esac
IMAGE="nginx:1.27-alpine"
ARCHIVE="$ROOT/images/nginx-linux-$ARCH.tar"
for FILE in "$ROOT/index.html" "$ROOT/config/dashboard-labels.json" "$ROOT/deploy/nginx.offline.conf" "$ARCHIVE" "$ARCHIVE.sha256"; do
  [ -f "$FILE" ] || { echo "Missing file: $FILE"; exit 1; }
done
if command -v sha256sum >/dev/null 2>&1; then
  (cd "$ROOT/images" && sha256sum -c "nginx-linux-$ARCH.tar.sha256")
fi
echo "[1/4] Loading bundled image (no network)..."
docker load -i "$ARCHIVE"
docker image inspect "$IMAGE" >/dev/null
echo "[2/4] Checking Nginx configuration..."
docker run --pull=never --rm --network host --entrypoint nginx -v "$ROOT/deploy/nginx.offline.conf:/etc/nginx/conf.d/default.conf:ro" "$IMAGE" -t
if docker container inspect "$NAME" >/dev/null 2>&1; then
  OWNER=$(docker inspect --format '{{index .Config.Labels "data-overview.offline"}}' "$NAME")
  [ "$OWNER" = "true" ] || { echo "Container name belongs to another deployment: $NAME"; exit 1; }
  docker rm -f "$NAME" >/dev/null
fi
echo "[3/4] Starting dashboard..."
docker run --pull=never -d --name "$NAME" --label data-overview.offline=true --restart unless-stopped --network host --entrypoint nginx -v "$ROOT:/usr/share/nginx/html:ro" -v "$ROOT/deploy/nginx.offline.conf:/etc/nginx/conf.d/default.conf:ro" "$IMAGE" -g 'daemon off;'
echo "[4/4] Checking startup..."
ATTEMPT=0
while [ "$ATTEMPT" -lt 20 ]; do
  if [ "$(docker inspect --format '{{.State.Running}}' "$NAME")" != "true" ]; then docker logs --tail 50 "$NAME"; exit 1; fi
  if docker exec "$NAME" sh -c 'PORT=$(sed -n "s/^[[:space:]]*listen[[:space:]]*\([0-9]*\);/\1/p" /etc/nginx/conf.d/default.conf | head -n 1); wget -q -O /dev/null "http://127.0.0.1:$PORT/health" && wget -q -O /dev/null "http://127.0.0.1:$PORT/" && wget -q -O /dev/null "http://127.0.0.1:$PORT/config/dashboard-labels.json"'; then
    echo "Deployment ready. Open http://SERVER_IP:8082 (see listen in deploy/nginx.offline.conf)."
    echo "Backend authentication/data availability is independent of page startup."
    exit 0
  fi
  ATTEMPT=$((ATTEMPT + 1))
  sleep 1
done
docker logs --tail 50 "$NAME"
echo "Startup check failed."
exit 1
