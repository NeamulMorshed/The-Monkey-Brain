#!/usr/bin/env bash
# Scaffold a Monkey Brain instance (.brain/) into a project, or refresh its schema.
# A thin wrapper over the plugin's own scaffold script, so the bootstrap and /brain:init can
# never drift apart (v0.33.0).
#
# Usage:
#   ./new-brain.sh <project-path> [name]           # create
#   ./new-brain.sh <project-path> [name] --update  # refresh CLAUDE.md, reference.md, templates/ (keeps wiki/)
#   ./new-brain.sh <project-path> [name] --force   # recreate (wipes the existing .brain)
set -euo pipefail

PROJECT="${1:-}"; NAME="${2:-}"; MODE="${3:-}"
if [[ -z "$PROJECT" ]]; then echo "Usage: $0 <project-path> [name] [--update|--force]"; exit 1; fi
if [[ "$NAME" == "--update" || "$NAME" == "--force" ]]; then MODE="$NAME"; NAME=""; fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENGINE_ROOT="$(dirname "$SCRIPT_DIR")"
ARGS=(--project "$PROJECT")
if [[ -n "$NAME" ]]; then ARGS+=(--name "$NAME"); fi
if [[ -n "$MODE" ]]; then ARGS+=("$MODE"); fi
exec node "$ENGINE_ROOT/plugin/skills/init/scripts/new-brain.js" "${ARGS[@]}"
