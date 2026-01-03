import express from "express";
import Ambulance from "../models/AmbulanceBooking.js";

const router = express.Router();

router.post("/", async (req, res) => {
  res.json(await Ambulance.create(req.body));
});

export default router;
