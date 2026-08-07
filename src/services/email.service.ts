import nodemailer from "nodemailer";

class EmailService {
    private user: string
    private pass: string
    private transporter: nodemailer.Transporter

    constructor(user: string, pass: string) {
        this.user = user
        this.pass = pass
        this.transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            auth: { 
                user: this.user, 
                pass: this.pass 
            },
            tls: {
                rejectUnauthorized: false
            }
        })
    }
    
    async sendEmail(to: string, subject: string, html: string) {
        try {
            let info = await this.transporter.sendMail({
                from: `"Droply" <${this.user}>`,
                to,
                subject,
                html
            })
        } catch (error) {
            console.error("Email sending error:", error);
            throw error;
        }
    }
}

export default EmailService;