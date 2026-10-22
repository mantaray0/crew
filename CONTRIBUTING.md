# Contributing to crew

Thanks for your interest in improving **crew**, a small planning plugin for
[Claude Code](https://www.claude.com/product/claude-code).

crew is **markdown + small Node hook scripts** — there is **no build, no TypeScript, no npm package**.
Claude runs everything through the plugin against a project's `.planning/` files. That keeps
contributions approachable: most changes are editing a command, agent, or skill file.

## Repository layout

| Path | What it is |
|------|------------|
| `commands/*.md` | Slash commands (`/crew:*`) — the user-facing control surface |
| `agents/executor.md` | The phase sub-agent `/crew:execute` spawns |
| `skills/<name>/SKILL.md` | Reusable knowledge/procedures the workflow relies on |
| `hooks/` | `hooks.json` + self-contained `.mjs` lifecycle scripts |
| `.claude-plugin/plugin.json` | The plugin manifest |
| `scripts/validate-plugin.mjs` | Structure, reference and word-budget check run in CI |
| `scripts/*.test.mjs` | Tests for the SessionStart hook and the config cleanup |

## Authoring conventions

- **Commands** need YAML frontmatter with a `description` (and optionally `argument-hint`).
- **Agents** need frontmatter with `name`, `description`, `tools`, `model`, and a clear task focus.
- **Skills** live at `skills/<name>/SKILL.md` with frontmatter `name` and `description`.
- The `.planning/` format and the config live in one place, `skills/crew-state/SKILL.md`; commands
  point there instead of restating it.
- Write only what changes the model's behavior. The validator enforces a word budget for
  `commands/`, `agents/` and `skills/`; raise it deliberately, never as a side effect.
- No references to other harnesses' names or branding.

## Local checks

```bash
node scripts/validate-plugin.mjs   # manifest, frontmatter, references, word budget
pnpm test                          # SessionStart hook and config cleanup
claude plugin validate .           # Claude Code's own manifest check
```

Try your change by pointing Claude Code at your fork:

```
/plugin marketplace add <your-fork-path-or-repo>
/plugin install crew
```

## Submitting changes

1. Fork and branch (`feat/…`, `fix/…`, `docs/…`).
2. Make your change; keep commits focused. We use [Conventional Commits](https://www.conventionalcommits.org/)
   (`feat:`, `fix:`, `docs:`, `chore:`).
3. **Add a changeset** for any user-facing change:
   ```bash
   pnpm changeset      # pick patch | minor | major, write a short summary
   ```
4. Run `node scripts/validate-plugin.mjs` and open a PR. CI validates structure; the maintainer
   cuts releases via the changesets flow.

## Code of Conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). By participating you agree to
uphold it.
