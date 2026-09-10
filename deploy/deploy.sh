#!/bin/sh
set -eu
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
MODE=auto
NAME=data-overview-offline
while [ "$#" -gt 0 ]; do
  case "$1" in
    --mode|--name) [ "$#" -ge 2 ] || { echo "Missing value: $1"; exit 1; }
      case "$1" in --mode) MODE=$2 ;; --name) NAME=$2 ;; esac; shift 2 ;;
    *) echo "Usage: sh start.sh [--mode auto|offline|online] [--name NAME]"; exit 1 ;;
  esac
done
case "$MODE" in auto|offline|online) ;; *) echo "Invalid mode: $MODE"; exit 1 ;; esac
case "$NAME" in ''|*[!a-zA-Z0-9_.-]*|-*) echo "Invalid container name"; exit 1 ;; esac
[ "$(uname -s)" = Linux ] || { echo "On Windows use start.ps1 or start.cmd."; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "Install and start Docker Engine first."; exit 1; }
docker info >/dev/null
[ "$(docker info --format '{{.OSType}}')" = linux ] || { echo "Linux containers required."; exit 1; }
ENDPOINT=${DOCKER_HOST:-$(docker context inspect --format '{{.Endpoints.docker.Host}}')}
case "$ENDPOINT" in unix://*) ;; *) echo "Use a local Docker Engine (unix socket)."; exit 1 ;; esac
case "$(docker info --format '{{.OperatingSystem}}')" in *Docker\ Desktop*) echo "Use native Linux Docker Engine, or Windows start.ps1 for Docker Desktop."; exit 1 ;; esac
ARCH=$(docker info --format '{{.Architecture}}')
case "$ARCH" in x86_64|amd64) ARCH=amd64 ;; aarch64|arm64) ARCH=arm64 ;; *) echo "Unsupported architecture: $ARCH"; exit 1 ;; esac
IMAGE=nginx:1.27-alpine
CONFIG="$ROOT/deploy/nginx.offline.conf"
ARCHIVE="$ROOT/images/nginx-linux-$ARCH.tar"
for FILE in "$ROOT/index.html" "$ROOT/config/dashboard-labels.json" "$CONFIG"; do
  [ -f "$FILE" ] || { echo "Missing file: $FILE. Deploy the built dist directory."; exit 1; }
done
PORT=$(sed -n 's/^[[:space:]]*listen[[:space:]]*\([0-9]*\);/\1/p' "$CONFIG")
case "$PORT" in ''|*[!0-9]*) echo "Config must have one numeric listen port."; exit 1 ;; esac
[ "$PORT" -gt 0 ] && [ "$PORT" -le 65535 ] || { echo "Invalid listen port"; exit 1; }
if docker container inspect "$NAME" >/dev/null 2>&1; then
  [ "$(docker inspect --format '{{index .Config.Labels "data-overview.offline"}}' "$NAME")" = true ] || { echo "Container belongs to another deployment: $NAME"; exit 1; }
fi
pull_image() {
  if [ -n "${OFFLINE_IMAGE_SOURCE:-}" ]; then
    docker pull --platform "linux/$ARCH" "$OFFLINE_IMAGE_SOURCE" && docker tag "$OFFLINE_IMAGE_SOURCE" "$IMAGE"
  else
    docker pull --platform "linux/$ARCH" "$IMAGE" || {
      SOURCE=public.ecr.aws/docker/library/nginx:1.27-alpine
      docker pull --platform "linux/$ARCH" "$SOURCE" && docker tag "$SOURCE" "$IMAGE"
    }
  fi
}
load_image() {
  [ -f "$ARCHIVE" ] && [ -f "$ARCHIVE.sha256" ] || { echo "Missing offline archive/checksum: $ARCHIVE"; return 1; }
  command -v sha256sum >/dev/null 2>&1 || { echo "sha256sum is required for offline verification."; return 1; }
  (cd "$ROOT/images" && sha256sum -c "nginx-linux-$ARCH.tar.sha256") || return 1
  docker load -i "$ARCHIVE"
}
echo "[1/4] Image mode: $MODE; platform: linux/$ARCH"
case "$MODE" in
  offline) load_image ;;
  online) pull_image || { echo "Online pull failed. Use --mode offline with a complete package."; exit 1; } ;;
  auto) if ! pull_image; then echo "Online sources unavailable; using verified bundled image."; load_image; fi ;;
esac
[ "$(docker image inspect --format '{{.Os}}/{{.Architecture}}' "$IMAGE")" = "linux/$ARCH" ] || { echo "Image platform mismatch"; exit 1; }
IMAGE_ID=$(docker image inspect --format '{{.Id}}' "$IMAGE")
echo "[2/4] Checking Nginx configuration..."
docker run --pull=never --rm --network host --entrypoint nginx -v "$CONFIG:/etc/nginx/conf.d/default.conf:ro" "$IMAGE_ID" -t
if docker container inspect "$NAME" >/dev/null 2>&1; then docker rm -f "$NAME" >/dev/null; fi
echo "[3/4] Starting dashboard..."
docker run --pull=never -d --name "$NAME" --label data-overview.offline=true --restart unless-stopped --network host --entrypoint nginx -v "$ROOT:/usr/share/nginx/html:ro" -v "$CONFIG:/etc/nginx/conf.d/default.conf:ro" "$IMAGE_ID" -g 'daemon off;'
echo "[4/4] Checking startup..."
ATTEMPT=0
while [ "$ATTEMPT" -lt 20 ]; do
  if [ "$(docker inspect --format '{{.State.Running}}' "$NAME")" != true ]; then docker logs --tail 50 "$NAME"; exit 1; fi
  if docker exec "$NAME" sh -c 'for path in /health / /config/dashboard-labels.json; do wget -q -O /dev/null "http://127.0.0.1:$1$path" || exit 1; done' sh "$PORT"; then
    echo "Deployment ready: http://SERVER_IP:$PORT/ (backend authentication/data checked separately)."
    exit 0
  fi
  ATTEMPT=$((ATTEMPT + 1)); sleep 1
done
docker logs --tail 50 "$NAME"
echo "Startup check failed."
exit 1
