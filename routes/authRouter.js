import express from "express"
import rateLimiter from "express-rate-limit"
import { StatusCodes } from "http-status-codes"
import { authenticateUser } from "../middlewares/index.js"
import { googleScope, googleCallback } from "../controllers/googleController.js"
import {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  verifyEmail,
  updatePassword,
} from "../controllers/authController.js"

const router = express.Router()

const apiLimiter = rateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message:
    "Too many request from the IP address, please try again after 10 minutes",
})

router.post("/register", register)
router.post("/login", login)
// router.post("/register", apiLimiter, register)
// router.post("/login", apiLimiter, login)
router.get("/logout", logout)
router.post("/forgot-password", forgotPassword)
router.patch("/reset-password/:token", resetPassword)
router.post("/verify-email", verifyEmail)
router.patch("/update-password", authenticateUser, updatePassword)

/*
=================================================
GOOGLE LOGIN
=================================================
*/
// router.get("/google", apiLimiter, googleScope())
router.get("/google", googleScope())
router.get("/google/callback", googleCallback())
router.get("/google/success", (req, res) => {
  res.status(StatusCodes.OK).json({
    msg: `successes!!!!!!`,
  })
})
router.get("/google/failed", (req, res) => {
  res.status(StatusCodes.UNAUTHORIZED).json({
    msg: `Log in fail`,
  })
})

export default router
