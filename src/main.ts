import { BunRuntime } from "@effect/platform-bun";
import { Effect, Layer } from "effect";

const Gateway = Layer.effectDiscard(
  Effect.gen(function* () {
    yield* Effect.logInfo("gateway starting");
  }),
);

BunRuntime.runMain(Layer.launch(Gateway));
