# Releasing crew

crew is a **pure Claude Code plugin** — it is distributed via the plugin marketplace (git), not npm.
Releases are managed with [Changesets](https://github.com/changesets/changesets) for changelog +
version bumps, and GitHub Actions cuts a **`x.x.x`** git tag + GitHub Release (semver, **no `v` prefix**).
There is **no npm publish** (the package is `private`).

## One-time setup

1. Create the GitHub repo (must match the changelog repo in `.changeset/config.json` — `mantaray0/crew`):
   ```bash
   gh repo create mantaray0/crew --public --source . --remote origin --push
   ```
2. In **Settings → Actions → General → Workflow permissions**, allow Actions to create pull
   requests (needed for the version PR). `GITHUB_TOKEN` is provided automatically; no other secret needed.

## Day-to-day flow

1. Make a change on a branch. Add a changeset:
   ```bash
   pnpm changeset       # pick patch | minor | major, write a summary
   ```
2. Open a PR and merge to `main`. **CI** validates the plugin structure (manifest/hooks JSON,
   frontmatter, hook scripts) on every push and PR.
3. On merge, **Release** opens (or updates) a **"version packages"** PR that bumps `package.json`
   to the next `x.x.x` and writes `CHANGELOG.md`.
4. Merge the version PR. The release workflow then creates the git tag `x.x.x` and a GitHub Release.

No manual version edits, no `v` prefix, no npm. The repo ships an initial `minor` changeset, so the
first version will be `0.1.0`.

## Installing a release

```
/plugin marketplace add mantaray0/crew
/plugin install crew
```
