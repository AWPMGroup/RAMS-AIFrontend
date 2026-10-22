import { randomUUID } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedPaths = new Map([
  ["review", "POST"], ["review/pdf", "POST"], ["review/dashboard-pdf", "POST"],
  ["review/reassess", "POST"], ["review/reassess-documents", "POST"],
  ["contractor-email", "POST"], ["health/live", "GET"], ["health/ready", "GET"],
]);

async function proxy(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const path = (await context.params).path.join("/");
  if (!allowedPaths.has(path)) return Response.json({ detail: "Not found" }, { status: 404 });
  if (allowedPaths.get(path) !== request.method) return Response.json({ detail: "Method not allowed" }, { status: 405 });
  const requestId = randomUUID();
  const started = Date.now();
  let status = 502;
  try {
    const backend = new URL(process.env.RAMS_API_URL || "http://127.0.0.1:8000");
    if (!["http:", "https:"].includes(backend.protocol) || backend.username || backend.password || backend.search || backend.hash) {
      throw new Error("Invalid review service configuration");
    }
    const timeout = Number(process.env.RAMS_API_TIMEOUT_MS || 600_000);
    if (!Number.isFinite(timeout) || timeout <= 0) throw new Error("Invalid review service timeout");
    const headers = new Headers({ "X-Request-Id": requestId });
    for (const name of ["content-type", "accept"]) {
      const value = request.headers.get(name);
      if (value) headers.set(name, value);
    }
    const options: RequestInit & { duplex?: "half" } = {
      method: request.method,
      headers,
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(timeout)]),
    };
    if (request.method === "POST") {
      options.body = request.body;
      options.duplex = "half";
    }
    const response = await fetch(new URL(`${backend.pathname.replace(/\/$/, "")}/${path}`, backend), options);
    status = response.status;
    const responseHeaders = new Headers({ "Cache-Control": "no-store", "X-Request-Id": requestId });
    for (const name of ["content-type", "content-disposition"]) {
      const value = response.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }
    if (!response.ok && !response.headers.get("content-type")?.includes("application/json")) {
      await response.body?.cancel();
      return Response.json({ detail: "The review service could not complete this request. Please retry." }, { status, headers: responseHeaders });
    }
    return new Response(response.body, { status, headers: responseHeaders });
  } catch {
    status = 502;
    return Response.json({ detail: "The review service is unavailable. Please retry shortly." }, { status, headers: { "Cache-Control": "no-store", "X-Request-Id": requestId } });
  } finally {
    console.info(JSON.stringify({ event: "backend_request", request_id: requestId, route: path, method: request.method, status, duration_ms: Date.now() - started }));
  }
}

export const GET = proxy;
export const POST = proxy;
