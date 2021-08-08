import { getRepository } from "typeorm"
import { ServerRequest, ServerReply } from "../../types/controller"
import { Contact, ContactMessage } from "../../models"
import { upload } from "../../utils"
import { v4 as uuidV4 } from "uuid"

export default {
    async index(req: ServerRequest, reply: ServerReply) {
        try {
            const id = req.user
            const contact_id = req.params.contact
            let { limit, skip } = req.query

            limit = limit > 0 ? limit : 50
            skip = (skip > 0 ? skip : 0) * limit

            const contactRepository = getRepository(Contact)
            const cMessageRepository = getRepository(ContactMessage)

            const contact = await contactRepository.findOne({ 
                where: { user_id: id, contact_user_id: contact_id }, 
                select: ["id"] 
            })

            if (!contact)
                return reply.status(404).send({ message: "Contato não encontrado!" })
            
            const messages = await cMessageRepository.find({
                where: { contact_id: contact.id },
                take: limit,
                skip,
                order: { created_at: "DESC" },
            })

            reply.status(200).send({ messages })
        } catch (error) {
            reply.status(500).send({ message: "Internal Server Error", error })
        }
    },

    async create(req: ServerRequest, reply: ServerReply) {
        try {
            if (!req.isMultipart()) // for the future
                return reply.status(400).send({ message: "Envie os dados no formato Multipart!" })
            
            const sender_id = req.user.toString()
            const { text, to } = upload.parseBody(req.body)

            const contactRepository = getRepository(Contact)
            const [sender, receiver] = await Promise.all([
                contactRepository.findOne({ where: { user_id: sender_id, contact_user_id: to } }),
                contactRepository.findOne({ where: { user_id: to, contact_user_id: sender_id } }),
            ])

            if (!sender)
                return reply.status(404).send({ message: "Sua conta não foi encontrada!" })

            if (!receiver)
                return reply.status(404).send({ message: "Contato não encontrado!" })
            
            if (sender.blocked)
                return reply.status(400).send({ message: "Você foi bloqueado!" })

            if (sender.you_blocked)
                return reply.status(400).send({ message: "Você bloqueou este contato!" })

            const cMessagesRepository = getRepository(ContactMessage),
                bidirectional_id = uuidV4(), 
                created_at = new Date(),
                unread_messages = receiver.unread_messages + 1

            const [message] = await Promise.all([
                cMessagesRepository.create({ text, sender_id, bidirectional_id, created_at, contact_id: sender.id, viewed: false }).save(),
                cMessagesRepository.create({ text, sender_id, bidirectional_id, created_at, contact_id: receiver.id, viewed: true }).save(),
                contactRepository.update(sender.id, { last_message_time: created_at }),
                contactRepository.update(receiver.id, { unread_messages, last_message_time: created_at }),
            ])

            reply.status(201).send({ message, to })
        } catch (error) {
            reply.status(500).send({ message: "Internal Server Error", error })
        }
    },

    async view(req: ServerRequest, reply: ServerReply) {
        try {
            const id = req.user
            const contact_id = req.params.contact

            const contactRepository = getRepository(Contact)
            const [myContact, contact] = await Promise.all([
                contactRepository.findOne({ where: { user_id: id, user_contact_id: contact_id } }),
                contactRepository.findOne({ where: { user_id: contact_id, user_contact_id: id } }),
            ])

            if (!contact || !myContact)
                return reply.status(404).send({ message: "Contato não encontrado!" })
            
            const cMessagesRepository = getRepository(ContactMessage)
            const unviewedMessages = await cMessagesRepository.find({ where: { contact, viewed: false, sender_id: id } })

            await Promise.all([
                contactRepository.update(myContact, { unread_messages: 0 }),
                unviewedMessages.map(m => cMessagesRepository.update(m, { viewed: true }))
            ])

            reply.status(200).send({ message: "ok" })
        } catch (error) {
            reply.status(500).send({ message: "Internal Server Error", error })
        }
    },

    async deleteOne(req: ServerRequest, reply: ServerReply) {
        try {
            const id = req.user
            const message_id = req.params.message
            const { target } = req.query

            const cMessagesRepository = getRepository(ContactMessage)
            const message = await cMessagesRepository.findOne(message_id, { relations: ["contact"] })

            if (!message)
                return reply.status(404).send({ message: "Mensagem não encontrada!" })

            if (message.contact.user_id !== id)
                return reply.status(401).send({ message: "Você não enviou esta mensagem!" })

            switch (target) {
                case "me":
                    await cMessagesRepository.delete({ id: message_id })
                    break
                case "bidirectional":
                    if (message.sender_id !== id)
                        return reply.status(401).send({ message: "Você não enviou esta mensagem!" })

                    await cMessagesRepository.delete({ bidirectional_id: message.bidirectional_id })
                    break
                default:
                    return reply.status(400).send({ message: "target inválido!" })
            }

            return reply.status(200).send({ message: "ok" })
        } catch (error) {
            reply.status(500).send({ message: "Internal Server Error", error })
        }
    },

    async clear(req: ServerRequest, reply: ServerReply) {
        try {
            const id = req.user 
            const contact_id = req.params.contact

            const contactRepository = getRepository(Contact)
            const contact = await contactRepository.findOne({ where: { user_id: id, contact_user_id: contact_id } })

            if (!contact)
                return reply.status(404).send({ message: "Contato não encontrado!" })

            const cMessagesRepository = getRepository(ContactMessage)
            await cMessagesRepository.delete({ contact })

            reply.status(200).send({ message: "ok" })
        } catch (error) {
            reply.status(500).send({ message: "Internal Server Error", error })
        }
    },
}
