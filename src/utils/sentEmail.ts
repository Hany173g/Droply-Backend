import { env } from "../config/env.js"
import EmailSerivce from "../services/email.service.js"

async function sentEmail(email: string, title: string, html: string) {
    const newEmail = new EmailSerivce(env.email.EMAIL_USER, env.email.EMAIL_PASSWORD)
    await newEmail.sendEmail(email, title, html)
}

export default sentEmail
