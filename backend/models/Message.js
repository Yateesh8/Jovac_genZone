const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: function () {
        return !this.mediaUrl;   // only required when no media
      },
      trim: true
    },
    delivered: {
      type: Boolean,
      default: false
    },
    seen: {
      type: Boolean,
      default: false
    },
    mediaType: { type: String, enum: ['image', 'video'], default: null },
    mediaUrl: { type: String, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', messageSchema);
