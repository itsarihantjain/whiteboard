const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const rooms = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-room", (roomId) => {
    try {
      socket.rooms.forEach((room) => {
        if (room !== socket.id) {
          socket.leave(room);
        }
      });

      socket.join(roomId);

      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Set());
      }
      rooms.get(roomId).add(socket.id);

      socket.to(roomId).emit("user-joined", { userId: socket.id });
    } catch (error) {
      socket.emit("error", { message: "Failed to join room" });
    }
  });

  socket.on("drawing", (data) => {
    try {
      if (!data.roomId) {
        throw new Error("No room ID provided");
      }
      socket.to(data.roomId).emit("drawing", data);
    } catch (error) {
      socket.emit("error", { message: "Failed to broadcast drawing" });
    }
  });

  socket.on("clear-canvas", (data) => {
    try {
      if (!data.roomId) {
        throw new Error("No room ID provided");
      }

      io.sockets
        .in(data.roomId)
        .emit("canvas-cleared", { roomId: data.roomId });

      const roomSockets = io.sockets.adapter.rooms.get(data.roomId);
      if (roomSockets) {
        console.log("Sockets in room:", Array.from(roomSockets));
      }
    } catch (error) {
      socket.emit("error", { message: "Failed to broadcast clear canvas" });
    }
  });

  socket.on("disconnect", () => {
    rooms.forEach((users, roomId) => {
      if (users.has(socket.id)) {
        users.delete(socket.id);
        if (users.size === 0) {
          rooms.delete(roomId);
        } else {
        }
      }
    });
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {});
