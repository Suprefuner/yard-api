import mongoose from "mongoose"

const messageSchema = new mongoose.Schema(
  {
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
    listing: {
      type: mongoose.Types.ObjectId,
      ref: "Listing",
      require: [true, `must provide listing id`],
    },
    message: {
      text: {
        type: String,
        default: "",
      },
      image: {
        type: String,
        default: "",
      },
    },
    status: {
      type: String,
      enum: {
        values: ["delivered", "unseen", "seen", "fail"],
        message: `{VALUE} is not supported`,
      },
      default: "delivered",
    },
  },
  {
    timestamps: true,
  }
)

const Message = mongoose.model("Message", messageSchema)
export default Message
