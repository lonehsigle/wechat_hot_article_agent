# Core Direction And Technical Points

## First-Principles Direction

This project should be treated as a truthful content operations system for WeChat official-account publishing, not as a collection of feature buttons.

The core product loop is:

1. Discover topics from declared data sources.
2. Collect verifiable materials.
3. Generate, rewrite, and polish article drafts.
4. Create WeChat drafts through real configured accounts.
5. Publish and refresh publish status through official WeChat contracts.
6. Sync article statistics explicitly.
7. Review performance and feed it back into the next content loop.

Any step without a real executor, credential, data source, or platform permission must be represented as `blocked`, `degraded`, or `501`, not as optimistic success.

## Core Product Boundaries

- WeChat official-account operations are the primary production path.
- AI generation is an assistant layer, not an authority layer; generated or unverified content must remain visible as `AI生成` / `待核验` until reviewed.
- External hot sources must declare their source contract: official API, third-party API, manual import, crawler worker, search, database, LLM-generated, or demo-only.
- API routes can expose explicit one-shot actions. Reliable scheduled or long-running work belongs to an explicit job or worker contract.
- Demo and mock data are development aids only and must stay opt-in.
- Secrets belong in environment variables or server-side storage, never in git or browser-editable settings.

## Main Technical Stack

- Runtime and UI: Next.js App Router, React, TypeScript.
- Persistence: PostgreSQL through Drizzle ORM.
- Verification: TypeScript typecheck, Next production build, Vitest unit tests, spec drift check, secret scan, and whitespace check.
- WeChat integration: official draft, publish, account probing, and datacube/statistics APIs.
- Worker contract: `/api/jobs`, `INTERNAL_WORKER_TOKEN`, persisted job run history, and operations status.
- Operations visibility: `/api/health`, `/api/system/capabilities`, and `/api/ops/status`.
- Source governance: data-source contracts and source scoring before material enters publishing.

## Repository Hygiene Rules

- Use npm as the single package-manager path. `package-lock.json`, Dockerfile, README, and verification scripts all follow npm.
- Keep generated build/test artifacts out of git: `.next/`, `coverage/`, `playwright-report/`, and `test-results/`.
- Keep the locked optimization baseline in `docs/specs/` stable. Update execution progress only through the ledger and evidence files.
- Prefer small changes that preserve truthful behavior over broad rewrites.

## Current Refactor Focus

The current codebase already has the major first-principles production contracts in place. Further optimization should focus on reducing surface complexity around the largest UI/API modules, extracting repeated test mocks where they materially reduce maintenance cost, and keeping source contracts visible wherever external data enters the system.
