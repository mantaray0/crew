---
description: Deprecated alias for /crew:complete — closes out a finished milestone (audit → summarize → archive).
argument-hint: "[milestone slug, optional — defaults to the active/latest milestone]"
---

# /crew:complete-milestone (alias)

This command was **renamed to `/crew:complete`**. The alias stays for backward compatibility until a future major version removes it.

**Execute the steps in [`commands/complete.md`](complete.md)** exactly as written — audit → summarize → update PROJECT.md → archive, wrapping `/crew:archive`. Pass through any `$ARGUMENTS` (the milestone slug). There is no separate logic here: `complete.md` is the single source of truth.

When you finish, mention once in your reply that `/crew:complete-milestone` is now `/crew:complete`.
