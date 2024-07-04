const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const dotenv = require('dotenv');
const { setupWebRTC } = require('./services/webrtc');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on('connected', () => {
  console.log('Connected to MongoDB');
});

// Middleware
app.use(express.json());

// Routes
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api', require('./routes/roomRoutes'));
app.use('/api/sessions', require('./routes/sessionRoutes'));

// Socket.io and WebRTC
io.on('connection', (socket) => {
  setupWebRTC(socket, io);
});

module.exports = { app, server };
