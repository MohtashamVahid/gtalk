const http = require('http');
const cluster = require('cluster');
const os = require('os');
const numCPUs = os.cpus().length;
const { app, configureSocketIo } = require('./App');
const RedisClusterManager = require('redis-cluster-manager');

const initialNodes = [
    { host: 'redis-cluster-node-1', port: 7000 },
    { host: 'redis-cluster-node-2', port: 7001 },
    { host: 'redis-cluster-node-3', port: 7002 },
];

const redisOptions = {
    scaleReads: 'slave',
    redisOptions: {
        // تنظیمات Redis دیگر
    }
};

async function startRedisCluster() {
    const manager = new RedisClusterManager(initialNodes, redisOptions);

    try {
        await manager.start();
        console.log('Redis cluster started successfully.');
    } catch (error) {
        console.error('Error starting Redis cluster:', error);
    }
}

if (cluster.isMaster) {
    console.log(`Master ${process.pid} is running`);

    // ایجاد و راه‌اندازی ورکرها
    const numWorkers = process.env.WEB_CONCURRENCY || numCPUs;
    for (let i = 0; i < numWorkers; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died`);
        if (code !== 0 && !worker.exitedAfterDisconnect) {
            cluster.fork();
        }
    });

    // شروع کلاستر Redis
    startRedisCluster();
} else {
    // سرور HTTP ایجاد می‌شود
    const server = http.createServer(app);

    // استفاده از Socket.io برای WebRTC
    const io = require('socket.io')(server);
    configureSocketIo(io);

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
        console.log(`Worker ${process.pid} started and server running on port ${PORT}`);
    });
}
