import express from "express";
import Ambulance from "../models/AmbulanceBooking.js";

const router = express.Router();

router.post("/book", async (req, res) => {
  await Ambulance.create(req.body);
  res.json({ eta: Math.floor(Math.random() * 10) + 5 });
});

export default router;
