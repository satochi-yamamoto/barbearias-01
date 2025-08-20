const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../utils/asyncHandler');
const Notification = require('../models/Notification');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Barber = require('../models/Barber');
const sendEmail = require('../utils/sendEmail');
const sendSMS = require('../utils/sendSMS');

// @desc    Obter notificações do usuário
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = asyncHandler(async (req, res, next) => {
  const notifications = await Notification.findByRecipientId(req.user.id);
  
  res.status(200).json({
    success: true,
    count: notifications.length,
    data: notifications
  });
});

// @desc    Obter uma notificação específica
// @route   GET /api/notifications/:id
// @access  Private
exports.getNotification = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findById(req.params.id);
  
  if (!notification) {
    return next(new ErrorResponse(`Notificação não encontrada com id ${req.params.id}`, 404));
  }
  
  if (notification.recipient_id.toString() !== req.user.id) {
    return next(new ErrorResponse('Não autorizado a acessar esta notificação', 401));
  }
  
  res.status(200).json({
    success: true,
    data: notification
  });
});

// @desc    Marcar notificação como lida
// @route   PUT /api/notifications/:id
// @access  Private
exports.markAsRead = asyncHandler(async (req, res, next) => {
  let notification = await Notification.findById(req.params.id);
  
  if (!notification) {
    return next(new ErrorResponse(`Notificação não encontrada com id ${req.params.id}`, 404));
  }
  
  if (notification.recipient_id.toString() !== req.user.id) {
    return next(new ErrorResponse('Não autorizado a modificar esta notificação', 401));
  }
  
  notification = await Notification.markAsRead(req.params.id);
  
  res.status(200).json({
    success: true,
    data: notification
  });
});

// @desc    Excluir notificação
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findById(req.params.id);
  
  if (!notification) {
    return next(new ErrorResponse(`Notificação não encontrada com id ${req.params.id}`, 404));
  }
  
  if (notification.recipient_id.toString() !== req.user.id) {
    return next(new ErrorResponse('Não autorizado a excluir esta notificação', 401));
  }
  
  await Notification.delete(req.params.id);
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Enviar lembrete de agendamento
// @route   POST /api/notifications/send/appointment-reminder/:appointmentId
// @access  Private (Admin, Barbeiro)
exports.sendAppointmentReminder = asyncHandler(async (req, res, next) => {
  const appointment = await Appointment.findById(req.params.appointmentId);
  
  if (!appointment) {
    return next(new ErrorResponse(`Agendamento não encontrado com id ${req.params.appointmentId}`, 404));
  }
  
  if (appointment.status === 'cancelado') {
    return next(new ErrorResponse('Não é possível enviar lembrete para um agendamento cancelado', 400));
  }
  
  const options = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  const formattedDate = new Date(appointment.date).toLocaleDateString('pt-BR', options);
  
  const emailMessage = `
    Olá ${appointment.client.name},
    
    Este é um lembrete do seu agendamento na ${appointment.barbershop.name} para amanhã, ${formattedDate}, às ${appointment.start_time}.
    
    Detalhes do agendamento:
    - Serviço: ${appointment.service.name}
    - Barbeiro: ${appointment.barber.user.name}
    - Local: ${appointment.barbershop.address.street}, ${appointment.barbershop.address.number}, ${appointment.barbershop.address.city}
    
    Caso precise reagendar ou cancelar, entre em contato conosco.
    
    Atenciosamente,
    Equipe ${appointment.barbershop.name}
  `;
  
  const smsMessage = `Lembrete: Você tem um agendamento amanhã às ${appointment.start_time} na ${appointment.barbershop.name} com ${appointment.barber.user.name}.`;
  
  try {
    await sendEmail({
      email: appointment.client.email,
      subject: `Lembrete de Agendamento - ${appointment.barbershop.name}`,
      message: emailMessage
    });
    
    await sendSMS({
      phone: appointment.client.phone,
      message: smsMessage
    });
    
    await Notification.create({
      recipient_id: appointment.client_id,
      type: 'appointment_reminder',
      title: 'Lembrete de Agendamento',
      message: `Você tem um agendamento amanhã às ${appointment.start_time}.`,
      related_to: appointment.id,
      on_model: 'Appointment',
      channel: 'email'
    });
    
    await Appointment.update(appointment.id, { notifications_status: { reminder_sent: true } });
    
    res.status(200).json({
      success: true,
      message: 'Lembrete enviado com sucesso'
    });
  } catch (err) {
    return next(new ErrorResponse('Erro ao enviar lembrete', 500));
  }
});

// @desc    Enviar confirmação de agendamento
// @route   POST /api/notifications/send/appointment-confirmation/:appointmentId
// @access  Private (Admin, Barbeiro)
exports.sendAppointmentConfirmation = asyncHandler(async (req, res, next) => {
  const appointment = await Appointment.findById(req.params.appointmentId);
  
  if (!appointment) {
    return next(new ErrorResponse(`Agendamento não encontrado com id ${req.params.appointmentId}`, 404));
  }
  
  if (appointment.status === 'cancelado') {
    return next(new ErrorResponse('Não é possível enviar confirmação para um agendamento cancelado', 400));
  }
  
  const updatedAppointment = await Appointment.update(req.params.appointmentId, { 
    status: 'confirmado', 
    notifications_status: { confirmation_sent: true } 
  });
  
  const options = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  const formattedDate = new Date(appointment.date).toLocaleDateString('pt-BR', options);
  
  const emailMessage = `
    Olá ${appointment.client.name},
    
    Seu agendamento na ${appointment.barbershop.name} foi confirmado para ${formattedDate}, às ${appointment.start_time}.
    
    Detalhes do agendamento:
    - Serviço: ${appointment.service.name}
    - Barbeiro: ${appointment.barber.user.name}
    - Local: ${appointment.barbershop.address.street}, ${appointment.barbershop.address.number}, ${appointment.barbershop.address.city}
    
    Estamos ansiosos para recebê-lo(a)!
    
    Atenciosamente,
    Equipe ${appointment.barbershop.name}
  `;
  
  const smsMessage = `Seu agendamento para ${appointment.start_time} na ${appointment.barbershop.name} com ${appointment.barber.user.name} foi confirmado.`;
  
  try {
    await sendEmail({
      email: appointment.client.email,
      subject: `Agendamento Confirmado - ${appointment.barbershop.name}`,
      message: emailMessage
    });
    
    await sendSMS({
      phone: appointment.client.phone,
      message: smsMessage
    });
    
    await Notification.create({
      recipient_id: appointment.client_id,
      type: 'appointment_confirmation',
      title: 'Agendamento Confirmado',
      message: `Seu agendamento para ${formattedDate} às ${appointment.start_time} foi confirmado.`,
      related_to: appointment.id,
      on_model: 'Appointment',
      channel: 'email'
    });
    
    res.status(200).json({
      success: true,
      message: 'Confirmação enviada com sucesso',
      data: updatedAppointment
    });
  } catch (err) {
    return next(new ErrorResponse('Erro ao enviar confirmação', 500));
  }
});
