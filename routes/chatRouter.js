import express from "express"
import {
  getAllMyChat,
  deleteMyChat,
  createChat,
  updateChat,
  getSingleChat,
} from "../controllers/chatController.js"
import { authenticateUser, restrictToRole } from "../middlewares/index.js"

const router = express.Router()

router
  .route("/")
  .get(authenticateUser, getAllMyChat)
  .post(authenticateUser, createChat)
  .patch(authenticateUser, updateChat)

router
  .route("/:chatId")
  // .delete(authenticateUser, restrictToRole("admin"), deleteMyChat)
  .delete(deleteMyChat)

router.get("/searchChat", authenticateUser, getSingleChat)

export default router
