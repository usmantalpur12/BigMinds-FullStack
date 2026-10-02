const mongoose = require("mongoose");

const parseDurationToSeconds = (raw) => {
  if (!raw) {
    return 30 * 24 * 60 * 60; // 30 days
  }

  const trimmed = raw.toString().trim().toLowerCase();
  const value = parseInt(trimmed, 10);
  if (Number.isNaN(value)) {
    return 30 * 24 * 60 * 60;
  }

  if (trimmed.endsWith("d")) {
    return value * 24 * 60 * 60;
  }
  if (trimmed.endsWith("h")) {
    return value * 60 * 60;
  }
  if (trimmed.endsWith("m")) {
    return value * 60;
  }
  if (trimmed.endsWith("s")) {
    return value;
  }

  return value;
};

const tokenExpirySeconds = parseDurationToSeconds(
  process.env.JWT_REFRESH_EXPIRE || process.env.JWT_EXPIRE || "30d",
);

const revokedTokenSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

revokedTokenSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: tokenExpirySeconds },
);

module.exports = mongoose.model("RevokedToken", revokedTokenSchema);
