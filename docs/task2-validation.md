# Task 2 — User journey validation

Review milestone, 22 October 2026. Changes are on `dev/user-journey-validation`. No merge or deployment is part of this milestone.

## Fixes

- Failed initial review requests leave the upload form and files available for retry.
- PDF, email draft and reassessment request failures show an alert without replacing the review text or hiding the dashboard. Successful retries clear the request error.
- PDF exports retain recorded primary and supporting document names after a submission is reopened. The backend now renders the supplied document list in the PDF.
- Malformed submission history no longer crashes saving the current review. Browser storage failures warn the reviewer to download before leaving, while retaining the open review.
- Initial review requires at least one primary document. Unsupported, empty and corrupt DOCX/PDF/image uploads produce HTTP 400 with a document-specific message, rather than generic HTTP 500 errors. Model failures remain server errors.

No scoring formulas, category ratings, model prompts or reassessment decision rules were changed. Pricing, billing, authentication and production infrastructure are outside scope.

## Automated checks

Frontend: `npm run typecheck`, `npm run lint`, `npm run build`, then `npm run test:e2e`. The nine Playwright Chromium tests exercise multipart submission, structured result persistence, reopening, PDF request/download, PDF/email/reassessment failures and successful retries, failed initial review recovery, malformed history, revised-document reassessment and history, missing files, and storage quota failure. Browser API responses are fixture responses. Production assets are served for the browser tests. Seven existing lint warnings remain.

Install the browser with `npx playwright install --with-deps chromium`. For an existing local Chromium binary, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to its path. The test server uses port 3100. The frontend PR workflow runs the browser suite after the production build.

Backend: `python -m unittest discover -s tests -v`, compilation and `python -m pip check`. Fourteen tests total, including eight new in-process HTTP cases, use real multipart parsing, DOCX/PDF extraction, scoring, PDF generation/download, revised evidence extraction, mocked OCR and blocked live network connections. Invalid upload tests include subcases for unsupported, empty and corrupt documents on initial review and reassessment. The existing workflow discovers them automatically.

Both suites passed locally. A separate local connected Chromium/FastAPI run also completed primary/supporting DOCX upload, actual extraction, deterministic scoring with only model responses mocked, browser persistence, reopening, actual PDF download and content extraction, and revised-document reassessment. No browser JavaScript errors or live OpenAI calls occurred.

## Unresolved product decision: reassessment authority

The connected run reproduced a pre-existing inconsistency:

| State | Observed value |
|---|---|
| Original structured review score | 82% |
| Reassessment narrative updated score | 96% |
| Dashboard/persisted score after reassessment | 82% |
| Narrative finding status | Closed |
| Dashboard/persisted open findings | 1 |

The frontend retains the initial structured score/decision/ratings and skips merging parsed reassessment findings whenever a structured score exists. The current reassessment API returns narrative text only. This affects both what the reviewer sees and subsequent PDF data.

There are also different existing penalty/clamp rules in the deterministic initial scoring engine, the frontend narrative fallback and the reassessment prompt. Choosing one authority would change review outcomes, so this PR does not switch to a different formula or reinterpret narrative scores.

Recommended next step: approve a structured reassessment response contract and specify the authoritative reassessment calculation and retained finding history. Then implement and test score, decision, risk and finding updates consistently across dashboard, browser persistence and PDFs. This is a release blocker for relying on reassessed dashboard outcomes; these PRs are a focused reliability improvement, not a claim that the complete reassessment journey is correct.

## Limits

Local browser coverage is Chromium at desktop size. No live model-quality validation, real OCR-engine validation, mobile compatibility testing or production deployment was performed. Browser regression CI mocks API responses; backend HTTP CI tests validate the real server paths separately. The connected local run is additional evidence, not a cross-repository CI job.
