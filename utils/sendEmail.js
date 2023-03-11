import nodemailer from "nodemailer"
import nodemailerConfig from "./nodeMailerConfig.js"

const sendEmail = async ({ to, subject, html }) => {
  const transporter = nodemailer.createTransport(nodemailerConfig)

  return transporter.sendMail({
    from: '"Yard 🏡" <info@yard.com>',
    to,
    subject,
    html,
  })
}

export default sendEmail
