const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const JWT_SECRET =
  "kfjo%$iaj98u34t89i**urghiaehf983haj)(erk;faklsmd;aeofjiehfu)(ndkea98fj34";

// Get all user
const getAll = (req, res, next) => {
  User.find()
    .then((response) => {
      res.json({ data: response, success: true });
    })
    .catch((err) => {
      res.json({
        message: "An Error Occured!",
        success: false,
      });
    });
};

// Add new user
const addUser = async (req, res, next) => {
  const { full_name, email, contact, password } = req.body;
  const isExist = await User.findOne({ email });
  if (isExist !== null) {
    return res.json({
      message: email + " Already exist!",
      success: false,
    });
  }
  const encriptedPassword = await bcrypt.hash(password, 10);
  let user = new User({
    full_name,
    email,
    contact,
    password: encriptedPassword,
  });
  user
    .save()
    .then(() => {
      res.json({
        message: "User Added Successfully",
        success: true,
      });
    })
    .catch((err) => {
      res.json({
        message: "An error Occured!",
        success: false,
      });
    });
};

// delete all user
const destroy = (req, res, next) => {
  let userId = req.params.id;
  User.findByIdAndRemove(userId)
    .then(() => {
      res.json({
        message: "User deleted successfully!",
        success: true,
      });
    })
    .catch((err) => {
      res.json({
        message: "An error Occured!",
        success: false,
      });
    });
};

// login
const login = async (req, res, next) => {
  const { email, password } = req.body;

  const findUser = await User.findOne({ email });
  if (!findUser) {
    return res.json({
      message: "User not found",
      success: false,
    });
  }

  if (bcrypt.compare(password, findUser.password)) {
    const token = jwt.sign({ email }, JWT_SECRET);
    if (res.status(201)) {
      return res.json({
        message: "ok",
        success: true,
        token,
      });
    } else {
      return res.json({
        success: false,
        message: "An error occured",
      });
    }
  }
  res.json({
    success: false,
    message: "Invalid password!",
  });
};

const userData = async (req, res, next) => {
  const { token } = req.body;
  try {
    const user = jwt.verify(token, JWT_SECRET);
    const email = user.email;
    User.findOne({ email })
      .then((data) => {
        res.json({
          success: true,
          data: data,
        });
      })
      .catch((err) => {
        res.json({
          success: false,
          message: "An error occured!",
        });
      });
  } catch (error) {
    res.json({
      success: false,
      message: "An error occured!",
    });
  }
};

module.exports = { getAll, addUser, destroy, login, userData, JWT_SECRET };
