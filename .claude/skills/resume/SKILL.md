---
name: resume
description: On reopening the project, read CLAUDE.md, CHANGELOG.md, and session memory to catch up on what happened. The session-start counterpart to close-session.
---
# Resume

* [ ] 

**Announce at start:** "Let me catch up on what's happened..."

## Step 1: Read core documentation

Read these files in order:

1. `CLAUDE.md` — architecture, conventions, file layout
2. `README.md` — project overview and usage

## Step 2: Read the changelog

Read `CHANGELOG.md` if it exists. Focus on the most recent entries (last 2-3 dates). This tells you what changed recently.

## Step 3: Read session memory

Read `C:\Users\DELL\.claude\projects\D--coding-is-fun-polymer-simulation\memory\MEMORY.md` for the index, then read the 2-3 most recent session files. Look for:

- Open threads that need attention
- Decisions that are still relevant
- User preferences noted in recent sessions

## Step 4: Check git state

```bash
git status
git log --oneline -5
```

This shows uncommitted work-in-progress and recent commits.

## Step 5: Summarize

Report to the user in 3-4 bullets:

```
I'm caught up. Here's where things stand:

- Project: <one-line description>
- Last session: <what was done>
- Open: <any unfinished threads>
- Git: <clean | N files modified>
```

Then ask: "What should we work on today?"
