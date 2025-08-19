const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../utils/asyncHandler');
const Appointment = require('../models/Appointment');
const Barber = require('../models/Barber');
const Service = require('../models/Service');
const User = require('../models/User');
const Notification = require('../models/Notification');
const sendEmail = require('../utils/sendEmail');
const sendSMS = require('../utils/sendSMS');

// @desc    Criar agendamento
// @route   POST /api/appointments
// @access  Private (Cliente)
exports.createAppointment = asyncHandler(async (req, res, next) => {
  req.body.client = req.user.id;
  
  // Verificar se o serviço existe
  const service = await Service.findById(req.body.service);
  if (!service) {
    return next(new ErrorResponse(`Serviço não encontrado com id ${req.body.service}`, 404));
  }
  
  // Verificar se o barbeiro existe
  const barber = await Barber.findById(req.body.barber);
  if (!barber) {
    return next(new ErrorResponse(`Barbeiro não encontrado com id ${req.body.barber}`, 404));
  }
  
  // Calcular horário de término com base na duração do serviço
  const startTime = req.body.startTime;
  const startHour = parseInt(startTime.split(':')[0]);
  const startMinute = parseInt(startTime.split(':')[1]);
  
  const durationMinutes = service.duration;
  
  let endHour = startHour + Math.floor((startMinute + durationMinutes) / 60);
  let endMinute = (startMinute + durationMinutes) % 60;
  
  const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
  
  // Adicionar horário de término e preço total ao agendamento
  req.body.endTime = endTime;
  req.body.totalPrice = service.price;
  
  // Verificar disponibilidade do horário
  const overlappingAppointment = await Appointment.findOne({
    barber: req.body.barber,
    date: req.body.date,
    status: { $nin: ['cancelado'] },
    $or: [
      {
        startTime: { $lt: endTime },
        endTime: { $gt: startTime }
      },
      {
        startTime: startTime,
        endTime: endTime
      }
    ]
  });
  
  if (overlappingAppointment) {
    return next(new ErrorResponse('Horário não disponível para este barbeiro', 400));
  }
  
  // Criar o agendamento
  const appointment = await Appointment.create(req.body);
  
  // Enviar notificação por email para o cliente
  const client = await User.findById(req.user.id);
  
  await sendEmail({
    email: client.email,
    subject: 'Agendamento Confirmado',
    message: `Seu agendamento foi confirmado para ${req.body.date} às ${req.body.startTime}. Serviço: ${service.name}.`
  });
  
  // Registrar notificação no sistema
  await Notification.create({
    recipient: req.user.id,
    type: 'appointment_confirmation',
    title: 'Agendamento Confirmado',
    message: `Seu agendamento foi confirmado para ${req.body.date} às ${req.body.startTime}. Serviço: ${service.name}.`,
    relatedTo: appointment._id,
    onModel: 'Appointment',
    channel: 'email'
  });
  
  res.status(201).json({
    success: true,
    data: appointment
  });
});

// @desc    Obter todos os agendamentos
// @route   GET /api/appointments
// @access  Private
exports.getAppointments = asyncHandler(async (req, res, next) => {
  let query;
  
  // Se o usuário for cliente, mostrar apenas seus agendamentos
  if (req.user.role === 'client') {
    query = Appointment.find({ client: req.user.id });
  } 
  // Se for barbeiro, mostrar apenas seus agendamentos
  else if (req.user.role === 'barber') {
    const barber = await Barber.findOne({ user: req.user.id });
    if (!barber) {
      return next(new ErrorResponse('Perfil de barbeiro não encontrado', 404));
    }
    query = Appointment.find({ barber: barber._id });
  } 
  // Se for admin, mostrar todos os agendamentos
  else {
    query = Appointment.find();
  }
  
  // Adicionar população
  query = query
    .populate('client', 'name email phone')
    .populate({
      path: 'barber',
      populate: {
        path: 'user',
        select: 'name email'
      }
    })
    .populate('service', 'name price duration')
    .populate('barbershop', 'name address');
  
  const appointments = await query;
  
  res.status(200).json({
    success: true,
    count: appointments.length,
    data: appointments
  });
});

