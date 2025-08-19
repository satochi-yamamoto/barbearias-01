const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  barber: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Barber',
    required: true
  },
  barbershop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Barbershop',
    required: true
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  date: {
    type: Date,
    required: [true, 'Por favor, informe a data do agendamento']
  },
  startTime: {
    type: String, // Formato: 'HH:MM'
    required: [true, 'Por favor, informe o horário do agendamento']
  },
  endTime: {
    type: String, // Formato: 'HH:MM'
    required: [true, 'Por favor, informe o horário de término']
  },
  status: {
    type: String,
    enum: ['agendado', 'confirmado', 'cancelado', 'concluído'],
    default: 'agendado'
  },
  totalPrice: {
    type: Number,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pendente', 'pago', 'reembolsado'],
    default: 'pendente'
  },
  paymentMethod: {
    type: String,
    enum: ['dinheiro', 'cartão', 'pix', 'outro'],
    default: 'dinheiro'
  },
  notes: {
    type: String
  },
  rating: {
    score: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    createdAt: Date
  },
  notificationsStatus: {
    reminderSent: {
      type: Boolean,
      default: false
    },
    confirmationSent: {
      type: Boolean,
      default: false
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Appointment', AppointmentSchema);
