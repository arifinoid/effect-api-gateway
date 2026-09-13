import { Effect, Layer } from "effect";
import { jsonResponse } from "../../application/http.ts";
import { HttpServer } from "../../services/HttpServer.ts";
import { RequestHandler } from "../../services/RequestHandler.ts";

export interface HttpServerOptions {
  readonly port: number;
  readonly hostname?: string | undefined;
}

export const BunHttpServerLive = (
  options: HttpServerOptions,
): Layer.Layer<HttpServer, never, RequestHandler> =>
  Layer.effect(
    HttpServer,
    Effect.gen(function* () {
      const handler = yield* RequestHandler;
      const context = yield* Effect.context<RequestHandler>();

      const server = yield* Effect.acquireRelease(
        Effect.sync(() =>
          Bun.serve({
            port: options.port,
            hostname: options.hostname,
            fetch: (request) =>
              Effect.runPromiseWith(context)(
                handler.handle(request).pipe(
                  Effect.catchCause((cause) =>
                    Effect.gen(function* () {
                      yield* Effect.logError("unhandled error while processing request", cause);
                      return jsonResponse(500, { error: "internal_server_error" });
                    }),
                  ),
                ),
              ).catch(() => jsonResponse(503, { error: "server_shutting_down" })),
          }),
        ),
        (server) => Effect.promise(() => server.stop()),
      );

      yield* Effect.logInfo(`http server listening on http://${server.hostname}:${server.port}`);

      if (server.port === undefined || server.hostname === undefined) {
        return yield* Effect.die("http server did not report its address");
      }

      return HttpServer.of({
        port: server.port,
        hostname: server.hostname,
      });
    }),
  );
