const mongoose = require('mongoose');

const BarbershopSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Por favor, informe o nome da barbearia'],
    trim: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  address: {
    street: String,
    number: String,
    complement: String,
    neighborhood: String,
    city: String,
    state: String,
    zipcode: String
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      index: '2dsphere'
    }
  },
  phone: {
    type: String,
    required: [true, 'Por favor, informe um telefone de contato']
  },
  email: {
    type: String,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Por favor, informe um email válido'
    ]
  },
  logo: {
    type: String,
    default: 'default-logo.jpg'
  },
  photos: [String],
  businessHours: [
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
      isOpen: {
        type: Boolean,
        default: true
      }
    }
  ],
  description: String,
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  subscriptionPlan: {
    type: String,
    enum: ['free', 'basic', 'premium'],
    default: 'free'
  },
  subscriptionStatus: {
    type: String,
    enum: ['active', 'pending', 'cancelled'],
    default: 'active'
  },
  subscriptionExpiration: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Barbershop', BarbershopSchema);
