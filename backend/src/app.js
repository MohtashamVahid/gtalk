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
const winston = require('winston');
const helmet = require('helmet');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const {configureSocketIo} = require('./socket'); // وارد کردن تابع تنظیم سوکت


dotenv.config();

// Create Express app
const app = express();
const httpsServer = https.createServer({
    key: fs.readFileSync(path.join(__dirname, 'ssl', 'private.key')),
    cert: fs.readFileSync(path.join(__dirname, 'ssl', 'certificate.crt')),
}, app);

const io = require('socket.io')(httpsServer, {
    cors: {
        origin: '*',
    },
    secure: true
});



// MongoDB Connection
await mongoose.connect(process.env.MONGO_URI, {
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


configureSocketIo(io,redisClient,pubClient,subClient);




app.use(helmet());

 app.use(session({
    store: new RedisStore({client: redisClient}),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {secure: process.env.NODE_ENV === 'production'}
}));

module.exports = {app};
