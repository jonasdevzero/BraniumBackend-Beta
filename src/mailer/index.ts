import nodeMailer from "nodemailer"
import ejs from "ejs"
import path from "path"

const mailer = nodeMailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: "devzerotest@gmail.com",
        pass: process.env.NODEMAILER_PASS,
    },
})

/**
 * Sends mails
 */
export function sendMail(to: string, subject: string, html: string) {
    return mailer.sendMail({
        from: "Dev Zero <devzerotest@gmail.com>",
        to,
        subject,
        html,
    })
}

/**
 * Return promise with html string
 * @param name The name of the template without '.' extension
 * @param data The Data that must contains in the file
 */
export function loadTemplate(name: string, data: any): Promise<string> {
    const filename = path.join(path.resolve(path.dirname("")), "src", "mailer", "views", `${name}.ejs`)
    return ejs.renderFile(filename, data)
}
