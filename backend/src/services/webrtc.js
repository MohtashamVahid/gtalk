const { RTCPeerConnection, RTCSessionDescription } = require('wrtc');

function setupWebRTC(socket, io) {
  socket.on('join-room', (roomId) => {
    socket.join(roomId);

    socket.on('offer', (data) => {
      io.to(roomId).emit('offer', data);
    });

    socket.on('answer', (data) => {
      io.to(roomId).emit('answer', data);
    });

    socket.on('candidate', (data) => {
      io.to(roomId).emit('candidate', data);
    });
  });
}

module.exports = { setupWebRTC };
