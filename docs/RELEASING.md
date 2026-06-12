# Releasing crew

Releases are managed with [Changesets](https://github.com/changesets/changesets) and GitHub Actions.
Versions are plain **`x.x.x`** (semver, **no `v` prefix**) — both the npm version and the git tag / GitHub Release.

## One-time setup

1. Create the GitHub repo (must match the changelog repo in `.changeset/config.json` — `mantaray0/crew`):
   ```bash
   gh repo create mantaray0/crew --public --source . --remote origin --push
   ```
2. Add the npm publish token as a repository secret:
   ```bash
   gh secret set NPM_TOKEN --body "<your npm automation token>"
   ```
   (`GITHUB_TOKEN` is provided automatically.)
3. In the repo's **Settings → Actions → General → Workflow permissions**, allow Actions to
   create pull requests (needed for the version PR).

## Day-to-day flow

1. Make a change on a branch. Add a changeset describing it:
   ```bash
   pnpm changeset            # pick patch | minor | major, write a summary
   ```
2. Open a PR and merge to `main`. **CI** (`.github/workflows/ci.yml`) runs lint → typecheck → test → build on every push and PR.
3. On merge, **Release** (`.github/workflows/release.yml`) opens (or updates) a **"version packages"** PR that bumps `package.json` to the next `x.x.x` and writes `CHANGELOG.md`.
4. Merge the version PR. The release workflow then:
   - publishes `@mantaray0/crew` to npm (`pnpm publish --access public`),
   - creates the git tag `x.x.x` and a GitHub Release `x.x.x`.

No manual version edits, no `v` prefix. To cut the first release, the repo already contains an
initial `minor` changeset, so the first version PR will set `0.1.0`.

## Local checks

```bash
pnpm install
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```
