import Sib from "sib-api-v3-sdk"
import "dotenv/config.js"

var client = Sib.ApiClient.instance

var apiKey = client.authentications["api-key"]
apiKey.apiKey = process.env.SEND_IN_BLUE_API_KEY

const tranEmailApi = new Sib.TransactionalEmailsApi()

const sender = {
  email: process.env.SEND_IN_BLUE_SENDER,
}

const sendEmail = async ({ sender, receivers, subject, htmlContent }) => {
  return tranEmailApi.sendTransacEmail({
    sender,
    to: receivers,
    subject,
    htmlContent,
  })
}

const sendVerificationEmail = async ({ email, verificationToken, origin }) => {
  const verifyEmailURL = `${origin}/verify-email?token=${verificationToken}&email=${email}`

  const htmlContent = `
    <p>Please confirm your email by clicking on the following link: 
      <a href="${verifyEmailURL}" target="_blank">Click here</a>
    </p>
  `

  return sendEmail({
    sender,
    receivers: [{ email }],
    subject: `Welcome to yard`,
    htmlContent,
  })
}

const sendResetPasswordEmail = async ({
  username,
  email,
  resetPasswordToken,
  origin,
}) => {
  const resetPasswordURL = `${origin}/reset-password?token=${resetPasswordToken}&email=${email}`

  const htmlContent = `
      <h4>Hello! ${username.toUpperCase()}</h4>
      <p>Please reset password by clicking on the following link: 
        <a href="${resetPasswordURL}">Reset password</a>
      </p>
    `

  return sendEmail({
    sender,
    receivers: [{ email }],
    subject: `Reset your password`,
    htmlContent,
  })
}

export { sendVerificationEmail, sendResetPasswordEmail }
