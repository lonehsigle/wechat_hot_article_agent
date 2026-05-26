#!/usr/bin/env bash
set -euo pipefail

echo "[verify] typecheck"
npm run typecheck

echo "[verify] build"
npm run build

echo "[verify] unit tests"
npx vitest run --pool forks --maxWorkers 1 --no-file-parallelism --reporter dot

echo "[verify] secret scan"
tracked_files=()
while IFS= read -r -d '' file; do
  if [[ -f "${file}" ]]; then
    tracked_files+=("${file}")
  fi
done < <(git ls-files -z)

secret_matches="$(
  if [[ "${#tracked_files[@]}" -gt 0 ]]; then
    rg -n "sk-[A-Za-z0-9_-]{12,}|AIza[0-9A-Za-z_-]{20,}|xox[baprs]-[0-9A-Za-z-]{10,}|gh[pousr]_[A-Za-z0-9_]{20,}|BEGIN (RSA |EC |OPENSSH |PRIVATE )?PRIVATE KEY|password\\s*[:=]\\s*['\"][^'\"]{8,}|api[_-]?key\\s*[:=]\\s*['\"][^'\"]{12,}|token\\s*[:=]\\s*['\"][^'\"]{12,}" "${tracked_files[@]}" \
      | rg -v "src/test/__tests__/api/auth\\.test\\.ts" || true
  fi
)"
if [[ -n "${secret_matches}" ]]; then
  echo "${secret_matches}"
  echo "[verify] potential secret found"
  exit 1
fi

echo "[verify] first-principles scan"
if rg -n "void\\s+maybe|Auto-syncing|setInterval\\(|mock[A-Z]|generateMock|演示数据已开启" src/app src/lib; then
  echo "[verify] Review the matches above. Demo/mock code must be explicit opt-in or non-production."
fi

echo "[verify] diff whitespace"
git diff --check

echo "[verify] ok"
