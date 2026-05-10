# AGENTS.md

## Project Rules

- Read this file before making code changes in this project.
- Prefer existing project patterns over new abstractions.
- Keep edits scoped to the user's request.
- Do not revert user changes unless explicitly asked.
- Production behavior must be truthful: no hidden resident jobs in API routes, no demo/mock fallback unless explicitly enabled, and no success response for total failure.
- Keep secrets out of git. Runtime secrets belong in environment variables or server-side storage, not browser-editable config.
- For long-running optimization work, use the locked spec flow in `docs/specs/`: read `systematic-optimization.manifest`, verify it with `bash scripts/verify-specs.sh`, treat `*.spec.md` and `*.tasks.md` as immutable baselines, and update only `*.ledger.md` plus `*.evidence.md` for progress.

## Build And Test

- Typecheck: `npm run typecheck`
- Build: `npm run build`
- Stable unit test command: `npx vitest run --pool forks --maxWorkers 1 --no-file-parallelism --reporter dot`
- Spec drift check: `bash scripts/verify-specs.sh`
- Full local gate: `npm run verify`

## Notes

- This is a Next.js content monitoring app under the `content-monitor` git repo.
- API routes may expose manual one-shot actions, but reliable scheduled or long-running work must go through an explicit job/worker contract.
