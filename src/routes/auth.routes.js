import protect from "../middleware/auth.js";
import express from "express";
import {
  registerUser,
  loginWithID,
  changePassword,
  logoutUser,
  forgotPassword,
  resetPassword,
  refreshToken,
  loginWithGoogle,
  handleRedirect,
} from "../controllers/auth.controller.js";
import User from "../models/user.model.js";

const authRoutes = express.Router();
authRoutes.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -__v");
    res.send(user);
  } catch (error) {
    console.error(error);
    res.send("an error occured");
  }
});

authRoutes.post("/register", registerUser);
authRoutes.post("/loginID", loginWithID);
authRoutes.post("/changepw", protect, changePassword); //user tu doi mk
authRoutes.post("/logout", protect, logoutUser);
authRoutes.post("/forgotpw", forgotPassword); // gui link den mail de reset mk
authRoutes.post("/resetpw/:token", resetPassword); //dung link de reset mk
authRoutes.post("/refresh", refreshToken);
authRoutes.get("/loginGoogle", loginWithGoogle);
authRoutes.get("/google/callback", handleRedirect);

export default authRoutes;
