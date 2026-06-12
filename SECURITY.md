# Security Policy

## Reporting a vulnerability

Please **do not** open a public issue for security problems.

Report vulnerabilities privately via this repository's
**[GitHub Security Advisories](https://github.com/mantaray0/crew/security/advisories/new)**
("Report a vulnerability"). We'll acknowledge your report, investigate, and keep you updated on
the fix and disclosure timeline.

## Scope

crew is a Claude Code plugin: markdown commands/agents/skills plus small Node lifecycle hook
scripts (`hooks/scripts/*.mjs`). Relevant concerns include:

- Hook scripts executing untrusted input (they are designed to be input-light and to never throw).
- Commands that instruct file writes/git operations against a project's `.planning/` state.
- The release workflow (`.github/workflows/release.yml`).

The plugin does not run a server and ships no secrets. Hook scripts use `execFile` with argument
arrays (no shell) and read only local project files.

## Supported versions

The latest released version receives security fixes.
