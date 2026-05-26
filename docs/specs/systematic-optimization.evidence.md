# Evidence: Systematic First-Principles Optimization

Task Set ID: `cm-first-principles-optimization`
Mutable: yes

Record fresh verification here. Interrupted or partial commands are evidence of unknown status, not success.

## Evidence Log

| ID | Date | Command / Source | Result | Applies To | Notes |
| --- | --- | --- | --- | --- | --- |
| E-2026-05-10-001 | 2026-05-10 | `npm run typecheck` | passed | P0-P13 | Fresh run in this session exited 0. |
| E-2026-05-10-002 | 2026-05-10 | `npm run build` | passed | P0-P13 | Fresh run in this session exited 0 with Next.js production build success. |
| E-2026-05-10-003 | 2026-05-10 | `npx vitest run --pool forks --maxWorkers 1 --no-file-parallelism --reporter dot` | interrupted | P7-P13 | User interrupted after about 10 seconds; this is not passing evidence. |
| E-2026-05-10-004 | 2026-05-10 | Spec/todo stability deployment | completed | TODO-STABILITY | Global Codex skill and project spec files were added. |
| E-2026-05-10-005 | 2026-05-10 | `bash scripts/verify-specs.sh` | passed | TODO-STABILITY | Locked spec/tasks hash verification exited 0. |
| E-2026-05-10-006 | 2026-05-10 | `npm run typecheck` | passed | TODO-STABILITY | Fresh run after spec/todo stability changes exited 0. |
| E-2026-05-10-007 | 2026-05-10 | `git diff --check` | passed | TODO-STABILITY | Fresh whitespace check exited 0. |
| E-2026-05-10-008 | 2026-05-10 | `npm run verify` | passed | P7-P13 | Fresh full gate exited 0: typecheck, spec drift, Next.js build, 41 test files / 531 tests, secret scan, first-principles scan, and diff whitespace. First-principles scan printed mock/demo review matches but did not fail because current code keeps those paths explicit opt-in or non-production. |
| E-2026-05-26-001 | 2026-05-26 | `npm run verify` | passed | REPO-HYGIENE | Fresh full gate exited 0 after repository cleanup: typecheck, spec drift, Next.js build, 41 test files / 531 tests, secret scan, first-principles scan, and diff whitespace. Secret scan no longer reports deleted tracked paths. |
| E-2026-05-26-002 | 2026-05-26 | `npx tsc --noEmit --noUnusedLocals --noUnusedParameters --pretty false` | passed | DEAD-CODE-CLEANUP | Fresh strict TypeScript unused-local/unused-parameter check exited 0 after removing stale imports, dead state, unused handlers, and unused locals. |
| E-2026-05-26-003 | 2026-05-26 | `npm audit --omit=dev --json`; `npm audit --json` | passed | DEPENDENCY-HYGIENE | Fresh production and full dependency audits reported 0 vulnerabilities after dependency updates and overrides. |
| E-2026-05-26-004 | 2026-05-26 | `npx depcheck --json` | passed | DEPENDENCY-HYGIENE | Fresh dependency usage scan reported no unused dependencies, unused devDependencies, or missing dependencies. |
| E-2026-05-26-005 | 2026-05-26 | `npm run verify` | passed | FINAL-GATE | Fresh full gate exited 0 after all cleanup: typecheck, spec drift, Next.js build, 42 test files / 532 tests, secret scan, first-principles scan, and diff whitespace. First-principles scan still prints existing explicit opt-in/non-production demo/mock review matches and exits 0. |
