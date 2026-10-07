#!/usr/bin/env bash
set -Eeuo pipefail

SESSION="piv-mechanics-studio"
PROJECT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
ACTION="${1:-start}"

if ! command -v node >/dev/null 2>&1; then
  printf 'Node.js is required. Install Node.js 18 or newer first.\n' >&2
  exit 1
fi
if ! node -e 'process.exit(Number(process.versions.node.split(".")[0]) >= 18 ? 0 : 1)'; then
  printf 'Node.js 18 or newer is required; found %s.\n' "$(node --version)" >&2
  exit 1
fi

case "$ACTION" in
  start)
    if ! command -v tmux >/dev/null 2>&1; then
      printf 'tmux is required to keep the site and bot running after SSH disconnects.\n' >&2
      printf 'Install it with: sudo apt update && sudo apt install -y tmux\n' >&2
      exit 1
    fi
    if [[ ! -f "$PROJECT_DIR/.env" ]]; then
      printf 'Missing .env in %s. Create it using the deployment guide in README.md.\n' "$PROJECT_DIR" >&2
      exit 1
    fi
    if tmux has-session -t "$SESSION" 2>/dev/null; then
      printf 'Already running in tmux session "%s". Use: %s status|logs|attach|restart|stop\n' "$SESSION" "$0"
      exit 0
    fi
    tmux new-session -d -s "$SESSION" -c "$PROJECT_DIR" "node server.mjs"
    sleep 2
    if tmux has-session -t "$SESSION" 2>/dev/null; then
      printf 'Website and Telegram test bot started in tmux session "%s".\n' "$SESSION"
      printf 'Default local address: http://127.0.0.1:4173\n'
      printf 'Check logs with: %s logs\n' "$0"
    else
      printf 'The process exited during startup. Recent output:\n' >&2
      tmux capture-pane -pt "$SESSION" 2>/dev/null | tail -n 40 >&2 || true
      exit 1
    fi
    ;;
  stop)
    if tmux has-session -t "$SESSION" 2>/dev/null; then
      tmux kill-session -t "$SESSION"
      printf 'Stopped tmux session "%s".\n' "$SESSION"
    else
      printf 'Session "%s" is not running.\n' "$SESSION"
    fi
    ;;
  restart)
    "$0" stop
    exec "$0" start
    ;;
  status)
    if tmux has-session -t "$SESSION" 2>/dev/null; then
      printf 'Running in tmux session "%s".\n' "$SESSION"
      tmux list-windows -t "$SESSION"
    else
      printf 'Session "%s" is not running.\n' "$SESSION"
      exit 1
    fi
    ;;
  logs)
    if ! tmux has-session -t "$SESSION" 2>/dev/null; then
      printf 'Session "%s" is not running.\n' "$SESSION" >&2
      exit 1
    fi
    tmux capture-pane -pt "$SESSION" -S -100
    ;;
  attach)
    if ! tmux has-session -t "$SESSION" 2>/dev/null; then
      printf 'Session "%s" is not running. Start it with: %s start\n' "$SESSION" "$0" >&2
      exit 1
    fi
    exec tmux attach-session -t "$SESSION"
    ;;
  *)
    printf 'Usage: %s [start|stop|restart|status|logs|attach]\n' "$0" >&2
    exit 2
    ;;
esac
