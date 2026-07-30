---
"@mantaray0/crew": minor
---

Notifications are push-only: the local `os` channel is gone. It shelled out to `osascript`/`notify-send`, and on macOS the OS attributes such a notification to the invoking script host — so it showed up under a foreign icon and clicking it opened the Script Editor instead of the session. That attribution cannot be fixed from a plugin (a proper sender needs a signed app bundle), and Claude Code already ships its own local notifications, so nothing is lost.

`notifications.channel` now takes `off` (the new default) · `push:ntfy` · `push:pushover`. `/crew:update` maps a frozen `"os"` to `"off"` and flags the default flip for configs that inherit the channel — those stop notifying locally and can opt into `push:ntfy` (with `CREW_NTFY_TOPIC`) to get pinged off-machine. The `Notification`/`Stop` hooks stay wired for the push channels.
