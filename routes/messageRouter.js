import express from "express"
import { authenticateUser } from "../middlewares/index.js"
import {
  createMessage,
  getMessagesOfChat,
  deleteMessage,
  uploadMessageImage,
  readMessage,
} from "../controllers/messageController.js"

const router = express.Router()
router
  .route("/")
  .get(authenticateUser, getMessagesOfChat)
  .post(authenticateUser, createMessage)
  .patch(authenticateUser, readMessage)

router.post("/uploadMessageImage", uploadMessageImage)
router.route("/:messageId").delete(authenticateUser, deleteMessage)

export default router
