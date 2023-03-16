import Message from "../models/messageModel.js"
import { StatusCodes } from "http-status-codes"
import checkPermission from "../utils/checkPermission.js"
import BadRequestError from "../errors/badRequestError.js"
import NotFoundError from "../errors/notFoundError.js"

export const createMessage = async (req, res) => {
  const { sender, receiver, listing, content } = req.body

  if (!sender || !receiver || !listing || (!content.text && !content.image)) {
    throw new BadRequestError(`please provide all values`)
  }

  const message = await Message.create({
    sender,
    receiver,
    listing,
    message: content,
  })

  res.status(StatusCodes.CREATED).json({
    status: "success",
    data: message,
  })
}

export const deleteMessage = async (req, res) => {
  const { messageId } = req.params

  const message = await Message.findById(messageId)

  if (!message)
    throw new NotFoundError(`can't find message with id: ${messageId}`)

  checkPermission(req.user, message.sender)

  // res.status(StatusCodes.NO_CONTENT).json({ msg: "delete message" })
  res.status(StatusCodes.OK).json({
    msg: message,
  })
}
