import mongoose from "mongoose"
import { NotFoundError } from "../errors/index.js"

const reviewSchema = new mongoose.Schema(
  {
    listing: {
      type: mongoose.Types.ObjectId,
      ref: "Listing",
      required: true,
    },
    createdBy: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reviewTo: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
    seller: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
    buyer: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    content: {
      type: String,
      trim: true,
      minlength: 8,
      maxlength: 255,
      required: [true, `please leave some review`],
    },
  },
  {
    timestamps: true,
  }
)

reviewSchema.index({ listing: 1, createdBy: 1 }, { unique: true })

reviewSchema.statics.calculateRating = async function (userId) {
  const result = await this.aggregate([
    { $match: { reviewTo: userId } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
        numOfReviews: { $sum: 1 },
      },
    },
  ])

  try {
    await this.model("User").findOneAndUpdate(
      {
        _id: userId,
      },
      {
        rating: Math.ceil(result[0]?.averageRating) || 0,
        numOfReviews: Math.ceil(result[0]?.numOfReviews) || 0,
      }
    )
  } catch (error) {
    throw new NotFoundError(`can't find user with id: ${userId}`)
  }
}

reviewSchema.post("save", async function () {
  await this.constructor.calculateRating(this.reviewTo)
})

reviewSchema.post("remove", async function () {
  await this.constructor.calculateRating(this.reviewTo)
})

const Review = mongoose.model("Review", reviewSchema)
export default Review
