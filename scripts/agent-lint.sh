#!/bin/bash
# Agent harness linter — errors are agent-readable
set -euo pipefail
ERRORS=0
cd "$(git rev-parse --show-toplevel)"

echo "=== Agent Lint (tangyuan-farming) ==="

# Rule 1: Frontend build must pass
echo "[1/4] Building frontend..."
cd frontend
if ! npm run build > /dev/null 2>&1; then
  echo "LINT ERROR [build-failure]: Frontend build failed"
  echo "  FIX: Run 'cd frontend && npm run build' to see errors."
  ERRORS=$((ERRORS+1))
fi
cd ..

# Rule 2: Admin build must pass
echo "[2/4] Building admin..."
cd admin
if ! npx vite build > /dev/null 2>&1; then
  echo "LINT ERROR [build-failure]: Admin build failed"
  echo "  FIX: Run 'cd admin && npx vite build' to see errors."
  ERRORS=$((ERRORS+1))
fi
cd ..

# Rule 3: Check for console.log in production code
echo "[3/4] Checking for console.log..."
LOG_COUNT=$(grep -rn "console\.log" frontend/src/ admin/src/ 2>/dev/null | grep -v "//.*console\.log" | wc -l || true)
if [ -n "$LOG_COUNT" ] && [ "$LOG_COUNT" -gt 0 ]; then
  echo "LINT WARNING [console-log]: $LOG_COUNT console.log found"
  echo "  FIX: Remove console.log statements or replace with proper logging."
fi

# Rule 4: AGENTS.md length
echo "[4/4] Checking AGENTS.md length..."
if [ -f AGENTS.md ] && [ "$(wc -l < AGENTS.md)" -gt 150 ]; then
  echo "LINT ERROR [agents-too-long]: AGENTS.md exceeds 150 lines"
  echo "  FIX: Move details to docs/ and replace with pointers."
  ERRORS=$((ERRORS+1))
fi

echo "=== Lint: $ERRORS error(s) ==="
[ $ERRORS -eq 0 ] || exit 1
echo "All checks passed. ✓"
