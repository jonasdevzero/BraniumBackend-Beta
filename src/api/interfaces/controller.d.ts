import { FastifyRequest, FastifyReply } from "fastify"

export interface ServerRequest extends FastifyRequest {
    body: any
    params: any
    query: any
}

export interface ServerReply extends FastifyReply {}