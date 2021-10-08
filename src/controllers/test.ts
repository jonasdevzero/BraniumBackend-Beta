import { ServerRequest, ServerReply } from "../types/controller"
import * as mailer from "../mailer"

export default {
    async sendMail(req: ServerRequest, reply: ServerReply) {
        try {
            const { email } = req.query

            const template = await mailer.loadTemplate("test", {})
            mailer.sendMail(email, "Completar cadastro!", template)

            reply.status(201).send({ message: "Verifique seu e-mail!" })
        } catch (error) {
            reply.status(500).send({ message: "Internal Server Error", error })
        }
    }
}
