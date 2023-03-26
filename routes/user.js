const express = require("express");
const router = express.Router();

const { getAll, addUser, destroy, login, userData } = require("../controllers/UserController");

router.get("/", getAll);
router.post("/add", addUser);
router.delete("/delete/:id", destroy);
router.post("/login", login);
router.post("/user-data", userData);

module.exports = router;
