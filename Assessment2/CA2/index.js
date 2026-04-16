const express = require("express");
const socket = require("socket.io");

// App setup
const PORT = 5000;
const app = express();
const server = app.listen(PORT, function () {
  console.log(`Listening on port ${PORT}`);

});

// Static files
app.use(express.static("public"));

// Socket setup
const io = socket(server);
// typing setup
const typingUsers = new Map();

//we use a set to store users, sets objects are for unique values of any type
const activeUsers = new Set();

io.on("connection", function (socket) {
  console.log("Made socket connection");

  socket.on("new user", function (data) {
    console.log("New user data:", data);
    socket.userId = data;
    activeUsers.add(data);
    // Send full list to the new user
    socket.emit("new user", [...activeUsers]);
    // Send only the new user to others
    socket.broadcast.emit("new user", data);
  });

  socket.on("disconnect", function () {
      activeUsers.delete(socket.userId);
      io.emit("user disconnected", socket.userId);
    });

    socket.on("chat message", function (data) {
      io.emit("chat message", data);
  });

     socket.on('typing', (isTyping) => {
     const room = Array.from(socket.rooms).find(r => r !== socket.id);
     if (!room) return;
    
     if (isTyping) {
         typingUsers.get(room).add(socket.username);
     } else {
         typingUsers.get(room).delete(socket.username);
     }

     io.to(room).emit('typing users', Array.from(typingUsers.get(room)));

});

});