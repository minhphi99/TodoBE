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
  userInfo,
} from "../controllers/auth.controller.js";
import User from "../models/user.model.js";

const authRoutes = express.Router();

authRoutes.post("/register", registerUser);
// TODO: Consider renaming this route to /login for consistency
authRoutes.post("/loginID", loginWithID);
// TODO: Consider renaming this route to /change-password for consistency
authRoutes.post("/changepw", protect, changePassword); //user tu doi mk
authRoutes.post("/logout", protect, logoutUser);
// TODO: Consider renaming this route to /forgot-password for consistency
authRoutes.post("/forgotpw", forgotPassword); // gui link den mail de reset mk
authRoutes.post("/resetpw/:token", resetPassword); //dung link de reset mk
authRoutes.post("/", refreshToken);
//check again, might not want to use /auth route
authRoutes.get("/me", protect, userInfo);
authRoutes.get("/loginGoogle", loginWithGoogle);
authRoutes.get("/google/callback", handleRedirect);

export default authRoutes;
