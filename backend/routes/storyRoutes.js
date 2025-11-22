const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Story = require('../models/Story');
const { authenticateUser } = require('../middleware/authMiddleware');
const User = require('../models/User');

// Multer setup for uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../frontend/images')); // Save inside frontend/images
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Create story (upload media)
router.post('/add', authenticateUser, upload.single('media'), async (req, res) => {
  try {
    const userId = req.user.id || req.user._id; // support both id/_id
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const mimeType = file.mimetype.startsWith('image/') ? 'image'
                  : file.mimetype.startsWith('video/') ? 'video' : null;
    if (!mimeType) return res.status(400).json({ error: 'Invalid file type' });

    const newStory = new Story({
      owner: userId,
      mediaType: mimeType,
      mediaUrl: `/images/${file.filename}`,
      caption: req.body.caption || ''
    });
    await newStory.save();
    res.json({ message: 'Story uploaded', story: newStory });
  } catch (error) {
    res.status(500).json({ error: 'Unable to save story' });
  }
});

// Get stories of friends only
router.get('/feed', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const user = await User.findById(userId).populate('friends');
    const friendIds = user.friends.map(f => f._id);

    const stories = await Story.find({
      owner: { $in: friendIds },
      expiresAt: { $gte: new Date() }
    }).populate('owner', 'username');
    res.json({ stories });
  } catch (err) {
    res.status(500).json({ error: 'Unable to fetch stories' });
  }
});

module.exports = router;
