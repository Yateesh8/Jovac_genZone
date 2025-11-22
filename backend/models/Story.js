const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mediaType: { type: String, enum: ['image', 'video'], required: true },
  mediaUrl: { type: String, required: true },
  caption: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: () => Date.now() + 24 * 60 * 60 * 1000 }
});

module.exports = mongoose.model('Story', storySchema);
