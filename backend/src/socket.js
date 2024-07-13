// socket.js
const {createAdapter} = require('@socket.io/redis-adapter');
const winston = require('winston');
const jwt = require('jsonwebtoken');
const Room = require('./models/Room'); // Adjust the path if necessary
const mongoose = require('mongoose');

const registerSocketEvents = (socket, logger, redisClient, io) => {
    socket.on('createGroup', async (groupName, description, languageId, topic, typeId) => {
        await createGroup(socket, groupName, description, languageId, topic, typeId, logger, redisClient, io);
    });

    socket.on('joinGroup', async (roomID) => {
        await joinGroup(socket, roomID, redisClient, io);
    });

    socket.on('sendMessage', async (groupName, message) => {
        await sendMessage(socket, groupName, message, logger, redisClient, io);
    });

    socket.on('leaveGroup', async (groupName) => {
        await leaveGroup(socket, groupName, redisClient, io);
    });

    socket.on('disconnect', async () => {
        await handleDisconnect(socket, redisClient, logger, io);
    });

    socket.on('requestUsersInGroup', async (groupName) => {
        try {
            const members = await getUsersInGroup(groupName, redisClient);
            socket.emit('usersInGroup', members);
        } catch (error) {
            console.error('Error retrieving users in group:', error);
            socket.emit('error', 'Error retrieving users in group');
        }
    });

    socket.on('requestUsersOnStage', async (groupName) => {
        try {
            const members = await getUsersOnStage(groupName, redisClient);
            socket.emit('usersOnStage', members);
        } catch (error) {
            console.error('Error retrieving users on stage:', error);
            socket.emit('error', 'Error retrieving users on stage');
        }
    });


    socket.on('requestToTalk', (roomID) => {
        redisClient.hmset(`user:${socket.id}`, {
            'canTalk': false  // Initially set to false
        });

        io.to(roomID).emit('userRequestedToTalk', socket.id);
    });

    socket.on('adminApproveTalkRequest', async (roomId, userId) => {
        // Await the promise returned from adminApproveTalkRequest
        await adminApproveTalkRequest(socket, roomId, userId, redisClient, io);
    });

    socket.on('adminRemoveFromStage', async (roomId, userId) => {
        await adminRemoveFromStage(socket, roomId, userId, redisClient, io);
    });

    socket.on('muteUser', async (userId, byAdmin) => {
        await muteUser(socket, userId, byAdmin, redisClient, io);
    });

    subscribeToComments(redisClient, io, logger);

};

const createGroup = async (socket, groupName, description, languageId, topic, typeId, logger, redisClient, io) => {
    try {
        const newRoom = new Room({
            roomId: new mongoose.Types.ObjectId().toString(),
            name: groupName,
            creator: socket.user.userId,
            description,
            languageId,
            topic,
            type: typeId,
            members: [socket.user.userId],
            admins: [socket.user.userId]
        });

        await newRoom.save();

        const groupKey = `group:${newRoom.roomId}`;
        await redisClient.hmset(groupKey, {
            'name': newRoom.name,
            'creator': newRoom.creator.toString(),
            'description': newRoom.description,
            'languageId': newRoom.languageId.toString(),
            'topic': newRoom.topic,
            'type': newRoom.type.toString()
        });

        await redisClient.sadd(`${groupKey}:members`, socket.user.userId.toString());
        await redisClient.sadd(`${groupKey}:admins`, socket.user.userId.toString());

        socket.join(groupName);
        io.to(groupName).emit('groupCreated', groupName);
        logger.info('Group created', {groupName, userId: socket.user.userId});
    } catch (error) {
        logger.error('Error creating group', {error});
        socket.emit('error', 'Error creating group');
    }
};

const joinGroup = async (socket, roomID, redisClient, io) => {
    const groupKey = `group:${roomID}`;
    try {
        const exists = await redisClient.exists(groupKey);
        if (exists) {
            const count = await redisClient.scard(`${groupKey}:members`);
            if (count < 100) {
                await redisClient.sadd(`${groupKey}:members`, socket.user.userId);
                await redisClient.hmset(`user:${socket.user.userId}`, {
                    'muted': true,
                    'canTalk': false
                });
                socket.join(roomID);
                io.to(roomID).emit('userJoined', socket.user.userId);
            } else {
                socket.emit('groupFull', 'The group is already full');
            }
        } else {
            socket.emit('groupNotFound', 'The group does not exist');
        }
    } catch (error) {
        console.error('Error joining group', error);
        socket.emit('error', 'Error joining group');
    }
};

const getUsersInGroup = async (groupName, redisClient) => {
    const groupKey = `group:${groupName}:members`;
    try {
        return await redisClient.smembers(groupKey); // Return the list of member IDs
    } catch (error) {
        console.error('Error retrieving members from Redis:', error);
        throw new Error('Could not retrieve members'); // Handle the error appropriately
    }
};

const getUsersOnStage = async (groupName, redisClient) => {
    const stageKey = `group:${groupName}:stage`;
    try {
        const members = await redisClient.smembers(stageKey);
        return members; // Return the list of user IDs on stage
    } catch (error) {
        console.error('Error retrieving members on stage from Redis:', error);
        throw new Error('Could not retrieve users on stage'); // Handle the error appropriately
    }
};

