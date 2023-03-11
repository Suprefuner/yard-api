import passport from "passport"

export const googleScope = () => {
  return passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
  })
}

export const googleCallback = () => {
  return passport.authenticate("google", {
    successRedirect: "https://yard-hnyg.onrender.com/",
    // successRedirect: "http://localhost:5173",
    failureRedirect: "https://yard-hnyg.onrender.com/",
  })
}
