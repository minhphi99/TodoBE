import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import TokenBlacklist from "../models/tokenBlacklist.model.js";
import crypto from "crypto";
import { generateRefreshToken, hashToken } from "../utils/token.js";
import RefreshToken from "../models/refreshToken.model.js";
import axios from "axios";
import cookieParser from "cookie-parser";

const REFRESH_EXPIRE_MS = 604800;

export const registerUser = async (req, res) => {
  try {
    const { username, password, email, role } = req.body;

    if (!username || !password || !email) {
      return res.status(400).json({ message: "Required field is missing" });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "User already existed" });
    } else {
      const user = await User.create({ username, password, email, role });
      return res.status(200).json({
        message: "User created successfully",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      });
    }
  } catch (error) {
    console.error("Registering failed", error);
    return res.status(500).json({ message: "Server issue hehehe" });
  }
};

export const loginWithID = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(400).json({ message: "Incorrect username/password" });
    }
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid username or password" });
    }
    const payload = { id: user._id, role: user.role };
    const accessToken = jwt.sign(payload, process.env.ACCESS_SECRET_KEY, {
      expiresIn: process.env.ACCESS_EXPIRE_IN,
    });

    const rawRefreshToken = generateRefreshToken(user);
    const refreshToken = hashToken(rawRefreshToken);

    const refreshExpireDate = new Date(Date.now() + REFRESH_EXPIRE_MS);
    await RefreshToken.create({
      userId: user._id,
      tokenHash: refreshToken,
      expireDate: refreshExpireDate,
    });

    // const refreshToken = jwt.sign(
    //   { id: user._id },
    //   process.env.REFRESH_SECRET_KEY,
    //   {
    //     expiresIn: process.env.REFRESH_EXPIRE_IN,
    //   }
    // );

    //check this again
    res.cookie("refreshToken", rawRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: REFRESH_EXPIRE_MS,
      path: "/auth/refresh",
    });

    return res.status(200).json({
      message: "Login succesfully",
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server issue" });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { newPassword, currentPassword } = req.body;

    if (!newPassword || !currentPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect user password" });
    }

    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();

    return res.status(200).json({ message: "Password changed succesfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server issue" });
  }
};

export const logoutUser = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized access" });
    }
    await TokenBlacklist.create({ token });
    //clear refresh token from cookies
    return res.status(200).json({ message: "logout succesfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server issue" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res
        .status(400)
        .json({ message: "invalid request, please enter new password" });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: "1d",
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const salt = await bcrypt.genSalt(12);
    User.password = await bcrypt.hash(newPassword, salt);

    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();
    return res.status(200).json({ message: "reset password sucessfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server issue" });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate password reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000;

    await user.save();

    // TODO: Send email with reset token
    //need nodemailer + more setup
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    return res.status(200).json({
      message: "Password reset instructions sent to email",
      // Remove token in production, only for testing
      resetToken,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server issue" });
  }
};

export const refreshToken = async (req, res) => {
  const raw = req.cookies?.refreshToken;
  if (!raw) {
    return res.status(401).json({ message: "No refresh token" });
  }

  const token = hashToken(raw);

  const tokenDoc = await RefreshToken.findOneAndDelete(token);

  //not found => possible reuse/invalid
  if (!tokenDoc) {
    res.clearCookie("refreshToken", { path: "/refresh" });
    return res.status(401).json({ message: "Invalid refresh token" });
  }

  if (tokenDoc === null) {
    res.clearCookie("refreshToken", { path: "/refresh" });
    return res.status(401).json({ message: "Possible reuse" });
  }

  if (tokenDoc.expireDate < new Date()) {
    return res.status(401).json({ message: "Refresh token expired" });
  }

  //if valid, issue new refresh token + access token
  const newTokenRaw = generateRefreshToken();
  const newTokenHashed = hashToken(newTokenRaw);
  const newExpireDate = new Date(Date.now() + REFRESH_EXPIRE_MS);

  //create new refresh token
  await RefreshToken.create({
    userId: tokenDoc.userId,
    tokenHash: newTokenHashed,
    expireDate: newExpireDate,
  });

  //issue new access token
  const newAccessToken = jwt.sign(
    {
      userId: tokenDoc.userId,
      role: tokenDoc.role,
    },
    process.env.ACCESS_SECRET_KEY,
    {
      expiresIn: "1hr",
    }
  );

  //send new token in cookie
  res.cookie("refreshToken", newTokenRaw, {
    userId: tokenDoc.userId,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: REFRESH_EXPIRE_MS,
    path: "/refresh",
  });

  return res.status(200).json({ message: newAccessToken });
};

export const loginWithGoogle = async (req, res) => {
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const redirectURI = process.env.GOOGLE_REDIRECT_URI;
  const scope = [
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
  ];
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientID}&redirect_uri=${redirectURI}&response_type=code&scope=${scope.join(
    " "
  )}&access_type=offline&prompt=consent`;
  res.render("login", { authUrl });
};

export const handleRedirect = async (req, res) => {
  const code = req.query.code;
  try {
    //Exchange code for data
    const { data } = await axios.post(
      "https://oauth2.googleapis.com/token",
      {
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      },
      { headers: { "Content-Type": "application/json" } }
    );
    const accessToken = data.access_token;

    //fetch user profile
    const userProfile = await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    const googleUser = userProfile.data;

    const user = await User.findOneAndUpdate(
      { email: googleUser.email },
      {
        $set: {
          id: googleUser.id,
          email: googleUser.email,
          name: googleUser.name,
          role: googleUser.role,
        },
      },
      { upsert: true, new: true, runValidators: true }
    );
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.ACCESS_SECRET_KEY,
      {
        expiresIn: process.env.ACCESS_EXPIRE_IN,
      }
    );

    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        token,
      },
    });
    // res.redirect("/");
  } catch (error) {
    console.error("Google Auth error", error.response?.data || error.message);
    res.status(500).json({ message: "Authentication with Google failed" });
  }
};
