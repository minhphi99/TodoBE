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
authRoutes.post("/login", loginWithID);
authRoutes.post("/changepw", protect, changePassword);
authRoutes.post("/logout", protect, logoutUser);
authRoutes.post("/forgotpw", forgotPassword);
authRoutes.post("/forgotpw/:id/:token", resetPassword);
authRoutes.post("/refresh", refreshToken);
authRoutes.get("/google", loginWithGoogle);
authRoutes.get("/google/callback", handleRedirect);

export default authRoutes;
