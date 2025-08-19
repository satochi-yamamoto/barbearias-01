const express = require('express');
const { 
  getBarbers, 
  getBarber, 
  createBarber, 
  updateBarber, 
  deleteBarber,
  getBarbersByBarbershop,
  updateWorkingHours,
  addReview
} = require('../controllers/barbers');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .get(getBarbers)
  .post(protect, authorize('admin'), createBarber);

router.route('/:id')
  .get(getBarber)
  .put(protect, authorize('barber', 'admin'), updateBarber)
  .delete(protect, authorize('admin'), deleteBarber);

router.route('/barbershop/:barbershopId')
  .get(getBarbersByBarbershop);

router.route('/:id/working-hours')
  .put(protect, authorize('barber', 'admin'), updateWorkingHours);

router.route('/:id/reviews')
  .post(protect, authorize('client'), addReview);

module.exports = router;
