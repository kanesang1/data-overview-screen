#!/bin/sh
# Run with: sh tests/deploy.sh. Docker is mocked to cover failure paths without a daemon.
set -eu
REPO=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$TMP/bin" "$TMP/package with spaces/deploy" "$TMP/package with spaces/config" "$TMP/package with spaces/images"
cp "$REPO/deploy/deploy.sh" "$TMP/package with spaces/deploy.sh"
cp "$REPO/deploy/nginx.offline.conf" "$TMP/package with spaces/deploy/nginx.offline.conf"
touch "$TMP/package with spaces/index.html" "$TMP/package with spaces/config/dashboard-labels.json"
printf 'test archive' > "$TMP/package with spaces/images/nginx-linux-amd64.tar"
(cd "$TMP/package with spaces/images" && sha256sum nginx-linux-amd64.tar > nginx-linux-amd64.tar.sha256)
cat > "$TMP/bin/docker" <<'MOCK'
#!/bin/sh
echo "$*" >> "$MOCK_LOG"
case "$1" in
  info) case "$*" in *OSType*) echo linux ;; *Architecture*) echo amd64 ;; *OperatingSystem*) echo 'Test Linux' ;; esac ;;
  context) echo unix:///var/run/docker.sock ;;
  container) [ "$MOCK_CASE" = foreign ] ;;
  inspect) case "$*" in *Labels*) echo false ;; *Running*) echo true ;; esac ;;
  pull) case "$MOCK_CASE" in fallback|online-fail) exit 1 ;; ecr) case "$*" in *public.ecr.aws*) exit 0 ;; *) exit 1 ;; esac ;; esac ;;
  image) case "$*" in *Architecture*) if [ "$MOCK_CASE" = wrongarch ]; then echo linux/arm64; else echo linux/amd64; fi ;; *) echo sha256:test ;; esac ;;
esac
MOCK
chmod +x "$TMP/bin/docker"
export PATH="$TMP/bin:$PATH"
export MOCK_LOG="$TMP/docker.log"
unset DOCKER_HOST DOCKER_CONTEXT OFFLINE_IMAGE_SOURCE
check() {
  export MOCK_CASE=$1
  MODE=$2
  EXPECT=$3
  : > "$MOCK_LOG"
  CODE=0
  sh "$TMP/package with spaces/deploy.sh" --mode "$MODE" > "$TMP/output" 2>&1 || CODE=$?
  if [ "$EXPECT" = pass ]; then
    [ "$CODE" = 0 ] && grep -q '^run --pull=never -d' "$MOCK_LOG" || { cat "$TMP/output"; exit 1; }
  else
    [ "$CODE" != 0 ] && ! grep -q '^run --pull=never -d' "$MOCK_LOG" || { cat "$TMP/output"; exit 1; }
  fi
  echo "PASS Linux $MOCK_CASE ($MODE)"
}
check offline offline pass
! grep -q '^pull ' "$MOCK_LOG"
grep -q '^load ' "$MOCK_LOG"
check fallback auto pass
grep -q '^load ' "$MOCK_LOG"
check ecr auto pass
grep -q 'pull .*public.ecr.aws' "$MOCK_LOG"
! grep -q '^load ' "$MOCK_LOG"
check online online pass
! grep -q '^load ' "$MOCK_LOG"
check online-fail online fail
! grep -q '^load ' "$MOCK_LOG"
check foreign offline fail
! grep -q '^rm ' "$MOCK_LOG"
check wrongarch offline fail
! grep -q '^rm ' "$MOCK_LOG"
printf 'corrupt' >> "$TMP/package with spaces/images/nginx-linux-amd64.tar"
check checksum offline fail
! grep -q '^load ' "$MOCK_LOG"
rm "$TMP/package with spaces/images/nginx-linux-amd64.tar"
check missing offline fail
check no-archive-online online pass
echo 'All Linux deployment flow tests passed.'
