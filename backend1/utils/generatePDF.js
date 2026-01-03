import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

export const generatePDF = (prescriptionData) => {
  return new Promise((resolve, reject) => {
    const fileName = `prescription_${Date.now()}.pdf`;
    const filePath = path.join("backend/uploads", fileName);

    const doc = new PDFDocument();
    doc.pipe(fs.createWriteStream(filePath));

    doc.fontSize(20).text("E-Prescription", { align: "center" });
    doc.moveDown();
    doc.fontSize(14).text(`Patient: ${prescriptionData.patientName}`);
    doc.text(`Doctor: ${prescriptionData.doctorName}`);
    doc.text(`Date: ${new Date().toLocaleDateString()}`);
    doc.moveDown();

    doc.text("Medicines:");
    prescriptionData.medicines.forEach((med, i) => {
      doc.text(`${i + 1}. ${med.name} - ${med.dose} - ${med.duration}`);
    });

    if (prescriptionData.notes) doc.moveDown().text(`Notes: ${prescriptionData.notes}`);

    doc.end();
    resolve(filePath);
  });
};
