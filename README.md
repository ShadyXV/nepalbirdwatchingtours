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

## Deploying to GitHub Pages

`BASE_PATH` sets both the Vite `base` and the router `basename`; it defaults to `/`. For a project page build with `BASE_PATH=/<repo>/`. With a non-root base React Router writes the prerendered HTML into `build/client/<repo>/` while assets stay in `build/client/`; the deploy workflow (`.github/workflows/deploy.yml`) flattens that and copies `__spa-fallback.html` to `404.html`. Set `BASE_PATH` to `/` in the workflow when using a custom domain.

Inquiry deep link: `/?inquire&trip=<slug>&from=<date>&to=<date>&party=<n>`.
