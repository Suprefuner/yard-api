import errorHandlerMiddleware from "./errorHandler.js"
import notFoundMiddleware from "./notFound.js"
import { authenticateUser, restrictToRole } from "./authentication.js"

export {
  errorHandlerMiddleware,
  notFoundMiddleware,
  authenticateUser,
  restrictToRole,
}
