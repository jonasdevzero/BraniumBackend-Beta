import { FastifyRequest, FastifyReply, HookHandlerDoneFunction } from "fastify"

export default function authHook(req: FastifyRequest, reply: FastifyReply, done: HookHandlerDoneFunction) {
    req.jwtVerify((err: any, decoded: any) => {
        if (err)
            return reply.status(401).send({ message: err.message })

        req.user = decoded.id
        done()
    })
}
