import express from "express";
import Prescription from "../models/Prescription.js";
import { generateQR } from "../utils/generateQR.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { patientName, doctorName, medicines } = req.body;

  const qr = await generateQR(patientName + doctorName);

  const prescription = await Prescription.create({
    patientName,
    doctorName,
    medicines,
    qrCode: qr
  });

  res.json(prescription);
});

export default router;
