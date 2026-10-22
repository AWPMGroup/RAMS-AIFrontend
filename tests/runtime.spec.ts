import { expect, test } from "@playwright/test";

test("frontend liveness reports a non-secret build version", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.status()).toBe(200);
  expect(await response.json()).toMatchObject({ status: "ok", service: "rams-ai-frontend" });
  expect(response.headers()["cache-control"]).toBe("no-store");
});

test("proxy blocks unknown routes and unexpected methods", async ({ request }) => {
  expect((await request.post("/api/backend/admin")).status()).toBe(404);
  expect((await request.get("/api/backend/review")).status()).toBe(405);
});

test("proxy connection failure returns a recoverable error without backend details", async ({ request }) => {
  const response = await request.post("/api/backend/review", { multipart: { reviewer_name: "Fixture reviewer" } });
  expect(response.status()).toBe(502);
  expect(await response.json()).toEqual({ detail: "The review service is unavailable. Please retry shortly." });
  expect(response.headers()["x-request-id"]).toBeTruthy();
});
