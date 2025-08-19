const express = require('express');
const { 
  getServices, 
  getService, 
  createService, 
  updateService, 
  deleteService,
  getBarbershopServices
} = require('../controllers/services');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .get(getServices)
  .post(protect, authorize('admin'), createService);

router.route('/:id')
  .get(getService)
  .put(protect, authorize('admin'), updateService)
  .delete(protect, authorize('admin'), deleteService);

router.route('/barbershop/:barbershopId')
  .get(getBarbershopServices);

module.exports = router;
