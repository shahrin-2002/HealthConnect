import express from "express";
import Prescription from "../models/Prescription.js";
import { generateQR } from "../utils/generateQR.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const qr = await generateQR(JSON.stringify(req.body));

  const prescription = await Prescription.create({
    ...req.body,
    qrCode: qr
  });

  res.json(prescription);
});

router.get("/qr/:id", async (req, res) => {
  const p = await Prescription.findById(req.params.id);
  res.send(`<img src="${p.qrCode}" />`);
});

export default router;
