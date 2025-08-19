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
  const notifications = await Notification.find({ recipient: req.user.id })
    .sort({ createdAt: -1 })
    .populate({
      path: 'relatedTo',
      select: 'service date startTime barber client',
      populate: [
        {
          path: 'service',
          select: 'name'
        },
        {
          path: 'barber',
          select: 'user',
          populate: {
            path: 'user',
            select: 'name'
          }
        },
        {
          path: 'client',
          select: 'name'
        }
      ]
    });
  
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
  
  // Verificar propriedade
  if (notification.recipient.toString() !== req.user.id) {
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
  
  // Verificar propriedade
  if (notification.recipient.toString() !== req.user.id) {
    return next(new ErrorResponse('Não autorizado a modificar esta notificação', 401));
  }
  
  notification.isRead = true;
  notification.status = 'read';
  await notification.save();
  
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
  
  // Verificar propriedade
  if (notification.recipient.toString() !== req.user.id) {
    return next(new ErrorResponse('Não autorizado a excluir esta notificação', 401));
  }
  
  await notification.remove();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Enviar lembrete de agendamento
// @route   POST /api/notifications/send/appointment-reminder/:appointmentId
// @access  Private (Admin, Barbeiro)
exports.sendAppointmentReminder = asyncHandler(async (req, res, next) => {
  const appointment = await Appointment.findById(req.params.appointmentId)
    .populate('client', 'name email phone')
    .populate({
      path: 'barber',
      populate: {
        path: 'user',
        select: 'name'
      }
    })
    .populate('service', 'name')
    .populate('barbershop', 'name address');
  
  if (!appointment) {
    return next(new ErrorResponse(`Agendamento não encontrado com id ${req.params.appointmentId}`, 404));
  }
  
  // Verificar se o agendamento está ativo
  if (appointment.status === 'cancelado') {
    return next(new ErrorResponse('Não é possível enviar lembrete para um agendamento cancelado', 400));
  }
  
  // Formatar a data para exibição
  const options = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  const formattedDate = new Date(appointment.date).toLocaleDateString('pt-BR', options);
  
  // Preparar mensagem
  const emailMessage = `
    Olá ${appointment.client.name},
    
    Este é um lembrete do seu agendamento na ${appointment.barbershop.name} para amanhã, ${formattedDate}, às ${appointment.startTime}.
    
    Detalhes do agendamento:
    - Serviço: ${appointment.service.name}
    - Barbeiro: ${appointment.barber.user.name}
    - Local: ${appointment.barbershop.address.street}, ${appointment.barbershop.address.number}, ${appointment.barbershop.address.city}
    
    Caso precise reagendar ou cancelar, entre em contato conosco.
    
    Atenciosamente,
    Equipe ${appointment.barbershop.name}
  `;
  
  const smsMessage = `Lembrete: Você tem um agendamento amanhã às ${appointment.startTime} na ${appointment.barbershop.name} com ${appointment.barber.user.name}.`;
  
  // Enviar notificações
  try {
    // Email
    await sendEmail({
      email: appointment.client.email,
      subject: `Lembrete de Agendamento - ${appointment.barbershop.name}`,
      message: emailMessage
    });
    
    // SMS
    await sendSMS({
      phone: appointment.client.phone,
      message: smsMessage
    });
    
    // Registrar notificação no sistema
    await Notification.create({
      recipient: appointment.client._id,
      type: 'appointment_reminder',
      title: 'Lembrete de Agendamento',
      message: `Você tem um agendamento amanhã às ${appointment.startTime}.`,
      relatedTo: appointment._id,
      onModel: 'Appointment',
      channel: 'email'
    });
    
    // Atualizar status de notificação no agendamento
    appointment.notificationsStatus.reminderSent = true;
    await appointment.save();
    
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
  const appointment = await Appointment.findById(req.params.appointmentId)
    .populate('client', 'name email phone')
    .populate({
      path: 'barber',
      populate: {
        path: 'user',
        select: 'name'
      }
    })
    .populate('service', 'name')
    .populate('barbershop', 'name address');
  
  if (!appointment) {
    return next(new ErrorResponse(`Agendamento não encontrado com id ${req.params.appointmentId}`, 404));
  }
  
  // Verificar se o agendamento está ativo
  if (appointment.status === 'cancelado') {
    return next(new ErrorResponse('Não é possível enviar confirmação para um agendamento cancelado', 400));
  }
  
  // Atualizar status do agendamento
  appointment.status = 'confirmado';
  
  // Formatar a data para exibição
  const options = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  const formattedDate = new Date(appointment.date).toLocaleDateString('pt-BR', options);
  
  // Preparar mensagem
  const emailMessage = `
    Olá ${appointment.client.name},
    
    Seu agendamento na ${appointment.barbershop.name} foi confirmado para ${formattedDate}, às ${appointment.startTime}.
    
    Detalhes do agendamento:
    - Serviço: ${appointment.service.name}
    - Barbeiro: ${appointment.barber.user.name}
    - Local: ${appointment.barbershop.address.street}, ${appointment.barbershop.address.number}, ${appointment.barbershop.address.city}
    
    Estamos ansiosos para recebê-lo(a)!
    
    Atenciosamente,
    Equipe ${appointment.barbershop.name}
  `;
  
  const smsMessage = `Seu agendamento para ${appointment.startTime} na ${appointment.barbershop.name} com ${appointment.barber.user.name} foi confirmado.`;
  
  // Enviar notificações
  try {
    // Email
    await sendEmail({
      email: appointment.client.email,
      subject: `Agendamento Confirmado - ${appointment.barbershop.name}`,
      message: emailMessage
    });
    
    // SMS
    await sendSMS({
      phone: appointment.client.phone,
      message: smsMessage
    });
    
    // Registrar notificação no sistema
    await Notification.create({
      recipient: appointment.client._id,
      type: 'appointment_confirmation',
      title: 'Agendamento Confirmado',
      message: `Seu agendamento para ${formattedDate} às ${appointment.startTime} foi confirmado.`,
      relatedTo: appointment._id,
      onModel: 'Appointment',
      channel: 'email'
    });
    
    // Atualizar status de notificação no agendamento
    appointment.notificationsStatus.confirmationSent = true;
    await appointment.save();
    
    res.status(200).json({
      success: true,
      message: 'Confirmação enviada com sucesso',
      data: appointment
    });
  } catch (err) {
    return next(new ErrorResponse('Erro ao enviar confirmação', 500));
  }
});
