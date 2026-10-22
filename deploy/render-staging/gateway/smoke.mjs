import assert from 'node:assert/strict';

// Configuration/PDF checks only. Never calls a model-backed route.
export async function smoke(origin, username, password) {
  const auth = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
  async function request(path, { authenticated = true, ...options } = {}) {
    return fetch(`${origin}${path}`, { ...options, redirect: 'error',
      signal: AbortSignal.timeout(15000), headers: {
        ...(authenticated ? { Authorization: auth } : {}), ...options.headers } });
  }
  for (const path of ['/', '/review', '/api/health', '/api/backend/health/live', '/api/backend/review/dashboard-pdf']) {
    const response = await request(path, { authenticated: false });
    assert.equal(response.status, 401, `Unauthenticated access: ${path}`);
    await response.arrayBuffer();
  }
  const frontendResponse = await request('/api/health');
  assert.equal(frontendResponse.status, 200, 'Frontend liveness');
  const frontend = await frontendResponse.json();
  assert.equal(frontend.version, '489b63057ce2e59aebf8228b4a01ed2aa8dea5b3');
  const backendResponse = await request('/api/backend/health/live');
  assert.equal(backendResponse.status, 200, 'Private API connectivity');
  const backend = await backendResponse.json();
  assert.equal(backend.version, '452a24a0e35cdecc43d636b95bdd56567df11ba5');
  assert.ok(backendResponse.headers.get('x-request-id'));
  const readinessResponse = await request('/api/backend/health/ready');
  assert.equal(readinessResponse.status, 503, 'Live OpenAI must remain disabled');
  const readiness = await readinessResponse.json();
  assert.equal(readiness.model_configured, false);
  const pdfResponse = await request('/api/backend/review/dashboard-pdf', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
      review_text: 'Synthetic staging validation. No customer data or live model calls.',
      reviewer_name: 'Synthetic tester', project_type: 'Synthetic staging check',
      score: 96, status: 'READY FOR APPROVER REVIEW', outcome: 'Ready for Approver Review',
      control_effectiveness: 96, risk_exposure: 'HIGH', residual_risk: 'LOW',
      documents_reviewed: ['synthetic-fixture.docx'], findings: [],
    }) });
  assert.equal(pdfResponse.status, 200, 'PDF through private upstream');
  assert.match(pdfResponse.headers.get('content-type') || '', /application\/pdf/);
  const pdf = Buffer.from(await pdfResponse.arrayBuffer());
  assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
  return { event: 'staging_smoke', status: 'passed', frontend_version: frontend.version,
    backend_version: backend.version, model_configured: false, pdf_bytes: pdf.length,
    live_model_calls: 0, scope: 'gateway_loopback_and_render_private_network' };
}
