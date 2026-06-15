---
"@mantaray0/crew": patch
---

Name config migrations by public version, not internal milestones.

The config-reconcile instructions in `/crew:init`, `/crew:setup`, `/crew:update`, and the `crew-config` skill referred to crew's internal development milestones when describing the known config migrations — labels that surfaced to users at reconcile time. They are replaced with descriptive names plus the public version gate that was always the real boundary: the "section-rename migration", the "workflow-nesting migration", and the one-time "inherit-first cleanup" gated on `crewVersion` < `0.16.0`. Migration logic, mappings, and version gates are unchanged.

The `planning` skill's separator example no longer uses a real internal slug and gains a "rename & reference-migration phases" convention (whole-tree grep exit gate). A new `scripts/validate-plugin.mjs` check, run in CI, fails if an internal milestone label reappears anywhere in shipped content.
