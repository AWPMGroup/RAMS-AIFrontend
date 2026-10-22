import http from 'node:http';
import { createHash, timingSafeEqual } from 'node:crypto';
import { pathToFileURL } from 'node:url';

const digest = value => createHash('sha256').update(value).digest();
const hopHeaders = new Set(['connection', 'keep-alive', 'proxy-authenticate',
  'proxy-authorization', 'te', 'trailer', 'transfer-encoding', 'upgrade']);
function cleanHeaders(headers) {
  const excluded = new Set([...hopHeaders,
    ...(headers.connection || '').split(',').map(x => x.trim().toLowerCase())]);
  return Object.fromEntries(Object.entries(headers).filter(([key]) => !excluded.has(key)));
}

export function createGateway({ upstream, username, password }) {
  if (!username || username.includes(':') || !password || password.length < 24) {
    throw new Error('Staging authentication requires a username and a password of at least 24 characters');
  }
  const target = new URL(upstream);
  if (target.protocol !== 'http:' || target.username || target.password ||
      target.pathname !== '/' || target.search || target.hash) {
    throw new Error('Upstream must be a private HTTP origin');
  }
  const expected = digest(`Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`);
  return http.createServer({ maxHeaderSize: 16384 }, (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (req.url === '/_staging/live' && (req.method === 'GET' || req.method === 'HEAD')) {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      return res.end('ok');
    }
    if (!timingSafeEqual(digest(req.headers.authorization || ''), expected)) {
      res.writeHead(401, { 'WWW-Authenticate': 'Basic realm="RAMS.AI staging", charset="UTF-8"' });
      return res.end('Authentication required');
    }
    // Use the raw origin-form path; never resolve a request URL against the upstream.
    if (!req.url?.startsWith('/') || req.url.startsWith('//') || req.method === 'CONNECT') {
      res.writeHead(400);
      return res.end('Invalid request');
    }
    const headers = cleanHeaders(req.headers);
    delete headers.authorization;
    delete headers['forwarded'];
    delete headers['x-forwarded-host'];
    delete headers['x-forwarded-for'];
    delete headers['x-forwarded-proto'];
    headers.host = target.host;
    // This process must only be public through Render's HTTPS ingress.
    headers['x-forwarded-proto'] = 'https';
    const proxy = http.request({ hostname: target.hostname, port: target.port || 80,
      method: req.method, path: req.url, headers }, incoming => {
      const responseHeaders = cleanHeaders(incoming.headers);
      responseHeaders['cache-control'] = 'no-store';
      responseHeaders['x-robots-tag'] = 'noindex, nofollow';
      responseHeaders['x-content-type-options'] = 'nosniff';
      res.writeHead(incoming.statusCode || 502, responseHeaders);
      incoming.on('error', () => res.destroy());
      incoming.pipe(res);
    });
    proxy.setTimeout(600000, () => proxy.destroy(new Error('Upstream timeout')));
    proxy.on('error', () => {
      if (res.headersSent) return res.destroy();
      res.writeHead(502);
      res.end('Staging upstream unavailable');
    });
    req.on('aborted', () => proxy.destroy());
    res.on('close', () => { if (!res.writableFinished) proxy.destroy(); });
    req.pipe(proxy);
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const server = createGateway({ upstream: process.env.STAGING_FRONTEND_URL || `http://${process.env.STAGING_FRONTEND_HOST}:3000`,
    username: process.env.STAGING_USERNAME, password: process.env.STAGING_PASSWORD });
  server.listen(Number(process.env.PORT || 10000), '0.0.0.0', async () => {
    if (process.env.STAGING_RUN_SMOKE !== '1') return;
    try {
      const { smoke } = await import('./smoke.mjs');
      const result = await smoke(`http://127.0.0.1:${server.address().port}`,
        process.env.STAGING_USERNAME, process.env.STAGING_PASSWORD);
      console.info(JSON.stringify(result));
    } catch (error) {
      console.error(JSON.stringify({ event: 'staging_smoke', status: 'failed',
        reason: error instanceof Error ? error.message : 'Unknown validation error' }));
    }
  });
  process.on('SIGTERM', () => {
    server.close();
    setTimeout(() => process.exit(0), 25000).unref();
  });
}
