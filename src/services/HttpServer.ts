import { Context } from "effect";

export class HttpServer extends Context.Service<
  HttpServer,
  {
    readonly port: number;
    readonly hostname: string;
  }
>()("gateway/infrastructure/http-server/HttpServer") {}
