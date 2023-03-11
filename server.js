// IMPORT UTILS PACKAGES ==================================
import "dotenv/config.js"
import "express-async-errors"
import morgan from "morgan"
import cookieParser from "cookie-parser"
import session from "express-session"
import cors from "cors"
import path, { dirname } from "path"
import { fileURLToPath } from "url"

// IMPORT SECURITY PACKAGES ==============================
import helmet from "helmet"
import xss from "xss-clean"
import mongoSanitize from "express-mongo-sanitize"

import passport from "passport"
import fileUpload from "express-fileupload"
import { v2 as cloudinary } from "cloudinary"
import "./passport.js"

// IMPORT MIDDLEWARES  ==================================
import notFoundMiddleware from "./middlewares/notFound.js"
import errorHandlerMiddleware from "./middlewares/errorHandler.js"

// IMPORT ROUTERS ==================================
import authRouter from "./routes/authRouter.js"
import userRouter from "./routes/userRouter.js"
import listingRouter from "./routes/listingRouter.js"
import reviewRouter from "./routes/reviewRouter.js"
import categoryRouter from "./routes/categoryRouter.js"

/*
=================================================
SETUP
=================================================
*/
import connectDB from "./db/connect.js"
import express from "express"

const app = express()
app.use(
  cors({
    origin: "https://yard-hnyg.onrender.com",
    // origin: "http://localhost:5000",
    credentials: true,
    optionsSuccessStatus: 200,
  })
)
app.use(express.json())
app.use(
  helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
      "img-src": ["'self'", "data:", "https://res.cloudinary.com/"],
      upgradeInsecureRequests: [],
    },
    reportOnly: false,
  })
)
app.use(xss())
app.use(mongoSanitize())

app.use(cookieParser(process.env.JWT_SECRET))
app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: false,
  })
)
app.use(passport.initialize())
app.use(passport.session())

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"))
}

app.use(fileUpload({ useTempFiles: true }))

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
})

const port = process.env.PORT || 5000

/*
=================================================
ONCE READY TO DEPLOY
=================================================
*/
const __dirname = dirname(fileURLToPath(import.meta.url))
app.use(express.static(path.resolve(__dirname, "../client/dist")))

/*
=================================================
ROUTES
=================================================
*/
app.use("/api/v1/auth", authRouter)
app.use("/api/v1/user", userRouter)
app.use("/api/v1/listing", listingRouter)
app.use("/api/v1/review", reviewRouter)
app.use("/api/v1/category", categoryRouter)

/*
=================================================
ONCE READY TO DEPLOY
=================================================
*/
app.get("*", (req, res) => {
  res.sendFile(path, resolve(__dirname, "../client/dist", "index.html"))
})

app.use(notFoundMiddleware)
app.use(errorHandlerMiddleware)

/*
=================================================
CONNECT TO MONGODB AND RUN THE SERVER
=================================================
*/
const start = async () => {
  try {
    await connectDB(process.env.MONGO_URL)

    app.listen(port, () => {
      console.log(`server is listening on port:${port}`)
    })
  } catch (error) {
    console.log(error)
  }
}

start()
