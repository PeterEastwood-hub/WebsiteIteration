#!/usr/bin/env bash
# Build export/engineering-handoff-bundle(.zip) for engineering handoff.
# Usage (from repo root):
#   bash export/engineering-handoff/package-handoff.sh
#   bash export/engineering-handoff/package-handoff.sh --with-site-mirror
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DEST="$ROOT/export/engineering-handoff-bundle"
ZIP="$ROOT/export/engineering-handoff-bundle.zip"
WITH_MIRROR=0
if [[ "${1:-}" == "--with-site-mirror" ]]; then
  WITH_MIRROR=1
fi

rm -rf "$DEST" "$ZIP"
mkdir -p "$DEST"/{docs,pages,prototype-source,custom-css,custom-js,screenshots}

cp "$ROOT/export/engineering-handoff/README.md" "$DEST/docs/"
cp "$ROOT/export/engineering-handoff/MANIFEST.txt" "$DEST/docs/"

# Example pages (reference markup; need full site-mirror for Next asset URLs)
cp "$ROOT/site-mirror/insights.html" "$DEST/pages/"
cp "$ROOT/site-mirror/insights-engineering-community.html" "$DEST/pages/"
cp "$ROOT/site-mirror/implementing-model-context-protocol-mcp-tips-tricks-and-pitfalls.html" "$DEST/pages/"

# Logic that encodes design/product rules
cp "$ROOT/postprocess-mirror.mjs" "$DEST/prototype-source/"
cp "$ROOT/scripts/insights-redesign-enrich.mjs" "$DEST/prototype-source/"
cp "$ROOT/scripts/build-insights-explore.py" "$DEST/prototype-source/" 2>/dev/null || true
cp "$ROOT/package.json" "$DEST/prototype-source/"

# Custom mirror styles + behaviour
cp "$ROOT/site-mirror/css/mirror-content-rhythm.css" "$DEST/custom-css/" 2>/dev/null || true
cp "$ROOT/site-mirror/css/mirror-stripe-influence.css" "$DEST/custom-css/" 2>/dev/null || true
cp "$ROOT/site-mirror/css/mirror-a11y-flair.css" "$DEST/custom-css/" 2>/dev/null || true
cp "$ROOT/site-mirror/css/insights-explore.css" "$DEST/custom-css/" 2>/dev/null || true

shopt -s nullglob
for f in "$ROOT/site-mirror/js"/mirror*.js; do
  cp "$f" "$DEST/custom-js/"
done

# Screenshots if present
if [[ -d "$ROOT/export/pdf-handoff-screenshots" ]]; then
  cp "$ROOT/export/pdf-handoff-screenshots"/*.png "$DEST/screenshots/" 2>/dev/null || true
fi

if [[ "$WITH_MIRROR" -eq 1 ]]; then
  echo "Copying full site-mirror (large)…"
  mkdir -p "$DEST/site-mirror-full"
  rsync -a --delete "$ROOT/site-mirror/" "$DEST/site-mirror-full/"
fi

(
  cd "$ROOT/export"
  rm -f "$ZIP"
  zip -rq "$ZIP" "$(basename "$DEST")"
)

echo "Wrote $DEST"
echo "Wrote $ZIP"
if [[ "$WITH_MIRROR" -eq 0 ]]; then
  echo "Note: default bundle excludes hashed Next assets. Engineer should clone repo and run preview (see README.md) for full layout."
fi
