#!/usr/bin/env bash
set -euo pipefail

# This script moves duplicate renderer HTML files into src/renderer/archive/
# It is idempotent and safe to run locally. It does not delete files; it moves them.

ARCHIVE_DIR="src/renderer/archive"
mkdir -p "$ARCHIVE_DIR"

files=(
  "src/renderer/visualization.html"
  "src/renderer/table.html"
  "src/renderer/filter.html"
  "src/renderer/calendar.html"
)

for f in "${files[@]}"; do
  if [ -f "$f" ]; then
    echo "Moving $f -> $ARCHIVE_DIR/"
    git mv "$f" "$ARCHIVE_DIR/" || mv "$f" "$ARCHIVE_DIR/"
  else
    echo "Not found: $f"
  fi
done

echo "Archive complete. Review changes and commit if desired."
