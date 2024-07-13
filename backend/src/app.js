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
const jwt = require('jsonwebtoken');

const Room = require('./models/Room'); // فرض بر این است که مدل Room در این مسیر قرار دارد

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

        // Authenticate and store user information on connection
        const token = socket.handshake.query.token;
        if (!token) {
            socket.disconnect();
            return;
        }

        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) {
                socket.disconnect();
                return;
            }

            socket.user = user; // Store user information in socket object
        });

        socket.on('createGroup', async (groupName, description, languageId, topic, typeId) => {
            // ساختن گروه در MongoDB
            const newRoom = new Room({
                roomId: new mongoose.Types.ObjectId().toString(), // تولید یک ID یکتا برای گروه
                name: groupName,
                creator: socket.user.userId,
                description: description,
                languageId: languageId,
                topic: topic,
                type: typeId,
                members: [socket.user.userId], // افزودن سازنده به عنوان اولین عضو
                admins: [socket.user.userId] // افزودن سازنده به عنوان اولین ادمین
            });

            await newRoom.save();

            // ذخیره اطلاعات گروه در Redis
            const groupKey = `group:${newRoom.roomId}`;
            redisClient.hmset(groupKey, {
                'name': newRoom.name,
                'creator': newRoom.creator.toString(),
                'description': newRoom.description,
                'languageId': newRoom.languageId.toString(),
                'topic': newRoom.topic,
                'type': newRoom.type.toString()
            });

            // افزودن ID سازنده به لیست اعضا در Redis
            redisClient.sadd(`${groupKey}:members`, socket.user.userId.toString());
            redisClient.sadd(`${groupKey}:admins`, socket.user.userId.toString());

            // پیوستن سازنده به گروه
            socket.join(groupName);

            // ارسال رویداد برای اطلاع رسانی به کلاینت‌ها که گروه ایجاد شده است
            io.to(groupName).emit('groupCreated', groupName);

            logger.info('Group created', {groupName, userId: socket.user.userId});
        });


        socket.on('joinGroup', async (roomID) => {
            const groupKey = `group:${roomID}`;

            // Check if group exists
            redisClient.exists(groupKey, (err, reply) => {
                if (reply === 1) {
                    // Check group size
                    redisClient.scard(`${groupKey}:members`, (err, count) => {
                        if (count < 100) { // Assuming max group size is 100
                            // Add user to group members in Redis
                            redisClient.sadd(`${groupKey}:members`, socket.user.userId);

                            // Update user's initial status in Redis
                            redisClient.hmset(`user:${socket.user.userId}`, {
                                'muted': true,
                                'canTalk': false // Initial state: muted and cannot talk
                            });

                            // Join the user to the group in Socket.io
                            socket.join(roomID);

                            // Emit an event to inform clients that a user joined
                            io.to(roomID).emit('userJoined', socket.user.userId);
                        } else {
                            socket.emit('groupFull', 'The group is already full');
                        }
                    });
                } else {
                    socket.emit('groupNotFound', 'The group does not exist');
                }
            });
        });


        // Function to get users on stage (in a specific group)
        const getUsersOnStage = (groupName, callback) => {
            const stageKey = `group:${groupName}:stage`;
            redisClient.smembers(stageKey, (err, members) => {
                if (err) {
                    console.error('Error retrieving members on stage from Redis:', err);
                    return callback(err, null);
                }
                callback(null, members);
            });
        };


        const getUsersInGroup = (groupName, callback) => {
            const groupKey = `group:${groupName}:members`;
            redisClient.smembers(groupKey, (err, members) => {
                if (err) {
                    console.error('Error retrieving members from Redis:', err);
                    return callback(err, null);
                }
                callback(null, members);
            });
        };

        socket.on('requestUsersOnStage', (groupName) => {
            getUsersOnStage(groupName, (err, members) => {
                if (err) {
                    console.error('Error retrieving users on stage:', err);
                    socket.emit('error', 'Error retrieving users on stage');
                } else {
                    socket.emit('usersOnStage', members);
                }
            });
        });

        socket.on('requestUsersInGroup', (groupName) => {
            getUsersInGroup(groupName, (err, members) => {
                if (err) {
                    console.error('Error retrieving users in group:', err);
                    socket.emit('error', 'Error retrieving users in group');
                } else {
                    socket.emit('usersInGroup', members);
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


        socket.on('adminApproveTalkRequest', async (roomId, userId) => {
            try {
                // Read room information from Redis
                const roomKey = `group:${roomId}`;
                redisClient.hmget(roomKey, 'name', 'creator', 'description', 'languageId', 'topic', 'type', async (err, result) => {
                    if (err) {
                        console.error('Error reading room information from Redis:', err);
                        return socket.emit('error', 'Error reading room information from Redis');
                    }

                    const [name, creator, description, languageId, topic, type] = result;

                    // Check if the user is admin of the room
                    let roomCreator = await redisClient.get(`roomCreator:${socket.user.userId}`);

                    if (!roomCreator) {
                        const roomInMongo = await Room.findOne({_id: roomId, members: socket.user.userId});
                        if (!roomInMongo || String(roomInMongo.creator) !== socket.user.userId) {
                            return socket.emit('notAuthorized', 'You are not authorized to approve talk request');
                        }
                        roomCreator = roomInMongo.creator.toString();
                        await redisClient.set(`roomCreator:${socket.user.userId}`, roomCreator);
                    } else if (roomCreator !== socket.user.userId.toString()) {
                        return socket.emit('notAuthorized', 'You are not authorized to approve talk request');
                    }

                    // Logic to approve the talk request and allow user to talk
                    redisClient.hmset(`user:${userId}`, {
                        'canTalk': true  // Set canTalk to true for the user
                    });

                    // Add user to the stage
                    const groupName = `group:${name}`;
                    redisClient.sadd(`${groupName}:stage`, userId);

                    // Emit an event to inform clients that admin approved the talk request
                    io.to(groupName).emit('userApprovedToTalk', userId);
                });
            } catch (err) {
                console.error('Error approving talk request:', err);
                socket.emit('error', 'Error approving talk request');
            }
        });

        const adminRemoveFromStage = async (roomId, userId) => {
            try {
                // Read room information from Redis
                const roomKey = `group:${roomId}`;
                redisClient.hmget(roomKey, 'name', 'creator', 'description', 'languageId', 'topic', 'type', async (err, result) => {
                    if (err) {
                        console.error('Error reading room information from Redis:', err);
                        return; // Handle error
                    }

                    const [name, creator, description, languageId, topic, type] = result;

                    // Check if the user is admin of the room
                    let roomCreator = await redisClient.get(`roomCreator:${socket.user.userId}`);

                    if (!roomCreator) {
                        const roomInMongo = await Room.findOne({_id: roomId, members: socket.user.userId});
                        if (!roomInMongo || String(roomInMongo.creator) !== socket.user.userId) {
                            console.error('User is not authorized to remove user from stage');
                            return; // Handle unauthorized error
                        }
                        roomCreator = roomInMongo.creator.toString();
                        await redisClient.set(`roomCreator:${socket.user.userId}`, roomCreator);
                    } else if (roomCreator !== socket.user.userId.toString()) {
                        console.error('User is not authorized to remove user from stage');
                        return; // Handle unauthorized error
                    }

                    // Remove user from the stage and add to normal members
                    const groupName = `group:${name}`;
                    redisClient.srem(`${groupName}:stage`, userId);
                    redisClient.sadd(`${groupName}:members`, userId);

                    // Emit an event to inform clients that user is removed from stage
                    io.to(groupName).emit('userRemovedFromStage', userId);
                });
            } catch (err) {
                console.error('Error removing user from stage:', err);
                // Handle error
            }
        };


        socket.on('muteUser', async (userId, byAdmin) => {
            // Check if the user is admin
            const roomCreator = await redisClient.get(`roomCreator:${socket.user.userId}`);

            if (!roomCreator) {
                const room = await Room.findOne({members: socket.user.userId});
                if (!room || String(room.creator) !== socket.user.userId) {
                    return socket.emit('notAuthorized', 'You are not authorized to mute this user');
                }
                await redisClient.set(`roomCreator:${socket.user.userId}`, room.creator);
            } else if (roomCreator !== socket.user.userId) {
                return socket.emit('notAuthorized', 'You are not authorized to mute this user');
            }

            // Update user's muted status and whether it was by admin in Redis
            redisClient.hmset(`user:${userId}`, {
                'muted': true,
                'mutedByAdmin': byAdmin ? 'true' : 'false'
            });

            // Emit an event to inform clients that user was muted
            io.emit('userMuted', userId);
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
