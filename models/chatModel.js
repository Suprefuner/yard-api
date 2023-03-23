import mongoose from "mongoose"
import { NotFoundError } from "../errors/index.js"

const chatSchema = new mongoose.Schema(
  {
    listing: {
      type: mongoose.Types.ObjectId,
      ref: "Listing",
      require: [true, `must provide listing`],
    },
    participants: {
      type: [mongoose.Types.ObjectId],
      ref: "User",
      require: [true, `must have 2 participants`],
      validate: {
        validator: function (val) {
          return val.length === 2
        },
      },
    },
    lastMessage: {
      type: mongoose.Types.ObjectId,
      ref: "Message",
    },
    offer: {
      type: Boolean,
      default: false,
    },
    offerPrice: Number,
    offerStatus: {
      type: String,
      enum: ["pending", "accepted", "denied"],
    },
  },
  {
    timestamps: true,
  }
)

chatSchema.statics.calculateChat = async function (listingId) {
  const result = await this.aggregate([
    { $match: { listing: listingId } },
    {
      $group: {
        _id: null,
        numOfChats: { $sum: 1 },
      },
    },
  ])
  try {
    await this.model("Listing").findOneAndUpdate(
      {
        _id: listingId,
      },
      {
        numOfChats: Math.ceil(result[0]?.numOfChats) || 0,
      }
    )
  } catch (error) {
    throw new NotFoundError(`can't find listing with id: ${listingId}`)
  }
}

chatSchema.post("save", async function () {
  await this.constructor.calculateChat(this.listing)
})

chatSchema.post("remove", async function () {
  await this.constructor.calculateChat(this.listing)
})

chatSchema.pre("remove", async function () {
  await this.model("Message").deleteMany({ chat: this._id })
})

const Chat = mongoose.model("Chat", chatSchema)
export default Chat
