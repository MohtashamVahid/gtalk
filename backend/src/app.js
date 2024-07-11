const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Redis = require('ioredis');
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const { createAdapter } = require('@socket.io/redis-adapter');
const winston = require('winston');
const helmet = require('helmet'); // برای افزودن امنیت HTTP headers
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { v4: uuidv4 } = require('uuid');

const subscriptionRoutes = require('./routes/subscriptionRoutes');

dotenv.config();

const app = express();
const httpsServer = https.createServer({
    key: fs.readFileSync(path.join(__dirname, 'ssl', 'private.key')), // مسیر فایل کلید خصوصی
    cert: fs.readFileSync(path.join(__dirname, 'ssl', 'certificate.crt')), // مسیر فایل گواهی
}, app);

const io = require('socket.io')(httpsServer, {
    cors: {
        origin: '*',
    },
    secure: true
});


// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});



mongoose.connection.on('connected', () => {
  console.log('Connected to MongoDB');
});


const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'My API',
            version: '1.0.0',
            description: 'My API Information',
            contact: {
                name: 'Developer',
                email: 'developer@example.com',
            },
            servers: [
                {
                    url: 'https://localhost:3000',
                },
            ],
        },
    },
    apis: ['./routes/*.js'], // مسیر فایل‌های route که داکیومنتیشن آن‌ها را می‌خواهید اضافه کنید
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);



// Middleware
app.use(express.json());


// Routes
app.use('/api/users', subscriptionRoutes);
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/users', require('./routes/commentRoutes'));
app.use('/api', require('./routes/roomRoutes'));
app.use('/api', require('./routes/appSettingsRoutes'));
app.use('/api', require('./routes/languageRoutes'));
app.use('/api/sessions', require('./routes/sessionRoutes'));

 app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));


const redisClient = new Redis.Cluster([
    {
        host: process.env.REDIS_HOST_1,
        port: process.env.REDIS_PORT || 6379
    },
    {
        host: process.env.REDIS_HOST_2,
        port: process.env.REDIS_PORT || 6379
    }
]);

const pubClient = new Redis.Cluster([
    {
        host: process.env.REDIS_HOST_1,
        port: process.env.REDIS_PORT || 6379
    },
    {
        host: process.env.REDIS_HOST_2,
        port: process.env.REDIS_PORT || 6379
    }
]);

const subClient = pubClient.duplicate();

const configureSocketIo = (io) => {
    io.adapter(createAdapter(pubClient, subClient));

    // تنظیم winston برای لاگ‌ها
    const logger = winston.createLogger({
        level: 'info',
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
        ),
        transports: [
            new winston.transports.File({ filename: 'combined.log' }),
            new winston.transports.File({ filename: 'errors.log', level: 'error' })
        ]
    });

    // مدیریت اتصالات Socket.io
    io.on('connection', (socket) => {
        logger.info('A user connected', { socketId: socket.id });

        socket.on('createGroup', (groupName) => {
            const groupKey = `group:${groupName}`;
            redisClient.sadd(groupKey, socket.id);
            socket.join(groupName);
            io.to(groupName).emit('groupCreated', groupName);
            logger.info('Group created', { groupName, socketId: socket.id });
        });

        socket.on('joinGroup', (groupName) => {
            const groupKey = `group:${groupName}`;
            redisClient.scard(groupKey, (err, count) => {
                if (count < 10) {
                    redisClient.sadd(groupKey, socket.id);
                    redisClient.hmset(`user:${socket.id}`, {
                        'muted': true,
                        'canTalk': true // برای اینکه اولش میوت شود
                    });
                    socket.join(groupName);
                    io.to(groupName).emit('userJoined', socket.id);
                    logger.info('User joined group', { groupName, socketId: socket.id });
                } else {
                    socket.emit('groupFull', 'The group is already full');
                    logger.info('Group full', { groupName, socketId: socket.id });
                }
            });
        });

        socket.on('leaveGroup', (groupName) => {
            const groupKey = `group:${groupName}`;
            redisClient.srem(groupKey, socket.id);
            socket.leave(groupName);
            io.to(groupName).emit('userLeft', socket.id);
            logger.info('User left group', { groupName, socketId: socket.id });

            redisClient.scard(groupKey, (err, count) => {
                if (count === 0) {
                    redisClient.del(groupKey);
                    logger.info('Group deleted', { groupName });
                }
            });
        });

        socket.on('muteUser', (groupName, userId) => {
            const muteKey = `mute:${groupName}:${userId}`;
            redisClient.set(muteKey, true);
            logger.info('User muted', { groupName, userId });
        });

        socket.on('unmuteUser', (groupName, userId) => {
            const muteKey = `mute:${groupName}:${userId}`;
            redisClient.del(muteKey);
            logger.info('User unmuted', { groupName, userId });
        });

        socket.on('sendMessage', (groupName, message) => {
            const commentChannel = `comments:${groupName}`;
            redisClient.publish(commentChannel, JSON.stringify({ user: socket.id, message: message }));
            logger.info('Message sent', { groupName, message, socketId: socket.id });
        });

        socket.on('adminMuteUser', (userId) => {
            redisClient.hset(`user:${userId}`, 'muted', true);
            logger.info('Admin muted user', { userId });
        });

        socket.on('adminUnmuteUser', (userId) => {
            redisClient.hdel(`user:${userId}`, 'muted');
            logger.info('Admin unmuted user', { userId });
        });

        socket.on('webrtcOffer', (data) => {
            const { groupName, offer, userId } = data;
            socket.to(groupName).emit('webrtcOffer', { offer, userId });
            logger.info('WebRTC offer sent', { groupName, offer, userId });
        });

        socket.on('webrtcAnswer', (data) => {
            const { groupName, answer, userId } = data;
            socket.to(groupName).emit('webrtcAnswer', { answer, userId });
            logger.info('WebRTC answer sent', { groupName, answer, userId });
        });

        socket.on('webrtcCandidate', (data) => {
            const { groupName, candidate, userId } = data;
            socket.to(groupName).emit('webrtcCandidate', { candidate, userId });
            logger.info('WebRTC candidate sent', { groupName, candidate, userId });
        });

        socket.on('disconnect', () => {
            logger.info('User disconnected', { socketId: socket.id });
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
            logger.info('Comment received', { groupName, comment });
        });
    });

    // امنیت Redis را افزایش دهید
    redisClient.on('error', (err) => {
        logger.error('Redis error', { error: err });
    });

    pubClient.on('error', (err) => {
        logger.error('Redis PubSub error', { error: err });
    });

    subClient.on('error', (err) => {
        logger.error('Redis Sub error', { error: err });
    });
};

// افزودن امنیت HTTP headers
app.use(helmet());

// استفاده از سشن‌های ذخیره شده در Redis
app.use(session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production' } // در تولید به true تغییر دهید
}));

module.exports = { app, configureSocketIo };
