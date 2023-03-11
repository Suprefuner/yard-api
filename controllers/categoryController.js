import { StatusCodes } from "http-status-codes"
import { BadRequestError } from "../errors/index.js"
import Category from "../models/categoryModel.js"
import { buildAncestors } from "../utils/index.js"

export const createCategory = async (req, res) => {
  const { name, parent } = req.body
  if (!name) {
    throw new BadRequestError(`please provide all values`)
  }

  const category = await Category.create({
    name,
  })

  await buildAncestors(category._id, parent)

  res.status(StatusCodes.CREATED).json({
    status: "success",
    category,
  })
}

export const getAllCategory = async (req, res) => {
  const categories = await Category.find()

  res.status(StatusCodes.OK).json({
    status: "success",
    results: categories.length,
    categories,
  })
}
