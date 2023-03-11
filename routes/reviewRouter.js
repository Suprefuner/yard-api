import express from "express"
import {
  getAllUserReview,
  createReview,
  updateReview,
  deleteReview,
} from "../controllers/reviewController.js"
import { authenticateUser } from "../middlewares/index.js"

const router = express.Router()

// prettier-ignore
router
  .route("/")
  .get(getAllUserReview)
  .post(authenticateUser, createReview)

router
  .route("/:id")
  .patch(authenticateUser, updateReview)
  .delete(authenticateUser, deleteReview)

export default router
