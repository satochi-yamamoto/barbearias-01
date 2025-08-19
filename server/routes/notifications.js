const express = require('express');
const { 
  getNotifications, 
  getNotification, 
  markAsRead, 
  deleteNotification,
  sendAppointmentReminder,
  sendAppointmentConfirmation
} = require('../controllers/notifications');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getNotifications);

router.route('/:id')
  .get(getNotification)
  .put(markAsRead)
  .delete(deleteNotification);

router.route('/send/appointment-reminder/:appointmentId')
  .post(sendAppointmentReminder);

router.route('/send/appointment-confirmation/:appointmentId')
  .post(sendAppointmentConfirmation);

module.exports = router;
