import "dotenv/config.js"
import crypto from "crypto"
import bcrypt from "bcryptjs"
import { StatusCodes } from "http-status-codes"

import User from "../models/userModel.js"
import { BadRequestError, UnauthenticatedError } from "../errors/index.js"
import { attachCookiesToResponse } from "../utils/index.js"
/*
===================================================================
DEVELOPMENT EMAIL SETTING
===================================================================
import {
  sendVerificationEmail,
  attachCookiesToResponse,
  sendResetPasswordEmail,
} from "../utils/index.js"
===================================================================
*/

/*
===================================================================
PRODUCTION EMAIL SETTING
===================================================================
*/
import {
  sendResetPasswordEmail,
  sendVerificationEmail,
} from "../utils/sendInBlueConfig.js"

//=================================================================

export const register = async (req, res) => {
  const { email, password, passwordConfirm } = req.body

  if (!email || !password || !passwordConfirm) {
    throw new BadRequestError(`please provide all values`)
  }

  const isFirstAccount = (await User.countDocuments({})) === 0
  const role = isFirstAccount ? "admin" : "user"

  const verificationToken = crypto.randomBytes(40).toString("hex")
  const hashedVerificationToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex")

  const user = await User.create({
    username: email.split("@")[0],
    email,
    password,
    passwordConfirm,
    role,
    verificationToken: hashedVerificationToken,
  })

  const tokenUser = { id: user._id, email: user.email, role: user.role }
  attachCookiesToResponse(res, tokenUser)

  await sendVerificationEmail({
    email,
    verificationToken,
    // frontend route
    // FIXME DEVELOPMENT
    // origin: "http://localhost:5173",
    origin: "https://yard-hnyg.onrender.com",
    // origin: process.env.CLIENT_URL,
  })

  res.status(StatusCodes.CREATED).json({
    status: "success",
    msg: `Success! Please check your email to verify account`,
  })
}

export const verifyEmail = async (req, res) => {
  const { verificationToken, email } = req.body
  const user = await User.findOne({ email })

  if (!user) {
    throw new UnauthenticatedError(`verification failed`)
  }

  const hashedVerificationToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex")

  if (hashedVerificationToken !== user.verificationToken) {
    throw new UnauthenticatedError(`verification failed`)
  }

  user.verificationToken = ""
  user.isVerified = true
  user.verified = Date.now()
  await user.save()

  res.status(StatusCodes.OK).json({
    status: "success",
    msg: `email verified`,
  })
}

export const login = async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    throw new BadRequestError(`please provide all values`)
  }

  const user = await User.findOne({ email }).select("+password")

  if (!user) {
    throw new UnauthenticatedError(`Invalid credentials`)
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password)
  if (!isPasswordCorrect) {
    throw new UnauthenticatedError(`Invalid credentials`)
  }

  if (!user.isVerified) {
    throw new UnauthenticatedError(`Please verify your email`)
  }

  user.password = undefined

  const tokenUser = { id: user._id, email: user.email, role: user.role }
  attachCookiesToResponse(res, tokenUser)

  res.status(StatusCodes.OK).json({
    status: "success",
    user,
  })
}

export const logout = (req, res, next) => {
  // INCLUDE PASSPORT.JS LOGOUT
  req.logout((err) => {
    if (err) return next()

    res.cookie("token", "", {
      httpOnly: true,
      expires: new Date(Date.now()),
      // FIXME DEVELOPMENT
      sameSite: "None",
      secure: process.env.NODE_ENV === "production",
    })

    res.status(StatusCodes.OK).json({ status: "success", msg: "logged out" })
  })
}

export const forgotPassword = async (req, res) => {
  const { email } = req.body

  if (!email) return new BadRequestError(`please provide email`)

  const user = await User.findOne({ email })
  if (user) {
    const resetPasswordToken = user.createPasswordResetToken()
    await user.save()

    try {
      await sendResetPasswordEmail({
        username: user.username,
        email,
        // FIXME DEVELOPMENT
        resetPasswordToken,
        // origin: "http://localhost:5173",
        origin: "https://yard-hnyg.onrender.com",
      })
    } catch (error) {
      user.passwordToken = undefined
      user.passwordTokenExpire = undefined
      throw new Error(
        `there was en error sending email, please try again later`
      )
    }
  }

  res.status(StatusCodes.OK).json({
    status: "success",
    msg: `please check your email to reset password`,
  })
}

export const resetPassword = async (req, res) => {
  const { token } = req.params
  const { email, password, passwordConfirm } = req.body

  if (!email || !password || !passwordConfirm)
    throw new BadRequestError(`please provide all values`)

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex")
  const user = await User.findOne({
    email,
    passwordToken: hashedToken,
    passwordTokenExpire: { $gt: Date.now() },
  })

  if (!user) throw new UnauthenticatedError(`Token is invalid or has expired`)

  user.password = password
  user.passwordConfirm = passwordConfirm
  user.passwordToken = undefined
  user.passwordTokenExpire = undefined
  await user.save()

  const tokenUser = { id: user._id, email: user.email, role: user.role }
  attachCookiesToResponse(res, tokenUser)

  res.status(StatusCodes.OK).json({
    status: "success",
    tokenUser,
  })
}

export const updatePassword = async (req, res) => {
  const { password, newPassword, newPasswordConfirm } = req.body
  const { id } = req.user

  console.log({ password, newPassword, newPasswordConfirm })
  console.log(id)

  const user = await User.findById(id).select("+password")

  if (!user) {
    throw new UnauthenticatedError(`invalid credential`)
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password)

  console.log(isPasswordCorrect)

  if (!isPasswordCorrect) {
    throw new UnauthenticatedError(`invalid credential`)
  }

  user.password = newPassword
  user.passwordConfirm = newPasswordConfirm
  await user.save()
  user.password = undefined

  console.log(user)

  const tokenUser = { id: user._id, email: user.email, role: user.role }
  attachCookiesToResponse(res, tokenUser)

  res.status(StatusCodes.OK).json({
    status: "success",
    user,
  })
}
