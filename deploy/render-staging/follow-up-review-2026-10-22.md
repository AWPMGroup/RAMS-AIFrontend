# Staging follow-up: CI, advisory reachability and Dashboard reconciliation

Reviewed 22 October 2026. No cloud configuration changes, deployments, Blueprint syncs, merges or resource creations occurred during this follow-up. Three single 0.5c-512mb services remain the approved US$21/month compute baseline. Live OpenAI stays disabled and deployed source commits remain unchanged.

## CI verified

- Frontend security PR #5, commit 0209429b9f177a6d06ea744f3388f056d0c382c1: Frontend quality completed successfully, run https://github.com/AWPMGroup/RAMS-AIFrontend/actions/runs/39797295828 .
- Backend security PR #6, commit c39c774911d4398bbcc5ee5b0a9c0d35c1b4163d: Backend quality completed successfully, run https://github.com/AWPMGroup/RAM-AI/actions/runs/39797309436 .

Both remain drafts, unmerged and undeployed. Deployed applications still use original frontend 489b63057ce2e59aebf8228b4a01ed2aa8dea5b3 / API 452a24a0e35cdecc43d636b95bdd56567df11ba5. Candidate audit reductions must not be mistaken for remediation of deployed dependencies. Original scan counts include duplicate database records; they are not counts of distinct exploitable CVEs.

## API exposure assessment

The API's image filename gate accepts .jpg/.jpeg/.png, but backend.extract_image_text calls unrestricted Pillow Image.open before calling pytesseract. Pillow detects format from bytes, not filename. A benign check confirmed PNG, JPEG, TIFF, GIF, PPM and BMP all pass as a filename ending .png. Pytesseract supports GIF/TIFF and saves decoded images to a temporary file in their original format. This is real parser exposure; authentication does not make untrusted file parsing safe.

A benign HTTP test with no model key confirmed extraction/OCR happens before the expected missing-key 503. OpenAI being disabled prevents paid model calls but does not disable upload parsers.

The 24 advisories left by backend PR #6 are all in Pillow 12.3.0, and also affect the older deployed Pillow 12.2.0. This is static call-path analysis plus benign format tests, not exploit verification. No malicious memory-corruption or resource-exhaustion proof of concept was run.

| Advisory | Current API call-path assessment |
|---|---|
| CVE-2026-112399, APNG allocation before bomb check | Relevant: ordinary Image.open for accepted PNG content. |
| CVE-2026-112401, GIF comment parsing DoS | Relevant: Image.open before actual-format validation, even renamed .png. |
| CVE-2026-112901, XBM header regex DoS | Relevant: Image.open plugin probing happens before pytesseract rejects unsupported formats. |
| CVE-2026-112897, TIFF decode uninitialized pixels | Potentially reachable: renamed TIFF is decoded and re-saved for OCR. Disclosure through OCR output has not been demonstrated. |
| CVE-2026-112395, TIFF tiled decode bounds | Potentially reachable through renamed TIFF pixel decoding. |
| CVE-2026-112404, TIFF tile/RGBA bounds | Potentially reachable through renamed TIFF pixel decoding. |
| CVE-2026-112896, TIFF ColorMap re-encoding bounds | Potentially reachable: pytesseract re-saves original TIFF format with metadata. Exact malformed-tag exploit not tested. |
| CVE-2026-112891, GIF comment copying on save | Potentially reachable: OCR preparation re-saves recognized GIFs. |
| CVE-2026-112895, CVE-2026-112391, CVE-2026-112406 | No observed path: require Pillow PDF append/parsing. API reads PDFs using pdfplumber/pdfminer and writes reports with ReportLab; no Pillow PDF append. |
| CVE-2026-112894 | No observed path: Pillow PDF save_all is not used. |
| CVE-2026-112393, CVE-2026-112396 | No observed matching sink: require TIFF encoding into an in-memory buffer; pytesseract saves to a filesystem path. |
| CVE-2026-112400 | No observed path: requires seeking a later GIF frame, catching the bomb error and reusing the rejected state. |
| CVE-2026-112397, CVE-2026-112392, CVE-2026-112402 | No observed path: morphology, rank filters and oversized affine transforms are not used. |
| CVE-2026-112899, CVE-2026-112900 | No observed path: EPS scale/Ghostscript operations are not used; pytesseract rejects EPS before save. |
| CVE-2026-112893 | No observed path: API does not render user-supplied fonts with Pillow strokes. |
| CVE-2026-112390 | No observed path: MIC frame-count traversal is not used. |
| CVE-2026-112405, CVE-2026-112892 | No observed pixel-load path: IPTC/MSP actual formats are rejected by pytesseract before save/load; Image.open probing is still a separate concern addressed above. |

