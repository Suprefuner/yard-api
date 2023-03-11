import { checkPermission } from "../utils/index.js"
import { StatusCodes } from "http-status-codes"
import { NotFoundError } from "../errors/index.js"

export const sortAndPaginate = async (req, Model, queryObject, sortProp) => {
  let result = Model.find(queryObject)

  const { sort } = req.query
  if (sort === "latest" || !sort) result = result.sort("-createdAt")
  if (sort === "oldest") result = result.sort("createdAt")
  if (sortProp && sort === "a-z") result = result.sort(sortProp)
  if (sortProp && sort === "z-a") result = result.sort(`-${sortProp}`)

  const page = Number(req.query.page) || 1
  const limit = Number(req.query.limit) || 10
  result = result.skip((page - 1) * limit).limit(limit)

  const docs = await result
  const totalDocs = await Model.countDocuments(queryObject)
  const numOfPages = Math.ceil(totalDocs / limit)

  return {
    status: "success",
    results: totalDocs,
    pages: numOfPages,
    page: req.query.page || 1,
    data: docs,
  }
}

export const deleteOne = (Model) => {
  return async (req, res) => {
    const { id } = req.params

    const doc = await Model.findById(id)
    if (!doc) {
      throw new NotFoundError(`can't find document with id: ${id}`)
    }

    checkPermission(req.user, doc.createdBy)
    await doc.remove()

    res.status(StatusCodes.OK).json({
      status: "success",
      msg: "document deleted",
    })
  }
}
