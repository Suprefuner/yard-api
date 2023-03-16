import express from "express"
import { authenticateUser } from "../middlewares/index.js"
import {
  createMessage,
  deleteMessage,
} from "../controllers/messageController.js"

const router = express.Router()
router.route("/").post(authenticateUser, createMessage)
router.route("/:messageId").delete(authenticateUser, deleteMessage)

export default router
