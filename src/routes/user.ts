import { FastifyPluginOptions, FastifyInstance } from "fastify"
import userController from "../controllers/user"
import authHook from "../hooks/auth"
import userSchema from "./_schema/userSchema"
import { serializeAuth } from "./_preSerializer/userSerializer"

export default function userRoutes(fastify: FastifyInstance, _opts: FastifyPluginOptions, done: (err?: Error) => void) {
    fastify.get("/", { 
        schema: userSchema.index 
    }, userController.index)

    fastify.get("/search", { 
        schema: userSchema.search, 
        preValidation: authHook 
    }, userController.search)

    fastify.get("/pre_registration/:id", {
        schema: userSchema.showPreRegistration
    }, userController.showPreRegistration)

    fastify.post("/pre_registration", {
        schema: userSchema.preRegistration
    }, userController.preRegistration)    

    fastify.post("/registration/:id", { 
        schema: userSchema.registration 
    }, userController.registration)

    fastify.post("/login", { 
        schema: userSchema.login 
    }, userController.login)

    fastify.post("/auth", { 
        schema: userSchema.auth,
        preValidation: authHook,
        preSerialization: serializeAuth
    }, userController.auth)

    fastify.put("/", {
        schema: userSchema.update,
        preValidation: authHook 
    }, userController.update)

    fastify.patch("/email", {
        schema: userSchema.email,
        preValidation: authHook
    }, userController.email)

    fastify.patch("/picture", {
        schema: userSchema.picture,
        preValidation: authHook
    }, userController.picture)

    fastify.post("/forgot_password", { 
        schema: userSchema.forgotPassword 
    }, userController.forgotPassword)

    fastify.patch("/reset_password", { 
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