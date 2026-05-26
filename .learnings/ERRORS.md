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

## [ERR-20260526-001] verify_secret_scan_deleted_tracked_files

**Logged**: 2026-05-26T02:15:45Z
**Priority**: medium
**Status**: pending
**Area**: tests

### Summary
`npm run verify` printed `rg: ... No such file or directory` during the secret scan after tracked files were deleted in the working tree.

### Error
```
rg: playwright-report/index.html: No such file or directory (os error 2)
rg: pnpm-lock.yaml: No such file or directory (os error 2)
rg: test-results/.last-run.json: No such file or directory (os error 2)
```

### Context
- The verification script used `git ls-files -z | xargs -0 rg ...`.
- `git ls-files` includes tracked files that are deleted but not yet committed.
- Repository cleanup tasks commonly create this exact state before commit.

### Suggested Fix
Filter `git ls-files` through `test -f` before passing paths to `rg`.

### Metadata
- Reproducible: yes
- Related Files: scripts/verify.sh

---

## [ERR-20260526-002] article_export_test_invalid_mp_url

**Logged**: 2026-05-26T10:40:00+08:00
**Priority**: low
**Status**: resolved
**Area**: tests

### Summary
The first article-export XLSX regression test used a WeChat article URL path that the production route correctly rejects.

### Error
```
AssertionError: expected 400 to be 200
```

### Context
- Command attempted: `npx vitest run src/test/__tests__/api/article-export.test.ts --pool forks --maxWorkers 1 --no-file-parallelism --reporter verbose`
- Test data used `https://mp.weixin.qq.com/s/a` and `/s/b`.
- `isValidMpArticleUrl` requires the pathname to be exactly `/s`, with article identity in query parameters.

### Suggested Fix
Use realistic `https://mp.weixin.qq.com/s?...` fixture URLs when testing article-export routes.

### Metadata
- Reproducible: yes
- Related Files: src/test/__tests__/api/article-export.test.ts

---

## [ERR-20260526-003] git_push_missing_github_credentials

**Logged**: 2026-05-26T11:18:00+08:00
**Priority**: medium
**Status**: pending
**Area**: infra

### Summary
Pushing the cleanup branch to GitHub failed because this local non-interactive shell has no usable GitHub credentials.

### Error
```
fatal: could not read Username for 'https://github.com': Device not configured
git@github.com: Permission denied (publickey).
```

### Context
- Command attempted: `git push -u origin codex/systematic-optimization`
- Remote is `https://github.com/lonehsigle/wechat_hot_article_agent.git`.
- `gh auth status` reports no logged-in GitHub host.
- SSH auth to `git@github.com` is rejected.

### Suggested Fix
Authenticate GitHub for this machine with `gh auth login`, configure an SSH deploy/user key, or provide a credentialed remote before retrying push.

### Metadata
- Reproducible: yes
- Related Files: git remote origin

---
