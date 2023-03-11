import sendEmail from "./sendEmail.js"

const sendVerificationEmail = async ({ email, verificationToken, origin }) => {
  const verifyEmailURL = `${origin}/verify-email?token=${verificationToken}&email=${email}`

  const message = `
    <p>Please confirm your email by clicking on the following link: 
      <a href="${verifyEmailURL}" target="_blank">Click here</a>
    </p>
  `

  return sendEmail({
    to: email,
    subject: `welcome to yard`,
    html: `
      <h4>hello! </h4>
      ${message}
    `,
  })
}

export default sendVerificationEmail
