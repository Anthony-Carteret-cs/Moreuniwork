const express = require("express");
const socket = require("socket.io");

const PORT = 5000;
const app = express();
const server = app.listen(PORT, function () {
  console.log(`Listening on port ${PORT}`);
});

app.use(express.static("public"));

const io = socket(server);

const activeUsers = new Set();
const typingUsers = new Set();

io.on("connection", function (socket) {
  console.log("Made socket connection");

  socket.on("new user", function (data) {
    socket.userId = data;
    activeUsers.add(data);
    socket.emit("new user", [...activeUsers]);
    socket.broadcast.emit("new user", data);
    socket.broadcast.emit("chat message", { nick: "Server", message: `${data} joined the chat` });
  });

  socket.on("disconnect", function () {
    activeUsers.delete(socket.userId);
    typingUsers.delete(socket.userId);
    io.emit("user disconnected", socket.userId);
    io.emit("chat message", { nick: "Server", message: `${socket.userId} left the chat` });
    socket.broadcast.emit("typing users", Array.from(typingUsers));
  });

  socket.on("chat message", function (data) {
    io.emit("chat message", data);
  });

  socket.on("typing", function (isTyping) {
    console.log(`${socket.userId} typing: ${isTyping}`);

    if (isTyping) {
      typingUsers.add(socket.userId);
    } else {
      typingUsers.delete(socket.userId);
    }

    console.log("Current typing users:", Array.from(typingUsers));
    socket.broadcast.emit("typing users", Array.from(typingUsers));
  });

});