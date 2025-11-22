const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const { authenticateUser } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

const fs = require("fs");
const uploadDir = path.join(__dirname, "../../frontend/images");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer setup for chat media (image/video) upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../frontend/images'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// ================== SEND MESSAGE with Optional Media ==================
router.post('/send',(req, res, next) => { 
  console.log('Message send route HIT');
  next();
}, authenticateUser, upload.single('media'), async (req, res) => {
  try {
    const { receiver, content } = req.body;
    const sender = req.user._id;

    if (!receiver || ((!(content && content.trim())) && !req.file)) {
      return res.status(400).json({ message: 'Receiver and either content or media are required.' });
    }

    let mediaType = null, mediaUrl = null;
    const file = req.file;

    if (file) {
      mediaType = file.mimetype.startsWith('image/') ? 'image'
            : file.mimetype.startsWith('video/') ? 'video' : null;
      mediaUrl = `/images/${file.filename}`;
    }

    const newMessage = new Message({
      sender,
      receiver,
      content: content ? content.trim() : "",
      mediaType,
      mediaUrl
    });

    await newMessage.save();

    res.status(201).json({
      message: 'Message sent successfully',
      data: {
        _id: newMessage._id,
        content: newMessage.content,
        sender,
        receiver,
        timestamp: newMessage.createdAt,
        mediaType,
        mediaUrl
      }
    });
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ========== FETCH MESSAGES WITH FRIEND ==========
router.get('/:receiverId', authenticateUser, async (req, res) => {
  const sender = req.user._id;
  const receiver = req.params.receiverId;

  try {
    // Mark all messages from receiver to sender as seen
    await Message.updateMany(
      { sender: receiver, receiver: sender, seen: false },
      { $set: { seen: true } }
    );

    // Fetch all messages between sender and receiver
    const messages = await Message.find({
      $or: [
        { sender, receiver },
        { sender: receiver, receiver: sender }
      ]
    }).sort({ createdAt: 1 });

    res.status(200).json({ messages });
  } catch (err) {
    console.error('Fetch messages error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
