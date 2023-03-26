const express = require("express");
const router = express.Router();

const { selectUser } = require("../controllers/Chat");

router.post("/select-user", selectUser);
router.post("/chat", selectUser);

module.exports = router;
