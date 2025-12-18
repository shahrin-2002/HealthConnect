const express = require("express");
const auth = require("../middlewares/auth");
const {
  createAvailability,
  getDoctorAvailability,
} = require("../controllers/availabilityController");

const router = express.Router();

router.post("/", auth, createAvailability);
router.get("/", getDoctorAvailability);

module.exports = router;
