import { createMiddleware } from "hono/factory";

export type RequestVariables = {
  requestId: string;
};

export const requestContext = createMiddleware<{ Variables: RequestVariables }>(async (c, next) => {
  const incoming = c.req.header("X-Request-Id");
  const requestId =
    incoming && /^[A-Za-z0-9._:-]{1,128}$/.test(incoming) ? incoming : crypto.randomUUID();
  const startedAt = Date.now();
  c.set("requestId", requestId);
  c.header("X-Request-Id", requestId);

  await next();

  console.info(
    JSON.stringify({
      level: "info",
      event: "http_request",
      requestId,
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
      durationMs: Date.now() - startedAt,
    }),
  );
});
