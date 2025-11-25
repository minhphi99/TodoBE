import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import TokenBlacklist from "../models/tokenBlacklist.model.js";
import crypto from "crypto";
import { generateRefreshToken, hashToken } from "../utils/token.js";
import RefreshToken from "../models/refreshToken.model.js";
import axios from "axios";
import dotenv from "dotenv";
import { sendPasswordResetEmail } from "../utils/sendmail.js";

dotenv.config();
// TODO: Move this to the .env file
const REFRESH_EXPIRE_MS = 604800000;

export const registerUser = async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;

    if (!username || !password || !email || !confirmPassword) {
      return res.status(400).json({ message: "Required field is missing" });
    }
    // TODO: Add a check to ensure that password and confirmPassword are the same.
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "User already existed" });
    } else {
      const user = await User.create({
        username,
        email,
        password,
        role: "user",
        loginType: "local",
      });
      return res.status(200).json({
        message: "User created successfully",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          loginType: user.loginType,
        },
      });
    }
  } catch (error) {
    console.error("Registering failed", error);
    return res.status(500).json({ message: "Internal server error" });
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

    res.cookie("refreshToken", rawRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: REFRESH_EXPIRE_MS,
      path: "/",
    });

    return res.status(200).json({
      message: "Login succesfully",
      accessToken,
      rawRefreshToken,
      refreshToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        loginType: user.loginType,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server issue" });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentpassword, newpassword, confirmpassword } = req.body;
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized access" });
    }

    if (!newpassword || !currentpassword || !confirmpassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await user.matchPassword(currentpassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect user password" });
    }

    if (newpassword === currentpassword) {
      return res
        .status(400)
        .json({ message: "New password must be different" });
    }

    if (newpassword === confirmpassword) {
      user.password = newpassword;
      await user.save();

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

      res.cookie("refreshToken", rawRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: REFRESH_EXPIRE_MS,
        path: "/",
      });

      return res.status(200).json({
        message: "Password changed succesfully",
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          loginType: user.loginType,
        },
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server issue" });
  }
};

export const userInfo = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized access" });
    }
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    return res.json(user);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
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
    //clear accesss token from cookies
    return res.status(200).json({ message: "logout succesfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server issue" });
  }
};

// TODO: This is not secure. A better approach would be to generate a random token, hash it, and store it in the database with an expiration date. Then, when the user clicks the link, you can find the user by the hashed token.
export const resetPassword = async (req, res) => {
  try {
    const token = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res
        .status(400)
        .json({ message: "invalid request, please enter new password" });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      // TODO: Move this to the .env file
      resetPasswordExpire: "1d",
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.password = newPassword;
    await user.save();
    return res.status(200).json({ message: "reset password sucessfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server issue" });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    // 1. Find user
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 2. Generate password reset token
    const token = jwt.sign({ userId: user.id }, process.env.ACCESS_SECRET_KEY, {
      expiresIn: "15m",
    });

    // 3. Send email with token
    const msgId = await sendPasswordResetEmail(email, token);

    return res.status(200).json({
      message: "Password reset instructions sent to email",
      token,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server issue" });
  }
};

//refresh token rotation
export const refreshToken = async (req, res) => {
  const raw = req.cookies?.refreshToken;
  if (!raw) {
    return res.status(401).json({ message: "No refresh token" });
  }

  const hashed = hashToken(raw);

  //check token before delete
  const tokenDoc = await RefreshToken.findOne({ tokenHash: hashed });

  //check exp => delete old token and reovke all refresh tokens
  if (tokenDoc.expireDate < new Date().getTime()) {
    await RefreshToken.deleteMany({ userId: tokenDoc?.userId });
    res.clearCookie("refreshToken", { path: "/" });
    return res.status(401).json({ message: "Refresh token expired" });
  }
  //valid => rotate token => issue new refresh token + access token
  else {
    await RefreshToken.deleteOne({ _id: tokenDoc._id });

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
    const user = await User.findById(tokenDoc.userId);

    const newAccessToken = jwt.sign(
      {
        userId: user._id,
        role: user.role,
      },
      process.env.ACCESS_SECRET_KEY,
      {
        expiresIn: "1hr",
      }
    );

    //send new token in cookie
    res.cookie("refreshToken", newTokenRaw, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: REFRESH_EXPIRE_MS,
      path: "/",
    });

    return res.status(200).json({ accessToken: newAccessToken });
  }
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
  res.redirect(authUrl);
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
    const { data: googleUser } = await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    const { email, name, id } = googleUser;

    //separate signup and login with OAuth
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        id: id,
        email: email,
        name: name,
        role: "user",
        loginType: "google",
      });
    } else if (user.loginType !== "google") {
      return res
        .status(400)
        .json({ message: "User already signed up using local account" });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.ACCESS_SECRET_KEY,
      {
        expiresIn: process.env.ACCESS_EXPIRE_IN,
      }
    );
    res.json({
      // TODO: The isNew property is not reliable. A better approach would be to check if the user was created in this request.
      message: user.isNew ? "Signup successful" : "Login successful",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        loginType: user.loginType,
        token,
      },
    });
  } catch (error) {
    console.error("Google Auth error", error.response?.data || error.message);
    res.status(500).json({ message: "Authentication with Google failed" });
  }
};
