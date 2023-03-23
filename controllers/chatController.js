import { StatusCodes } from "http-status-codes"
import Chat from "../models/chatModel.js"
import Message from "../models/messageModel.js"
import Listing from "../models/listingModel.js"
import { BadRequestError, NotFoundError } from "../errors/index.js"

export const getSingleChat = async (req, res) => {
  const { id } = req.user
  const { listingId } = req.query

  const chat = await Chat.findOne({
    listing: listingId,
    participants: { $in: id },
  }).populate({
    path: "participants",
    match: { _id: { $ne: id } },
    select: "_id",
  })

  res.status(StatusCodes.OK).json({
    status: "success",
    data: chat,
  })
}

export const getAllMyChat = async (req, res) => {
  const { id } = req.user

  let chats = await Chat.find({
    participants: { $in: id },
  })
    .populate({
      path: "participants",
      match: { _id: { $ne: id } },
      select: "username photo lastOnline",
    })
    .populate({
      path: "listing",
      select: "name photos createdBy price status",
    })
    .populate({
      path: "lastMessage",
      select: "message createdAt type offerType offerPrice",
    })

  chats = chats.sort(
    (a, b) => b.lastMessage.createdAt - a.lastMessage.createdAt
  )

  res.status(StatusCodes.OK).json({
    status: "success",
    result: chats.length,
    data: chats,
  })
}

// CREATING A CHAT MUST COMES WITH A NEW MESSAGE
export const createChat = async (req, res) => {
  const { id } = req.user
  const {
    userId,
    listing: listingId,
    text,
    image,
    type,
    offerType,
    offerPrice,
  } = req.body

  if (!userId || !listingId) {
    throw new BadRequestError(`please provide all values`)
  }

  if (!type && !text && !image) {
    throw new BadRequestError(`please provide all values`)
  }

  if (type && type === "offer" && (!offerType || !offerPrice)) {
    throw new BadRequestError(`please provide all values`)
  }

  const listing = await Listing.findById(listingId)
  if (!listing) {
    throw new NotFoundError(`can't find listing with id: ${listingId} hahah`)
  }

  let chat

  chat = await Chat.findOne({
    listing: listingId,
    participants: { $all: [id, userId] },
  })

  if (!chat) {
    chat = await Chat.create({
      listing: listingId,
      participants: [id, userId],
    })
  }

  const messageObject = {
    chat: chat._id,
    sender: id,
    receiver: userId,
  }

  if (type && type === "offer") {
    messageObject.type = "offer"
    messageObject.offerType = offerType
    messageObject.offerPrice = offerPrice
  } else {
    messageObject.message = text ? { text } : { image }
  }

  await Message.create(messageObject)

  chat = await Chat.findById(chat._id)
    .populate({
      path: "participants",
      match: { _id: { $ne: id } },
      select: "username photo lastOnline",
    })
    .populate({
      path: "listing",
      select: "name photos createdBy price",
    })
    .populate({
      path: "lastMessage",
      select: "message createdAt type offerType offerPrice",
    })

  res.status(StatusCodes.CREATED).json({
    status: "success",
    data: chat,
  })
}

export const updateChat = async (req, res) => {
  const { chatId, offer, offerPrice, offerStatus } = req.body

  const chat = await Chat.findById(chatId)

  if (!chat) throw new NotFoundError(`can't find chat with id: ${chatId}`)

  chat.offer = offer
  chat.offerPrice = offerPrice
  chat.offerStatus = offerStatus
  await chat.save()

  res.status(StatusCodes.OK).json({
    status: "success",
    data: chat,
  })
}

export const deleteMyChat = async (req, res) => {
  const { chatId } = req.params

  const chat = await Chat.findById(chatId)
  if (!chat) throw new NotFoundError(`can't find chat with id: ${chatId}`)

  await chat.remove()

  res.status(StatusCodes.NO_CONTENT).json({
    status: "success",
    msg: `chat remove successfully`,
  })
}
