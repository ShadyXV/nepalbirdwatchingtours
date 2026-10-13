# Nepal Birdwatching Tours

Static site for Krishna Thapa's birdwatching tours in Nepal. React Router v7 (framework mode, `ssr: false`, every route prerendered), Tailwind CSS v4, TypeScript. See `docs/PLAN.md` for the brief.

## Commands

```sh
pnpm install
pnpm dev         # dev server
pnpm typecheck   # react-router typegen && tsc
pnpm build       # prerendered static site in build/client
pnpm preview     # serve build/client
```

## Structure

- `app/routes/` thin route modules; `map-layout.tsx` mounts the map once for `/` and `/trips/:slug`.
- `app/screens/` page compositions. `app/components/` split by area (layout, map, inquiry, media, ui).
- `app/content/` typed content: `types.ts` is the contract, `data/*` the data, `index.ts` the accessors.
- `app/i18n/` all UI strings (`en.ts`) and the typed `t()` helper.
- `public/` static files (served as-is, use `assetUrl()` from `app/lib/site.ts` to reference them).

## Deploying to GitHub Pages (manual, from your machine)

No GitHub Actions: you build locally and push the result yourself.

```sh
pnpm pages                       # build for /nepalbirdwatchingtours/ and commit it to a local gh-pages branch
BASE_PATH=/<repo>/ pnpm pages    # if the GitHub repo has another name
BASE_PATH=/ pnpm pages           # with a custom domain
git push origin gh-pages         # publish
```

In the GitHub repo: Settings → Pages → Source "Deploy from a branch", branch `gh-pages`, folder `/ (root)`.

`scripts/pages.sh` builds with `BASE_PATH`, lifts the prerendered pages out of `build/client/<repo>/`,
adds `404.html` (app-shell fallback) and `.nojekyll`, strips local design previews, then commits
`build/client` to `gh-pages` through a temporary worktree. It refuses to build while Krishna's mock-up
photos (`public/media/mock/`) are present unless you pass `--with-mock-photos`, since they'd become
public. `--no-commit` only builds. Also set `SITE_URL` in `app/lib/site.ts` to the real address.
