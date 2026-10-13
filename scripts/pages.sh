#!/usr/bin/env bash
# Build the static site for GitHub Pages and commit it to a local `gh-pages` branch, ready for you to
# push yourself. No GitHub Actions involved.
#
# Usage:
#   scripts/pages.sh [--with-mock-photos] [--no-commit]
#
#   BASE_PATH   Sub-path the site is served from (default: /nepalbirdwatchingtours/).
#               Project pages live at https://<user>.github.io/<repo>/, so use "/<repo>/".
#               With a custom domain, use BASE_PATH=/.
#   --with-mock-photos  Include Krishna's mock-up photos (public/media/mock/). They become public on
#                       push, so only use this once he has agreed. Without it the build stops if they
#                       are present.
#   --no-commit         Only build into build/client; don't touch the gh-pages branch.
#
# Then publish:  git push origin gh-pages
# GitHub repo → Settings → Pages → Source: "Deploy from a branch", branch gh-pages, folder / (root).
set -euo pipefail

cd "$(dirname "$0")/.."
base=${BASE_PATH:-/nepalbirdwatchingtours/}
with_mock=false
commit=true
for arg in "$@"; do
  case "$arg" in
    --with-mock-photos) with_mock=true ;;
    --no-commit) commit=false ;;
    *) echo "unknown option: $arg" >&2; exit 2 ;;
  esac
done

if [[ -d public/media/mock && "$with_mock" == false ]]; then
  echo "public/media/mock/ holds Krishna's mock-up photos; they would be published." >&2
  echo "Re-run with --with-mock-photos once he has agreed, or move the folder away." >&2
  exit 1
fi

echo "building with BASE_PATH=$base"
BASE_PATH="$base" pnpm build

out=build/client
# With a sub-path, React Router nests the prerendered HTML under build/client/<base>/ while assets stay
# at the root. Pages serves the branch root at <base>, so lift the pages up.
dir=${base#/}; dir=${dir%/}
if [[ -n "$dir" && -d "$out/$dir" ]]; then
  cp -R "$out/$dir/." "$out/"
  rm -rf "${out:?}/$dir"
fi
cp "$out/__spa-fallback.html" "$out/404.html" # unknown URLs fall back to the app shell
touch "$out/.nojekyll"
rm -rf "${out:?}/_specimen" # local design previews never ship

echo "built $(find "$out" -type f | wc -l | tr -d ' ') files ($(du -sh "$out" | cut -f1)) in $out"
[[ "$commit" == true ]] || exit 0

# Commit the build to a local gh-pages branch through a throwaway worktree.
worktree=.gh-pages
source_rev=$(git rev-parse --short HEAD)
git worktree remove --force "$worktree" 2>/dev/null || true
if git show-ref --verify --quiet refs/heads/gh-pages; then
  git worktree add "$worktree" gh-pages
else
  git worktree add --detach "$worktree"
  git -C "$worktree" checkout --orphan gh-pages
fi
git -C "$worktree" rm -rqf --ignore-unmatch .
cp -R "$out/." "$worktree/"
git -C "$worktree" add -A
if git -C "$worktree" diff --cached --quiet; then
  echo "gh-pages already matches this build"
else
  git -C "$worktree" commit -q -m "deploy: site built from $source_rev"
  echo "committed to gh-pages ($(git -C "$worktree" rev-parse --short HEAD))"
fi
git worktree remove --force "$worktree"
echo "publish with: git push origin gh-pages"
