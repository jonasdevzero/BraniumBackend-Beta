import nodeMailer from 'nodemailer'

export default nodeMailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: "devzerotest@gmail.com",
        pass: process.env.NODEMAILER_PASS,
    },
})
