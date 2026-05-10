# Ledger: Systematic First-Principles Optimization

Task Set ID: `cm-first-principles-optimization`
Mutable: yes

This file is the only place to change route status during execution. The locked spec and task baseline must not be edited to reflect progress.

## Status Definitions

- `pending`: not started.
- `in_progress`: actively being changed.
- `implemented_unverified`: implementation or docs changed, but full verification is missing.
- `completed`: verified with logged evidence.
- `blocked`: external credential, platform permission, or user decision is required.

## Route Status

| Route | Status | Evidence | Notes |
| --- | --- | --- | --- |
| P0 | completed | E-2026-05-10-001, E-2026-05-10-002, E-2026-05-10-008 | Stable gates and task docs are covered by the full verification gate. |
| P1 | completed | E-2026-05-10-001, E-2026-05-10-002 | Capability truthfulness work is present in current tree. |
| P2 | completed | E-2026-05-10-001, E-2026-05-10-002 | Explicit job and worker-token contract is present. |
| P3 | completed | E-2026-05-10-001, E-2026-05-10-002 | Data-source contract surface is present. |
| P4 | completed | E-2026-05-10-001, E-2026-05-10-002 | Analytics read route is designed as read-only. |
| P5 | completed | E-2026-05-10-001, E-2026-05-10-002 | Audit and worker-token checks are present. |
| P6 | completed | E-2026-05-10-001, E-2026-05-10-002 | Operations status and health surfaces are present. |
| P7 | completed | E-2026-05-10-008 | WeChat account capability probing is implemented and covered by the full verification gate. |
| P8 | completed | E-2026-05-10-008 | Datacube statistics sync is implemented and covered by the full verification gate. |
| P9 | completed | E-2026-05-10-008 | Publish status refresh, backfill, and ID separation are implemented and covered by the full verification gate. |
| P10 | completed | E-2026-05-10-008 | External hot-source contract governance is implemented and covered by the full verification gate. |
| P11 | completed | E-2026-05-10-008 | Dashboard operations status visibility is implemented and covered by the full verification gate. |
| P12 | completed | E-2026-05-10-008 | Persistent job run tracking is implemented and covered by the full verification gate. |
| P13 | completed | E-2026-05-10-008 | Source scoring and publish guard behavior are implemented and covered by the full verification gate. |
| TODO-STABILITY | completed | E-2026-05-10-004, E-2026-05-10-005 | Locked baseline, ledger, evidence, manifest verification, project instruction, and global Codex skill are deployed. |

## Recovery Rule

After context compression, resume from this table plus `systematic-optimization.evidence.md`. If a remembered status conflicts with this file, this file wins.
