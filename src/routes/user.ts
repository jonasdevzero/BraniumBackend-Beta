import { FastifyPluginOptions, FastifyInstance } from "fastify"
import userController from "../controllers/user"
import authHook from "../hooks/auth"

export default function userRoutes(fastify: FastifyInstance, _opts: FastifyPluginOptions, done: (err?: Error) => void) {
    fastify.get("/", userController.index)
    fastify.get("/search", { preValidation: authHook }, userController.search)

    done()
}