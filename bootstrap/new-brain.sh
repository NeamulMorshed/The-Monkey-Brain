#!/usr/bin/env bash
# Scaffold a Monkey Brain instance (.brain/) into a project, or refresh its schema.
#
# Usage:
#   ./new-brain.sh <project-path> [name]          # create
#   ./new-brain.sh <project-path> [name] --update  # refresh schema only (keeps wiki/)
#   ./new-brain.sh <project-path> [name] --force    # recreate (wipes existing .brain)
set -euo pipefail

PROJECT="${1:-}"; NAME="${2:-}"; MODE="${3:-}"
if [[ -z "$PROJECT" ]]; then echo "Usage: $0 <project-path> [name] [--update|--force]"; exit 1; fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENGINE_ROOT="$(dirname "$SCRIPT_DIR")"
TEMPLATE="$ENGINE_ROOT/schema/brain-template"
[[ -d "$TEMPLATE" ]] || { echo "Template not found at $TEMPLATE"; exit 1; }
[[ -d "$PROJECT"  ]] || { echo "Project path does not exist: $PROJECT"; exit 1; }

PROJECT="$(cd "$PROJECT" && pwd)"
BRAIN="$PROJECT/.brain"
[[ -n "$NAME" && "$NAME" != "--update" && "$NAME" != "--force" ]] || NAME="$(basename "$PROJECT")"
[[ "$NAME" == "--update" || "$NAME" == "--force" ]] && { MODE="$NAME"; NAME="$(basename "$PROJECT")"; }
TODAY="$(date +%F)"

subst() {  # replace placeholders in-place (portable sed)
  local f="$1"
  sed -e "s|{{PROJECT}}|$NAME|g" -e "s|{{DATE}}|$TODAY|g" "$f" > "$f.tmp" && mv "$f.tmp" "$f"
}

if [[ "$MODE" == "--update" ]]; then
  [[ -d "$BRAIN" ]] || { echo "No .brain at $BRAIN to update."; exit 1; }
  echo "Refreshing schema in $BRAIN (knowledge left untouched)..."
  cp "$TEMPLATE/CLAUDE.md" "$BRAIN/CLAUDE.md"
  cp -R "$TEMPLATE/templates/." "$BRAIN/templates/"
  subst "$BRAIN/CLAUDE.md"
  echo "Done. CLAUDE.md + templates/ refreshed for '$NAME'."
  exit 0
fi

if [[ -d "$BRAIN" ]]; then
  if [[ "$MODE" == "--force" ]]; then echo "Removing existing .brain (--force)..."; rm -rf "$BRAIN";
  else echo ".brain already exists at $BRAIN. Use --update or --force."; exit 1; fi
fi

echo "Scaffolding Monkey Brain '$NAME' into $BRAIN ..."
cp -R "$TEMPLATE" "$BRAIN"
while IFS= read -r -d '' f; do subst "$f"; done < <(find "$BRAIN" -name '*.md' -print0)

PAGES="$(find "$BRAIN/wiki" -name '*.md' | wc -l | tr -d ' ')"
cat <<EOF

Created .brain for '$NAME'  ($PAGES seed pages)
Next:
  1. cd "$PROJECT" && claude        # .brain/CLAUDE.md loads automatically
  2. Drop a doc in .brain/raw-sources/ (or paste in chat), say 'ingest this'
  3. Open .brain/ as an Obsidian vault to browse the graph

Note: confirm the brain's CLAUDE.md loaded with /memory. If not, run claude from inside
.brain/, or add '@.brain/CLAUDE.md' to a root CLAUDE.md so it always loads.
EOF
