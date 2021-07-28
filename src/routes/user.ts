import { FastifyPluginOptions, FastifyInstance } from "fastify"
import userController from "../controllers/user"
import authHook from "../hooks/auth"
import userScheme from "./_scheme/userScheme"

export default function userRoutes(fastify: FastifyInstance, _opts: FastifyPluginOptions, done: (err?: Error) => void) {
    fastify.addHook("onError", (req, reply, err, done) => {
        reply.status(400).send({ message: "Error on send request", err })
    })

    fastify.get("/", { schema: userScheme.index }, userController.index)

    fastify.get("/search", { preValidation: authHook }, userController.search)

    fastify.post("/", { schema: userScheme.create }, userController.create)

    fastify.post("/login", userController.login)

    fastify.post("/auth", { preValidation: authHook }, userController.auth)

    fastify.put("/", { preValidation: authHook }, userController.update)

    fastify.post("/forgot_password", userController.forgotPassword)

    fastify.post("/reset_password", userController.resetPassword)

    fastify.post("/delete", { preValidation: authHook }, userController.delete)

    fastify.post("/restore", userController.restore)

    done()
}