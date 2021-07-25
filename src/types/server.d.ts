import { FastifyRequest } from "fastify"

export interface ServerRequest extends FastifyRequest {
    body: any
    params: any
    query: any
}
