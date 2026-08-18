# AGENTS.md

## Project Rules

- Read this file before making code changes in this project.
- Prefer existing project patterns over new abstractions.
- Keep edits scoped to the approved optimization design.
- Do not revert user changes unless explicitly asked.
- Do not commit, push, deploy, or write to production without explicit current authorization.

## Build And Test

- Install dependencies with `npm ci`.
- Validate changes with `npm run typecheck`, `npm test`, `npm run build`, and `npm run test:e2e`.
- Run the consolidated local gate with `npm run verify`.
- Apply PostgreSQL migrations with `npm run db:migrate` against a local or test database.

## Notes

- Treat external API keys, WeChat credentials, and database URLs as secrets.
- Use local or test environments for verification.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
