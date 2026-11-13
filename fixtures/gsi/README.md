# GSI fixtures

- `real-*.json`: recorded from a live CS2 practice match, then sanitized (Steam ID and player name replaced with fakes, auth token removed). Real payloads also carry `previously` and `added` diff blocks.
- Other files: hand-authored from the documented shape (menu-minimal, freezetime-no-bomb, live-bomb-carrier, bomb-planted). `bomb-planted` is the only planted-bomb sample and is not yet recorded: record a plant to replace it.

When recording new payloads, run the receiver with `GSI_RECORD_DIR` set and sanitize before copying anything here.
