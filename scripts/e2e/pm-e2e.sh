#!/bin/sh
# End-to-end check of `stackpilot pm` in a real pseudo-terminal: the fixture
# stack starts in dependency order and gets ready, the UI shows it, q → y stops everything, and no
# process is left behind. Needs bun, node, python3 and pgrep. Runs in place; cleans up after itself.
set -eu
ROOT=$(cd "$(dirname "$0")/../.." && pwd)
STACK="$ROOT/tests/fixtures/stack"
OUT=$(mktemp)
trap 'rm -rf "$OUT" "$STACK/.stackpilot"' EXIT
cd "$ROOT"

if pgrep -f fixture-server.js >/dev/null; then
  echo "fixture processes are already running; stop them first" >&2
  exit 1
fi

status=0
PTY_SECONDS=20 PTY_SNAPSHOTS='[5]' PTY_SCRIPT='[[5.5,"q"],[6.5,"y"]]' NODE_ENV=production \
  python3 scripts/e2e/pty-frames.py bun cli/index.js pm --config "$STACK/stackpilot.json" > "$OUT" \
  || { echo "FAIL stackpilot did not exit cleanly"; status=1; }

# The stack box and its title, the header naming the stack (the fixture folder) with every process ready,
# the processes' readiness, and the logs panel that the focused stack box opens.
for needle in '┌─ stack ' 'stack  ● 4/4 ready' 'ready :4610' 'ready :4611' 'logs · db' 'following ●'; do
  if grep -qF "$needle" "$OUT"; then echo "ok   $needle"; else echo "FAIL $needle"; status=1; fi
done
sleep 1
if pgrep -f fixture-server.js >/dev/null; then
  echo "FAIL processes left behind:"; pgrep -fl fixture-server.js; status=1
else
  echo "ok   nothing left running"
fi
if [ -e "$STACK/.stackpilot/run.json" ]; then echo "FAIL run state not cleared"; status=1; else echo "ok   run state cleared"; fi
[ "$status" -eq 0 ] || sed -n '1,45p' "$OUT"
exit $status
