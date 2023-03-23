import User from "../models/userModel.js"
import Message from "../models/messageModel.js"
import { StatusCodes } from "http-status-codes"
import checkPermission from "../utils/checkPermission.js"
import BadRequestError from "../errors/badRequestError.js"
import NotFoundError from "../errors/notFoundError.js"
import { uploadPhoto } from "../utils/index.js"

export const uploadMessageImage = async (req, res) => {
  const result = await uploadPhoto(req.files, "message")

  res.status(StatusCodes.OK).json({
    status: "success",
    data: result,
  })
}

export const createMessage = async (req, res) => {
  const { id } = req.user
  const { chat, receiver, text, image, type, offerType, offerPrice } = req.body

  // WITHOUT TYPE === NORMAL MESSAGE
  if (!type && (!chat || !receiver || (!text && !image))) {
    throw new BadRequestError(`please provide all values`)
  }

  // OFFER MESSAGE
  if (type && type === "offer" && (!offerType || !offerPrice)) {
    throw new BadRequestError(`please provide all values`)
  }

  const messageObject = {
    chat,
    sender: id,
    receiver,
  }

  if (type && type === "offer") {
    messageObject.type = "offer"
    messageObject.offerType = offerType
    messageObject.offerPrice = offerPrice
  } else {
    messageObject.message = text ? { text } : { image }
  }

  const message = await Message.create(messageObject)

  res.status(StatusCodes.CREATED).json({
    status: "success",
    data: message,
  })
}

export const getMessagesOfChat = async (req, res) => {
  const { id } = req.user
  const { chatId } = req.query

  if (!chatId) throw new BadRequestError(`please provide chat id`)

  await Message.updateMany(
    {
      chat: chatId,
      receiver: id,
    },
    {
      status: "seen",
    }
  )

  const messages = await Message.find({
    chat: chatId,
  })

  const UnreadMessages = await Message.find({
    chat: chatId,
    receiver: id,
    status: "delivered",
  })

  const user = await User.findById(id)

  user.numOfUnreadMessages = UnreadMessages.length
  await user.save()

  res.status(StatusCodes.OK).json({
    status: "success",
    result: messages.length,
    data: messages,
    unread: UnreadMessages.length,
    // data: { messages, numOfUnreadMessages: UnreadMessages.length },
  })
}

export const readMessage = async (req, res) => {
  const { userId, chatId } = req.body

  await Message.updateMany(
    {
      chat: chatId,
      sender: userId,
    },
    { status: "seen" }
  )

  res.status(StatusCodes.NO_CONTENT)
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
