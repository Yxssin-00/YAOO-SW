const asyncHandler = require('express-async-handler');
const { Notification } = require('../../database');

// @desc    Get notifications for user
// @route   GET /api/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.findAll({
    where: { userId: req.user.id },
    order: [['createdAt', 'DESC']]
  });
  res.json(notifications);
});

// @desc    Mark notifications as read
// @route   POST /api/notifications/mark-read
// @access  Private
const markNotificationsAsRead = asyncHandler(async (req, res) => {
  await Notification.update(
    { isRead: true },
    { where: { userId: req.user.id, isRead: false } }
  );
  res.json({ message: 'Notifications marked as read' });
});

module.exports = {
  getNotifications,
  markNotificationsAsRead
};