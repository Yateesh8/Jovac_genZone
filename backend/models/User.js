const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  username: { type: String, required: true, unique: true, trim: true },
  emailOrPhone: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  profilePic: { type: String, default: "" },
  status: { type: String, enum: ["online", "offline"], default: "offline" },
  bio: { type: String, default: "" },
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  pendingSent: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],        // Requests sent by me (waiting for their accept)
  pendingReceived: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],   // Requests I received (waiting for me to accept)
}, { timestamps: true });

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
