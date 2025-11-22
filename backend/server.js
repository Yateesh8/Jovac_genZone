const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const socketIo = require("socket.io");
const path = require('path');

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const messageRoutes = require("./routes/messageRoutes");
const friendsRoutes = require('./routes/friendsRoutes');
const storyRoutes = require('./routes/storyRoutes');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

// Serve static frontend and images
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/images', express.static(path.join(__dirname, '../frontend/images')));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);
app.use('/api/friends', friendsRoutes);
app.use('/api/story', storyRoutes);

// MongoDB connection
const mongoURI = "mongodb+srv://yateeshGangwar:yateesh%401221@cluster1.qjzwxfe.mongodb.net/genzone?retryWrites=true&w=majority";
mongoose.connect(mongoURI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB connection failed:", err));

// Socket.IO logic
const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);
  socket.on("join", (userId) => {
    onlineUsers.set(userId, socket.id);
    console.log(`User ${userId} is online`);
  });
  socket.on("sendMessage", async ({ receiverId, message }) => {
    const receiverSocket = onlineUsers.get(receiverId);
    if (receiverSocket) {
      io.to(receiverSocket).emit("receiveMessage", message);
    }
  });
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
    for (const [key, value] of onlineUsers.entries()) {
      if (value === socket.id) onlineUsers.delete(key);
    }
  });
});

// Start server
const PORT = 5500;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
