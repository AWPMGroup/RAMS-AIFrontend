import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createGateway } from './server.mjs';

const username = 'tester';
const password = 'synthetic-test-password-1234567890';
const auth = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
const listen = server => new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const stop = server => new Promise(resolve => server.close(resolve));

test('gateway fails closed without strong authentication configuration', () => {
  for (const values of [{}, { username, password: 'short' }]) {
    assert.throws(() => createGateway({ upstream: 'http://127.0.0.1:1', ...values }));
  }
  assert.throws(() => createGateway({ upstream: 'http://user:pass@example.com', username, password }));
});

test('all application routes require auth; liveness does not contact upstream', async () => {
  let calls = 0;
  const upstream = http.createServer((req, res) => { calls++; res.end('unexpected'); });
  await listen(upstream);
  const gateway = createGateway({ upstream: `http://127.0.0.1:${upstream.address().port}`, username, password });
  await listen(gateway);
  try {
    const origin = `http://127.0.0.1:${gateway.address().port}`;
    for (const path of ['/', '/review', '/api/backend/health/live', '/api/backend/dashboard-pdf', '/_staging/live/']) {
      const response = await fetch(origin + path);
      assert.equal(response.status, 401);
      await response.text();
    }
    const wrong = await fetch(origin, { headers: { authorization: 'Basic wrong' } });
    assert.equal(wrong.status, 401);
    await wrong.text();
    const live = await fetch(origin + '/_staging/live');
    assert.equal(live.status, 200);
    assert.equal(await live.text(), 'ok');
    assert.equal(calls, 0);
  } finally { await stop(gateway); await stop(upstream); }
});

test('authenticated POST preserves PDF bytes and path, without forwarding credentials', async () => {
  const pdf = Buffer.from('%PDF-1.4\nsynthetic\n%%EOF');
  const upstream = http.createServer(async (req, res) => {
    assert.equal(req.url, '/api/backend/dashboard-pdf?synthetic=1');
    assert.equal(req.headers.authorization, undefined);
    assert.equal(req.headers['x-forwarded-for'], undefined);
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    assert.equal(Buffer.concat(chunks).toString(), '{"synthetic":true}');
    res.writeHead(200, { 'Content-Type': 'application/pdf', 'Cache-Control': 'public' });
    res.write(pdf.subarray(0, 8));
    setImmediate(() => res.end(pdf.subarray(8)));
  });
  await listen(upstream);
  const gateway = createGateway({ upstream: `http://127.0.0.1:${upstream.address().port}`, username, password });
  await listen(gateway);
  try {
    const response = await fetch(`http://127.0.0.1:${gateway.address().port}/api/backend/dashboard-pdf?synthetic=1`, {
      method: 'POST', headers: { authorization: auth, 'x-forwarded-for': 'spoofed' }, body: '{"synthetic":true}' });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal(response.headers.get('content-type'), 'application/pdf');
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), pdf);
  } finally { await stop(gateway); await stop(upstream); }
});
