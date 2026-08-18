# Implementation Plan 01 — Part 1 (Node/JS/Express & Hexagonal Scaffold)

Derived from Part 1 of [implementation_plan.md](./implementation_plan.md). Part 1's endpoints and
scaffold are already built; this plan turns that section's open checklist items into concrete,
executable steps — fix the two spec-visible bugs, implement the one open design question, and close the
test gaps. Ordered so each step can be done and verified independently.

## [x] 1. Body-parser errors: map the remaining status codes

**Problem:** `ErrorHandler.ts` only special-cases malformed JSON (`SyntaxError`). `entity.too.large`
(should be 413) and `encoding.unsupported` (should be 415) still fall through to 500.

**Fix:** generalize the existing malformed-JSON branch in `ErrorHandler.ts` to key off `err.status < 500`
for any body-parser error (each already carries the correct `status` from Express's body-parser), instead
of checking `SyntaxError` specifically. Keep the spec's error response shape (`{status, code, message}`).

**Verify:** add a case to whatever test currently exercises the malformed-JSON path (or a new one) that
POSTs an oversized body and an unsupported `Content-Type`/encoding, asserting 413 and 415 respectively.

## [x] 2. Stop `values.map(String)` from corrupting port numbers

**Problem:** `Validation.ts:32` stringifies every element of `values`, so `POST /api/firewall/ports` will
echo `"22"` instead of the spec's `22`. `Rule.value` is already typed `string | number`
(`domain/rules/Rule.ts:5`), so the domain layer already supports this — only the request-shape layer
forces everything to a string.

**Fix, in order (widen from the inside out):**
1. `createIP`/`isValidIPv4` (`domain/rules/ipType.ts`): add a `typeof value !== 'string'` guard so a
   stray number can't slip into an IP rule.
2. `Rule.build` / `RuleConstructor.create`: accept `string | number` and dispatch by rule type instead of
   assuming string.
3. `AddRuleRequest` type and `addRules` use case: widen the `values` array type to `(string | number)[]`.
4. `Validation.ts:32`: drop the `values.map(String)` coercion entirely — pass values through as received
   from JSON (numbers stay numbers, strings stay strings).

**Verify:** `POST /api/firewall/ports` with numeric `values` (e.g. `[22, 443]`) and confirm the response
echoes `22`/`443` as JSON numbers, not `"22"`/`"443"`. Re-run IP/domain tests to confirm they still pass
unchanged (they only ever send strings).

## 3. Implement duplicate-value rejection (global, 409)

**Not in the written spec**, but now a decided design: reject a duplicate on `(type, value)` **globally**
— a value can only exist in one list (blacklist or whitelist) at a time, not independently in both.

**Fix:**
- Add a typed error `DuplicateRuleError` (`application/errors.ts`, alongside `RuleNotFoundError`) with a
  `code: 'DUPLICATE_RULE'`.
- Map it in `ErrorHandler.ts` to **409 Conflict** (not 400 — this is a state conflict with existing data,
  not a malformed request), following the same pattern as the existing `RuleNotFoundError` → 404 mapping.
- Check for existing `(type, value)` matches against already-persisted rows during `addRules`'s
  pre-flight validation phase — the same batch-before-commit pattern already used by
  `addRules`/`removeRules`/`updateRuleStatus` — not inside `repository.add()` alone, so a batch can't
  partially persist before hitting a duplicate. This needs a repository lookup by `(type, value)` across
  both modes (not just by id), so `RuleRepository` likely needs a new port method (e.g.
  `findByValue(type, values)`) backed by `DrizzleRuleRepository`.

**Verify:** `POST` the same IP twice (second call → 409 `DUPLICATE_RULE`), then `POST` that same IP to
the *other* mode (blacklist → whitelist) and confirm it's also rejected with 409, since the rule is
global.

## 4. Close the test gaps

Three independent gaps, each addable without touching production code:

- **`isValidIPv4` edge cases** (currently only reached indirectly via `IpRule.test.ts`, two cases): add
  direct unit tests for leading zeros (`01.1.1.1`), wrong octet count, empty octets (`1..1.1`),
  whitespace, `255.255.255.255`, `0.0.0.0`.
- **`Validation.ts`, `Middleware.ts`, `ErrorHandler.ts`**: no direct tests today — add unit tests per
  file (shape-validation pure functions are trivial to test directly; `ErrorHandler.ts` can be tested by
  invoking it with constructed error instances and asserting the response shape, including the new 409
  `DuplicateRuleError` mapping from step 3).
- **HTTP-level spec coverage**: once steps 1–2 above are fixed, add/extend `tests/integration/` cases
  that hit the running server and assert the exact request/response shapes documented in the Part 1 spec
  PDF (status codes, error `{status, code, message}` shape, the widened port-number response) — this is
  the only layer that would have caught bugs 1 and 2 in the first place.

## 5. Clean the stale `dist/`

**Problem:** `dist/` still contains `applications/`, `core/`, `infrastructure/` — directory names from
before the hexagonal refactor, no longer present in `src/`.

**Fix:** delete `dist/` and run `npm run build` for a clean rebuild; consider adding `dist/` to
`.gitignore` if it isn't already, so stale build output can't recur. Worth doing before Part 4's
Dockerfile copies `dist/` into the runtime image.

## Verification (whole plan)

- `npm run build` — type-checks cleanly after the widening in step 2 and the new error type in step 3.
- `npm test` — full suite green, including new tests from steps 1, 2, 3, and 4.
- Manual smoke test: `POST /api/firewall/ports` with numeric values, an oversized body, a bad
  `Content-Type`, and a duplicate value, confirming 201/413/415/409 as appropriate.
