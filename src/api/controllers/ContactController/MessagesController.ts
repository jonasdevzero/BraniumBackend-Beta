import { getRepository } from "typeorm"
import { ServerRequest, ServerReply } from "../../interfaces/controller"
import { Contact, ContactMediaMessage, ContactMessage } from "../../models"
import { upload } from "../../helpers"
import { v4 as uuidV4 } from "uuid"
import socketEmit from "../../websocket/emit"

// CTRL d > Implemet Socket Event Bellow

export default {
    async index(req: ServerRequest, reply: ServerReply) {
        try {
            const id = req.user
            const contact_id = req.params.contact
            let { limit, skip, skip_u } = req.query

            limit = limit > 0 ? limit : 30
            skip = ((skip > 0 ? skip : 0) * limit) + (skip_u || 0)

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
                relations: ["medias"],
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
            const { text, to, medias } = upload.parseBody(req.body)

            if (!text && !medias)
                return reply.status(400).send({ message: "Você deve enviar algum dado!" })
                
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

            const cMessageRepository = getRepository(ContactMessage),
                bidirectional_id = uuidV4(), 
                created_at = new Date(),
                unread_messages = receiver.unread_messages + 1

            const [message, receiverMessage] = await Promise.all([
                cMessageRepository.create({ text, sender_id, bidirectional_id, created_at, contact_id: sender.id, viewed: false }).save(),
                cMessageRepository.create({ text, sender_id, bidirectional_id, created_at, contact_id: receiver.id, viewed: true }).save(),
                contactRepository.update(sender.id, { last_message_time: created_at }),
                contactRepository.update(receiver.id, { unread_messages, last_message_time: created_at }),
            ])

            if (medias && message && receiverMessage) {
                const mediaRepository = getRepository(ContactMediaMessage)

                const uploadedMedias = await Promise.all((Array.isArray(medias) ? medias : [medias]).map(m => upload.save(m)))
                const [mediasSaved, receiverMediasSaved] = await Promise.all([
                    Promise.all(uploadedMedias.map(m => {
                        return mediaRepository.create({ message_id: message.id, url: m.Location, type: m.type }).save()
                    })),
                    Promise.all(uploadedMedias.map(m => {
                        return mediaRepository.create({ message_id: receiverMessage.id, url: m.Location, type: m.type }).save()
                    })),
                ])

                message.medias = mediasSaved
                receiverMessage.medias = receiverMediasSaved
            }

            socketEmit.contact.message(message, receiverMessage, to)
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
                contactRepository.findOne({ where: { user_id: id, contact_user_id: contact_id } }),
                contactRepository.findOne({ where: { user_id: contact_id, contact_user_id: id } }),
            ])

            if (!contact || !myContact)
                return reply.status(404).send({ message: "Contato não encontrado!" })
            
            const cMessageRepository = getRepository(ContactMessage)
            const unviewedMessages = await cMessageRepository.find({ where: { contact, viewed: false, sender_id: id } })

            await Promise.all([
                contactRepository.update(myContact, { unread_messages: 0 }),
                unviewedMessages.map(m => cMessageRepository.update(m, { viewed: true }))
            ])

            reply.status(200).send({ message: "ok" })

            // Implemet Socket Event Bellow
        } catch (error) {
            reply.status(500).send({ message: "Internal Server Error", error })
        }
    },

    async deleteOne(req: ServerRequest, reply: ServerReply) {
        try {
            const id = req.user
            const message_id = req.params.message
            let { target } = req.query

            const cMessageRepository = getRepository(ContactMessage)
            const message = await cMessageRepository.findOne(message_id, { relations: ["contact"] })

            if (!message)
                return reply.status(404).send({ message: "Mensagem não encontrada!" })

            if (message.contact.user_id !== id)
                return reply.status(401).send({ message: "Você não enviou esta mensagem!" })

            target = !target ? "me" : target 
            switch (target) {
                case "me":
                    await cMessageRepository.delete({ id: message_id })
                    break
                case "bidirectional":
                    if (message.sender_id !== id)
                        return reply.status(401).send({ message: "Você não enviou esta mensagem!" })

                    await cMessageRepository.delete({ bidirectional_id: message.bidirectional_id })
                    break
            }

            reply.status(200).send({ message: "ok" })

            // Implemet Socket Event Bellow
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

            const cMessageRepository = getRepository(ContactMessage)
            await cMessageRepository.delete({ contact })

            reply.status(200).send({ message: "ok" })
        } catch (error) {
            reply.status(500).send({ message: "Internal Server Error", error })
        }
    },
}
