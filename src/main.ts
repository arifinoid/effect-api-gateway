import { BunRuntime } from "@effect/platform-bun";
import { Layer } from "effect";
import { RequestHandlerLive } from "./application/handler.ts";
import { BunHttpServerLive } from "./infrastructure/http-server/BunHttpServer.ts";

const Gateway = BunHttpServerLive({ port: 3000 }).pipe(Layer.provide(RequestHandlerLive));

BunRuntime.runMain(Layer.launch(Gateway));
