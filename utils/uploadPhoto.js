import fs from "fs"
import { v2 as cloudinary } from "cloudinary"
import { BadRequestError } from "../errors/index.js"

const checkIsImage = (file) => {
  if (file.mimetype.startsWith("image")) return
  fs.unlinkSync(file.tempFilePath)
  throw new BadRequestError(`can only upload image`)
}

const cloudinaryUploadOption = (type) => ({
  use_filename: true,
  folder:
    type === "user"
      ? "user-photo"
      : type === "message"
      ? "message-photos"
      : "listing-photos",
})

const uploadPhoto = async (files, type, photo) => {
  // ==============================================
  // UPLOAD IMAGE FROM GOOGLE ACCOUNT
  // ==============================================
  if (!files && photo) {
    const result = await cloudinary.uploader.upload(
      photo.replace("=s96", "=s300"),
      cloudinaryUploadOption(type)
    )

    return result
  }

  // ==============================================
  // MULTIPLE IMAGES UPLOAD
  // ==============================================
  if (Object.values(files)[0].length > 1) {
    let tempFilePaths = []
    let requests = Object.values(files)[0].map((photo) => {
      checkIsImage(photo)
      tempFilePaths = [...tempFilePaths, photo.tempFilePath]

      // CREATE REQUESTS (NOT SOLVING RIGHT AWAY)
      return cloudinary.uploader.upload(photo.tempFilePath, {
        use_filename: true,
        folder: "listing-photos",
      })
    })

    // SOLVE ALL REQUESTS ONCE HERE
    const finalResult = await Promise.allSettled(requests)
    tempFilePaths.forEach((path) => fs.unlinkSync(path))
    return finalResult
  }

  // ==============================================
  // SINGLE IMAGES UPLOAD
  // ==============================================
  checkIsImage(files.photo)

  const result = await cloudinary.uploader.upload(
    files.photo.tempFilePath,
    cloudinaryUploadOption(type)
  )

  fs.unlinkSync(files.photo.tempFilePath)
  return result
}

export default uploadPhoto
