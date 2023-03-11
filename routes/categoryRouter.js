import express from "express"
import {
  createCategory,
  getAllCategory,
} from "../controllers/categoryController.js"
import {
  authenticateUser,
  restrictToRole,
} from "../middlewares/authentication.js"

const router = express.Router()

router
  .route("/")
  // .post(createCategory)
  // .get(getAllCategory)
  .post(authenticateUser, restrictToRole("admin"), createCategory)
  .get(authenticateUser, restrictToRole("admin"), getAllCategory)

export default router
