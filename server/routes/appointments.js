const express = require('express');
const { 
  createAppointment, 
  getAppointments, 
  getAppointment, 
  updateAppointment, 
  deleteAppointment,
  getBarberAppointments,
  getBarbershopAppointments,
  confirmAppointment,
  cancelAppointment,
  completeAppointment,
  rateAppointment
} = require('../controllers/appointments');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .post(protect, authorize('client', 'admin'), createAppointment)
  .get(protect, getAppointments);

router.route('/:id')
  .get(protect, getAppointment)
  .put(protect, updateAppointment)
  .delete(protect, deleteAppointment);

router.route('/barber/:barberId')
  .get(protect, authorize('barber', 'admin'), getBarberAppointments);

router.route('/barbershop/:barbershopId')
  .get(protect, authorize('admin'), getBarbershopAppointments);

router.route('/:id/confirm')
  .put(protect, authorize('barber', 'admin'), confirmAppointment);

router.route('/:id/cancel')
  .put(protect, cancelAppointment);

router.route('/:id/complete')
  .put(protect, authorize('barber', 'admin'), completeAppointment);

router.route('/:id/rate')
  .put(protect, authorize('client'), rateAppointment);

module.exports = router;
