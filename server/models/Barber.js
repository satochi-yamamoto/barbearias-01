const mongoose = require('mongoose');

const BarberSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  barbershop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Barbershop',
    required: true
  },
  specialties: [String],
  workingHours: [
    {
      day: {
        type: Number, // 0-6 (Domingo-Sábado)
        required: true
      },
      start: {
        type: String, // Formato: 'HH:MM'
        required: true
      },
      end: {
        type: String, // Formato: 'HH:MM'
        required: true
      },
      isAvailable: {
        type: Boolean,
        default: true
      }
    }
  ],
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  reviews: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      text: {
        type: String,
        required: true
      },
      rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  isActive: {
    type: Boolean,
    default: true
  }
});

module.exports = mongoose.model('Barber', BarberSchema);
