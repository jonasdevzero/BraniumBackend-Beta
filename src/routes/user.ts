import { FastifyPluginOptions, FastifyInstance } from "fastify"
import userController from "../controllers/user"
import authHook from "../hooks/auth"
import userSchema from "./_schema/userSchema"

export default function userRoutes(fastify: FastifyInstance, _opts: FastifyPluginOptions, done: (err?: Error) => void) {
    fastify.get("/", { 
        schema: userSchema.index 
    }, userController.index)

    fastify.get("/search", { 
        schema: userSchema.search, 
        preValidation: authHook 
    }, userController.search)

    fastify.post("/", { 
        schema: userSchema.create 
    }, userController.create)

    fastify.post("/login", { 
        schema: userSchema.login 
    }, userController.login)

    fastify.post("/auth", { 
        schema: userSchema.auth,
        preValidation: authHook 
    }, userController.auth)

    fastify.put("/", {
        schema: userSchema.update,
        preValidation: authHook 
    }, userController.update)

    fastify.post("/forgot_password", { 
        schema: userSchema.forgotPassword 
    }, userController.forgotPassword)

    fastify.post("/reset_password", { 
        schema: userSchema.resetPassword 
    }, userController.resetPassword)

    fastify.post("/delete", {
        schema: userSchema.Sdelete,
        preValidation: authHook 
    }, userController.delete)

    fastify.post("/restore", { 
        schema: userSchema.restore 
    }, userController.restore)

    done()
}