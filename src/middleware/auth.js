import jwt from "jsonwebtoken";
import TokenBlacklist from "../models/tokenBlacklist.model.js";

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const accessToken = authHeader && authHeader.split(" ")[1];
    if (!accessToken) {
      // res.redirect("/auth/google");
      return res.status(401).json({ message: "Unauthorized access" });
    }

    const blacklist = await TokenBlacklist.findOne({ accessToken });
    if (blacklist)
      return res.status(401).json({ message: "token blacklisted" });

    const decoded = jwt.verify(accessToken, process.env.ACCESS_SECRET_KEY);
    req.user = decoded;
    next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export default protect;
