const express = require("express");
const router = express.Router();
const { authenticateUser } = require("../middleware/authMiddleware");
const User = require("../models/User");

// GET accepted friends
router.get("/friends", authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      "friends", "_id username fullName profilePic"
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user.friends);
  } catch (err) {
    console.error("Fetch friends error:", err);
    res.status(500).json({ message: "Failed to fetch friends" });
  }
});

// GET friend requests (pending), both sent and received
router.get("/friend-requests", authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("pendingSent", "_id username fullName profilePic")
      .populate("pendingReceived", "_id username fullName profilePic");
    res.status(200).json({
      sent: user.pendingSent,
      received: user.pendingReceived,
    });
  } catch (err) {
    console.error("Fetch requests error:", err);
    res.status(500).json({ message: "Failed to fetch friend requests" });
  }
});

// SEND friend request
router.post("/add-friend", authenticateUser, async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ message: "Username is required" });

  try {
    const receiver = await User.findOne({ username });
    if (!receiver) return res.status(404).json({ message: "User not found" });
    if (receiver._id.equals(req.user._id))
      return res.status(400).json({ message: "You cannot add yourself" });

    const sender = await User.findById(req.user._id);
    if (sender.friends.includes(receiver._id))
      return res.status(400).json({ message: "Already friends" });

    // Already sent request
    if (sender.pendingSent.includes(receiver._id))
      return res.status(400).json({ message: "Friend request already sent" });

    // Check if you have a pending received request from this user (mutual request, so accept!)
    if (sender.pendingReceived.includes(receiver._id)) {
      // Auto accept both
      sender.friends.push(receiver._id);
      receiver.friends.push(sender._id);

      // Clean from pending arrays
      sender.pendingReceived = sender.pendingReceived.filter(id => !id.equals(receiver._id));
      receiver.pendingSent = receiver.pendingSent.filter(id => !id.equals(sender._id));
      await sender.save();
      await receiver.save();

      return res.status(200).json({ message: `Friend request accepted with ${receiver.username}!`, friend: receiver });
    }

    // Else, push as pending
    sender.pendingSent.push(receiver._id);
    receiver.pendingReceived.push(sender._id);
    await sender.save();
    await receiver.save();

    res.status(200).json({ message: "Friend request sent!" });
  } catch (err) {
    console.error("Add friend error:", err);
    res.status(500).json({ message: "Failed to add friend" });
  }
});

// ACCEPT request
router.post("/accept-friend", authenticateUser, async (req, res) => {
  const { senderId } = req.body;
  try {
    const receiver = await User.findById(req.user._id);
    const sender = await User.findById(senderId);

    if (!receiver.pendingReceived.includes(senderId))
      return res.status(400).json({ message: "No pending request from this user" });

    // Add each other as friends
    receiver.friends.push(senderId);
    sender.friends.push(receiver._id);

    // Remove from pending
    receiver.pendingReceived = receiver.pendingReceived.filter(id => !id.equals(senderId));
    sender.pendingSent = sender.pendingSent.filter(id => !id.equals(receiver._id));
    await receiver.save();
    await sender.save();

    res.status(200).json({ message: "Friend request accepted", friend: sender });
  } catch (err) {
    console.error("Accept friend error:", err);
    res.status(500).json({ message: "Failed to accept friend request" });
  }
});

// REJECT request
router.post("/reject-friend", authenticateUser, async (req, res) => {
  const { senderId } = req.body;
  try {
    const receiver = await User.findById(req.user._id);
    const sender = await User.findById(senderId);

    receiver.pendingReceived = receiver.pendingReceived.filter(id => !id.equals(senderId));
    sender.pendingSent = sender.pendingSent.filter(id => !id.equals(receiver._id));
    await receiver.save();
    await sender.save();

    res.status(200).json({ message: "Friend request rejected" });
  } catch (err) {
    console.error("Reject friend error:", err);
    res.status(500).json({ message: "Failed to reject friend request" });
  }
});

// Optional: GET all users (for search, etc)
router.get("/all", authenticateUser, async (req, res) => {
  try {
    const users = await User.find({}, "_id username fullName profilePic");
    res.status(200).json(users);
  } catch (err) {
    console.error("Fetch all users error:", err);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

// GET /api/users/username/:username
router.get('/username/:username', authenticateUser, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Error finding user' });
  }
});


module.exports = router;
