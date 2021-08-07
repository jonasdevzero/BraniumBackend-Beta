import { getRepository } from "typeorm"
import { ServerRequest, ServerReply } from "../../types/controller"
import { ContactMessage } from "../../models"

export default {
    async index(req: ServerRequest, reply: ServerReply) {
        try {
            const id = req.user
            const contact_id = req.params.contact

            const cMessageRepository = getRepository(ContactMessage)
            const messages = cMessageRepository.find({ where: { contact: { user_id: id, contact_user_id: contact_id } } })

            reply.status(200).send({ messages })
        } catch (error) {
            reply.status(500).send({ message: "Internal Server Error", error })
        }
    },
}
