import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

// TODO: The username and password fields are not required. This is probably to accommodate for social logins, but it could lead to users being created without a username or password. It would be better to have separate models for local and social users, or to use a different approach to handle this.
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: false,
    unique: true,
    // TODO: The sparse option creates a sparse index that only contains entries for documents that have the indexed field. This is useful when you have a unique index on a field that may not be present in all documents. However, since the username is not required, this could lead to multiple users with no username. This is probably not what you want.
    sparse: true,
  },
  password: {
    type: String,
    required: false,
    unique: false,
    sparse: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  providerId: {
    type: String,
  },
  loginType: {
    type: String,
    enum: ["local", "google"],
  },
  lastLogin: { type: Date },
  resetPasswordToken: {
    type: String,
  },
  resetPasswordExpire: {
    type: Date,
  },
});

//salt and hash pw
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

//compare password with hashed
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
