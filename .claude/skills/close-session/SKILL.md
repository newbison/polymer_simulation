---
name: close-session
description: End a work session by updating CLAUDE.md, saving session memory, logging changes, and pushing to GitHub. The full shutdown checklist.
---
# Close Session

Wrap up a work session: update documentation, persist context, log what changed, and push to GitHub. Treat this as the "shutdown checklist" before walking away.

**Announce at start:** "Closing this session — let me save everything."

## Step 1: Review what changed

```bash
git status
git diff
```

Identify:

- Files added, modified, or deleted
- New features, bug fixes, refactors
- Configuration or documentation changes
- Open threads not yet resolved

## Step 2: Update CLAUDE.md

Check if `CLAUDE.md` is still accurate:

- **New files or directories?** Update the project layout section.
- **New conventions or patterns?** Add them to the coding conventions.
- **New dependencies or tools?** Document them.
- **Architecture changed?** Update the architecture section.

If nothing structural changed, skip the CLAUDE.md update — don't edit it just for the sake of editing it.

## Step 3: Save session memory

Write a session summary to the project memory directory at:
`C:\Users\DELL\.claude\projects\D--coding-is-fun-polymer-simulation\memory\`

Create a file named `session-YYYY-MM-DD.md` (today's date) with:

```markdown
---
name: session-YYYY-MM-DD
description: Session summary — what we worked on, decisions made, files changed
type: project
---

## What we did

- [Bullet list of accomplishments]

## Key decisions

- [Decisions made and why]

## Open threads

- [Things not yet finished]

## Files changed

- [List of key files modified]
```

Update `MEMORY.md` with a pointer to this session file. Remove old session entries if there are more than 5.

Also proactively update any other memory files:

- `project-context.md` if the overall direction shifted
- `user-prefs.md` if new preferences emerged
- `feedback.md` if the user corrected any approach

## Step 4: Log major updates

Append to `CHANGELOG.md` at the project root (create if it doesn't exist):

```markdown
## YYYY-MM-DD

- [One-line summary of each major change]
```

Be concise — one bullet per significant change, not every file edit.

## Step 5: Commit and push

```bash
git add -A
git status  # review what's staged
```

**Important:** Don't blindly `git add -A`. Exclude files that shouldn't be committed:

- `.claude/settings.local.json` (local settings)
- `.env` files, credentials, tokens
- Large binary files or generated output

If there's nothing meaningful to commit, skip to Step 6.

```bash
git commit -m "session: <brief summary of work done>"
git push
```

If pushing fails (no network, etc.), warn the user but don't block — the commit is what matters.

## Step 6: Confirm

Tell the user what was saved and pushed. Keep it to 3-4 lines:

```
Session closed. Here's what I saved:

- CLAUDE.md: <updated or "no changes needed">
- Memory: session-YYYY-MM-DD.md
- Changelog: <N> entries added
- GitHub: <pushed or "nothing to push">
```
