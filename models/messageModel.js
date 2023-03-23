import mongoose from "mongoose"
import { NotFoundError } from "../errors/index.js"

const messageSchema = new mongoose.Schema(
  {
    chat: {
      type: mongoose.Types.ObjectId,
      ref: "Chat",
      require: [true, `message must inside a chat`],
    },
    sender: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      require: [true, `must provide sender id`],
    },
    receiver: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      require: [true, `must provide receiver id`],
    },
    message: {
      text: {
        type: String,
        default: "",
      },
      image: {
        publicId: String,
        url: String,
        default: {},
      },
    },
    type: {
      type: String,
      enum: {
        values: ["message", "offer"],
        message: "{VALUE} is not supported",
      },
      required: true,
      default: "message",
    },
    offerType: {
      type: String,
      enum: {
        values: ["made", "cancelled", "accepted"],
        message: "{VALUE} is not supported",
      },
    },
    offerPrice: {
      type: Number,
      min: 0,
    },
    status: {
      type: String,
      enum: {
        values: ["delivered", "seen"],
        message: `{VALUE} is not supported`,
      },
      default: "delivered",
    },
  },
  {
    timestamps: true,
  }
)

messageSchema.statics.calcUnreadMessages = async function (userId) {
  const result = await this.aggregate([
    {
      $match: { receiver: userId, status: { $ne: "seen" } },
    },
    {
      $group: {
        _id: null,
        numOfUnreadMessages: { $sum: 1 },
      },
    },
  ])

  try {
    await this.model("User").findOneAndUpdate(
      {
        _id: userId,
      },
      {
        numOfUnreadMessages: result[0].numOfUnreadMessages || 0,
      }
    )
  } catch (error) {
    throw new NotFoundError(`can't find user with id: ${userId}`)
  }
}

messageSchema.post("save", async function () {
  await this.constructor.calcUnreadMessages(this.receiver)
})

messageSchema.post("remove", async function () {
  await this.constructor.calcUnreadMessages(this.receiver)
})

messageSchema.pre("save", async function (next) {
  const chat = await this.model("Chat").findById(this.chat)
  chat.lastMessage = this

  if (this.type === "offer" && this.offerType === "made") {
    chat.offer = true
    chat.offerPrice = this.offerPrice
    chat.offerStatus = "pending"
  }

  if (this.type === "offer" && this.offerType === "cancelled") {
    chat.offer = false
    chat.offerPrice = undefined
    chat.offerStatus = undefined
  }

  await chat.save()
  next()
})

messageSchema.pre("remove", async function (next) {
  const chat = await this.model("Chat").findById(this.chat)
  const lastMessage = await this.model("Message")
    .findOne({ chat: this.chat })
    .sort("-createdAt")
  chat.lastMessage = lastMessage
  await chat.save()
  next()
})

const Message = mongoose.model("Message", messageSchema)
export default Message
