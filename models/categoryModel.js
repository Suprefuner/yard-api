import mongoose from "mongoose"
import { slugify } from "../utils/index.js"

const categorySchema = new mongoose.Schema({
  name: String,
  slug: {
    type: String,
    index: true,
  },
  photo: {
    publicId: String,
    url: String,
  },
  parent: {
    type: mongoose.Types.ObjectId,
    ref: "Category",
    default: null,
  },
  ancestors: [
    {
      _id: {
        type: mongoose.Types.ObjectId,
        ref: "Category",
        index: true,
      },
      name: String,
      slug: String,
    },
  ],
})

categorySchema.pre("save", async function (next) {
  this.slug = slugify(this.name)
})

const Category = mongoose.model("Category", categorySchema)
export default Category
