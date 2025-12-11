const Document = require('../models/Document');
const User = require('../models/User');

class AdminController {
  async listPending(req, res) {
    try {
      const docs = await Document.find({ status: 'pending' }).populate('user', 'name email role');
      res.json(docs);
    } catch {
      res.status(500).json({ error: 'Error fetching pending documents' });
    }
  }

  async verifyDocument(req, res) {
    try {
      await Document.findByIdAndUpdate(req.params.id, { status: 'verified', notes: null });
      res.json({ message: 'Verified' });
    } catch {
      res.status(500).json({ error: 'Verification failed' });
    }
  }

  async rejectDocument(req, res) {
    try {
      await Document.findByIdAndUpdate(req.params.id, { status: 'rejected', notes: req.body.notes || '' });
      res.json({ message: 'Rejected' });
    } catch {
      res.status(500).json({ error: 'Rejection failed' });
    }
  }

  async lockUser(req, res) {
    try {
      await User.findByIdAndUpdate(req.params.id, { locked: true });
      res.json({ message: 'User locked' });
    } catch {
      res.status(500).json({ error: 'Locking failed' });
    }
  }
}

module.exports = new AdminController();
