#!/usr/bin/env bash
# Make web-sized mock-up copies of the (renamed) originals: EXIF-oriented, 1600 px long edge,
# all metadata stripped (camera EXIF includes GPS location), progressive JPEG.
# A proper responsive/AVIF pipeline comes in the media optimization pass.
#
# Usage: scripts/media/mock-copies.sh <src-dir> <out-dir>
set -euo pipefail

src=${1:?source dir}
out=${2:?output dir}
mkdir -p "$out"

count=0
while IFS= read -r -d '' f; do
  name=$(basename "${f%.*}").jpg
  [[ -f "$out/$name" ]] && continue
  magick -define jpeg:size=3200x3200 "$f" -auto-orient -resize '1600x1600>' -strip \
    -interlace Plane -sampling-factor 4:2:0 -quality 78 "$out/$name"
  count=$((count + 1))
done < <(find "$src" -maxdepth 1 -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' \) -print0)

echo "wrote $count web copies to $out ($(du -sh "$out" | cut -f1))"
