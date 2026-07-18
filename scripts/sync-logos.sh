#!/usr/bin/env bash
#
# Sync the runtime logo SVGs from the ukc-data brand vault (the source of truth)
# into assets/logos/ here. Run this whenever the vault logos change.
#
#   ukc-data/assets/brand/logos/  ->  ukc-design-system/assets/logos/
#
# The vault nests logos in subfolders (horizontal/, icon/, shield/, stacked/);
# this repo keeps them flat because the UI kits and _ds_bundle.js reference flat
# paths. Two marks are DS-native and NOT in the vault, so they are never touched:
#   - parish-mono-white_three-mark.svg   (newsletter header)
#   - parish-reverse_combined-shield.svg (preview card)
#
# Override the vault location with UKC_DATA_LOGOS if the repos aren't siblings.
#
# Usage:  scripts/sync-logos.sh
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="${UKC_DATA_LOGOS:-$REPO_ROOT/../ukc-data/assets/brand/logos}"
DST="$REPO_ROOT/assets/logos"

if [[ ! -d "$SRC" ]]; then
  echo "error: vault logos not found at: $SRC" >&2
  echo "       set UKC_DATA_LOGOS to the ukc-data/assets/brand/logos path." >&2
  exit 1
fi

mkdir -p "$DST"

# Copy every approved variant, flattened. Skip the raw working lamb file and the
# two gold-cross files (renamed below to drop the redundant _cross suffix that
# the render references don't use).
copied=0
while IFS= read -r -d '' f; do
  cp -f "$f" "$DST/$(basename "$f")"
  copied=$((copied + 1))
done < <(find "$SRC" -name '*.svg' \
  ! -name 'sjb_lamb.svg' \
  ! -name 'parish-gold-screen-cross_cross.svg' \
  ! -name 'parish-gold-print-cross_cross.svg' \
  -print0)

# Gold cross: renders reference the name without the trailing _cross.
cp -f "$SRC/icon/parish-gold-screen-cross_cross.svg" "$DST/parish-gold-screen-cross.svg"
cp -f "$SRC/icon/parish-gold-print-cross_cross.svg"  "$DST/parish-gold-print-cross.svg"
copied=$((copied + 2))

# Sanity check: the DS-native marks must survive a sync.
for native in parish-mono-white_three-mark.svg parish-reverse_combined-shield.svg; do
  if [[ ! -f "$DST/$native" ]]; then
    echo "warning: DS-native mark missing after sync: $native" >&2
  fi
done

echo "synced $copied logo SVGs from $SRC"
echo "review with: git -C \"$REPO_ROOT\" status assets/logos"