// @desc    Obter um agendamento específico
// @route   GET /api/appointments/:id
// @access  Private
exports.getAppointment = asyncHandler(async (req, res, next) => {
  const appointment = await Appointment.findById(req.params.id)
    .populate('client', 'name email phone')
    .populate({
      path: 'barber',
      populate: {
        path: 'user',
        select: 'name email'
      }
    })
    .populate('service', 'name price duration')
    .populate('barbershop', 'name address');
  
  if (!appointment) {
    return next(new ErrorResponse(`Agendamento não encontrado com id ${req.params.id}`, 404));
  }
  
  // Verificar se o usuário tem permissão para ver este agendamento
  if (
    req.user.role === 'client' && appointment.client._id.toString() !== req.user.id &&
    req.user.role === 'barber' && appointment.barber.user._id.toString() !== req.user.id
  ) {
    return next(new ErrorResponse('Não autorizado a acessar este agendamento', 401));
  }
  
  res.status(200).json({
    success: true,
    data: appointment
  });
});

// @desc    Atualizar agendamento
// @route   PUT /api/appointments/:id
// @access  Private
exports.updateAppointment = asyncHandler(async (req, res, next) => {
  let appointment = await Appointment.findById(req.params.id);
  
  if (!appointment) {
    return next(new ErrorResponse(`Agendamento não encontrado com id ${req.params.id}`, 404));
  }
  
  // Verificar propriedade
  if (
    req.user.role === 'client' && 
    appointment.client.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(new ErrorResponse('Não autorizado a atualizar este agendamento', 401));
  }
  
  // Não permitir alterações em agendamentos concluídos ou cancelados
  if (appointment.status === 'concluído' || appointment.status === 'cancelado') {
    return next(new ErrorResponse('Não é possível modificar um agendamento concluído ou cancelado', 400));
  }
  
  // Se a data ou hora estiver sendo alterada, verificar disponibilidade
  if (req.body.date || req.body.startTime || req.body.barber) {
    const date = req.body.date || appointment.date;
    const startTime = req.body.startTime || appointment.startTime;
    const barber = req.body.barber || appointment.barber;
    
    // Se o serviço estiver sendo alterado, recalcular o horário de término
    if (req.body.service) {
      const service = await Service.findById(req.body.service);
      if (!service) {
        return next(new ErrorResponse(`Serviço não encontrado com id ${req.body.service}`, 404));
      }
      
      const startHour = parseInt(startTime.split(':')[0]);
      const startMinute = parseInt(startTime.split(':')[1]);
      
      const durationMinutes = service.duration;
      
      let endHour = startHour + Math.floor((startMinute + durationMinutes) / 60);
      let endMinute = (startMinute + durationMinutes) % 60;
      
      req.body.endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
      req.body.totalPrice = service.price;
    }
    
    const endTime = req.body.endTime || appointment.endTime;
    
    // Verificar disponibilidade do horário
    const overlappingAppointment = await Appointment.findOne({
      barber,
      date,
      _id: { $ne: req.params.id },
      status: { $nin: ['cancelado'] },
      $or: [
        {
          startTime: { $lt: endTime },
          endTime: { $gt: startTime }
        },
        {
          startTime: startTime,
          endTime: endTime
        }
      ]
    });
    
    if (overlappingAppointment) {
      return next(new ErrorResponse('Horário não disponível para este barbeiro', 400));
    }
  }
  
  appointment = await Appointment.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  
  // Enviar notificação sobre a atualização
  const client = await User.findById(appointment.client);
  
  await sendEmail({
    email: client.email,
    subject: 'Agendamento Atualizado',
    message: `Seu agendamento foi atualizado para ${appointment.date} às ${appointment.startTime}.`
  });
  
  // Registrar notificação no sistema
  await Notification.create({
    recipient: appointment.client,
    type: 'appointment_confirmation',
    title: 'Agendamento Atualizado',
    message: `Seu agendamento foi atualizado para ${appointment.date} às ${appointment.startTime}.`,
    relatedTo: appointment._id,
    onModel: 'Appointment',
    channel: 'email'
  });
  
  res.status(200).json({
    success: true,
    data: appointment
  });
});

