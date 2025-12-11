const fs = require('fs');
const path = require('path');
const Document = require('../models/Document');

class DocumentController {
  async upload(req, res) {
    try {
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
      const { type } = req.body;
      if (!type) return res.status(400).json({ error: 'Document type is required' });

      const doc = await Document.create({
        user: req.user.id,
        filename: req.file.filename,
        type
      });

      res.status(201).json({ message: 'Uploaded', document: doc });
    } catch {
      res.status(500).json({ error: 'Error uploading document' });
    }
  }

  async preview(req, res) {
    try {
      const filePath = path.join(__dirname, '..', 'uploads', req.params.filename);
      if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });
      res.sendFile(filePath);
    } catch {
      res.status(500).json({ error: 'Error previewing document' });
    }
  }

  async remove(req, res) {
    try {
      const doc = await Document.findById(req.params.id);
      if (!doc) return res.status(404).json({ error: 'Not found' });
      if (doc.user.toString() !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
      if (doc.status === 'verified') return res.status(403).json({ error: 'Cannot delete verified document' });

      const filePath = path.join(__dirname, '..', 'uploads', doc.filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

      await doc.deleteOne();
      res.json({ message: 'Deleted' });
    } catch {
      res.status(500).json({ error: 'Error deleting document' });
    }
  }
}

module.exports = new DocumentController();
