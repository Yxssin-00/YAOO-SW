const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/middleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/users/me', protect, getMe);

module.exports = router;
