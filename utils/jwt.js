import jwt from "jsonwebtoken"

const createJWT = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_LIFETIME,
  })
}

const verifyJWT = (token) => jwt.verify(token, process.env.JWT_SECRET)

const attachCookiesToResponse = (res, payload) => {
  const token = createJWT(payload)
  const oneDay = 1000 * 60 * 60 * 24

  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + oneDay),
    secure: process.env.NODE_ENV === "production",
    // FIXME DEVELOPMENT
    sameSite: "None",
    signed: true,
  })
}

export { createJWT, verifyJWT, attachCookiesToResponse }
