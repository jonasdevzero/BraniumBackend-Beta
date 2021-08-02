import { getRepository, ILike, Not } from "typeorm"
import { ServerRequest, ServerReply } from "../types/controller"
import User from "../models/User"
import { userUtil, upload } from "../utils"
import * as yup from "yup"
import * as mailer from "../mailer"

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
            const id = req.user.toString()
            const { username } = req.query

            const userRepository = getRepository(User)
            const [user, users] = await Promise.all([
                userRepository.findOne(id, { relations: ["contacts"], withDeleted: true }),
                userRepository.find({ where: { username: ILike(`%${username}%`) }, take: 20 }),
            ])

            if (!user)
                return reply.status(500).send({ message: "Conta não encontrada!" })

            if (user.deleted_at)
                return reply.status(400).send({ message: "Sua conta foi deletada! Restaure-a!" })

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
            const { name, username, email, password, confirm_password } = req.body

            if (password !== confirm_password)
                return reply.status(500).send({ message: "Senhas diferentes" })

            const schema = yup.object().shape({
                confirm_password: yup.string().min(6).required("Preencha o campo 'confirmar senha'"),
                password: yup.string().min(6, "A senha deve ter no mínimo 6 caracteres").required("Preencha o campo 'senha'"),
                email: yup.string().lowercase().email("Formatação de email incorreta").required("Preencha o campo 'email'"),
                username: yup.string().lowercase().min(4, "O username deve ter no mínimo 4 caracteres").required("Preencha o campo 'username'"),
                name: yup.string().required("Preencha o campo 'nome'"),
            })

            let validationError: any = undefined
            const userRepository = getRepository(User)
            const [existsUsername, existsEmail] = await Promise.all([
                userRepository.findOne({ where: { username }, withDeleted: true }),
                userRepository.findOne({ where: { email }, withDeleted: true }),
                schema.validate(req.body).catch(err => validationError = err)
            ])

            if (validationError)
                return reply.status(400).send({ message: validationError.errors[0] })

            if (existsUsername)
                return reply.status(400).send({ message: "Username em uso" })

            if (existsEmail)
                return reply.status(400).send({ message: "Email já registrado" })

            const user = await userRepository.create({ name, username, email, password }).save()
            const token = await reply.jwtSign({ id: user.id }, { expiresIn: 86400000 })

            reply.status(201).send({ token })
        } catch (error) {
            reply.status(500).send({ message: "Internal Server Error", error })
        }
    },

    async login(req: ServerRequest, reply: ServerReply) {
        try {
            const { ref, password }: { ref: string, password: string } = req.body

            const userRepository = getRepository(User)

            const target = /^[a-z0-9.]+@[a-z0-9]+\.[a-z]+(\.[a-z]+)?$/i.test(ref) ? "email" : "username"
            const user = await userRepository.findOne({ where: { [target]: ref }, withDeleted: true })

            if (!user)
                return reply.status(400).send({ message: `'${target}' incorreto` })

            if (user.deleted_at)
                return reply.status(400).send({ message: "Sua conta foi deletada! Restaure-a!" })

            if (!userUtil.comparePasswords(password, user.password))
                return reply.status(401).send({ message: "Senha Incorreta" })

            const token = await reply.jwtSign({ id: user.id }, { expiresIn: 86400000 })
            reply.status(200).send({ token })
        } catch (error) {
            reply.status(500).send({ message: "Internal Server Error", error })
        }
    },

    async auth(req: ServerRequest, reply: ServerReply) {
        try {
            const id = req.user.toString()

            const userRepository = getRepository(User)
            const user = await userRepository.findOne(id, {
                relations: ["contacts", "contacts.contact", "contact_invitations", "contact_invitations.sender"],
                withDeleted: true
            })

            if (user?.deleted_at)
                return reply.status(400).send({ message: "Sua conta foi deletada! Restaure-a!" })

            reply.status(200).send({ user })
        } catch (error) {
            reply.status(500).send({ message: "Internal Server Error", error })
        }
    },

    async update(req: ServerRequest, reply: ServerReply) {
        try {
            const id = req.user.toString()
            const { name, username } = req.body

            const userRepository = getRepository(User)

            const scheme = yup.object({
                name: yup.string().required("Preencha o campo 'nome'"),
                username: yup.string().min(4, "O username deve ter no mínimo 4 caracteres").required("Preencha o campo 'username'")
            })
            let validationError: any = undefined

            const [user, existsUsername] = await Promise.all([
                userRepository.findOne(id),
                userRepository.findOne({ where: { username, id: Not(id) } }),
                scheme.validate(req.body).catch(error => validationError = error)
            ])

            if (validationError)
                return reply.status(400).send({ message: validationError.errors[0] })

            if (!user)
                return reply.status(500).send({ message: "Usuário não encontrado!" })

            if (existsUsername)
                return reply.status(400).send({ message: "Username em uso!" })

            await userRepository.update(id, { name, username })
            return reply.status(200).send({ name, username })
        } catch (error) {
            reply.status(500).send({ message: "Internal Server Error", error })
        }
    },

    async email(req: ServerRequest, reply: ServerReply) {
        try {
            const id = req.user.toString()
            const { email, password } = req.body
            
            const schema = yup.object({
                email: yup.string().email("Email mal formatado").required("Preencha o campo 'email'"),
                password: yup.string().required("Preencha o campo  'senha'")
            })
            let validationError: any = undefined

            const userRepository = getRepository(User)
            const [user, existsEmail] = await Promise.all([
                userRepository.findOne(id),
                userRepository.findOne({ where: { id: Not(id), email } }),
                schema.validate(req.body).catch(error => validationError = error)
            ])

            if (validationError)
                return reply.status(400).send({ message: validationError.errors[0] })

            if (!user)
                return reply.status(500).send({ message: "Usuário não encontrado!" })

            if (existsEmail)
                return reply.status(400).send({ message: "Email em uso!" })

            if (!userUtil.comparePasswords(password, user.password))
                return reply.status(401).send({ message: "Senha incorreta!" })

            await userRepository.update(id, { email })

            reply.status(200).send({ email })
        } catch (error) {
            reply.status(500).send({ message: "Internal Server Error", error })
        }
    },

    async picture(req: ServerRequest, reply: ServerReply) {
        try {
            const id = req.user.toString()
            const { picture } = upload.parseBody(req.body)

            const userRepository = getRepository(User)
            const user = await userRepository.findOne(id)

            if (!user)
                return reply.status(500).send({ message: "Error inesperado! Tente novamente" })

            let location = null
            if (picture) {
                const [{ Location }] = await Promise.all([
                    upload.save(picture),
                    user.picture ? upload.remove(user.picture) : null
                ]).catch((error) => reply.status(500).send({ message: "Não foi possível atualizar a imagem!", error }))

                location = Location
                await userRepository.update(id, { picture: Location })
            } else if (user.picture) {
                await Promise.all([
                    upload.remove(user.picture),
                    userRepository.update(id, { picture: undefined })
                ]).catch(() => reply.status(500).send({ message: 'Não foi possível remover a imagem!' }))
            }

            reply.status(200).send({ location })
        } catch (error) {
            reply.status(500).send({ message: "Internal Server Error", error })
        }
    },

    async forgotPassword(req: ServerRequest, reply: ServerReply) {
        try {
            const { email } = req.body

            const userRepository = getRepository(User)
            const user = await userRepository.findOne({ where: { email }, withDeleted: true })

            if (!user)
                return reply.status(400).send({ message: 'Conta não encontrada!' })

            if (user.deleted_at)
                return reply.status(400).send({ message: "Sua conta foi deletada! Restaure-a!" })

            const reset_token = userUtil.generateHash()
            const expire_token = new Date()
            expire_token.setHours(new Date().getHours() + 1)

            const { id } = user
            await userRepository.update(id, { reset_token, expire_token })

            const link = `${process.env.CLIENT_URL}/resetPassword/${reset_token}`
            const template = await mailer.loadTemplate("forgotPassword", { link })
            mailer.sendMail(email, "Password Reset", template)

            reply.status(200).send({ message: 'Verifique seu email' })
        } catch (error) {
            reply.status(500).send({ message: "Internal Server Error", error })
        }
    },

    async resetPassword(req: ServerRequest, reply: ServerReply) {
        try {
            const { password, confirm_password, reset_token } = req.body

            if (password !== confirm_password)
                return reply.status(400).send({ message: 'Senhas diferentes' })

            const schema = yup.object({
                reset_token: yup.string().required("Token para resetar está faltando"),
                password: yup.string().min(6, "A senha deve ter no mínimo 6 caracteres").required("Preencha o campo senha")
            })

            let validationError: any = undefined
            schema.validate(req.body).catch(err => validationError = err)

            if (validationError)
                return reply.status(400).send({ message: validationError.errors[0] })

            const userRepository = getRepository(User)
            const user = await userRepository.findOne({ where: { reset_token } })

            if (!user)
                return reply.status(400).send({ message: 'Token inválido' })

            const now = new Date()
            if (now > user.expire_token)
                return reply.status(400).send({ message: 'Token expirado' })

            await userRepository.update(user, { password: userUtil.encryptPassword(password), reset_token: undefined, expire_token: undefined })
            reply.status(200).send({ message: 'Senha alterada com sucesso!' })
        } catch (error) {
            reply.status(500).send({ message: "Internal Server Error", error })
        }
    },

    async delete(req: ServerRequest, reply: ServerReply) {
        try {
            const id = req.user.toString()
            const { password } = req.body

            const userRepository = getRepository(User)
            const user = await userRepository.findOne(id, { withDeleted: true })

            if (!user)
                return reply.status(500).send({ message: 'Usuário não encontrado!' })

            if (user.deleted_at)
                return reply.status(400).send({ message: "Conta já deletada!" })

            if (!userUtil.comparePasswords(password, user.password))
                return reply.status(401).send({ message: 'Senha Incorreta' })

            await userRepository.softDelete(user)

            reply.status(200).send({ message: 'ok' })
        } catch (error) {
            reply.status(500).send({ message: "Internal Server Error", error })
        }
    },

    async restore(req: ServerRequest, reply: ServerReply) {
        try {
            const { username, password } = req.body

            const userRepository = getRepository(User)
            const user = await userRepository.findOne({ where: { username }, withDeleted: true })

            if (!user)
                return reply.status(404).send({ message: 'Usuário não encontrado!' })

            if (!user.deleted_at)
                return reply.status(400).send({ message: 'Conta não deletada!' })

            if (!userUtil.comparePasswords(password, user.password))
                return reply.status(401).send({ message: 'Senha Incorreta!' })

            await userRepository.restore(user.id)
            reply.status(200).send({ message: 'ok' })
        } catch (error) {
            reply.status(500).send({ message: "Internal Server Error", error })
        }
    },
}
