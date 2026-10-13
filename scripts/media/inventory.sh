#!/usr/bin/env bash
# Inventory original photos: stable ids, true (EXIF-corrected) dimensions, orientation,
# small thumbnails and numbered contact sheets for cheap visual classification.
#
# Usage: scripts/media/inventory.sh <src-dir> <work-dir>
# Output: <work-dir>/inventory.tsv, <work-dir>/thumbs/<id>.jpg, <work-dir>/sheets/sheet-NN.jpg
set -euo pipefail

src=${1:?source dir}
work=${2:?work dir}
mkdir -p "$work/thumbs" "$work/sheets"

printf 'id\tfile\twidth\theight\torientation\tmegapixels\n' > "$work/inventory.tsv"

i=0
while IFS= read -r -d '' f; do
  i=$((i + 1))
  id=$(printf 'img-%03d' "$i")

  read -r w h exif < <(magick identify -format '%w %h %[orientation]\n' "$f" | head -1)
  # Rotated-by-90 EXIF orientations swap the displayed width and height.
  case "$exif" in RightTop | LeftBottom | LeftTop | RightBottom) t=$w; w=$h; h=$t ;; esac

  if (( w * 100 > h * 115 )); then o=landscape
  elif (( h * 100 > w * 115 )); then o=portrait
  else o=square; fi

  mp=$(awk -v w="$w" -v h="$h" 'BEGIN { printf "%.1f", w * h / 1e6 }')
  printf '%s\t%s\t%s\t%s\t%s\t%s\n' "$id" "$(basename "$f")" "$w" "$h" "$o" "$mp" >> "$work/inventory.tsv"

  # jpeg:size lets the decoder shrink on load, so big originals stay cheap to read.
  magick -define jpeg:size=640x640 "$f" -auto-orient -thumbnail 320x320 -quality 70 "$work/thumbs/$id.jpg"
done < <(find "$src" -maxdepth 1 -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' \) -print0 | sort -z)

# 12 labelled thumbnails per sheet (4 x 3).
thumbs=("$work"/thumbs/*.jpg)
n=0
for ((start = 0; start < ${#thumbs[@]}; start += 12)); do
  n=$((n + 1))
  # -label must precede the inputs it applies to.
  montage -label '%t' "${thumbs[@]:start:12}" -tile 4x3 -geometry 300x300+6+6 \
    -pointsize 20 -fill white -background '#1a1a1a' -quality 75 \
    "$work/sheets/$(printf 'sheet-%02d' "$n").jpg"
done

echo "inventoried $i images into $n sheets"
