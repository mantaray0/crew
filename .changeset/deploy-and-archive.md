---
"@mantaray0/crew": minor
---

Deploy/Release + roadmap archiving. New `config.deploy` (`mode`: off/orchestrate/execute, `provider`: gh-actions/gitlab-ci) and a `/crew:ship` command that drives version → commit → tag → push → PR → deploy, **bounded by `config.git`** (never pushes/PRs/commits in a way your git config disables). New `crew-deploy` skill and `.planning/DEPLOY.md` artifact. New `/crew:archive` and `/crew:complete-milestone` move finished milestones into `.planning/archive/` to keep the live roadmap small. CI-workflow scaffolding is intentionally out of this MVP.
