const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const {
  getUsers,
  getUserProfile,
  updateUserProfile
} = require('../controllers/userController');

router.route('/').get(protect, admin, getUsers);
router.route('/:id')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

module.exports = router;