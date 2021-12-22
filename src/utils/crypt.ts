import bcryptjs from 'bcryptjs'
import crypto from 'crypto'

export default {
    encryptPassword(password: string) {
        const salt = bcryptjs.genSaltSync(10)
        return bcryptjs.hashSync(password, salt)
    },

    comparePasswords(password: string, passwordHash: string) {
        return bcryptjs.compareSync(password, passwordHash)
    },

    generateHash() {
        return crypto.randomBytes(20).toString('hex')
    }
}
