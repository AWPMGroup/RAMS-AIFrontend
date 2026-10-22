import { expect, test, type Page } from "@playwright/test";

const reviewText = `### **__Executive Summary__**
- Decision: Further Amendments Required
- Summary: Fixture RAMS review identifies a site-specific rescue evidence gap requiring competent reviewer confirmation before works proceed.
### **__Project Context Applied__**
- Project Name: Fixture works
- Contractor Name: Fixture contractor
### **__Evidence Gaps__**
- Critical: Site-specific rescue plan missing.
### **__Contractor Actions Required__**
- Critical: Supply the site-specific rescue plan.`;

const review = {
  review_text: reviewText,
  score: 82,
  band: "Good",
  decision: "Further Amendments Required",
  risk_exposure: "HIGH",
  residual_risk: "MEDIUM",
  control_effectiveness: 82,
  ratings: { emergency_rescue: "Missing" },
  findings: [{ ref: "001", category: "04 Emergency & Rescue", finding: "Site-specific rescue plan missing.", severity: "Critical", status: "Open", action: "Supply the site-specific rescue plan." }],
};

const openReassessment = {
  schema_version: 1,
  scoring_method: "reassessment-v1",
  review_text: "### **__Reassessed Executive Summary__**\n- Updated Position: Further Amendments Required\n- Updated Score: 80%\n- Decision: Further Amendments Required",
  score: 80,
  band: "Good",
  decision: "Further Amendments Required",
  risk_exposure: "HIGH",
  residual_risk: "MEDIUM",
  control_effectiveness: 80,
  findings: review.findings,
};
const closedReassessment = {
  ...openReassessment,
  review_text: "### **__Reassessed Executive Summary__**\n- Updated Position: Ready for Approver Review\n- Updated Score: 96%\n- Decision: Ready for Approver Review",
  score: 96,
  band: "Excellent",
  decision: "Ready for Approver Review",
  residual_risk: "LOW",
  control_effectiveness: 96,
  findings: [{ ...review.findings[0], status: "Closed", sourceRefs: ["001"], dateClosed: "22/10/2026", evidenceUsed: "Revision C and reviewer confirmation", action: "Closed - revision C confirms the rescue arrangements." }],
};

async function start(page: Page) {
  await page.goto("/review");
  await page.getByRole("button", { name: "Enter", exact: true }).click();
  await page.locator('input').nth(0).fill("Fixture reviewer");
  await page.locator('input').nth(1).fill("UK");
  await page.locator('input').nth(2).fill("Fixture works");
  await page.locator('input[type=file]').nth(0).setInputFiles({ name: "rams.docx", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", buffer: Buffer.from("browser multipart fixture") });
  await page.locator('input[type=file]').nth(1).setInputFiles({ name: "site-policy.pdf", mimeType: "application/pdf", buffer: Buffer.from("browser multipart fixture") });
}

async function run(page: Page, waitForSave = true) {
  await page.route("http://127.0.0.1:8000/review", async (route) => {
    const body = route.request().postDataBuffer()?.toString() || "";
    expect(body).toContain('name="review_files"; filename="rams.docx"');
    expect(body).toContain('name="supporting_files"; filename="site-policy.pdf"');
    expect(body).toContain("Fixture reviewer");
    await route.fulfill({ json: review });
  });
  await start(page);
  await page.getByRole("button", { name: "Run Review", exact: true }).click();
  await expect(page.getByRole("button", { name: "Download Report" })).toBeVisible();
  if (waitForSave) await page.waitForFunction(() => JSON.parse(localStorage.getItem("rams_ai_submissions") || "[]").length === 1);
}

async function stored(page: Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem("rams_ai_submissions") || "[]")[0]);
}

test("upload, save, reopen and export PDF retain review data and document names", async ({ page }) => {
  await run(page);
  const original = await stored(page);
  expect(original.score).toBe(82);
  expect(original.findings[0].severity).toBe("Critical");
  expect(original.ratings).toEqual(review.ratings);
  await page.getByRole("link", { name: "Submissions", exact: true }).click();
  await page.getByRole("button").filter({ hasText: original.id }).click();
  await expect(page.getByRole("button", { name: "Download Report" })).toBeVisible();
  await expect(page.getByText("📄 rams.docx", { exact: true })).toBeVisible();
  let payload: Record<string, unknown> = {};
  await page.route("**/review/dashboard-pdf", async (route) => {
    payload = route.request().postDataJSON();
    await route.fulfill({ contentType: "application/pdf", body: "%PDF-1.4\nfixture" });
  });
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download Report" }).click();
  expect((await download).suggestedFilename()).toBe("rams_ai_dashboard_report.pdf");
  expect(payload.score).toBe(original.score);
  expect(payload.findings).toEqual(original.findings);
  expect(payload.documents_reviewed).toEqual(["rams.docx", "site-policy.pdf"]);
  expect((await stored(page)).reviewText).toBe(reviewText);
});

