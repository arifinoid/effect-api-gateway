import { describe, expect, test } from "bun:test"
import { Effect, Layer } from "effect"
import { RequestHandlerLive } from "../src/application/handler.ts"
import { jsonResponse } from "../src/application/http.ts"
import { BunHttpServerLive } from "../src/infrastructure/http-server/BunHttpServer.ts"
import { HttpServer } from "../src/services/HttpServer.ts"
import { RequestHandler } from "../src/services/RequestHandler.ts"

const withServer = <A>(f: (port: number) => Promise<A>): Promise<A> =>
  Effect.runPromise(
    Effect.gen(function*() {
      const server = yield* HttpServer
      return yield* Effect.promise(() => f(server.port))
    }).pipe(
      Effect.provide(BunHttpServerLive({ port: 0 })),
      Effect.provide(RequestHandlerLive),
      Effect.scoped
    )
  )

const withBoomServer = <A>(f: (port: number) => Promise<A>): Promise<A> => {
  const boomHandler = Layer.succeed(RequestHandler, {
    handle: (request: Request) =>
      new URL(request.url).pathname === "/boom"
        ? Effect.die("boom")
        : Effect.succeed(jsonResponse(404, { error: "not_found" }))
  })
  return Effect.runPromise(
    Effect.gen(function*() {
      const server = yield* HttpServer
      return yield* Effect.promise(() => f(server.port))
    }).pipe(
      Effect.provide(BunHttpServerLive({ port: 0 })),
      Effect.provide(boomHandler),
      Effect.scoped
    )
  )
}

describe("http server", () => {
  test("GET /healthz returns 200 with status ok", async () => {
    await withServer(async (port) => {
      const res = await fetch(`http://localhost:${port}/healthz`)
      expect(res.status).toBe(200)
      expect(res.headers.get("content-type")).toBe("application/json")
      expect(await res.json()).toEqual({ status: "ok" })
    })
  })

  test("unknown path returns 404", async () => {
    await withServer(async (port) => {
      const res = await fetch(`http://localhost:${port}/nope`)
      expect(res.status).toBe(404)
      expect(await res.json()).toEqual({ error: "not_found", path: "/nope" })
    })
  })

  test("defect in handler is mapped to 500", async () => {
    await withBoomServer(async (port) => {
      const res = await fetch(`http://localhost:${port}/boom`)
      expect(res.status).toBe(500)
      expect(await res.json()).toEqual({ error: "internal_server_error" })
    })
  })
})
