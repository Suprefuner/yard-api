import passport from "passport"

export const googleScope = () => {
  return passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
  })
}

export const googleCallback = () => {
  return passport.authenticate("google", {
    // successRedirect: "http://localhost:5173",
    successRedirect: "http://localhost:5000",
    failureRedirect: "/api/v1/auth/google/failed",
  })
}