for (const operation of ["pdf", "reassess", "email"] as const) {
  test(`${operation} failure preserves saved review and permits retry`, async ({ page }) => {
    await run(page);
    const endpoint = operation === "pdf" ? "**/review/dashboard-pdf" : operation === "email" ? "**/contractor-email" : "**/review/reassess-documents";
    await page.route(endpoint, (route) => route.fulfill({ status: 503, json: { detail: "Fixture service unavailable" } }));
    const button = operation === "pdf" ? page.getByRole("button", { name: "Download Report" }) : operation === "email" ? page.getByRole("button", { name: /Generate.*Email/i }) : page.getByRole("button", { name: "Reassess Submission", exact: true });
    if (operation !== "pdf") await page.getByPlaceholder("Add close-out notes, evidence provided, contractor clarifications, closed items, remaining actions, or final reviewer position...").fill("Fixture evidence");
    await button.click();
    await expect(page.locator("main").getByRole("alert")).toBeVisible();
    await expect(button).toBeVisible();
    await expect(button).toBeEnabled();
    expect((await stored(page)).reviewText).toBe(reviewText);
    await page.route(endpoint, (route) => operation === "pdf"
      ? route.fulfill({ contentType: "application/pdf", body: "%PDF-1.4\nfixture" })
      : route.fulfill({ json: operation === "email" ? { subject: "Fixture subject", body: "Fixture email draft" } : openReassessment }));
    const download = operation === "pdf" ? page.waitForEvent("download") : null;
    await button.click();
    if (download) await download;
    if (operation === "email") await expect(page.getByText("Fixture email draft", { exact: true })).toBeVisible();
    await expect(page.locator("main").getByRole("alert")).toHaveCount(0);
    const record = await stored(page);
    await page.goto(`/review?submissionId=${encodeURIComponent(record.id)}`);
    await expect(page.getByRole("button", { name: "Download Report" })).toBeVisible();
  });
}

test("failed initial review can be retried with the same files", async ({ page }) => {
  await page.route("http://127.0.0.1:8000/review", (route) => route.fulfill({ status: 400, json: { detail: "Unsupported file type" } }));
  await start(page);
  await page.getByRole("button", { name: "Run Review", exact: true }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText("Unsupported file type");
  await expect(page.getByRole("button", { name: "Run Review", exact: true })).toBeEnabled();
  await page.route("http://127.0.0.1:8000/review", (route) => route.fulfill({ json: review }));
  await page.getByRole("button", { name: "Run Review", exact: true }).click();
  await expect(page.getByRole("button", { name: "Download Report" })).toBeVisible();
});

test("malformed submission storage does not prevent a new review being saved", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.setItem("rams_ai_submissions", '{broken'));
  await run(page);
  expect((await stored(page)).score).toBe(82);
});

test("reassessment submits revised files and saves returned text and history", async ({ page }) => {
  await run(page);
  const before = await stored(page);
  const updated = openReassessment.review_text;
  await page.route("**/review/reassess-documents", async (route) => {
    const body = route.request().postDataBuffer()?.toString() || "";
    expect(body.replace(/\r\n/g, "\n")).toContain(reviewText);
    expect(body).toContain('filename="revision.docx"');
    expect(body).toContain("Fixture evidence");
    await route.fulfill({ json: openReassessment });
  });
  await page.getByPlaceholder("Add close-out notes, evidence provided, contractor clarifications, closed items, remaining actions, or final reviewer position...").fill("Fixture evidence");
  await page.locator('input[type=file]').nth(0).setInputFiles({ name: "revision.docx", mimeType: "application/octet-stream", buffer: Buffer.from("Fixture revision") });
  await page.getByRole("button", { name: "Reassess Submission", exact: true }).click();
  await page.waitForFunction((text) => JSON.parse(localStorage.getItem("rams_ai_submissions") || "[]")[0]?.reviewText === text, updated);
  const record = await stored(page);
  expect(record.uploadedDocuments).toContain("revision.docx");
  expect(record.reviewHistory).toHaveLength(1);
  expect(record.score).toBe(80);
  expect(record.reviewVersions[0].score).toBe(82);
  expect(record.reviewVersions[0].findings).toEqual(before.findings);
  expect(record.ratings).toEqual(review.ratings);
});

test("empty initial upload is rejected before contacting the API", async ({ page }) => {
  let contacted = false;
  await page.route("http://127.0.0.1:8000/review", async (route) => { contacted = true; await route.abort(); });
  await page.goto("/review");
  await page.getByRole("button", { name: "Enter", exact: true }).click();
  await page.getByRole("button", { name: "Run Review", exact: true }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText("Upload at least one");
  expect(contacted).toBe(false);
});

test("storage quota failure leaves the review available for export", async ({ page }) => {
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
      if (key === "rams_ai_submissions") throw new DOMException("Fixture quota", "QuotaExceededError");
      return original.call(this, key, value);
    };
  });
  await run(page, false);
  await expect(page.locator("main").getByRole("alert")).toContainText("browser storage could not save");
  await expect(page.getByRole("button", { name: "Download Report" })).toBeVisible();
  await page.getByRole("button", { name: /View full AI review/ }).click();
  await expect(page.locator("pre")).toContainText("Site-specific rescue plan missing.");
});

