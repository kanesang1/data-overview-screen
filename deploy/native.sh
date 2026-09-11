#!/bin/sh
set -eu
ACTION=${1:-start}
case "$ACTION" in start|stop|reload|status) ;; *) echo 'Usage: sh native.sh [start|stop|reload|status]'; exit 1 ;; esac
[ "$#" -le 1 ] || { echo 'Too many arguments'; exit 1; }
[ "$(uname -s)" = Linux ] || { echo 'Use native.ps1 on Windows.'; exit 1; }
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
case "$(uname -m)" in x86_64|amd64) ARCH=amd64; CPU=x86_64 ;; aarch64|arm64) ARCH=arm64; CPU=aarch64 ;; *) echo 'Supported: Linux AMD64 and ARM64.'; exit 1 ;; esac
for TOOL in tar sha256sum sed; do command -v "$TOOL" >/dev/null || { echo "Required tool: $TOOL"; exit 1; }; done
ARCHIVE="$ROOT/native-runtime/nginx-linux-$ARCH.tar.gz"
CONFIG="$ROOT/deploy/nginx.native.conf"
PIDFILE="$ROOT/logs/native-nginx.pid"
for FILE in "$ROOT/index.html" "$ROOT/config/dashboard-labels.json" "$CONFIG" "$ARCHIVE" "$ARCHIVE.sha256"; do
  [ -f "$FILE" ] || { echo "Missing file: $FILE"; exit 1; }
done
(cd "$ROOT/native-runtime" && sha256sum -c "nginx-linux-$ARCH.tar.gz.sha256")
HASH=$(sha256sum "$ARCHIVE" | cut -c1-12)
RUNTIME="$ROOT/.native/linux-$ARCH-$HASH"
if [ ! -f "$RUNTIME/ready" ]; then
  mkdir -p "$RUNTIME"
  tar -xzf "$ARCHIVE" -C "$RUNTIME"
  touch "$RUNTIME/ready"
fi
LOADER="$RUNTIME/lib/ld-musl-$CPU.so.1"
BINARY="$RUNTIME/usr/sbin/nginx"
WORKER_GROUP=
if [ "$(id -u)" = 0 ]; then
  WORKER_GROUP=$(id -gn nobody) || { echo 'Run as an ordinary user, or provide the standard nobody account.'; exit 1; }
fi
nginx() {
  if [ -n "$WORKER_GROUP" ]; then set -- -g "user nobody $WORKER_GROUP;" "$@"; fi
  "$LOADER" --library-path "$RUNTIME/lib:$RUNTIME/usr/lib" "$BINARY" -p "$ROOT/" -e "$ROOT/logs/native-error.log" -c deploy/nginx.native.conf "$@"
}
mkdir -p "$ROOT/logs"
RUNNING=false
if [ -f "$PIDFILE" ]; then
  MASTER=$(cat "$PIDFILE")
  case "$MASTER" in ''|*[!0-9]*) echo 'Invalid native PID file'; exit 1 ;; esac
  if [ -d "/proc/$MASTER" ]; then
    # musl rewrites argv; check the actual loader and mapped nginx executable.
    if [ "$(readlink "/proc/$MASTER/exe")" = "$LOADER" ] && grep -Fq "$BINARY" "/proc/$MASTER/maps"; then
      RUNNING=true
    else echo 'PID belongs to another process; refusing to signal it.'; exit 1
    fi
  fi
fi
case "$ACTION" in
  status) if "$RUNNING"; then echo "Native Nginx running (PID $MASTER)."; exit 0; else echo 'Native Nginx stopped.'; exit 1; fi ;;
  stop)
    if ! "$RUNNING"; then echo 'Already stopped.'; exit 0; fi
    nginx -s quit
    COUNT=0
    while [ "$COUNT" -lt 20 ]; do
      [ -f "$PIDFILE" ] || { echo 'Stopped.'; exit 0; }
      COUNT=$((COUNT + 1)); sleep 1
    done
    echo 'Graceful shutdown is still in progress; check active connections.'; exit 1 ;;
esac
if [ "$ACTION" = reload ] && ! "$RUNNING"; then echo 'Not running. Use start.'; exit 1; fi
if command -v curl >/dev/null 2>&1; then
  probe() { curl --noproxy '*' --fail --silent --max-time 2 "$1" >/dev/null; }
elif command -v wget >/dev/null 2>&1; then
  probe() { http_proxy= https_proxy= HTTP_PROXY= HTTPS_PROXY= wget -q -T 2 -O /dev/null "$1"; }
else echo 'Install curl or wget during offline machine preparation (required for health checks).'; exit 1
fi
nginx -t
if "$RUNNING"; then
  if [ "$ACTION" = reload ]; then nginx -s reload; else echo 'Already running; use reload after changing configuration.'; fi
else rm -f "$PIDFILE"; nginx; fi
PORT=$(sed -n 's/^[[:space:]]*listen[[:space:]]*\([0-9]*\);/\1/p' "$CONFIG")
case "$PORT" in ''|*[!0-9]*) echo 'Config must contain one numeric listen port.'; exit 1 ;; esac
COUNT=0
while [ "$COUNT" -lt 20 ]; do
  if [ -f "$PIDFILE" ] && probe "http://127.0.0.1:$PORT/health" && probe "http://127.0.0.1:$PORT/" && probe "http://127.0.0.1:$PORT/config/dashboard-labels.json"; then
    echo "Native deployment ready: http://SERVER_IP:$PORT/ (business backend checked separately)."; exit 0
  fi
  COUNT=$((COUNT + 1)); sleep 1
done
echo 'Startup check failed; see logs/native-error.log.'
exit 1
