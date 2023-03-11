import { v2 as cloudinary } from "cloudinary"
import { StatusCodes } from "http-status-codes"
import Category from "../models/categoryModel.js"
import Listing from "../models/listingModel.js"
import { BadRequestError, NotFoundError } from "../errors/index.js"
import { checkPermission, uploadPhoto } from "../utils/index.js"

const parentCategoryList = ["electronics", "fashion", "toy"]

export const getAllListing = async (req, res) => {
  const {
    search,
    condition,
    category,
    brand,
    minPrice,
    status,
    maxPrice,
    sort,
  } = req.query

  const queryObject = {}

  if (search) {
    queryObject.name = { $regex: search, $options: "i" }
  }

  if (status) queryObject.status = { $ne: status }
  if (condition && condition !== "all") queryObject.condition = condition
  if (brand) queryObject.brand = brand
  if (category && category !== "all") {
    /*
    ===============================================================
    FOR CATEGORY PAGE BECAUSE NEED TO FIND PRODUCT FROM SAME PARENT
    ===============================================================
    */
    // FIXME SINCE CAR DOESN'T HAVE SUB-CATEGORY FOR NOW
    // if (category !== "car") {
    if (parentCategoryList.includes(category)) {
      const parentCate = await Category.findOne({ name: category })

      // ===============================================================
      // BOTH CAN GET THE SAME RESULT, this is array of sub categories
      const cate = await Category.find({ "ancestors._id": parentCate._id })
      // const cate = await Category.find({ parent: cate1._id })
      // ===============================================================

      queryObject.category = { $in: cate }
    } else {
      const cate = await Category.findOne({ name: category })
      queryObject.category = cate
    }
  }

  if (minPrice && minPrice !== "0" && minPrice <= maxPrice)
    queryObject.price = { $gte: +minPrice }
  if (maxPrice && maxPrice !== "0" && maxPrice >= minPrice)
    queryObject.price = { $gte: minPrice, $lte: +maxPrice }

  let result = Listing.find(queryObject).populate({
    path: "createdBy",
    populate: {
      path: "user",
      select: "username _id photo",
    },
  })

  if (sort === "latest" || !sort) result = result.sort("-createdAt")
  if (sort === "oldest") result = result.sort("createdAt")
  if (sort === "favorite") result = result.sort("-numOfFavorite")
  if (sort === "price - high to low") result = result.sort("-price")
  if (sort === "price - low to high") result = result.sort("price")

  const page = Number(req.query.page) || 1
  const limit = Number(req.query.limit) || 10
  result = result.skip((page - 1) * limit).limit(limit)

  const listings = await result

  const totalListings = await Listing.countDocuments(queryObject)
  const numOfPages = Math.ceil(totalListings / limit)

  res.status(StatusCodes.OK).json({
    status: "success",
    results: totalListings,
    pages: numOfPages,
    page: req.query.page || 1,
    data: listings,
  })
}

export const getUserAllListing = async (req, res) => {
  const { userId, search, condition, category, minPrice, maxPrice, sort } =
    req.query

  const queryObject = { "createdBy.user": userId }

  if (search) {
    queryObject.name = { $regex: search, $options: "i" }
  }

  if (condition) queryObject.condition = condition
  if (category) {
    const cate = await Category.findOne({ name: category })
    queryObject.category = cate._id
  }
  if (minPrice) queryObject.price = { $gte: minPrice }
  if (maxPrice) queryObject.price = { $gte: minPrice, $lte: maxPrice }

  let result = Listing.find(queryObject).populate({
    path: "createdBy",
    populate: {
      path: "user",
      select: "username _id photo",
    },
  })

  if (sort === "latest" || !sort) result = result.sort("-createdAt")
  if (sort === "oldest") result = result.sort("createdAt")
  if (sort === "a-z") result = result.sort("name")
  if (sort === "z-a") result = result.sort("-name")

  const page = Number(req.query.page) || 1
  const limit = Number(req.query.limit) || 10
  result = result.skip((page - 1) * limit).limit(limit)

  const listings = await result
  const totalListings = await Listing.countDocuments(queryObject)
  const numOfPages = Math.ceil(totalListings / limit)

  res.status(StatusCodes.OK).json({
    status: "success",
    results: totalListings,
    pages: numOfPages,
    page: req.query.page || 1,
    data: listings,
  })
}

