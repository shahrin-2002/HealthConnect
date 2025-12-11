const User = require('../models/User');
const Document = require('../models/Document');

class UserController {
  async getProfile(req, res) {
    try {
      const user = await User.findById(req.user.id).lean();
      if (!user) return res.status(404).json({ error: 'User not found' });
      const documents = await Document.find({ user: req.user.id }).lean();
      res.json({ user, documents });
    } catch {
      res.status(500).json({ error: 'Error fetching profile' });
    }
  }

  async updateProfile(req, res) {
    try {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      if (user.locked) return res.status(403).json({ error: 'Profile is locked' });

      const allowed = ['name', 'phone', 'address', 'gender', 'date_of_birth'];
      for (const key of allowed) {
        if (req.body[key] !== undefined) user[key] = req.body[key];
      }
      await user.save();

      const fresh = await User.findById(req.user.id).lean();
      res.json({ message: 'Profile updated', user: fresh });
    } catch {
      res.status(500).json({ error: 'Error updating profile' });
    }
  }
}

module.exports = new UserController();
