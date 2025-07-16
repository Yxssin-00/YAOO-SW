const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/middleware');
const {
  getNotifications,
  markNotificationsAsRead
} = require('../controllers/notificationController');

router.route('/')
  .get(protect, getNotifications);

router.route('/mark-read')
  .post(protect, markNotificationsAsRead);

module.exports = router;