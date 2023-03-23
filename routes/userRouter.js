import express from "express"
import { authenticateUser, restrictToRole } from "../middlewares/index.js"

import {
  getAllUser,
  updateCurrentUser,
  getCurrentUser,
  getUser,
  deleteCurrentUser,
  uploadUserPhoto,
  addListingToFavorite,
  getMyFavorite,
  followUser,
  updateUserLastOnline,
  getNumOfUnreadMessage,
} from "../controllers/userController.js"

const router = express.Router()

// router.route("/").get(getAllUser)
router.route("/").get(authenticateUser, restrictToRole("admin"), getAllUser)

router
  .route("/me")
  .get(authenticateUser, getCurrentUser)
  .patch(authenticateUser, updateCurrentUser)
  .delete(authenticateUser, deleteCurrentUser)

router.get("/getNumOfUnreadMessage", authenticateUser, getNumOfUnreadMessage)
router.patch("/updateMyPhoto", authenticateUser, uploadUserPhoto)
router.get("/myFavorite", authenticateUser, getMyFavorite)
router.patch("/updateMyFavorite", authenticateUser, addListingToFavorite)
router.patch("/followUser", authenticateUser, followUser)
router.patch("/updateMe", authenticateUser, updateCurrentUser)
router.patch("/deleteMe", authenticateUser, deleteCurrentUser)
router.patch("/updateUserLastOnline", authenticateUser, updateUserLastOnline)

router.route("/:id").get(getUser)
export default router
