# Task 3 — Consistent structured reassessment

Review milestone, 22 October 2026. Development branch: `dev/structured-reassessment`. Nothing merged or deployed as part of this milestone.

## Behaviour

The browser sends the current finding register and prior inherent risk to the API. It validates the versioned structured reassessment response before changing current state. The backend's score, band, decision, risks, control effectiveness and complete finding register update together. The dashboard, stored submission, reopened review and PDF request use that same result.

Original category ratings remain unchanged. Each successful reassessment archives the superseded review in `reviewVersions`, including text, score/band/decision, risks, findings, original ratings, document names, project/contractor metadata, comments and scoring method. These versions are visible in expandable entries in the Review Timeline and survive reopening. The timestamp records when the version was archived. Repeated reassessment appends versions instead of replacing the original.

Incomplete/text-only/malformed responses, duplicate IDs or dropped original findings leave the previous result and history unchanged. Successful reassessment clears the submitted additional-file selection to avoid sending the same revision repeatedly; recorded document names remain attached. Empty structured finding registers stay authoritative instead of falling back to parsed narrative findings. Project and contractor names survive responses that omit their narrative headings.

## Retained calculation

The backend retains the existing reassessment penalties: Critical 20, Major 10, Minor 4, Observation 1, Closed 0; score clamped to 20–96. Initial scoring is unchanged and remains separate. Closed material findings yield Ready for Approver Review, not permission to start works. Initial category ratings are preserved, not presented as a new model re-rating.

## Files

Frontend changes:
- `src/lib/reassessment.ts`: shared finding/snapshot types and strict response validation.
- `src/app/review/page.tsx`: send register/risk, apply the authoritative result, persist/display previous versions and preserve metadata.
- `tests/review-journey.spec.ts`: extend the browser regressions for closure, repeated reassessment, history, reload/PDF consistency and malformed response rejection.

Companion backend changes:
- `rams_reassessment.py`: structured model schema, original-reference validation, existing deterministic reassessment calculation and report rendering.
- `backend.py`, `api.py`: integrate structured reassessment on JSON/multipart routes while retaining legacy direct-Python text mode.
- `tests/test_reassessment.py` and existing test updates: calculation, history/identity, malformed input/output, HTTP and PDF coverage.
- `.github/workflows/quality.yml`: explicitly compile the new module.
- `docs/reassessment-contract.md`: protocol, scoring and compatibility details.

## Verification

Local TypeScript, lint and production build passed; lint retains seven existing warnings. All 15 browser tests and all 26 backend tests passed locally, along with backend compilation and dependency checks. GitHub CI results are recorded in the PR descriptions. Browser CI uses fixture API responses; backend HTTP tests use real multipart parsing, extraction and PDF generation with mocked OpenAI.

A connected local Chromium/FastAPI run with real uploaded DOCX files reproduced the former disagreement and then verified:

| Value | Result |
|---|---|
| Original review score | 82% |
| Backend reassessment score | 96% |
| Saved/reopened current score | 96% |
| Actual downloaded reassessment PDF | 96% |
| Retained original history score | 82% |
| Current open/closed findings | 0 / 1 |
| Browser JavaScript errors | 0 |
| Live OpenAI calls | 0 |

## Limits and release notes

The API and frontend contract changes require a coordinated, separately approved deployment. Old API requests without a finding register and prior risk are rejected before a model call; the updated browser also rejects old text-only responses without losing the current review. No deployment is included here.

History remains in the existing browser-local submission store; it is not a server-backed or tamper-proof audit log. Older overwritten reviews cannot be reconstructed; existing submissions gain a snapshot when next successfully reassessed. Storage limits and quota warnings remain in force. PDFs describe the current result; older versions remain in the browser history.

Tests use mocked model responses. No live model judgement/structured-output validation, production checks or new OCR-engine validation was performed. Pricing, billing, authentication and production infrastructure remain outside scope.
