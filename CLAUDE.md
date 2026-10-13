# Nepal Birdwatching Tours

Static React site for Krishna Thapa, a birding guide in Nepal. Built incrementally by an orchestrating
agent with subagents.

## Read first, every session

1. `docs/VISION.md`: the owner's intent for vibe, aesthetics and interaction. It wins any conflict.
2. `docs/PLAN.md`: stack, sitemap, phases.
3. `docs/EXPERIENCE.md`: map states, phone layouts, URLs/SEO, motion.
4. `docs/STYLE_GUIDE.md`: type, colour, field labels, map styling. Tokens live in `app/design/tokens.css`.
5. `app/content/types.ts`: the content contract.

At the start of a session, briefly remind the owner of the next phase and of the open items in
`docs/VISION.md` → "Still to decide".

## Working rules

- **Model choice for subagents:** anything that builds features, UI or interactions → **Opus**. Sonnet and
  Haiku only for research, low-level mechanical implementation, and minor updates or fixes.

- Mobile-first; most visitors are on phones.
- No pop-ups or modal cards. Trips and places share one interaction: map fly-to plus a rising sheet. The
  inquiry drawer is the only overlay.
- Paths for things, query params for states. Every page must be fully readable without JavaScript.
- Field labels: name, italic scientific name, place, altitude, date. Never coordinates or conservation codes.
- **UI work uses the `frontend-design:frontend-design` skill** for layout, content placement, visual and type
  hierarchy, spacing and responsiveness, but not for its creative direction. The aesthetic comes from
  `docs/VISION.md`, `docs/STYLE_GUIDE.md`, the tokens and the San Rita reference; those win any conflict.
- Design values only through tokens; no hard-coded colours or fonts in components.
- **No tests, for now.** No unit, integration or e2e tests, no test frameworks, no test files. Don't spend
  tokens on elaborate verification. Put the effort into clear, understandable components and scripts.
  Verification is `pnpm typecheck` and `pnpm build`, plus a quick look when something is visual.
- Technical details are decided at implementation time; the docs hold intent, not task lists.
- No analytics or server. Commands: `pnpm dev`, `pnpm typecheck`, `pnpm build`.
- Commit frequently with the git-commit skill (conventional commits, explicit file staging).
- Verification: wrap heavy commands in `timeout <s> taskpolicy -b …`. No long headless-browser runs.
  Kill anything you start. Never send the owner's personal data off the machine.