// @desc    Excluir agendamento
// @route   DELETE /api/appointments/:id
// @access  Private
exports.deleteAppointment = asyncHandler(async (req, res, next) => {
  const appointment = await Appointment.findById(req.params.id);
  
  if (!appointment) {
    return next(new ErrorResponse(`Agendamento não encontrado com id ${req.params.id}`, 404));
  }
  
  // Verificar propriedade
  if (
    req.user.role === 'client' && 
    appointment.client.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(new ErrorResponse('Não autorizado a excluir este agendamento', 401));
  }
  
  await appointment.remove();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Obter agendamentos de um barbeiro
// @route   GET /api/appointments/barber/:barberId
// @access  Private (Barbeiro, Admin)
exports.getBarberAppointments = asyncHandler(async (req, res, next) => {
  const appointments = await Appointment.find({ barber: req.params.barberId })
    .populate('client', 'name email phone')
    .populate('service', 'name price duration')
    .populate('barbershop', 'name address');
  
  res.status(200).json({
    success: true,
    count: appointments.length,
    data: appointments
  });
});

// @desc    Obter agendamentos de uma barbearia
// @route   GET /api/appointments/barbershop/:barbershopId
// @access  Private (Admin)
exports.getBarbershopAppointments = asyncHandler(async (req, res, next) => {
  const appointments = await Appointment.find({ barbershop: req.params.barbershopId })
    .populate('client', 'name email phone')
    .populate({
      path: 'barber',
      populate: {
        path: 'user',
        select: 'name email'
      }
    })
    .populate('service', 'name price duration');
  
  res.status(200).json({
    success: true,
    count: appointments.length,
    data: appointments
  });
});

// @desc    Confirmar agendamento
// @route   PUT /api/appointments/:id/confirm
// @access  Private (Barbeiro, Admin)
exports.confirmAppointment = asyncHandler(async (req, res, next) => {
  const appointment = await Appointment.findById(req.params.id);
  
  if (!appointment) {
    return next(new ErrorResponse(`Agendamento não encontrado com id ${req.params.id}`, 404));
  }
  
  appointment.status = 'confirmado';
  await appointment.save();
  
  // Enviar notificação por email para o cliente
  const client = await User.findById(appointment.client);
  
  await sendEmail({
    email: client.email,
    subject: 'Agendamento Confirmado pelo Barbeiro',
    message: `Seu agendamento para ${appointment.date} às ${appointment.startTime} foi confirmado pelo barbeiro.`
  });
  
  // Enviar SMS (simulado)
  await sendSMS({
    phone: client.phone,
    message: `Seu agendamento para ${appointment.date} às ${appointment.startTime} foi confirmado pelo barbeiro.`
  });
  
  // Registrar notificação no sistema
  await Notification.create({
    recipient: appointment.client,
    type: 'appointment_confirmation',
    title: 'Agendamento Confirmado pelo Barbeiro',
    message: `Seu agendamento para ${appointment.date} às ${appointment.startTime} foi confirmado pelo barbeiro.`,
    relatedTo: appointment._id,
    onModel: 'Appointment',
    channel: 'sms'
  });
  
  res.status(200).json({
    success: true,
    data: appointment
  });
});

// @desc    Cancelar agendamento
// @route   PUT /api/appointments/:id/cancel
// @access  Private
exports.cancelAppointment = asyncHandler(async (req, res, next) => {
  const appointment = await Appointment.findById(req.params.id);
  
  if (!appointment) {
    return next(new ErrorResponse(`Agendamento não encontrado com id ${req.params.id}`, 404));
  }
  
  // Verificar propriedade para clientes
  if (
    req.user.role === 'client' && 
    appointment.client.toString() !== req.user.id
  ) {
    return next(new ErrorResponse('Não autorizado a cancelar este agendamento', 401));
  }
  
  appointment.status = 'cancelado';
  await appointment.save();
  
  // Determinar quem cancela
  const cancelledBy = req.user.role === 'client' ? 'cliente' : 'barbeiro';
  
  // Enviar notificação apropriada
  if (req.user.role !== 'client') {
    // Barbeiro ou admin cancelou, notificar cliente
    const client = await User.findById(appointment.client);
    
    await sendEmail({
      email: client.email,
      subject: 'Agendamento Cancelado',
      message: `Seu agendamento para ${appointment.date} às ${appointment.startTime} foi cancelado pelo ${cancelledBy}.`
    });
    
    // Registrar notificação no sistema
    await Notification.create({
      recipient: appointment.client,
      type: 'appointment_cancelation',
      title: 'Agendamento Cancelado',
      message: `Seu agendamento para ${appointment.date} às ${appointment.startTime} foi cancelado pelo ${cancelledBy}.`,
      relatedTo: appointment._id,
      onModel: 'Appointment',
      channel: 'email'
    });
  } else {
    // Cliente cancelou, notificar barbeiro
    const barber = await Barber.findById(appointment.barber).populate('user');
    
    await sendEmail({
      email: barber.user.email,
      subject: 'Agendamento Cancelado',
      message: `O agendamento para ${appointment.date} às ${appointment.startTime} foi cancelado pelo cliente.`
    });
    
    // Registrar notificação no sistema
    await Notification.create({
      recipient: barber.user._id,
      type: 'appointment_cancelation',
      title: 'Agendamento Cancelado',
      message: `O agendamento para ${appointment.date} às ${appointment.startTime} foi cancelado pelo cliente.`,
      relatedTo: appointment._id,
      onModel: 'Appointment',
      channel: 'email'
    });
  }
  
  res.status(200).json({
    success: true,
    data: appointment
  });
});

// @desc    Marcar agendamento como concluído
// @route   PUT /api/appointments/:id/complete
// @access  Private (Barbeiro, Admin)
exports.completeAppointment = asyncHandler(async (req, res, next) => {
  const appointment = await Appointment.findById(req.params.id);
  
  if (!appointment) {
    return next(new ErrorResponse(`Agendamento não encontrado com id ${req.params.id}`, 404));
  }
  
  appointment.status = 'concluído';
  appointment.paymentStatus = req.body.paymentStatus || 'pago';
  appointment.paymentMethod = req.body.paymentMethod || appointment.paymentMethod;
  
  await appointment.save();
  
  // Enviar notificação por email para o cliente
  const client = await User.findById(appointment.client);
  
  await sendEmail({
    email: client.email,
    subject: 'Agendamento Concluído',
    message: `Seu agendamento para ${appointment.date} às ${appointment.startTime} foi concluído. Obrigado pela preferência!`
  });
  
  // Registrar notificação no sistema
  await Notification.create({
    recipient: appointment.client,
    type: 'review_request',
    title: 'Como foi seu atendimento?',
    message: `Seu agendamento foi concluído. Que tal avaliar o serviço que você recebeu?`,
    relatedTo: appointment._id,
    onModel: 'Appointment',
    channel: 'email'
  });
  
  res.status(200).json({
    success: true,
    data: appointment
  });
});

// @desc    Avaliar agendamento
// @route   PUT /api/appointments/:id/rate
// @access  Private (Cliente)
exports.rateAppointment = asyncHandler(async (req, res, next) => {
  const { score, comment } = req.body;
  
  if (!score || score < 1 || score > 5) {
    return next(new ErrorResponse('Por favor, forneça uma avaliação válida (1-5)', 400));
  }
  
  const appointment = await Appointment.findById(req.params.id);
  
  if (!appointment) {
    return next(new ErrorResponse(`Agendamento não encontrado com id ${req.params.id}`, 404));
  }
  
  // Verificar se o cliente é o dono do agendamento
  if (appointment.client.toString() !== req.user.id) {
    return next(new ErrorResponse('Não autorizado a avaliar este agendamento', 401));
  }
  
  // Verificar se o agendamento foi concluído
  if (appointment.status !== 'concluído') {
    return next(new ErrorResponse('Apenas agendamentos concluídos podem ser avaliados', 400));
  }
  
  // Adicionar avaliação ao agendamento
  appointment.rating = {
    score,
    comment,
    createdAt: Date.now()
  };
  
  await appointment.save();
  
  // Atualizar a média de avaliações do barbeiro
  const barber = await Barber.findById(appointment.barber);
  
  // Buscar todos os agendamentos concluídos deste barbeiro que tenham avaliação
  const ratedAppointments = await Appointment.find({
    barber: barber._id,
    status: 'concluído',
    'rating.score': { $exists: true }
  });
  
  // Calcular a média
  const totalRating = ratedAppointments.reduce((sum, app) => sum + app.rating.score, 0);
  const averageRating = totalRating / ratedAppointments.length;
  
  // Atualizar a avaliação do barbeiro
  barber.rating = parseFloat(averageRating.toFixed(1));
  
  // Adicionar avaliação à lista de reviews do barbeiro
  barber.reviews.push({
    user: req.user.id,
    text: comment,
    rating: score,
    createdAt: Date.now()
  });
  
  await barber.save();
  
  res.status(200).json({
    success: true,
    data: appointment
  });
});
