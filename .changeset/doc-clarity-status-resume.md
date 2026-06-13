---
"@mantaray0/crew": patch
---

Clarify the `/crew:status` vs `/crew:resume` distinction in both command docs (`status` = any-time read-only dashboard; `resume` = session bootstrap that reads the session snapshot — DO NOT RETRY + the exact next step). Fix a dead `/crew:new` reference in `/crew:complete-milestone`'s hand-off (now points to real verbs). Align `/crew:complete-milestone`'s audit so `[~]` deferred phases are non-blocking for close-out, consistent with the `/crew:execute` boundary guard.
