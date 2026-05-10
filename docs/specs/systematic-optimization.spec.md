# Spec: Systematic First-Principles Optimization

Spec ID: `cm-first-principles-optimization`
Version: `2026-05-10.locked`
Status: locked baseline

## Change Policy

This file is the requirement baseline. Do not edit it during implementation, task execution, or context-compression recovery.

Allowed changes:

- A deliberate requirement update requested by the user.
- A new version created with an updated manifest hash.
- A correction that is recorded in the ledger and evidence log.

Current task state belongs in `systematic-optimization.ledger.md`.
Verification evidence belongs in `systematic-optimization.evidence.md`.

## User Requirement

The system must become a truthful, production-oriented content operations app. Completion is not measured by feature names, buttons, or optimistic API responses. Completion is measured by real capability, explicit blocked/degraded states, and fresh verification evidence.

## First-Principles Invariants

1. UI actions and API success responses must map to real business capability.
2. API routes may expose explicit one-shot actions, but must not pretend to be resident schedulers or long-running background workers.
3. Mock/demo data must never enter production paths unless explicitly enabled.
4. Total failure must not return `success: true`.
5. External data sources must declare their contract: official API, third-party API, manual import, crawler worker, database, search, LLM-generated, or demo-only.
6. AI-generated or unverified material must remain visible as `AI生成` / `待核验` until reviewed or explicitly confirmed.
7. Secrets, tokens, cookies, app secrets, API keys, and private config must stay out of git and out of browser-editable settings.
8. A task is complete only when implementation, tests, build/typecheck, and evidence all support that status.
9. Long-lived todo state must not be stored only in model context. The locked baseline, mutable ledger, and evidence log on disk are the source of truth after context compression.

## Functional Optimization Routes

P0. Stable gates and task baseline.

P1. Product-state governance for unavailable or degraded features.

P2. Explicit worker/job infrastructure for manual or external execution.

P3. Real data-source contracts and source provenance.

P4. Content-loop metrics without hidden sync in read routes.

P5. Production safety and auditability.

P6. Operations status and health visibility.

P7. WeChat account capability probing.

P8. Official WeChat datacube statistics.

P9. Publish loop completion and ID separation.

P10. External hot-source governance.

P11. Frontend operations status page.

P12. Persistent job run history.

P13. Fact verification and source scoring.

## Acceptance Standard

For each route:

- `pending`: no implementation claim.
- `implemented_unverified`: code or docs changed, but full verification is missing.
- `completed`: implementation exists, relevant tests pass, build/typecheck pass, and evidence is logged.
- `blocked`: external credential, platform permission, or user decision is required.

Do not mark a route `completed` based only on memory, handoff text, or partial tests.
