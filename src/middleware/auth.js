import jwt from "jsonwebtoken";
import TokenBlacklist from "../models/tokenBlacklist.model.js";

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const accessToken = authHeader && authHeader.split(" ")[1];
    if (!accessToken) {
      return res.status(401).json({ message: "Unauthorized access" });
    }

    const blacklist = await TokenBlacklist.findOne({ accessToken });
    if (blacklist)
      return res.status(401).json({ message: "token blacklisted" });

    const decoded = jwt.verify(accessToken, process.env.ACCESS_SECRET_KEY);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    }
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export default protect;