Other currently deployed packages still have findings addressed by PR #6. Multipart/header/body parser DoS is relevant to the Form/File endpoints. Some Starlette form parsing issues are also relevant; FileResponse/Windows StaticFiles/HTTPEndpoint-specific issues have no observed matching route here. DOCX XML parsing uses python-docx's configured parser, so a generic lxml default-parser advisory is not automatically an exploitable DOCX finding. Installed GitPython/Tornado are brought in for Streamlit and are not the FastAPI serving stack. TLS/client advisories in AnyIO/urllib3/cryptography depend on specific transport or cryptographic operations; live OpenAI remains off. These distinctions do not replace patching compatible dependencies.

Primary advisory references: https://github.com/advisories/GHSA-5xm2-6676-qcp9 , https://github.com/advisories/GHSA-74r2-7ff9-mjj2 , https://github.com/advisories/GHSA-xgh8-jp6q-p5x8 , https://github.com/advisories/GHSA-q45j-58j2-45rg . Remaining classifications use the retained pip-audit descriptions and inspected API/pytesseract code.

## Smallest tested fix proposal — not deployed or committed as an application change

Keep the existing Streamlit requirements/profile and app.py entrypoint intact. Add a separate requirements-api.txt for the API Docker image, based on PR #6's compatible fixes but without the Streamlit UI dependency, and pin Pillow 13.0.0 there. Change only the API Dockerfile's COPY/install requirements filename. Do not force Pillow 13 into Streamlit's incompatible environment and do not remove OCR, image uploads, PDF support or the Streamlit app.

A scratch API-only profile with these exact changes resolves successfully: pip check passes, pip-audit reports zero known advisories across 65 resolved dependencies, all 29 existing backend regressions pass with mocked model calls, and a real local Tesseract OCR check reads a generated synthetic text image correctly. No scoring code, review handlers or model prompts changed. The current Streamlit profile remains untouched; it still needs its own future Pillow-compatible upstream update. The API proposal has not been Docker-built or deployed and needs code review/approval before implementation/deployment. An image format allowlist alone is not a complete fix because the APNG issue affects allowed PNGs at open time.

## Gateway reconciliation status and one consolidated Dashboard checklist

Read-only inventory confirms exactly one gateway: srv-dbd1qurncjis73e0335g, rams-ai-staging-ingress. It is ungrouped; frontend srv-dbd1d767bikc73a7nbe0 and API srv-dbd1c0e7bikc73a7j340 are in staging environment evm-dbd1c0e7bikc73a7j2m0. All three have one 0.5c-512mb instance and auto-deploy off. The corrected Blueprint uses the same gateway name, region, repo and Docker paths, but intended ownership/environment association is not yet reconciled. No sync was attempted.

The connector cannot move services, inspect Blueprint ownership/sync previews or update health-check paths. Render CLI has no authenticated workspace session. Complete these steps in AWPM Group Ltd only:

1. Confirm Hobby billing, exactly the three service IDs above, one US$7/month instance each, and Blueprint Auto Sync = No. Leave paid upgrades/autoscaling off.
2. Move the EXISTING gateway via its service menu > Move to rams-ai-staging / staging. Moving must not create a replacement. Check its Blueprint-managed indicator and ensure no second Blueprint manages it. Environment placement alone is not proof of Blueprint ownership.
3. Validate the corrected dev/render-staging-infrastructure/render.yaml against the workspace and inspect the existing Blueprint's proposed changes. It must reference the exact current gateway/service IDs. Reject any Create gateway action, generated suffix, fourth service, replacement, extra instance or plan upgrade. If the Dashboard cannot safely adopt the gateway, leave sync disabled and request Render support guidance; do not delete/recreate the working gateway.
4. Reconcile gateway /_staging/live HTTP health-check configuration (currently default TCP), private host binding and existing generated password preservation. Do not apply a sync or any configuration deployment until approval of that concrete change review. Keep API OPENAI_API_KEY empty, no key-bearing env groups, and original app source commits unchanged.
5. From a permitted external client, verify a valid TLS certificate and HTTP-to-HTTPS redirect without sending credentials over HTTP. Fresh unauthenticated /review and /api/backend/* must return 401/auth prompt; /_staging/live may return 200. Wrong credentials must fail. Use the password securely from the gateway Environment tab to check authenticated UI, version/health proxy, readiness 503 with model_configured false, and a synthetic PDF. Never paste credentials into chat. Confirm API/frontend have no public URLs.
6. Check included build/bandwidth usage, billing and staging-only failure notifications. Do not purchase monitoring or upgrade the workspace. Record the review and seek approval before a security-fix deployment or Blueprint apply.

External HTTPS attempts through the web tool remain inaccessible. The enforced managed egress policy does not allow this gateway hostname, so shell requests are blocked with CONNECT 403; no proxy/allowlist bypass was attempted. Existing internal cloud smoke remains valid evidence of authentication, private connectivity and PDFs, not external TLS/browser validation. Public checks and Blueprint ownership reconciliation remain blocked until the Dashboard/permitted client steps above are completed.
