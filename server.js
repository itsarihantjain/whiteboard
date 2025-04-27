const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static("public"));

io.on("connection", (socket) => {
  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
  });

  socket.on("drawing", (data) => {
    socket.broadcast.to(data.roomId).emit("drawing", data);
  });

  socket.on("disconnect", () => {
    alert("disconnected");
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
