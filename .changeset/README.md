# Changesets

This folder is managed by [changesets](https://github.com/changesets/changesets).

Add a changeset for any user-facing change:

```bash
pnpm changeset
```

Pick the bump (`patch` / `minor` / `major`) and write a short summary. On merge to `main`,
CI opens a **"version packages"** PR that bumps the version (`x.x.x`, no `v` prefix) and updates
`CHANGELOG.md`. Merging that PR publishes `@mantaray0/crew` to npm and creates a GitHub Release
tagged `x.x.x`.

See `docs/RELEASING.md` for the full flow.
