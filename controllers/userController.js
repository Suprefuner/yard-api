import { StatusCodes } from "http-status-codes"
import { v2 as cloudinary } from "cloudinary"
import User from "../models/userModel.js"
import {
  attachCookiesToResponse,
  uploadPhoto,
  convertOperator,
} from "../utils/index.js"
import { sortAndPaginate } from "./handlerFactory.js"
import NotFoundError from "../errors/notFoundError.js"

const forbiddenFields = ["password", "passwordConfirm", "role"]

export const getAllUser = async (req, res) => {
  const { search, role, rating, operator } = req.query
  const queryObject = {}

  if (search) {
    queryObject.username = { $regex: search, $option: "i" }
    queryObject.email = { $regex: search, $option: "i" }
  }

  if (role) queryObject.role = role
  if (rating && operator) {
    const obj = {}
    obj[convertOperator[operator]] = rating
    queryObject.rating = obj
  }

  const { docs, totalDocs, numOfPages } = sortAndPaginate(
    req,
    User,
    queryObject,
    "username"
  )

  res.status(StatusCodes.OK).json({
    status: "success",
    results: totalDocs,
    pages: numOfPages,
    page: req.query.page || 1,
    users: docs,
  })
}

export const getCurrentUser = async (req, res) => {
  const { id } = req.user
  const user = await User.findById(id)

  if (!user) {
    throw new NotFoundError(
      `no document found with id: ${id}, please try again`
    )
  }

  res.status(StatusCodes.OK).json({
    status: "success",
    data: user,
  })
}

export const getUser = async (req, res) => {
  const { id } = req.params
  const user = await User.findById(id)

  if (!user) {
    throw new NotFoundError(`can't find user with id: ${id}`)
  }

  res.status(StatusCodes.OK).json({
    status: "success",
    data: user,
  })
}

export const uploadUserPhoto = async (req, res) => {
  const { id } = req.user
  // FIXME CHANGE TO FILES
  const result = await uploadPhoto(req.files, "user")

  const user = await User.findById(id)

  if (!user) throw new NotFoundError(`Invalid credential`)

  if (!user.photo.url.split("/").at(-1).startsWith("default")) {
    await cloudinary.uploader.destroy(user.photo.publicId)
  }

  user.photo = { publicId: result.public_id, url: result.secure_url }
  await user.save()

  res.status(StatusCodes.OK).json({
    status: "success",
    user,
    result,
    src: result.secure_url,
  })
}

export const updateCurrentUser = async (req, res) => {
  const { id } = req.user
  const user = await User.findById(id)

  const formDataArr = Object.entries(req.body)
  formDataArr.forEach((item) => {
    const [name, value] = item
    if (forbiddenFields.includes(name)) return
    user[name] = value
    if (user[name].trim().length === 0) user[name] = undefined
  })

  await user.save()

  const tokenUser = { id: user._id, email: user.email, role: user.role }
  attachCookiesToResponse(res, tokenUser)

  res.status(StatusCodes.OK).json({
    status: "success",
    user,
  })
}

export const deleteCurrentUser = async (req, res) => {
  const user = await User.findById(req.user.id)

  user.active = false
  await user.save()

  res.status(StatusCodes.NO_CONTENT).json({
    status: "success",
    msg: `user deleted`,
  })
}

export const getMyFavorite = async (req, res) => {
  const { id } = req.user

  const user = await User.findById(id).populate({
    path: "favoriteList",
    select: "_id name createdBy condition price numOfFavorite photos",
    populate: {
      path: "createdBy.user",
      select: "_id username photo",
    },
  })

  if (!user) {
    throw new NotFoundError(`can't find user with id: ${id}`)
  }

  res.status(StatusCodes.OK).json({
    status: "success",
    data: user.favoriteList,
  })
}

export const addListingToFavorite = async (req, res) => {
  const { id } = req.user
  const { listing } = req.body

  const user = await User.findById(id)

  /*
  =================================================
  LOCAL FAVORITE LIST IS THE STANDARD
  =================================================
  */
  // ADD NEW LISTING TO FAVORITE LIST
  listing.forEach((item) => {
    if (!user.favoriteList.includes(item)) {
      user.favoriteList = [...user.favoriteList, item]
    }
  })

  // REMOVE OUTDATED FAVORITE LISTING
  user.favoriteList.forEach((item) => {
    if (!listing.map((item) => item._id).includes(item.toString())) {
      user.favoriteList = user.favoriteList.filter(
        (listing) => listing._id !== item
      )
    }
  })

  await user.save()

  res.status(StatusCodes.OK).json({
    status: "success",
    user,
  })
}

export const followUser = async (req, res) => {
  const { id: myId } = req.user
  const { id: userId, type } = req.body

  const user = await User.findById(myId)

  if (!user) {
    throw new NotFoundError(`can't find user with id:${myId}`)
  }

  const otherUser = await User.findById(userId)

  if (!otherUser) {
    throw new NotFoundError(`can't add non-exist user to following list`)
  }

  if (
    type === "follow" &&
    !user.following.includes(userId) &&
    myId !== userId
  ) {
    user.following = [...user.following, otherUser]
  }

  if (type !== "follow" && user.following.includes(userId)) {
    user.following = user.following.filter((user) => user.toString() !== userId)
  }

  user.save()

  res.status(StatusCodes.OK).json({
    status: "success",
    data: user,
  })
}

export const updateUserLastOnline = async (req, res) => {
  const user = await User.findById(id)

  if (!user) throw new NotFoundError(`can't find user with this id: ${id}`)

  user.lastOnline = Date.now()
  await user.save()

  res.status(StatusCodes.NO_CONTENT)
}

export const getNumOfUnreadMessage = async (req, res) => {
  const { id } = req.user

  const user = await User.findById(id)
  if (!user) throw new NotFoundError(`can't find user with id: ${id}`)

  res.status(StatusCodes.OK).json({
    status: "success",
    data: user.numOfUnreadMessages,
  })
}
