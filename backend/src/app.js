//app.js
const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Redis = require('ioredis');
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const {createAdapter} = require('@socket.io/redis-adapter');
const winston = require('winston');
const helmet = require('helmet');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const {v4: uuidv4} = require('uuid');

dotenv.config();

// Create Express app
const app = express();
const httpsServer = https.createServer({
    key: fs.readFileSync(path.join(__dirname, 'ssl', 'private.key')),
    cert: fs.readFileSync(path.join(__dirname, 'ssl', 'certificate.crt')),
}, app);

// Initialize Socket.io with HTTPS server
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

// Swagger Options for API documentation
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
    apis: ['./routes/*.js'],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);

// Middleware
app.use(express.json());

// Routes
app.use('/api/users', require('./routes/subscriptionRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/users', require('./routes/commentRoutes'));
app.use('/api', require('./routes/roomRoutes'));
app.use('/api', require('./routes/appSettingsRoutes'));
app.use('/api', require('./routes/languageRoutes'));
app.use('/api', require('./routes/ruleRoutes'));
app.use('/api/sessions', require('./routes/sessionRoutes'));

// Swagger UI setup
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Redis setup for session storage and pub/sub
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

// Function to configure Socket.io behavior
const configureSocketIo = (io) => {
    io.adapter(createAdapter(pubClient, subClient));

    // Logger setup with Winston
    const logger = winston.createLogger({
        level: 'info',
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
        ),
        transports: [
            new winston.transports.File({filename: 'combined.log'}),
            new winston.transports.File({filename: 'errors.log', level: 'error'})
        ]
    });

    // Socket.io connection management
    io.on('connection', (socket) => {
        logger.info('A user connected', {socketId: socket.id});

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
                if (count < 100) { // Assuming max group size is 100
                    redisClient.sadd(groupKey, socket.id);
                    redisClient.hmset(`user:${socket.id}`, {
                        'muted': true,
                        'canTalk': false, // Initial state: muted but cannot talk
                        'mutedByAdmin': false // Initial state: not muted by admin
                    });
                    socket.join(groupName);
                    io.to(groupName).emit('userJoined', socket.id);
                } else {
                    socket.emit('groupFull', 'The group is already full');
                }
            });
        });

        // Function to get users on stage (in a specific group)
        const getUsersOnStage = (groupName, callback) => {
            const groupKey = `group:${groupName}`;
            redisClient.smembers(groupKey, (err, members) => {
                if (err) {
                    console.error('Error retrieving members from Redis:', err);
                    return callback(err, null);
                }

                const multi = redisClient.multi();
                members.forEach(member => {
                    multi.hgetall(`user:${member}`);
                });

                multi.exec((err, results) => {
                    if (err) {
                        console.error('Error retrieving user data from Redis:', err);
                        return callback(err, null);
                    }

                    const usersOnStage = results.map((user, index) => ({
                        userId: members[index],
                        muted: user.muted === 'true',
                        canTalk: user.canTalk === 'true'
                    }));

                    callback(null, usersOnStage);
                });
            });
        };

        socket.on('requestUsersOnStage', (groupName) => {
            getUsersOnStage(groupName, (err, users) => {
                if (err) {
                    console.error('Error retrieving users on stage:', err);
                    // Optional: emit an error event to client
                } else {
                    io.to(socket.id).emit('usersOnStage', users);
                }
            });
        });

        socket.on('requestToTalk', (groupName) => {
            // Update user's ability to talk (canTalk) in Redis
            redisClient.hmset(`user:${socket.id}`, {
                'canTalk': false  // Initially set to false
            });

            // Emit an event to inform clients that user requested to talk
            io.to(groupName).emit('userRequestedToTalk', socket.id);
        });

        socket.on('adminApproveTalkRequest', (userId) => {
            // Logic to approve the talk request and allow user to talk
            redisClient.hmset(`user:${userId}`, {
                'canTalk': true  // Set canTalk to true for the user
            });

            // Emit an event to inform clients that admin approved the talk request
            io.emit('userApprovedToTalk', userId);
        });

        socket.on('muteUser', (userId, byAdmin) => {
            // Update user's muted status and whether it was by admin in Redis
            redisClient.hmset(`user:${userId}`, {
                'muted': true,
                'mutedByAdmin': byAdmin ? 'true' : 'false'
            });

            // Emit an event to inform clients that user was muted
            io.emit('userMuted', userId);
        });

        socket.on('unmuteUser', (userId) => {
            // Check if the user was muted by admin
            redisClient.hget(`user:${userId}`, 'mutedByAdmin', (err, mutedByAdmin) => {
                if (mutedByAdmin === 'true') {
                    // If muted by admin, only admin can unmute
                    if (socket.admin) { // Assuming you have a way to check if the socket belongs to an admin
                        redisClient.hmset(`user:${userId}`, {
                            'muted': false,
                            'mutedByAdmin': 'false'
                        });
                        io.emit('userUnmuted', userId);
                    } else {
                        socket.emit('error', 'You do not have permission to unmute this user');
                    }
                } else {
                    // If not muted by admin, the user can unmute themselves
                    redisClient.hmset(`user:${userId}`, {
                        'muted': false,
                        'mutedByAdmin': 'false'
                    });
                    io.emit('userUnmuted', userId);
                }
            });
        });


        // Handle 'sendMessage' event with canTalk check
        socket.on('sendMessage', (groupName, message) => {
            redisClient.hget(`user:${socket.id}`, 'canTalk', (err, canTalk) => {
                if (canTalk === 'true') {
                    const commentChannel = `comments:${groupName}`;
                    redisClient.publish(commentChannel, JSON.stringify({user: socket.id, message: message}));
                    logger.info('Message sent', {groupName, message, socketId: socket.id});
                } else {
                    // Handle inability to talk (optional: emit an error)
                }
            });
        });

        socket.on('leaveGroup', (groupName) => {
            const groupKey = `group:${groupName}`;
            redisClient.srem(groupKey, socket.id);
            socket.leave(groupName);
            io.to(groupName).emit('userLeft', socket.id);
        });

        socket.on('disconnect', () => {
            logger.info('User disconnected', {socketId: socket.id});
            redisClient.keys('group:*', (err, keys) => {
                keys.forEach((key) => {
                    redisClient.srem(key, socket.id);
                });
            });
        });

        // Subscribe to comment channel for group
        const commentChannel = `comments:*`;
        redisClient.subscribe(commentChannel);
        redisClient.on('message', (channel, message) => {
            const groupName = channel.split(':')[1];
            const comment = JSON.parse(message);
            io.to(groupName).emit('messageReceived', comment);
            logger.info('Comment received', {groupName, comment});
        });
    });

    // Increase Redis security handling
    redisClient.on('error', (err) => {
        logger.error('Redis error', {error: err});
    });

    pubClient.on('error', (err) => {
        logger.error('Redis PubSub error', {error: err});
    });

    subClient.on('error', (err) => {
        logger.error('Redis Sub error', {error: err});
    });
};

// Enhance HTTP headers security
app.use(helmet());

// Use stored sessions in Redis
app.use(session({
    store: new RedisStore({client: redisClient}),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {secure: process.env.NODE_ENV === 'production'}
}));

module.exports = {app, configureSocketIo};
