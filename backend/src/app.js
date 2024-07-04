const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const dotenv = require('dotenv');
const Redis = require('ioredis');
const session = require('express-session');
const RedisStore = require('connect-redis')(session);

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const redisClient = new Redis.Cluster([
  {
    host: 'redis-host-1',
    port: 6379
  },
  {
    host: 'redis-host-2',
    port: 6379
  }
]);

// استفاده از سشن‌های ذخیره شده در Redis
app.use(session({
    store: new RedisStore({ client: redisClient }),
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

// مدیریت اتصالات Socket.io
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('createGroup', (groupName) => {
        const groupKey = `group:${groupName}`;
        redisClient.sadd(groupKey, socket.id);
        socket.join(groupName);
        io.to(groupName).emit('groupCreated', groupName);
    });

    socket.on('joinGroup', (groupName) => {
        const groupKey = `group:${groupName}`;
        redisClient.sadd(groupKey, socket.id);
        socket.join(groupName);
        io.to(groupName).emit('userJoined', socket.id);
    });

    socket.on('leaveGroup', (groupName) => {
        const groupKey = `group:${groupName}`;
        redisClient.srem(groupKey, socket.id);
        socket.leave(groupName);
        io.to(groupName).emit('userLeft', socket.id);
    });

    socket.on('muteUser', (groupName, userId) => {
        const muteKey = `mute:${groupName}:${userId}`;
        redisClient.set(muteKey, true);
    });

    socket.on('unmuteUser', (groupName, userId) => {
        const muteKey = `mute:${groupName}:${userId}`;
        redisClient.del(muteKey);
    });

    socket.on('sendMessage', (groupName, message) => {
        const muteKey = `mute:${groupName}:${socket.id}`;
        redisClient.exists(muteKey, (err, isMuted) => {
            if (!isMuted) {
                const commentChannel = `comments:${groupName}`;
                redisClient.publish(commentChannel, JSON.stringify({ user: socket.id, message: message }));
            }
        });
    });

    socket.on('disconnect', () => {
        console.log(`User ${socket.id} disconnected`);
        // حذف کاربر از تمام گروه‌ها در Redis
        redisClient.keys('group:*', (err, keys) => {
            keys.forEach((key) => {
                redisClient.srem(key, socket.id);
            });
        });
    });

    const commentChannel = `comments:*`;
    redisClient.subscribe(commentChannel);
    redisClient.on('message', (channel, message) => {
        const groupName = channel.split(':')[1];
        const comment = JSON.parse(message);
        io.to(groupName).emit('messageReceived', comment);
    });
});
