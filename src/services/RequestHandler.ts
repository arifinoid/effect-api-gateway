import { Context, Effect } from "effect";

export class RequestHandler extends Context.Service<
  RequestHandler,
  {
    handle(request: Request): Effect.Effect<Response>;
  }
>()("gateway/application/RequestHandler") {}
