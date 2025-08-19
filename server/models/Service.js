const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Por favor, informe o nome do serviço'],
    trim: true
  },
  barbershop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Barbershop',
    required: true
  },
  description: {
    type: String,
    required: [true, 'Por favor, informe uma descrição para o serviço']
  },
  price: {
    type: Number,
    required: [true, 'Por favor, informe o valor do serviço']
  },
  duration: {
    type: Number, // Duração em minutos
    required: [true, 'Por favor, informe a duração do serviço']
  },
  category: {
    type: String,
    enum: ['corte', 'barba', 'combo', 'tratamento', 'outros'],
    default: 'corte'
  },
  image: {
    type: String,
    default: 'default-service.jpg'
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

module.exports = mongoose.model('Service', ServiceSchema);
