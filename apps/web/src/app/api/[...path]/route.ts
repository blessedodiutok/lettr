// Runs the Express API inside this Next.js app when DEMO_MODE is on, so the
// portfolio demo deploys to Vercel as one project on one URL. Anywhere else,
// next.config.ts rewrites /api/* to the standalone API and this never runs.

import { IncomingMessage, ServerResponse } from "node:http";
import type { Socket } from "node:net";
import { PassThrough } from "node:stream";

export const dynamic = "force-dynamic";

let app: Promise<(req: IncomingMessage, res: ServerResponse) => void> | undefined;

type WriteCallback = (error?: Error | null) => void;
type Encoding = Parameters<Buffer["toString"]>[0];

/** Give Express a Node request and response, and collect what it sends back. */
function runExpress(express: (req: IncomingMessage, res: ServerResponse) => void, request: Request, body: Buffer): Promise<Response> {
  const url = new URL(request.url);
  // Body parsers treat a request on a closed socket as already read, so this one stays open.
  const socket = new PassThrough() as unknown as Socket;
  Object.defineProperty(socket, "remoteAddress", { value: "127.0.0.1" });

  const req = new IncomingMessage(socket);
  req.method = request.method;
  req.url = url.pathname + url.search;
  req.headers = Object.fromEntries(request.headers);
  // Node's HTTP parser would set this. Without it, a request read to the end still counts as aborted.
  req.complete = true;
  if (body.length) req.push(body);
  req.push(null);

  return new Promise((resolve) => {
    const res = new ServerResponse(req);
    const chunks: Buffer[] = [];
    const collect = (chunk: unknown, encoding?: Encoding) => {
      if (chunk !== undefined && chunk !== null && typeof chunk !== "function") {
        chunks.push(typeof chunk === "string" ? Buffer.from(chunk, encoding) : Buffer.from(chunk as Uint8Array));
      }
    };

    res.write = ((chunk: unknown, encoding?: Encoding | WriteCallback, callback?: WriteCallback) => {
      collect(chunk, typeof encoding === "string" ? encoding : undefined);
      (typeof encoding === "function" ? encoding : callback)?.();
      return true;
    }) as typeof res.write;

    res.end = ((chunk?: unknown, encoding?: Encoding | WriteCallback) => {
      collect(chunk, typeof encoding === "string" ? encoding : undefined);
      const headers = new Headers();
      for (const [name, value] of Object.entries(res.getHeaders())) {
        for (const item of Array.isArray(value) ? value : [value]) if (item !== undefined) headers.append(name, String(item));
      }
      const empty = request.method === "HEAD" || res.statusCode === 204 || res.statusCode === 304;
      resolve(new Response(empty ? null : Buffer.concat(chunks), { status: res.statusCode, headers }));
      // Marks the headers as sent, so request logs can report the status.
      res.writeHead(res.statusCode);
      res.emit("finish");
      return res;
    }) as typeof res.end;

    express(req, res);
  });
}

async function handle(request: Request): Promise<Response> {
  if (process.env.DEMO_MODE !== "true") return Response.json({ success: false, error: "Route not found" }, { status: 404 });
  try {
    app ??= import("@lettr/api/app").then(({ createApp }) => createApp());
    return runExpress(await app, request, Buffer.from(await request.arrayBuffer()));
  } catch (error) {
    app = undefined;
    console.error("The API could not start:", error);
    return Response.json({ success: false, error: "The API could not start. Check this deployment's environment variables." }, { status: 503 });
  }
}

export { handle as DELETE, handle as GET, handle as HEAD, handle as OPTIONS, handle as PATCH, handle as POST, handle as PUT };
