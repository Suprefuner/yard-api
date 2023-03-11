import { StatusCodes } from "http-status-codes"

const errorHandlerMiddleware = (err, req, res, next) => {
  const defaultError = {
    statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
    msg: err.message || `something went wrong, please try again`,
  }

  if (err.name === "ValidationError") {
    defaultError.statusCode = StatusCodes.BAD_REQUEST
    defaultError.msg = Object.values(err.errors)
      .map((item) => item.message)
      .join(`, `)
  }

  if (err.code && err.code === 11000) {
    defaultError.statusCode = StatusCodes.BAD_REQUEST
    defaultError.msg = `${Object.keys(
      err.keyValue
    )} already existed, please try with other email`
  }

  res.status(defaultError.statusCode).json({
    msg: defaultError.msg,
  })
}

export default errorHandlerMiddleware
