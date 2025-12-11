const router = require('express').Router();
const auth = require('../middleware/auth');
const UserController = require('../controllers/userController');

router.get('/me', auth, (req, res) => UserController.getProfile(req, res));
router.put('/me', auth, (req, res) => UserController.updateProfile(req, res));

module.exports = router;

