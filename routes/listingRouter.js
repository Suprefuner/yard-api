import express from "express"
import {
  getAllListing,
  getUserAllListing,
  getSingleListing,
  createListing,
  editListing,
  deleteListing,
  updateListingStatus,
  uploadListingPhotos,
  removeListingPhoto,
  buyListing,
} from "../controllers/listingController.js"
import { authenticateUser } from "../middlewares/index.js"

const router = express.Router()

// prettier-ignore
router
  .route("/")
  .get(getAllListing)
  .post(authenticateUser, createListing)

router.get("/allMyListings", getUserAllListing)
router.post("/uploadListingPhotos", authenticateUser, uploadListingPhotos)
router.patch("/:id/updateStatus", authenticateUser, updateListingStatus)
router.patch("/removeListingPhoto", authenticateUser, removeListingPhoto)
router.patch("/:id/buyListing", authenticateUser, buyListing)

router
  .route("/:id")
  .get(getSingleListing)
  .patch(authenticateUser, editListing)
  .delete(authenticateUser, deleteListing)

export default router
