import CustomAPIError from "../errors/customAPIError.js"
import Category from "../models/categoryModel.js"

const buildAncestors = async (id, parent_name) => {
  try {
    let parent_category = await Category.findOne(
      { name: parent_name },
      { name: 1, slug: 1, ancestors: 1 }
    )
    if (parent_category) {
      const { _id, name, slug } = parent_category
      const ancestor = [...parent_category.ancestors]
      ancestor.unshift({ _id, name, slug })
      await Category.findByIdAndUpdate(id, {
        $set: {
          parent: parent_category._id,
          ancestors: ancestor,
        },
      })
    }
  } catch (err) {
    throw new CustomAPIError(err.message)
  }
}

export default buildAncestors
