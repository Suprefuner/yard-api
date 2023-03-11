import mongoose, { Schema } from "mongoose"
const listingSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, `please provide a product name`],
    },
    condition: {
      type: String,
      enum: {
        values: [
          "brand new",
          "like new",
          "lightly used",
          "well used",
          "heavily used",
        ],
        message: "{VALUE} is not supported",
      },
      required: [true, `please provide condition of the listing`],
    },
    // category: {
    //   type: String,
    //   enum: {
    //     values: [
    //       "computer & tech",
    //       "mobile phones & gadgets",
    //       "TV & home appliances",
    //       "apparel",
    //       "watches",
    //       "sneakers & footwear",
    //       "toys",
    //       "video games",
    //       "car",
    //       "motobikes",
    //     ],
    //     message: "{VALUE} is not supported",
    //   },
    //   required: [true, `please provide category of the listing`],
    // },
    category: {
      type: mongoose.Types.ObjectId,
      ref: "Category",
      required: [true, `please provide category`],
    },
    price: {
      type: Number,
      required: [true, `please provide a price`],
    },
    previousPrice: [Number],
    dealPrice: Number,
    description: {
      type: String,
      maxlength: 255,
    },
    photos: [
      {
        publicId: String,
        url: String,
      },
    ],
    status: {
      type: String,
      enum: {
        values: ["sell", "reserved", "sold"],
        message: "{VALUE} is not supported",
      },
      required: [true, `please provide status`],
      default: "sell",
    },
    createdBy: {
      user: {
        type: mongoose.Types.ObjectId,
        ref: "User",
        required: true,
      },
      review: {
        type: Boolean,
        default: false,
      },
    },
    soldTo: {
      user: {
        type: mongoose.Types.ObjectId,
        ref: "User",
      },
      review: {
        type: Boolean,
        default: false,
      },
    },
    // review: {
    //   type: mongoose.Types.ObjectId,
    //   ref: "Review",
    // },
    dealMethod: {
      meetUp: {
        type: Boolean,
        default: true,
      },
      delivery: Boolean,
    },
    meetUpLocation: {
      type: [String],
      default: "cwb",
    },
    numOfFavorite: {
      type: Number,
      min: 0,
      default: 0,
      required: true,
    },
  },
  { timestamps: true }
)

listingSchema.pre("save", function (next) {
  if (this.photos.length <= 10) return next()
  this.photos = this.photos.slice(0, 10)
})

listingSchema.pre("remove", async function (next) {
  await this.model("Review").deleteMany({ listing: this._id })
})

const Listing = mongoose.model("Listing", listingSchema)
export default Listing
