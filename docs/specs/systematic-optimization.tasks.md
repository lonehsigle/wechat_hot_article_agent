# Tasks: Systematic First-Principles Optimization

Task Set ID: `cm-first-principles-optimization`
Generated From: `systematic-optimization.spec.md`
Version: `2026-05-10.locked`
Status: locked baseline

## Change Policy

This file is the immutable task baseline. It intentionally does not use checkboxes. Do not mark progress here.

Progress belongs in `systematic-optimization.ledger.md`.
Verification belongs in `systematic-optimization.evidence.md`.

## P0 Stable Gates And Task Baseline

- P0.1 Create project-level operating rules.
- P0.2 Provide a full verification command.
- P0.3 Keep a durable optimization baseline and completion standard.

## P1 Unavailable Feature Governance

- P1.1 Expose system capabilities through an API.
- P1.2 Represent unavailable features as `blocked` or `degraded`.
- P1.3 Remove wording that implies API routes are resident background workers.
- P1.4 Correct WeChat draft sync to use the real official draft list path when configured.

## P2 Worker And Job Contract

- P2.1 Add a job registry.
- P2.2 Add an explicit `/api/jobs` contract for listing and manual execution.
- P2.3 Require `INTERNAL_WORKER_TOKEN` for external worker calls.
- P2.4 Return `501` for tasks without a real executor.
- P2.5 Connect WeChat draft sync to a real server-side configured account path.

## P3 Data Source Provenance

- P3.1 Add source contracts for database, search, LLM, manual, official API, third-party API, worker, and demo-only sources.
- P3.2 Surface data-source state through capability and operations APIs.
- P3.3 Preserve AI-generated and unverified labels as production boundaries.

## P4 Content Metrics Loop

- P4.1 Remove implicit analytics sync from read routes.
- P4.2 Keep analytics GET read-only.
- P4.3 Expose latest sync state and explicit sync entry points.

## P5 Safety And Auditability

- P5.1 Record job start, completion, and failure in audit logs.
- P5.2 Surface audit write failures as warnings.
- P5.3 Cover worker-token middleware boundaries in tests.

## P6 Operations Visibility

- P6.1 Add `/api/ops/status`.
- P6.2 Add capability summaries and worker-token safety hints to `/api/health`.
- P6.3 Do not report completion without full verification evidence.

## P7 WeChat Account Capability Probing

- P7.1 Detect missing appId/appSecret.
- P7.2 Detect access-token retrieval success/failure.
- P7.3 Probe draft list permission.
- P7.4 Probe publish permission and classify official API failures.
- P7.5 Probe datacube permission and distinguish no permission, no data, and low-volume/no-stat cases.
- P7.6 Surface account-level checks in capability and operations APIs.
- P7.7 Cover missing config, token failure, draft failure, publish failure, and stats failure in tests.

## P8 Official WeChat Datacube Statistics

- P8.1 Add minimal datacube client paths for article summary, user read, and article total.
- P8.2 Persist daily stats to `article_stats_daily`.
- P8.3 Keep analytics GET read-only; sync only through explicit routes/jobs.
- P8.4 Mark low-volume, no-permission, not-ready-date, and partial-failure statuses.
- P8.5 Cover success, no data, permission failure, and partial article failure in tests.

## P9 Publish Loop Completion

- P9.1 Add `freepublish/get` status refresh.
- P9.2 Add `freepublish/batchget` published-list backfill.
- P9.3 Separate draft `media_id`, publish `publish_id`, and article `msg_data_id`.
- P9.4 Expose manual publish-status refresh.
- P9.5 Cover draft creation, publish submit, status refresh, list backfill, and failure classification in tests.

## P10 External Hot-Source Governance

- P10.1 Add `sourceContract` for hot-source platforms.
- P10.2 Block Douyin/Xiaohongshu mock production results unless a real source is configured.
- P10.3 Provide a manual-import contract when no official API is available.
- P10.4 Record provider, authorization mode, updated time, failure reason, and compliance notes.
- P10.5 Show source credibility and verification state before material enters creation.

## P11 Frontend Operations Status

- P11.1 Connect `/api/ops/status` to the admin dashboard.
- P11.2 Bind blocked/degraded capability state to real feature entries.
- P11.3 Show security configuration presence without exposing secret values.
- P11.4 Cover status loading, warnings, and blocked feature hints in frontend tests.

## P12 Persistent Job Runs

- P12.1 Add `job_runs` persistence.
- P12.2 Record started, succeeded, and failed job executions from `/api/jobs`.
- P12.3 Expose recent runs, failure rate, and last success in operations status.
- P12.4 Preserve external worker-token execution instead of hiding resident schedules in API routes.
- P12.5 Cover success and failure paths in tests.

## P13 Fact Verification And Source Scoring

- P13.1 Score materials by URL count, accessibility, source type, and manual verification.
- P13.2 Block or require explicit confirmation before publishing AI-generated or unverified material.
- P13.3 Report source coverage in capability or operations status.
- P13.4 Cover no-source, search-source, LLM-inferred, and manually verified material in tests.