const adminApproveTalkRequest = async (socket, roomId, userId, redisClient, io) => {
    try {
        // Read room information from Redis
        const roomKey = `group:${roomId}`;
        const result = await redisClient.hmget(roomKey, 'name', 'creator');

        if (!result) {
            throw new Error('Room not found');
        }

        const [name, creator] = result;

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
        // Approve the talk request
        await redisClient.hmset(`user:${userId}`, {
            'canTalk': true, // Set canTalk to true for the user
        });

        // Add user to the stage
        const groupName = `group:${name}`;
        await redisClient.sadd(`${groupName}:stage`, userId);

        // Emit an event to inform clients that admin approved the talk request
        io.to(groupName).emit('userApprovedToTalk', userId);
    } catch (error) {
        console.error('Error approving talk request:', error);
        socket.emit('error', 'Error approving talk request');
    }
};

const adminRemoveFromStage = async (socket, roomId, userId, redisClient, io) => {
    try {
        // Read room information from Redis
        const roomKey = `group:${roomId}`;
        const result = await redisClient.hmget(roomKey, 'name', 'creator');

        if (!result) {
            throw new Error('Room not found');
        }

        const [name, creator] = result;

        // Check if the requesting user is the admin
        const roomCreator = await redisClient.get(`roomCreator:${socket.user.userId}`);
        if (!roomCreator || roomCreator !== socket.user.userId.toString()) {
            const roomInMongo = await Room.findOne({_id: roomId, members: socket.user.userId});
            if (!roomInMongo || String(roomInMongo.creator) !== socket.user.userId) {
                return socket.emit('notAuthorized', 'You are not authorized to remove user from stage');
            }
        }

        // Remove user from the stage
        const groupName = `group:${name}`;
        await redisClient.srem(`${groupName}:stage`, userId);
        await redisClient.sadd(`${groupName}:members`, userId); // Optionally add them back to members

        // Emit an event to inform clients that the user is removed from the stage
        io.to(groupName).emit('userRemovedFromStage', userId);
    } catch (error) {
        console.error('Error removing user from stage:', error);
        socket.emit('error', 'Error removing user from stage');
    }
};


const muteUser = async (socket, userId, byAdmin, redisClient, io) => {
    try {
        // Check if the requesting user is an admin
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

        // Update user's muted status in Redis
        await redisClient.hmset(`user:${userId}`, {
            'muted': true,
            'mutedByAdmin': byAdmin ? 'true' : 'false',
        });

        // Emit an event to inform clients that the user was muted
        io.emit('userMuted', userId);
    } catch (error) {
        console.error('Error muting user:', error);
        socket.emit('error', 'Error muting user');
    }
};


const sendMessage = async (socket, groupName, message, logger, redisClient) => {
    try {
        const canTalk = await redisClient.hget(`user:${socket.user.userId}`, 'canTalk');
        if (canTalk === 'true') {
            const commentChannel = `comments:${groupName}`;
            await redisClient.publish(commentChannel, JSON.stringify({user: socket.user.userId, message}));
            logger.info('Message sent', {groupName, message, socketId: socket.id});
        } else {
            socket.emit('error', 'You cannot send messages right now');
        }
    } catch (error) {
        logger.error('Error sending message', {error});
        socket.emit('error', 'Error sending message');
    }
};

const subscribeToComments = (redisClient, io, logger) => {
    const commentChannel = `comments:*`;

    redisClient.subscribe(commentChannel);

    redisClient.on('message', async (channel, message) => {
        const groupName = channel.split(':')[1];
        const comment = JSON.parse(message);

        // Emit the comment to the clients
        io.to(groupName).emit('messageReceived', comment);

        // Log the comment received
        logger.info('Comment received', {groupName, comment});

        // Store the comment in MongoDB
        try {
            const newComment = new Comment({
                groupId: groupName,
                userId: comment.user, // assuming the comment object contains a user field
                message: comment.message,
                timestamp: new Date()
            });

            // Save to MongoDB
            await newComment.save();
            logger.info('Comment saved to MongoDB', {groupName, comment});
        } catch (error) {
            logger.error('Error saving comment to MongoDB', {error, groupName, comment});
        }
    });
};

const leaveGroup = async (socket, groupName, redisClient, io) => {
    try {
        await redisClient.srem(`group:${groupName}:members`, socket.user.userId);
        socket.leave(groupName);
        io.to(groupName).emit('userLeft', socket.user.userId);
    } catch (error) {
        console.error('Error leaving group', error);
        socket.emit('error', 'Error leaving group');
    }
};

const handleDisconnect = async (socket, redisClient, logger) => {
    logger.info('User disconnected', {socketId: socket.id});
    try {
        const keys = await redisClient.keys('group:*');
        await Promise.all(keys.map(key => redisClient.srem(key, socket.user.userId)));
    } catch (error) {
        logger.error('Error handling disconnect', {error});
    }
};

const configureSocketIo = (io, redisClient, pubClient, subClient) =>  {
    io.adapter(createAdapter(pubClient, subClient));
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

    io.on('connection', (socket) => {
        logger.info('A user connected', {socketId: socket.id});

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

        registerSocketEvents(socket, logger, redisClient, io);
    });

    // Redis error handling
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

module.exports = configureSocketIo;
