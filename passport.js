import "dotenv/config.js"
import passport from "passport"
import { Strategy as GoogleStrategy } from "passport-google-oauth20"
import User from "./models/userModel.js"
import uploadPhoto from "./utils/uploadPhoto.js"

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async function (accessToken, refreshToken, profile, done) {
      const {
        sub: id,
        name,
        given_name,
        family_name,
        picture,
        email,
      } = profile._json

      const user = await User.findOne({ email })

      if (!user) {
        // UPLOAD PICTURE TO CLOUDINARY
        const photo = await uploadPhoto(null, "user", picture)

        const newUser = await User.create({
          googleId: id,
          username: name,
          lastName: family_name,
          firstName: given_name,
          photo: {
            publicId: photo.public_id,
            url: photo.secure_url,
          },
          email,
          role: "user",
          isVerified: true,
          verified: new Date(Date.now()),
          // FIXME WHAT IS THE BETTER WAY TO DO
          password: "test1234",
          passwordConfirm: "test1234",
        })
        return done(null, newUser)
      } else {
        if (!user.googleId) {
          user.googleId = id
          await user.save()
        }
        return done(null, user)
      }
    }
  )
)

passport.serializeUser(function (user, done) {
  const { id, email, role } = user
  return done(null, { id, email, role })
})

passport.deserializeUser(function (user, done) {
  return done(null, user)
})

// passport.serializeUser(function(user, done){
//   const { id, email, role } = user
//   process.nextTick(() => {
//     return done(null, { id, email, role })
//   })
// })

// passport.deserializeUser((user, done) => {
//   process.nextTick(() => {
//     return done(null, user)
//   })
// })

// passport.serializeUser((user, done) => {
//   const { id, email, role } = user
//   return done(null, { id, email, role })
// })

// passport.deserializeUser((user, done) => {
//   return done(null, user)
// })

// passport.deserializeUser(async (user, done) => {
//   return done(null, user)
// })
