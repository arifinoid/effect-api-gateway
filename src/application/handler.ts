import { Effect, Layer } from "effect";
import { RequestHandler } from "../services/RequestHandler.ts";
import { jsonResponse } from "./http.ts";

export const RequestHandlerLive = Layer.succeed(RequestHandler, {
  handle: (request: Request): Effect.Effect<Response> => {
    const { pathname } = new URL(request.url);
    if (pathname === "/healthz") {
      return Effect.succeed(jsonResponse(200, { status: "ok" }));
    }
    return Effect.succeed(jsonResponse(404, { error: "not_found", path: pathname }));
  },
});