test("closed reassessment updates dashboard, saved state and PDF while preserving original history", async ({ page }) => {
  await run(page);
  await page.route("**/review/reassess-documents", async (route) => {
    const body = route.request().postDataBuffer()?.toString() || "";
    expect(body).toContain('name="original_findings"');
    expect(body).toContain('"ref":"001"');
    expect(body).toContain('name="risk_exposure"');
    await route.fulfill({ json: closedReassessment });
  });
  await page.getByPlaceholder("Add close-out notes, evidence provided, contractor clarifications, closed items, remaining actions, or final reviewer position...").fill("Revision C closes the rescue finding");
  await page.getByRole("button", { name: "Reassess Submission", exact: true }).click();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem("rams_ai_submissions") || "[]")[0]?.score === 96);
  let record = await stored(page);
  expect(record.decision).toBe("Ready for Approver Review");
  expect(record.project).toBe("Fixture works");
  expect(record.contractor).toBe("Fixture contractor");
  expect(record.openFindings).toEqual([]);
  expect(record.closedFindings).toHaveLength(1);
  expect(record.residualRisk).toBe("LOW");
  expect(record.riskExposure).toBe("HIGH");
  expect(record.controlEffectiveness).toBe(96);
  expect(record.ratings).toEqual(review.ratings);
  expect(record.reviewVersions[0].reviewText).toBe(reviewText);
  expect(record.reviewVersions[0].score).toBe(82);
  expect(record.reviewVersions[0].findings[0].status).toBe("Open");
  expect(record.reviewVersions[0].ratings).toEqual(review.ratings);
  await expect(page.getByRole("heading", { name: "READY FOR APPROVER REVIEW", exact: true })).toBeVisible();
  await expect(page.getByText("96%", { exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "Show Closed Findings", exact: true }).click();
  await expect(page.getByRole("cell", { name: "Closed", exact: true })).toBeVisible();
  await page.goto(`/review?submissionId=${encodeURIComponent(record.id)}`);
  await expect(page.getByRole("button", { name: "Download Report" })).toBeVisible();
  record = await stored(page);
  expect(record.score).toBe(96);
  expect(record.reviewVersions[0].score).toBe(82);
  let pdf: Record<string, unknown> = {};
  await page.route("**/review/dashboard-pdf", async (route) => {
    pdf = route.request().postDataJSON();
    await route.fulfill({ contentType: "application/pdf", body: "%PDF-1.4\nfixture" });
  });
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download Report" }).click();
  await download;
  expect(pdf.score).toBe(96);
  expect(pdf.status).toBe("READY FOR APPROVER REVIEW");
  expect(pdf.open_findings).toEqual([]);
  expect(pdf.closed_findings).toEqual(closedReassessment.findings);
  expect(pdf.control_effectiveness).toBe(96);
  await expect(page.getByText("Review 1 — 82% — Further Amendments Required", { exact: true })).toBeVisible();

  await page.route("**/review/reassess-documents", (route) => route.fulfill({ json: { ...openReassessment, score: 90, band: "Excellent", control_effectiveness: 90, findings: [{ ...review.findings[0], severity: "Major" }], review_text: "### **__Reassessed Executive Summary__**\n- Updated Score: 90%\n- Decision: Further Amendments Required" } }));
  await page.getByRole("button", { name: "Reassess Submission", exact: true }).click();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem("rams_ai_submissions") || "[]")[0]?.score === 90);
  record = await stored(page);
  expect(record.reviewVersions.map((version: { score: number }) => version.score)).toEqual([82, 96]);
  expect(record.openFindings[0].severity).toBe("Major");
});

for (const [label, invalid] of [
  ["text-only", { review: "Legacy narrative claims 96%" }],
  ["missing score", { ...closedReassessment, score: undefined }],
  ["dropped finding", { ...closedReassessment, findings: [] }],
  ["non-string decision", { ...closedReassessment, decision: ["Ready for Approver Review"] }],
  ["invalid finding", { ...closedReassessment, findings: [{ ...review.findings[0], status: "Partially Closed" }] }],
] as const) {
  test(`${label} reassessment cannot overwrite the previous review`, async ({ page }) => {
    await run(page);
    const before = await stored(page);
    await page.route("**/review/reassess-documents", (route) => route.fulfill({ json: invalid }));
    await page.getByPlaceholder("Add close-out notes, evidence provided, contractor clarifications, closed items, remaining actions, or final reviewer position...").fill("Fixture evidence");
    await page.getByRole("button", { name: "Reassess Submission", exact: true }).click();
    await expect(page.locator("main").getByRole("alert")).toContainText("previous review has been preserved");
    const record = await stored(page);
    expect(record.score).toBe(82);
    expect(record.findings).toEqual(before.findings);
    expect(record.reviewText).toBe(reviewText);
    expect(record.reviewVersions).toEqual([]);
    expect(record.reviewHistory).toEqual([]);
  });
}
