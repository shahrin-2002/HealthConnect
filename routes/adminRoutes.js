const router = require('express').Router();
const auth = require('../middleware/auth');
const requireRole = require('../middleware/role');
const AdminController = require('../controllers/adminController');

router.get('/documents', auth, requireRole('Hospital_Admin'), (req, res) => AdminController.listPending(req, res));
router.patch('/documents/:id/verify', auth, requireRole('Hospital_Admin'), (req, res) => AdminController.verifyDocument(req, res));
router.patch('/documents/:id/reject', auth, requireRole('Hospital_Admin'), (req, res) => AdminController.rejectDocument(req, res));
router.patch('/users/:id/lock', auth, requireRole('Hospital_Admin'), (req, res) => AdminController.lockUser(req, res));

module.exports = router;
