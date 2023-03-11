import { UnauthorizedError } from "../errors/index.js"

const checkPermission = (requestUser, resourceId) => {
  if (requestUser.role === "admin") return
  if (requestUser.id === resourceId.toString()) return
  throw new UnauthorizedError(`unauthorized`)
}

export default checkPermission
