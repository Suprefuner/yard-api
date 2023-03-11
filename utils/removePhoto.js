import { v2 as cloudinary } from "cloudinary"

const removePhoto = async (photoPublicId) => {
  if (!!photoPublicId.forEach) {
    const requests = photoPublicId.forEach((photoId) => {
      return cloudinary.uploader.destroy(photoId)
    })

    const result = await Promise.all(requests)
    return result
  }
}

export default removePhoto
