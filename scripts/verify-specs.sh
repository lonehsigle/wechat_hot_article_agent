#!/usr/bin/env bash
set -euo pipefail

manifest="${1:-docs/specs/systematic-optimization.manifest}"

if [[ ! -f "${manifest}" ]]; then
  echo "[verify-specs] manifest not found: ${manifest}"
  exit 1
fi

get_value() {
  local key="$1"
  local value
  value="$(awk -F= -v k="${key}" '$1 == k { print substr($0, index($0, "=") + 1) }' "${manifest}")"
  if [[ -z "${value}" ]]; then
    echo "[verify-specs] missing manifest key: ${key}" >&2
    exit 1
  fi
  printf '%s' "${value}"
}

spec_path="$(get_value spec)"
tasks_path="$(get_value tasks)"
ledger_path="$(get_value ledger)"
evidence_path="$(get_value evidence)"
expected_spec_sha="$(get_value spec_sha256)"
expected_tasks_sha="$(get_value tasks_sha256)"

for path in "${spec_path}" "${tasks_path}" "${ledger_path}" "${evidence_path}"; do
  if [[ ! -f "${path}" ]]; then
    echo "[verify-specs] required file not found: ${path}"
    exit 1
  fi
done

actual_spec_sha="$(shasum -a 256 "${spec_path}" | awk '{ print $1 }')"
actual_tasks_sha="$(shasum -a 256 "${tasks_path}" | awk '{ print $1 }')"

if [[ "${actual_spec_sha}" != "${expected_spec_sha}" ]]; then
  echo "[verify-specs] locked spec drift detected: ${spec_path}"
  echo "[verify-specs] expected ${expected_spec_sha}"
  echo "[verify-specs] actual   ${actual_spec_sha}"
  exit 1
fi

if [[ "${actual_tasks_sha}" != "${expected_tasks_sha}" ]]; then
  echo "[verify-specs] locked tasks drift detected: ${tasks_path}"
  echo "[verify-specs] expected ${expected_tasks_sha}"
  echo "[verify-specs] actual   ${actual_tasks_sha}"
  exit 1
fi

if rg -n '^\s*-\s+\[[ xX]\]' "${tasks_path}" >/tmp/verify-specs-checkboxes.$$; then
  cat /tmp/verify-specs-checkboxes.$$
  rm -f /tmp/verify-specs-checkboxes.$$
  echo "[verify-specs] locked task baseline must not use mutable checkboxes"
  exit 1
fi
rm -f /tmp/verify-specs-checkboxes.$$

if ! rg -n 'implemented_unverified|completed|pending|blocked|in_progress' "${ledger_path}" >/dev/null; then
  echo "[verify-specs] ledger has no recognized status terms: ${ledger_path}"
  exit 1
fi

if ! rg -n '^\| E-' "${evidence_path}" >/dev/null; then
  echo "[verify-specs] evidence log has no evidence ids: ${evidence_path}"
  exit 1
fi

echo "[verify-specs] ok"
