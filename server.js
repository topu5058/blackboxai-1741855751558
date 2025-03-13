const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// Serve static files from public directory
app.use(express.static('public'));
const io = socketIO(server, {
  cors: {
    origin: "*", // In production, replace with specific origin
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Basic route for health check
app.get('/', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Handle joining a chat room
  socket.on('join', (username) => {
    socket.username = username;
    io.emit('userJoined', `${username} joined the chat`);
  });

  // Handle new messages
  socket.on('sendMessage', (message) => {
    io.emit('message', {
      user: socket.username,
      text: message,
      timestamp: new Date().toISOString()
    });
  });

  // Handle typing status
  socket.on('typing', (isTyping) => {
    socket.broadcast.emit('userTyping', {
      user: socket.username,
      isTyping
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    if (socket.username) {
      io.emit('userLeft', `${socket.username} left the chat`);
    }
    console.log('Client disconnected:', socket.id);
  });

  // Handle errors
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
