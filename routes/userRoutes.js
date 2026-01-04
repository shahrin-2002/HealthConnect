const router = require('express').Router();
const { verifyToken } = require('../middleware/auth');
const UserController = require('../controllers/userController');

router.get('/me', verifyToken, (req, res) => UserController.getProfile(req, res));
router.put('/me', verifyToken, (req, res) => UserController.updateProfile(req, res));

module.exports = router;

