import sgMail from "@sendgrid/mail"
import ejs from "ejs"
import path from "path"

const API_KEY = process.env.SENDGRID_KEY || ""

sgMail.setApiKey(API_KEY)

/**
 * Sends mails
 */
export function sendMail(to: string, subject: string, html: string) {
    return sgMail.send({
        from: "devzerotest@gmail.com",
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
    const filename = path.join(path.resolve(path.dirname("")), "src", "utils", "mailer", "views", `${name}.ejs`)
    return ejs.renderFile(filename, data)
}
