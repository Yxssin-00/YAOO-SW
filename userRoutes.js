const express = require('express');
const router = express.Router();
const { getProfile, updateProfile } = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/users/:id', protect, getProfile);
router.put('/users/:id', protect, updateProfile);

module.exports = router;