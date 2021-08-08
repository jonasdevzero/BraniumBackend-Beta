import { getRepository } from "typeorm"
import { ServerRequest, ServerReply } from "../../types/controller"
import { Contact, User, ContactInvitation } from "../../models"

export default {
    async show(req: ServerRequest, reply: ServerReply) {
        try {
            const id = req.user
            const contact_id = req.params.id

            const contactRepository = getRepository(Contact)
            const contact = await contactRepository.findOne({
                where: { user_id: id, contact_user_id: contact_id },
                relations: ["contact"]
            })

            if (!contact)
                return reply.status(404).send({ message: "Contato não encontrado!" })

            reply.status(200).send({ contact })
        } catch (error) {
            reply.status(500).send({ message: "Internal Server Error", error })
        }
    },

    async invite(req: ServerRequest, reply: ServerReply) {
        try {
            const id = req.user.toString()
            const contact_id = req.params.id

            if (id == contact_id) 
                return reply.status(400).send({ message: "Você não pode convidar a si mesmo" })

            const userRepository = getRepository(User)
            const invitationRepository = getRepository(ContactInvitation)

            const [user, existsUser, invitationAlreadySent, invitationAlreadyReceived] = await Promise.all([
                userRepository.findOne({ where: { id }, relations: ['contacts'] }),
                userRepository.findOne({ where: { id: contact_id }, select: ["id"] }),
                invitationRepository.findOne({ where: { sender_id: id, receiver_id: contact_id, pending: true } }),
                invitationRepository.findOne({ where: { sender_id: contact_id, receiver_id: id, pending: true } })
            ])

            if (!user)
                return reply.status(500).send({ message: "Sua conta não foi encontrada!" })

            if (!existsUser)
                return reply.status(400).send({ message: "Usuário não encontrado!" })

            if (user.contacts.find(c => c.contact_user_id === contact_id))
                return reply.status(400).send({ message: "Você já possui este contato" })

            if (invitationAlreadySent)
                return reply.status(400).send({ message: "Você já enviou um convite para este usuário" })

            if (invitationAlreadyReceived)
                return reply.status(400).send({ message: "Este usuário lhe enviou um convite!" })

            await invitationRepository.create({ sender: user, receiver_id: contact_id }).save()

            reply.status(201).send({ message: "ok" });
        } catch (error) {
            reply.status(500).send({ message: "Internal Server Error", error })
        }
    },

    async acceptInvite(req: ServerRequest, reply: ServerReply) {
        try {
            const id = req.user.toString()
            const invitation_id = req.params.invite

            const contactRepository = getRepository(Contact)
            const invitationsRepository = getRepository(ContactInvitation)

            const invitation = await invitationsRepository.findOne(invitation_id)

            if (!invitation)
                return reply.status(404).send({ message: "Convite não encontrado!" })

            const { sender_id, receiver_id, pending } = invitation

            if (receiver_id !== id)
                return reply.status(400).send({ message: "Este convite é para outro usuário!" })

            if (!pending)
                return reply.status(400).send({ message: "Convite inválido" })

            await Promise.all([
                contactRepository.create({ user_id: id, contact_user_id: sender_id }).save(),
                contactRepository.create({ user_id: sender_id, contact_user_id: id }).save(),
                invitationsRepository.update(invitation, { pending: false })
            ])
            const contact = await contactRepository.findOne({ where: { user_id: id, contact_user_id: sender_id }, relations: ["contact"] })

            reply.status(201).send({ contact })
        } catch (error) {
            reply.status(500).send({ message: "Internal Server Error", error })
        }
    },

    async refuseInvite(req: ServerRequest, reply: ServerReply) {
        try {
            const id = req.user
            const invitation_id = req.params.invite

            const invitationsRepository = getRepository(ContactInvitation)
            const invitation = await invitationsRepository.findOne({ where: { id: invitation_id, receiver_id: id } })

            if (!invitation)
                return reply.status(404).send({ message: "Convite não encontrado!" })

            const { receiver_id, pending } = invitation

            if (receiver_id !== id)
                return reply.status(400).send({ message: "Este convite é para outro usuário!" })

            if (!pending)
                return reply.status(400).send({ message: "Convite inválido!" })

            await invitationsRepository.update(invitation, { pending: false })

            return reply.status(200).send({ message: "ok" })
        } catch (error) {
            reply.status(500).send({ message: "Internal Server Error", error })
        }
    },

    async block(req: ServerRequest, reply: ServerReply) {
        try {
            const id = req.user.toString()
            const contact_id = req.params.id

            const contactRepository = getRepository(Contact)

            // "myContact" is my contact that I have with the other user. "contact" is the contact that the other user has with me.
            const [myContact, contact] = await Promise.all([
                contactRepository.findOne({ user_id: id, contact_user_id: contact_id }),
                contactRepository.findOne({ user_id: contact_id, contact_user_id: id })
            ])

            if (!myContact || !contact)
                return reply.status(400).send({ message: "Contato não encontrado!" })

            await Promise.all([
                contactRepository.update(myContact, { you_blocked: !myContact.you_blocked }),
                contactRepository.update(contact, { blocked: !contact.blocked })
            ])

            reply.status(200).send({ you_blocked: !myContact.you_blocked })
        } catch (error) {
            reply.status(500).send({ message: "Internal Server Error", error })
        }
    },
}
