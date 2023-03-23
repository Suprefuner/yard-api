import { Server } from "socket.io"
import User from "./models/userModel.js"
import Chat from "./models/chatModel.js"

const socketServer = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
    },
  })

  let users = []

  const addUser = (userId, socketId) => {
    if (!users.find((user) => user.id === userId)) {
      users.push({ id: userId, socketId })
    }
  }

  const removeUser = (socketId) => {
    users = users.filter((user) => user.socketId !== socketId)
  }

  const getUser = (userId) => {
    return users.find((user) => user.id === userId)
  }

  const getUserBySocketId = (socketId) => {
    const user = users.find((user) => user.socketId === socketId)
    return user ? user.id : null
  }

  io.on("connection", (socket) => {
    /*
    ====================================================
    CONNECT
    ====================================================
    */
    console.log("new user connected")
    socket.on("addUser", (userId) => {
      addUser(userId, socket.id)
      io.emit("getUsers", users)
      console.log("this is from connect")
      console.log(users)
    })

    socket.on("setTypingMessage", ({ senderId, receiverId, isTyping }) => {
      const receiver = getUser(receiverId)
      if (!receiver) return
      io.to(receiver.socketId).emit("getTypingMessage", { senderId, isTyping })
    })

    /*
    ====================================================
    SEND MESSAGE
    ====================================================
    */

    socket.on(
      "createChat",
      async ({
        senderId,
        receiverId,
        listing,
        text,
        image,
        type,
        offerType,
        offerPrice,
      }) => {
        const chat = await Chat.findOne({
          listing: listing._id,
          participants: { $all: [receiverId, senderId] },
        })
          .populate({
            path: "participants",
            match: { _id: { $ne: receiverId } },
            select: "username photo lastOnline",
          })
          .populate({
            path: "listing",
            select: "name photos createdBy price",
          })
          .populate({
            path: "lastMessage",
            select: "message createdAt type offerType offerPrice",
          })

        // FIXME DEVELOPMENT
        // console.log("this is chat from socket in backend")

        const receiver = getUser(receiverId)
        if (!receiver) return
        io.to(receiver.socketId).emit("getNewChat", chat)
      }
    )

    socket.on(
      "cancelOffer",
      ({ receiverId, chat, type, offerType, offerPrice }) => {
        const receiver = getUser(receiverId)
        if (!receiver) return
        io.to(receiver.socketId).emit("getCancelOffer", {
          chat,
          type,
          offerType,
          offerPrice,
        })
      }
    )

    socket.on("sendMessage", ({ senderId, receiverId, msg }) => {
      const receiver = getUser(receiverId)
      if (!receiver) return
      io.to(receiver.socketId).emit("getMessage", { senderId, msg })
    })

    socket.on("readMessage", ({ chatId, userId }) => {
      const receiver = getUser(userId)
      if (!receiver) return
      io.to(receiver.socketId).emit("updateMessageStatus", { chatId })
    })

    /*
    ====================================================
    DISCONNECT
    ====================================================
    */
    socket.on("disconnect", async () => {
      const userId = getUserBySocketId(socket.id)
      removeUser(socket.id)

      const user = await User.findById(userId)
      if (!user) return
      user.lastOnline = Date.now()
      await user.save()

      console.log("this is from disconnect")
      console.log(users)

      io.emit("getUsers", users)
      io.emit("updateUserLastOnline", userId)
    })
  })

  return { io, users }
}

export default socketServer
