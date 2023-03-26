const express = require("express");
const http = require("http");
const socketIO = require("socket.io");

const mongoose = require("mongoose");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const cors = require("cors");

const EmployeeRouter = require("./routes/employee");
const UserRouter = require("./routes/user");
const ChatRouter = require("./routes/chat");

mongoose.connect("mongodb://127.0.0.1:27017/testdb", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", (err) => {
  console.log(err);
});
db.once("open", () => {
  console.log("Database Connection Established.");
});

const PORT = process.env.PORT || 3009;
const app = express();
const server = http.Server(app);
const io = socketIO(server, {
  cors: { origin: ["http://localhost:3000"] },
  pingTimeout: 60000,
});

global.io = io;
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("./controllers/UserController");
// app.use(morgan("dev"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

// const app = express();
// const io = require("socket.io")(server, {
//   cors: { origin: ["http://localhost:3000"] },
//   pingTimeout: 60000,
// });

app.use("/api/employee/", EmployeeRouter);
app.use("/api/user/", UserRouter);
app.use("/api/chat/", ChatRouter);

global.io.on("connection", async (socket) => {
  socket.on("send-message", (message, room) => {
    console.log(message, room);
    if (!room) {
      socket.broadcast.emit("received-message", message);
    } else {
      socket.broadcast.to(room).emit("received-message", message);
    }
  });
});

global.connectedUsers = [];
global.userIo = io.of("/user");
global.userIo.on("connection", (socket) => {
  global.socketUser = socket;
  if (socket.username !== "accessLocal") {
    global.connectedUsers.push({
      id: socket.id,
      email: socket.username,
      connected: 0,
      connections: [],
    });
  }
  console.log("connected to user namespace with user name " + socket.username);
  socket.on("send-message", (data, callback) => {
    socket.to(data.id).emit("received-message", data, async (response) => {
      console.log(response);
      await callback(response);
    });
    console.log(data);
  });

  socket.on("newUserRequest", async (message, callback) => {
    console.log(message);
    if (global.connectedUsers.length) {
      const selectuser = await new Promise((resolve, rejected) => {
        const users = global.connectedUsers;
        const connectUser = selectAnUser(users);
        console.log({ connectUser, users: global.connectedUsers });
        if (users[connectUser].connected < 5) {
          // COUNT CONNECTIONS
          global.connectedUsers[connectUser].connected += 1;

          // SET CONNECTION USERS ID'S
          const prevConnections =
            global.connectedUsers[connectUser]?.connections;
          global.connectedUsers[connectUser].connections = [
            ...prevConnections,
            message?.id,
          ];
          resolve(users[connectUser]);
        } else {
          resolve("No longer found");
        }
      });
      if (selectuser !== "No longer found") {
        socket.to(selectuser.id).emit("newUserRequest", message);
      }
      console.log({ selectuser });
      callback(selectuser);
    } else {
      callback("No user connected now");
    }
  });

  socket.on("userRemoveFromList", async (message, callback) => {
    const promise = await new Promise(async (resolve) => {
      let deletedId;
      for (const [i, iterator] of global.connectedUsers.entries()) {
        for (const [j, item] of iterator.connections.entries()) {
          if (item === message) {
            const data = global.connectedUsers[i].connections[j];
            deletedId = data;
            const newConnections = global.connectedUsers[i].connections.filter(
              (k) => k !== data
            );
            global.connectedUsers[i].connections = newConnections;
            global.connectedUsers[i].connected -= 1;
            break;
          }
        }
      }
      socket
        .to(deletedId)
        .emit("closeLiveChat", { liveChatClosed: true, id: message });
      resolve({ liveChatClosed: true, id: message });
    });
    callback(promise);
  });

  // setInterval(() => {
  //   const abc = new Promise(() => {
  //     testingEmit(socket);
  //   });
  // }, 2000);

  socket.on("disconnect", () => {
    const disconnect = global.connectedUsers.filter(
      (item) => item.id !== socket.id
    );
    global.connectedUsers = disconnect;
    console.log(socket.id + " --- " + socket.username);
  });
});

userIo.use((socket, next) => {
  if (socket.handshake.auth.token) {
    socket.username = getUsernameFromToken(socket.handshake.auth.token);
    next();
  } else {
    next(new Error("Please send a token"));
  }
});

function getUsernameFromToken(token) {
  if (token === "accessLocal") {
    return "accessLocal";
  }
  const user = jwt.verify(token, JWT_SECRET);
  return user.email;
}

function selectAnUser(connections) {
  let lessConnectUserIndex;
  if (connections) {
    let smallvalue = 0;
    for (let index = 0; index < connections.length; index++) {
      const element = connections[index];
      if (element.connected === 0) {
        lessConnectUserIndex = index;
        break;
      }
      if (index === 0) {
        smallvalue = connections[index].connected;
        lessConnectUserIndex = index;
        continue;
      }
      if (index > 0) {
        if (smallvalue > connections[index].connected) {
          smallvalue = connections[index].connected;
          lessConnectUserIndex = index;
        }
      }
    }
    return lessConnectUserIndex;
  } else {
    return "user not found!";
  }
}

server.listen(PORT, () => {
  console.log(`App is running at http://localhost:${PORT}`);
});
