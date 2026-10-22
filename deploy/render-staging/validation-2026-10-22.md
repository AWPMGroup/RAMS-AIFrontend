# RAMS.AI staging validation — 22 October 2026

## Outcome and scope

Three live single-instance 0.5c-512mb services in AWPM Group Ltd (tea-dbcvvfui0phs73876ct0), Frankfurt: API srv-dbd1c0e7bikc73a7j340, frontend srv-dbd1d767bikc73a7nbe0, gateway srv-dbd1qurncjis73e0335g. Compute baseline US$21/month; no workspace upgrade, autoscaling, database, disk, domain purchase, production deployment or live model usage. Workspace fees/tax/build/bandwidth overages remain separate, with no global spending cap.

Application source remains frontend 489b63057ce2e59aebf8228b4a01ed2aa8dea5b3 / API 452a24a0e35cdecc43d636b95bdd56567df11ba5. Neither staging PR #4 is merged. Existing local development checkouts remain clean on their work branches. No scoring, prompts, review handlers, storage behaviour or source identity changed in staging.

## Blueprint correction

Infrastructure branch dev/render-staging-infrastructure contains corrected render.yaml: frontend Docker command node server.js and RAMS_API_URL=http://rams-ai-staging-api:8000, no shell wrapper; three fixed-size instances, previews off, auto-deploys off, API OPENAI_API_KEY explicitly empty. JSON-formatted YAML passes Render's fetched current JSON Schema. CLI v2.31.0 installed in task workspace; workspace validation could not execute because the CLI has no authenticated Render session/API credential. The connector does not support Blueprint sync or service/project assignment. No sync was triggered after correction.

The failed initial Blueprint never created the gateway. It was created through the connector as the approved third service, with a cryptographically generated staging-only password set before startup. It is currently ungrouped (no environmentId), whereas the two private services are in evm-dbd1c0e7bikc73a7j2m0. Before any Blueprint sync, review/adopt this exact existing gateway and reject any plan to create a duplicate/fourth billable instance. Complete workspace-aware validation in the Dashboard. The gateway currently has TCP health checks; the Blueprint's /_staging/live HTTP health setting also needs reconciliation. Do not blindly sync or upgrade plans.

## Cloud verification

Gateway deploy dep-dbd1so8n74is73ftm4ug is live at infrastructure commit 23f91264e2728b19436a59a0665ca057e82dd7ed. Optional startup smoke harness emits only non-secret results and calls no model route. Its observed log at 14:32:30 UTC records status passed, both exact application versions, model_configured false, pdf_bytes 3796 and live_model_calls 0.

The smoke exercised authenticated gateway loopback → private frontend:3000 → Next.js proxy → private API:8000, version and request-ID checks, readiness 503 with no model key, and real synthetic dashboard PDF generation. Unauthenticated application, review, health-proxy and PDF routes returned 401. Only minimal /_staging/live is unauthenticated. Auth is stripped before proxying; no password or request payload is logged. Gateway credentials are available to the owner in the Render service Environment tab; do not paste them into chat or repository files.

The local managed egress policy rejects the public onrender.com hostname (CONNECT 403); the web tool also could not access it. No bypass was attempted. Therefore public HTTPS/certificate and browser authentication from an external client remain unverified. Internal TCP/private-network success does not establish those external checks.

## Synthetic application verification

Original exact candidates: all 29 backend tests, TypeScript, lint (zero errors/seven existing warnings), production build and all 18 browser/runtime tests passed.

A separate connected local harness used the exact frontend source/build, unchanged FastAPI code, a real authenticated gateway/proxy, valid synthetic DOCX/PDF uploads and an in-process mocked OpenAI client with non-loopback outbound connections rejected. Passed initial review 82%, reassessment 96%, original-history score 82%, all findings closed, saved review reopened and real 6015-byte PDF downloaded. PDF text retained 96% and revision.docx. Only the model was mocked; extraction, scoring, proxy, browser storage and PDF code ran normally. The first PDF harness check inspected Chromium's empty response body for attachment downloads; corrected the harness to inspect the saved download and reran successfully, without changing application code.

These results validate deterministic behaviour, not live-model output quality. Cloud AI routes remain disabled; no mock key or test-mode endpoint was introduced into the deployed API.

## Dependency review

Frontend draft PR https://github.com/AWPMGroup/RAMS-AIFrontend/pull/5: Next.js/preset 16.4.2 and compatible lockfile fixes; production npm audit zero findings; full audit five high affected development-tool entries from one braces advisory chain. New preset rule retained as warning on existing review effects to avoid behaviour changes. Typecheck/lint/build/18 browser tests pass.

Backend draft PR https://github.com/AWPMGroup/RAM-AI/pull/6: compatible dependency fixes reduce 149 reported advisories across 11 packages to 24 in Pillow. Pillow 13 conflicts with existing Streamlit <13 constraint; do not force incompatible packages or remove the existing app entrypoint. Installation resolves, pip check and all 29 tests pass. Remaining constraints and follow-up options are documented in the PR. Neither dependency candidate is deployed. Current staging still has the original vulnerable dependency versions and is suitable only for controlled synthetic-data testing.

CI status must be checked on the draft PRs; local success is not a claim of completed CI. Container OS/base-image scanning, representative OCR capacity testing, external uptime/alert ownership and a cloud rollback drill are not completed. Existing launch-readiness gates remain open.

## Access and stopping charges

Public origin: https://rams-ai-staging-ingress.onrender.com . Username rams-staging; obtain the password securely from the gateway Environment settings, never from chat. Use synthetic documents only. Keep OPENAI_API_KEY empty, do not attach production secret groups, and keep automatic deployments/Blueprint auto-sync disabled until resource association is reconciled.

To end testing, retain the release/test record, disconnect or remove staging definitions from the Blueprint so resources cannot be recreated, then delete all three staging services and verify the resource list and accrued billing. Disconnecting a Blueprint alone does not delete services; closing the browser or turning off auto-deploys does not stop compute. Leave unrelated resources, workspace subscriptions, development branches and PRs intact. Accrued charges remain payable.
