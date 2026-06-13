---
"@mantaray0/crew": minor
---

Add release-mechanics awareness to deploy. New `config.deploy.releaseTool` (`auto`/`changesets`/`release-please`/`semantic-release`/`manual`/`none`) replaces ship's hardcoded Changesets detection — ship now branches its version/commit/tag steps by the tool (local bump vs. push-only vs. CI-autonomous). New `config.deploy.finishRelease` (`off`/`ask`/`auto`, default `ask`) lets ship merge an open bot version-PR to finish the release (changesets/release-please only). `/crew:init` now runs an active deploy/release interview that feeds these axes and creates the `reference/deploy.md` runbook; `/crew:setup` captures the global defaults. Additive — existing configs gain the new fields with defaults at reconcile.
