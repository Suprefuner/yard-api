import Review from "../models/reviewModel.js"
import Listing from "../models/listingModel.js"
import { checkPermission } from "../utils/index.js"
import {
  NotFoundError,
  UnauthorizedError,
  BadRequestError,
} from "../errors/index.js"
import { StatusCodes } from "http-status-codes"
import { deleteOne } from "./handlerFactory.js"

export const getAllUserReview = async (req, res) => {
  const { id, seller, buyer, sort } = req.query

  const queryObject = { reviewTo: id }

  let result = Review.find(queryObject)
    .populate("listing", "name price photos")
    .populate("createdBy", "username createdAt photo rating numOfReviews")

  if (sort === "latest" || !sort) result = result.sort("-createdAt")
  if (sort === "oldest") result = result.sort("createdAt")

  const page = Number(req.query.page) || 1
  const limit = Number(req.query.limit) || 10
  result = result.skip((page - 1) * limit).limit(limit)

  const reviews = await result

  const totalReviews = await Review.countDocuments(queryObject)
  const numOfPages = Math.ceil(totalReviews / limit)

  res.status(StatusCodes.OK).json({
    status: "success",
    results: totalReviews,
    pages: numOfPages,
    page: req.query.page || 1,
    data: reviews,
  })
}

export const createReview = async (req, res) => {
  const { id: userId } = req.user
  const { listing: listingId, rating, content } = req.body

  if (!listingId || !rating || !content) {
    throw new BadRequestError(`please provide all values`)
  }

  const listing = await Listing.findById(listingId)

  if (!listing) {
    throw new NotFoundError(`can't find listing with id: ${listingId}`)
  }

  if (listing.status !== "sold") {
    throw new BadRequestError(`can't leave review on selling product`)
  }

  const seller = listing.createdBy.toString()
  const buyer = listing.soldTo.toString()

  if (seller !== userId && buyer !== userId) {
    throw new UnauthorizedError(`unauthorized`)
  }

  const reviewTo = seller === userId ? buyer : seller

  const review = await Review.create({
    listing: listingId,
    seller,
    buyer,
    rating,
    content,
    createdBy: userId,
    reviewTo,
  })

  res.status(StatusCodes.CREATED).json({
    status: "success",
    review,
  })
}

export const updateReview = async (req, res) => {
  const { id: reviewId } = req.params
  const { rating, content } = req.body

  if (!rating || !content) {
    throw new BadRequestError(`please provide all values`)
  }

  const review = await Review.findById(reviewId)

  if (!review) {
    throw new NotFoundError(`can't find review with id: ${reviewId}`)
  }

  checkPermission(req.user, review.createdBy)

  review.rating = rating
  review.content = content
  await review.save()

  res.status(StatusCodes.OK).json({
    status: "success",
    content,
  })
}

export const deleteReview = deleteOne(Review)
