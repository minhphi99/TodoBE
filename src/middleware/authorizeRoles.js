// import roles from "../models/roles";

export const authrorizeRoles = (...roles) => {
  return (req, res, next) => {
    try {
      if (!req.user || !req.user.role) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }
      next();
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Server error" });
    }
  };
};
