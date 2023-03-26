const express = require("express");
const router = express.Router();

const EmployeeController = require("../controllers/EmployeeController");

router.get("/", EmployeeController.index);
router.get("/show", EmployeeController.show);
router.post("/store", EmployeeController.store);
router.patch("/update", EmployeeController.update);
router.delete("/delete", EmployeeController.destroy);

module.exports = router;
