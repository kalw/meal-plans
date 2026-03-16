# Claude Instructions — meal-plans

## Token Efficiency

Keep token usage lean. This project is small; stay focused.

### Response style
- Be concise. No preamble, no summaries after completing a task.
- Avoid restating what you're about to do — just do it.
- Skip "I've updated X" confirmations unless asked.

### Context management
- Use `/compact` before switching to a new unrelated task.
- Use `/clear` to start fresh between separate issues.
- Do not re-read files you've already read in the same session unless the content may have changed.

### File reading
- Read only files relevant to the current task.
- Never read `node_modules/`, `dist/`, `*.lock`, or generated files.
- Prefer reading specific sections of large files over loading the full file.

### CLAUDE.md scope
- This file stays under 50 lines. Move task-specific instructions to comments or issues instead.

## Project Overview

A meal-planning app deployed on Cloudflare Workers. Core logic is in `core.js`. Tests live in `tests.js`.

## Commands

- `npm test` — run the test suite
- `npm run deploy` — deploy to Cloudflare Workers

## Code Style

- Plain JavaScript (no TypeScript).
- Keep functions small and pure where possible.
- Match the existing style in `core.js`.

## PR Conventions

- Branch naming: `claude/issue-<N>-<YYYYMMDD>-<HHMM>`
- Commit prefix: `fix:`, `feat:`, `test:`, `chore:`
- PRs should close the related issue (`Closes #N`).
