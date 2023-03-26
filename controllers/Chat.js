const Chat = require("../models/Chat");
const User = require("../models/User");
const { JWT_SECRET } = require("../controllers/UserController");
const jwt = require("jsonwebtoken");

// Select an user for live chat
const selectUser = async (req, res, next) => {
  const { contact, email, full_name } = req.body;
  const unique = new Date().valueOf();
  console.log({ contact, email, full_name });
  const token = jwt.sign({ contact, email, full_name }, JWT_SECRET);
  await handleNewConnection({
    contact,
    email,
    full_name,
    emit: global.connectedUsers[0]?.id + "-" + unique,
    status: "Pending",
  });
  res.json({
    token,
    data: global.connectedUsers[0].id,
  });
};

const handleNewConnection = async ({
  contact,
  email,
  full_name,
  emit,
  status,
}) => {
  const confirmation = await new Promise(async (resolve, rejected) => {
    console.log(global.connectedUsers);
    global.userIo.to(global.connectedUsers[0]?.id).emit(
      "newUserRequest",
      {
        contact,
        email,
        full_name,
        emit,
        status,
      },
      (response) => {
        console.log("response");
        console.log(response);
      }
    );

    // testingEmit(global.userIo)

    // setInterval(() => {
    //   const abc = new Promise(() => {
    //     testingEmit(global.userIo);
    //   });
    // }, 2000);
  });
};

const testingEmit = (socket) => {
  socket.emit(
    "test-emit",
    {
      name: "testing",
    },
    (response) => {
      console.log(response);
    }
  );
};

setTimeout(() => {
  (async () => {
    // all sockets in the main namespace
    const ids = await global.io.allSockets();
    console.log(ids);
    const ids2 = await global.io.of("/user").allSockets();
    console.log(ids2);
    console.log(global.connectedUsers);
  })();
}, 2000);

const chat = (req, res, next)=>{
  
}

module.exports = { selectUser };
