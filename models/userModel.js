import mongoose from "mongoose"
import validator from "validator"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import crypto from "crypto"

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30,
      default: "foo",
    },
    googleId: String,
    email: {
      type: String,
      required: [true, `please provide a email`],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, "please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "please provide a password"],
      minlength: 8,
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: [true, "please confirm your password"],
      select: false,
      validate: {
        validator: function (el) {
          return el === this.password
        },
      },
    },
    firstName: {
      type: String,
      trim: true,
      maxlength: 20,
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: 20,
    },
    description: {
      type: String,
      maxlength: 255,
    },
    role: {
      type: String,
      enum: {
        values: ["admin", "user"],
        message: "{VALUE} is not supported",
      },
      default: "user",
    },
    // listing: {
    //   type: mongoose.Types.ObjectId,
    //   ref: "Listing",
    // },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    numOfReviews: {
      type: Number,
      min: 0,
      default: 0,
    },
    photo: {
      publicId: String,
      url: {
        type: String,
        default: `https://res.cloudinary.com/dytia9net/image/upload/v1676530550/user-photo/default-user_gtlhqu.jpg`,
      },
    },
    favoriteList: {
      type: [mongoose.Types.ObjectId],
      ref: "Listing",
      default: [],
    },
    following: {
      type: [mongoose.Types.ObjectId],
      ref: "User",
      default: [],
    },
    follower: {
      type: Number,
      default: 0,
    },
    birthday: {
      type: Date,
      min: "1950-01-01",
      max: Date.now(),
    },
    passwordChangeAt: Date,
    passwordToken: String,
    passwordTokenExpire: Date,
    verificationToken: String,
    isVerified: {
      type: Boolean,
      default: false,
    },
    verified: Date,
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
  },
  {
    timestamps: true,
  }
)

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next()

  this.password = await bcrypt.hash(this.password, 12)
  this.passwordConfirm = undefined
})

userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || this.isNew) return next()

  this.passwordChangeAt = Date.now() - 1000
})

userSchema.statics.calculateFavorite = async function (listingId) {
  const result = await this.aggregate([
    {
      $match: {
        $expr: { $in: [listingId, `$favoriteList`] },
      },
    },
    {
      $group: {
        _id: null,
        numOfFavorite: { $sum: 1 },
      },
    },
  ])

  try {
    await this.model("Listing").findOneAndUpdate(
      {
        _id: listingId,
      },
      {
        numOfFavorite: result[0]?.numOfFavorite,
      }
    )
  } catch (error) {
    throw new NotFoundError(`can't find listing with id: ${listingId}`)
  }
}

userSchema.statics.calculateFollower = async function (userId) {
  const result = await this.aggregate([
    {
      $match: {
        $expr: { $in: [userId, `$following`] },
      },
    },
    {
      $group: {
        _id: null,
        follower: { $sum: 1 },
      },
    },
  ])

  try {
    await this.model("User").findOneAndUpdate(
      {
        _id: userId,
      },
      {
        follower: result[0]?.follower,
      }
    )
  } catch (error) {
    throw new NotFoundError(`can't find user with id: ${userId}`)
  }
}

userSchema.post("save", async function () {
  await this.constructor.calculateFavorite(this.favoriteList.at(-1))
  await this.constructor.calculateFollower(this.following.at(-1))
})

userSchema.post("remove", async function () {
  await this.constructor.calculateFavorite(this.favoriteList.at(-1))
  await this.constructor.calculateFollower(this.following.at(-1))
})

userSchema.pre(/^find/, async function (next) {
  this.find({ active: { $ne: false } })
  next()
})

userSchema.methods.createJWT = function () {
  return jwt.sign({ userId: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_LIFETIME,
  })
}

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(40).toString("hex")

  this.passwordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex")

  this.passwordTokenExpire = Date.now() + 10 * 60 * 1000

  return resetToken
}

const User = mongoose.model("User", userSchema)
export default User
