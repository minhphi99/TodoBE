import mongoose from "mongoose";

const refreshTokenSchema = new mongoose.Schema({
  id: {
    type: String,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  tokenHash: {
    type: String,
    required: true,
  },
  expireDate: {
    type: Date,
    default: Date.now,
    required: true,
    expires: 60 * 60 * 24 * 7, // 7 days
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  // valid: {
  //   type: Boolean,
  //   default: True,
  // },
});

const RefreshToken = mongoose.model("refreshToken", refreshTokenSchema);
export default RefreshToken;
