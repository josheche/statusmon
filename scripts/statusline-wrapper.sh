#!/usr/bin/env bash
# Statusmon statusline wrapper — chains with any existing statusline
SESSION_JSON=$(cat)

# Resolve node: NVM_BIN (set by nvm), then PATH
NODE="${NVM_BIN:+$NVM_BIN/node}"
[ -z "$NODE" ] || [ ! -x "$NODE" ] && NODE="$(command -v node 2>/dev/null || echo node)"

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# Render Statusmon (pass TERM_PROGRAM for inline sprite detection)
echo "$SESSION_JSON" | TERM_PROGRAM="${TERM_PROGRAM:-}" "$NODE" "$SCRIPT_DIR/dist/statusline.mjs" 2>/dev/null

# Chain with TokenGolf if installed (version-agnostic glob)
for tg in "$HOME"/.claude/plugins/cache/tokengolf/tokengolf/*/scripts/statusline.sh; do
  [ -f "$tg" ] && echo "$SESSION_JSON" | bash "$tg" 2>/dev/null && break
done
