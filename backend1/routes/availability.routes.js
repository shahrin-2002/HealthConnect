import express from "express";
import Availability from "../models/Availability.js";

const router = express.Router();

router.post("/", async (req, res) => {
  await Availability.create(req.body);
  res.json({ message: "Availability saved" });
});

router.get("/:doctorId", async (req, res) => {
  res.json(await Availability.find({ doctorId: req.params.doctorId }));
});

export default router;
