# Dependency security review — 22 October 2026

This is a dependency-only candidate based on staging commit 489b63057ce2e59aebf8228b4a01ed2aa8dea5b3. It is not deployed and must not be merged automatically.

Initial npm audit: 16 affected dependency entries (1 critical, 12 high, 2 moderate, 1 low), including the directly installed Next.js runtime. Upgrade Next.js and matching eslint-config-next from 16.2.2 to 16.4.2 and apply compatible lockfile fixes. No application source, scoring, model prompts, review effects or storage behaviour changes.

Candidate npm audit --omit=dev: zero known production dependency advisories. Full audit: five high affected development dependency entries, all from the braces/micromatch/fast-glob/Next ESLint chain. The root advisory is GHSA-vfj7-8cjw-p6xm. npm suggests a breaking downgrade to eslint-config-next 14.2.35; this was not applied. Do not lint untrusted glob inputs. This residual requires upstream remediation or a separately reviewed tooling change, not a forced downgrade of the framework.

The updated ESLint preset enables react-hooks/set-state-in-effect. Keep it visible as a warning only for the pre-existing review page effects, preserving review/storage behaviour in this security-only PR. Other rules remain unchanged. Lint passes with warnings; refactoring those effects is separate work.

Validation: TypeScript, lint (zero errors), production build and all 18 existing browser/runtime tests pass on the candidate. Existing review/reassessment journeys preserve the 82% original and 96% current score, history and PDF payload. These browser tests mock API responses; full private-stack validation is recorded separately. npm advisory results are time-sensitive and not proof of complete application or container security. Container OS vulnerability scanning was not completed.
