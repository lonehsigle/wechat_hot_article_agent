## [ERR-20260501-001] frontend_validation_test_fixture

**Logged**: 2026-05-01T13:48:00+08:00
**Priority**: medium
**Status**: pending
**Area**: tests

### Summary
Updating frontend password validation from 6 to 8 characters broke a login form test that still submitted a 6-character password.

### Error
```
LandingPage > submits login form successfully
expected "vi.fn()" to be called with arguments: [ '/api/auth', Any<Object> ]
```

### Context
- Changed UI validation to match the backend's 8-character password requirement.
- The test fixture still used `123456`, so client validation blocked the submit before `fetch('/api/auth')`.

### Suggested Fix
When aligning frontend validation with backend constraints, update component/API tests that submit boundary-value fixtures.

### Metadata
- Reproducible: yes
- Related Files: src/app/components/LandingPage.tsx, src/test/__tests__/components/LandingPage.test.tsx

---

## [ERR-20260501-002] parallel_next_build_typecheck_race

**Logged**: 2026-05-01T14:10:00+08:00
**Priority**: medium
**Status**: pending
**Area**: tests

### Summary
Running `npm run build` and `npm run typecheck` in parallel caused `tsc` to see missing `.next/types` files while Next was regenerating them.

### Error
```
error TS6053: File '.next/types/app/.../route.ts' not found.
```

### Context
- `tsconfig.json` includes `.next/types/**/*.ts`.
- `next build` rewrites `.next/types`.
- Running `tsc --noEmit` concurrently can race with that rewrite.

### Suggested Fix
Run `npm run build` and `npm run typecheck` sequentially when `.next/types` is included in the TypeScript project.

### Metadata
- Reproducible: yes
- Related Files: tsconfig.json

---

## [ERR-20260501-003] vitest_jest_option_mismatch

**Logged**: 2026-05-01T14:38:00+08:00
**Priority**: low
**Status**: pending
**Area**: tests

### Summary
Vitest rejected the Jest-only `--runInBand` option.

### Error
```
CACError: Unknown option `--runInBand`
```

### Context
- Command attempted: `npm test -- --runInBand src/test/__tests__/api/crawler.test.ts`
- This project uses Vitest, not Jest.

### Suggested Fix
Use Vitest-supported options for this project: `--pool forks --maxWorkers 1 --no-file-parallelism` when single-worker execution is needed.

### Metadata
- Reproducible: yes
- Related Files: package.json

---
