// routes/friendRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Mongoose model use kar

// Friend add route
router.post('/add/:friendId', async (req, res) => {
  try {
    const currentUserId = req.body.userId || req.user?.id; // JWT/req se le sakta hai
    const friendId = req.params.friendId;
    if (!currentUserId || !friendId) {
      return res.status(400).json({ message: 'Both userId and friendId required.' });
    }

    const currentUser = await User.findById(currentUserId);
    const friendUser = await User.findById(friendId);

    if (!currentUser || !friendUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Duplicates avoid karo
    if (currentUser.friends?.includes(friendId)) {
      return res.status(400).json({ message: 'Already added as friend.' });
    }

    // Friend list add in current user (ya dono me)
    currentUser.friends = currentUser.friends || [];
    currentUser.friends.push(friendId);
    await currentUser.save();

    // (optional) Friend ki bhi list me currentUserId push kar sakta hai
    friendUser.friends = friendUser.friends || [];
    friendUser.friends.push(currentUserId);
    await friendUser.save();

    return res.status(200).json({ message: 'Friend added successfully!' });
  } catch (err) {
    console.error('Friend add error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
