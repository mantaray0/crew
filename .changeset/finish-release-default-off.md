---
"@mantaray0/crew": patch
---

Default `deploy.finishRelease` to `off` so new scaffolds never auto-merge a bot version-PR; existing configs are untouched (reconcile never writes a changed default over a set value).
