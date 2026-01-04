const User = require('../models/User');

class AdminController {
  async lockUser(req, res) {
    try {
      await User.findByIdAndUpdate(req.params.id, { locked: true });
      res.json({ message: 'User locked' });
    } catch {
      res.status(500).json({ error: 'Locking failed' });
    }
  }

  async unlockUser(req, res) {
    try {
      await User.findByIdAndUpdate(req.params.id, { locked: false });
      res.json({ message: 'User unlocked' });
    } catch {
      res.status(500).json({ error: 'Unlocking failed' });
    }
  }

  async listUsers(req, res) {
    try {
      const users = await User.find({}).select('-password').lean();
      res.json(users);
    } catch {
      res.status(500).json({ error: 'Error fetching users' });
    }
  }
}

module.exports = new AdminController();
