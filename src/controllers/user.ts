import { getRepository, ILike } from "typeorm"
import { ServerRequest, ServerReply } from "../types/controller"
import User from "../models/User"

export default {
    async index(_req: ServerRequest, reply: ServerReply) {
        try {
            const userRepository = getRepository(User)
            const user = await userRepository.find()

            // create pagination here...

            reply.status(200).send({ user })
        } catch (error) {
            reply.status(500).send({ message: "Internal Server Error", error })
        }
    },

    async search(req: ServerRequest, reply: ServerReply) {
        try {
            const id =  req.user.toString()
            const { username } = req.query

            const userRepository = getRepository(User)
            const [user, users] = await Promise.all([
                userRepository.findOne(id, { relations: ["contact"] }),
                userRepository.find({ where: { username: ILike(`%${username}%`) }, take: 30 }),
            ])

            if (!user)
                return reply.status(200).send({ message: 'Unexpected Error' });

            const existentContacts = user.contacts.map(c => c.contact_user_id)
            existentContacts.push(id)

            const filteredUsers = users.filter(u => !existentContacts.includes(u.id))

            reply.status(200).send({ user: filteredUsers })
        } catch (error) {
            reply.status(500).send({ message: "Internal Server Error", error })
        }
    },

    async create(req: ServerRequest, reply: ServerReply) {
        try {
            
        } catch (error) {
            reply.status(500).send({ message: "Internal Server Error", error })
        }
    },

    async login(req: ServerRequest, reply: ServerReply) {
        try {
            
        } catch (error) {
            reply.status(500).send({ message: "Internal Server Error", error })
        }
    },

    async auth(req: ServerRequest, reply: ServerReply) {
        try {
            
        } catch (error) {
            reply.status(500).send({ message: "Internal Server Error", error })
        }
    },

    async update(req: ServerRequest, reply: ServerReply) {
        try {
            
        } catch (error) {
            reply.status(500).send({ message: "Internal Server Error", error })
        }
    },

    async forgotPassword(req: ServerRequest, reply: ServerReply) {
        try {
            
        } catch (error) {
            reply.status(500).send({ message: "Internal Server Error", error })
        }
    },

    async resetPassword(req: ServerRequest, reply: ServerReply) {
        try {
            
        } catch (error) {
            reply.status(500).send({ message: "Internal Server Error", error })
        }
    },

    async delete(req: ServerRequest, reply: ServerReply) {
        try {
            
        } catch (error) {
            reply.status(500).send({ message: "Internal Server Error", error })
        }
    },

    async restore(req: ServerRequest, reply: ServerReply) {
        try {
            
        } catch (error) {
            reply.status(500).send({ message: "Internal Server Error", error })
        }
    },
}
