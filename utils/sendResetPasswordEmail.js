import sendEmail from "./sendEmail.js"

const sendResetPasswordEmail = async ({
  email,
  resetPasswordToken,
  origin,
}) => {
  // TODO this is the frontend route
  const resetPasswordURL = `${origin}/reset-password?token=${resetPasswordToken}&email=${email}`

  const message = `<p>Please reset password by clicking on the following link: <a href="${resetPasswordURL}">Reset password</a></p>`

  return sendEmail({
    to: email,
    subject: `Reset your password`,
    html: `
      <h4>hello! </h4>
      ${message}
    `,
  })
}

export default sendResetPasswordEmail