export const getSingleListing = async (req, res) => {
  const { id } = req.params
  const listing = await Listing.findById(id)
    .populate({
      path: "createdBy",
      populate: {
        path: "user",
        select:
          "photo username rating numOfReviews createdAt follower following",
      },
    })
    .populate({
      path: "category",
      select: "_id name",
    })

  if (!listing) {
    throw new NotFoundError(`can't find listing with id: ${id}`)
  }

  res.status(StatusCodes.OK).json({
    status: "success",
    listing,
  })
}

export const uploadListingPhotos = async (req, res) => {
  const result = await uploadPhoto(req, "listing")

  res.status(StatusCodes.OK).json({
    status: "success",
    data: result,
  })
}

export const removeListingPhoto = async (req, res) => {
  const { photoPublicId } = req.body
  const result = await cloudinary.uploader.destroy(photoPublicId)

  res.status(StatusCodes.NO_CONTENT).json({
    status: "success",
    msg: result,
  })
}

export const createListing = async (req, res) => {
  const {
    name,
    condition,
    category,
    brand,
    price,
    photos,
    description,
    dealMethod,
    meetUpLocation,
  } = req.body

  if (
    !name ||
    !condition ||
    !category ||
    !price ||
    photos.length === 0 ||
    (!dealMethod.meetUp && !dealMethod.delivery)
  ) {
    throw new BadRequestError(`please provide all values`)
  }

  const cate = await Category.findOne({ name: category })
  if (!cate) {
    throw new NotFoundError(
      `can't find category: ${category}, please try again `
    )
  }

  const newListing = await Listing.create({
    name,
    condition,
    category: cate,
    brand,
    description,
    price,
    photos,
    dealMethod,
    meetUpLocation,
    createdBy: { user: req.user.id },
  })

  res.status(StatusCodes.CREATED).json({
    status: "success",
    listing: newListing,
  })
}

export const editListing = async (req, res) => {
  const { id } = req.params
  const {
    name,
    condition,
    category,
    brand,
    price,
    photos,
    dealMethod,
    meetUpLocation,
    removedPhotos,
  } = req.body

  if (
    !name ||
    !condition ||
    !category ||
    !price ||
    !photos ||
    !dealMethod ||
    (dealMethod === "meet up" && !meetUpLocation)
  ) {
    throw new BadRequestError(`please provide all values`)
  }

  const listing = await Listing.findById(id)
  if (!listing) {
    throw new NotFoundError(`can't find listing with id: ${id}`)
  }

  checkPermission(req.user, listing.createdBy)

  listing.name = name
  listing.condition = condition
  listing.category = category
  listing.brand = brand
  listing.price = price
  listing.photos = [
    ...listing.photos.filter(
      (photo) => !removedPhotos.includes(photo.publicId)
    ),
    ...photos,
  ]
  listing.dealMethod = dealMethod
  listing.meetUpLocation = meetUpLocation
  await listing.save()

  res.status(StatusCodes.OK).json({
    status: "success",
    listing,
  })
}

export const updateListingStatus = async (req, res) => {
  const { id } = req.params
  const { status } = req.body

  const listing = await Listing.findById(id)

  if (!listing) {
    throw new NotFoundError(`can't find listing with id: ${id}`)
  }

  checkPermission(req.user, listing.createdBy.user)

  listing.status = status
  await listing.save()

  res.status(StatusCodes.OK).json({
    status: "success",
    listing,
  })
}

export const buyListing = async (req, res) => {
  const { id } = req.params
  const { buyer } = req.body

  const listing = await Listing.findById(id)
  if (!listing) {
    throw new NotFoundError(`can't find listing with id:${id}`)
  }

  listing.soldTo = buyer
  listing.status = "sold"
  await listing.save()

  res.status(StatusCodes.OK).json({
    status: "success",
    data: listing,
  })
}

export const deleteListing = async (req, res) => {
  const { id } = req.params
  const { photoPublicId } = req.query

  const listing = await Listing.findById(id)
  if (!listing) {
    throw new NotFoundError(`can't find listing with id: ${id}`)
  }

  checkPermission(req.user, listing.createdBy)

  photoPublicId.split(",").forEach(async (photo) => {
    await cloudinary.uploader.destroy(photo)
  })

  await listing.remove()

  res.status(StatusCodes.NO_CONTENT).json({
    status: "success",
    msg: "listing deleted",
  })
}
