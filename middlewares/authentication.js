import { verifyJWT, attachCookiesToResponse } from "../utils/index.js"
import { UnauthenticatedError } from "../errors/index.js"

const authenticateUser = async (req, res, next) => {
  const { token } = req.signedCookies

  // IF USER LOGIN WITH GOOGLE PASSPORT.JS WILL ASSIGN THEM AS req.user
  if (!token && !req.user) throw new UnauthenticatedError(`please login`)

  if (req.user) {
    attachCookiesToResponse(res, req.user)
    next()
  } else {
    try {
      const { id, email, role } = verifyJWT(token)
      req.user = { id, email, role }
      next()
    } catch (error) {
      throw new UnauthenticatedError(`please login`)
    }
  }
}

const restrictToRole = (...roles) => {
  return async (req, res, next) => {
    if (roles.includes(req.user.role)) {
      next()
    } else {
      throw new UnauthenticatedError(`unauthorized`)
    }
  }
}

export { authenticateUser, restrictToRole }
