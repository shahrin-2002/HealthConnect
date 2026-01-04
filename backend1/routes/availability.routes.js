import express from "express";
import Availability from "../models/Availability.js";

const router = express.Router();

router.post("/", async (req, res) => {
  await Availability.create(req.body);
  res.json({ message: "Slot booked" });
});

router.get("/:doctorId", async (req, res) => {
  const slots = await Availability.find({ doctorId: req.params.doctorId });
  res.json(slots);
});

export default router;
