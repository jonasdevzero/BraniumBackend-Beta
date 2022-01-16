import sgMail from '@sendgrid/mail';
import ejs from 'ejs';
import path from 'path';

const API_KEY = process.env.SENDGRID_KEY || 'SG.';
const nodeEnv = process.env.NODE_ENV as string;

sgMail.setApiKey(API_KEY);

interface SendTemplatedEmailI {
    to: string;
    subject: string;
    templateName: string;
    data?: { [key: string]: any };
}

export default {
    sendMail(to: string, subject: string, html: string) {
        return ['development', 'test'].includes(nodeEnv)
            ? new Promise(resolve => resolve('ok'))
            : sgMail.send({
                  from: 'devzerotest@gmail.com',
                  to,
                  subject,
                  html,
              });
    },

    /**
     * Return promise with html string
     * @param name The name of the template without '.' extension
     * @param data The Data that must contains in the file
     */
    loadTemplate(name: string, data: any): Promise<string> {
        const filename = path.join(
            path.resolve(path.dirname('')),
            'src',
            'api',
            'helpers',
            'mailer',
            'views',
            `${name}.ejs`,
        );
        return ejs.renderFile(filename, data);
    },

    async sendTemplatedEmail({
        to,
        subject,
        templateName,
        data,
    }: SendTemplatedEmailI) {
        const template = await this.loadTemplate(templateName, data);
        return this.sendMail(to, subject, template);
    },
};
