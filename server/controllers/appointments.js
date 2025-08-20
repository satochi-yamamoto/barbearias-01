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
  req.body.client_id = req.user.id;
  
  const service = await Service.findById(req.body.service_id);
  if (!service) {
    return next(new ErrorResponse(`Serviço não encontrado com id ${req.body.service_id}`, 404));
  }
  
  const barber = await Barber.findById(req.body.barber_id);
  if (!barber) {
    return next(new ErrorResponse(`Barbeiro não encontrado com id ${req.body.barber_id}`, 404));
  }
  
  const startTime = req.body.start_time;
  const startHour = parseInt(startTime.split(':')[0]);
  const startMinute = parseInt(startTime.split(':')[1]);
  
  const durationMinutes = service.duration;
  
  let endHour = startHour + Math.floor((startMinute + durationMinutes) / 60);
  let endMinute = (startMinute + durationMinutes) % 60;
  
  const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
  
  req.body.end_time = endTime;
  req.body.total_price = service.price;
  
  const { data: overlappingAppointment, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('barber_id', req.body.barber_id)
    .eq('date', req.body.date)
    .neq('status', 'cancelado')
    .or(`start_time.lt.${endTime},end_time.gt.${startTime}`);

  if (error) {
    return next(new ErrorResponse(error.message, 500));
  }

  if (overlappingAppointment && overlappingAppointment.length > 0) {
    return next(new ErrorResponse('Horário não disponível para este barbeiro', 400));
  }
  
  const appointment = await Appointment.create(req.body);
  
  const client = await User.findById(req.user.id);
  
  await sendEmail({
    email: client.email,
    subject: 'Agendamento Confirmado',
    message: `Seu agendamento foi confirmado para ${req.body.date} às ${req.body.start_time}. Serviço: ${service.name}.`
  });
  
  await Notification.create({
    recipient_id: req.user.id,
    type: 'appointment_confirmation',
    title: 'Agendamento Confirmado',
    message: `Seu agendamento foi confirmado para ${req.body.date} às ${req.body.start_time}. Serviço: ${service.name}.`,
    related_to: appointment.id,
    on_model: 'Appointment',
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
  
  if (req.user.role === 'client') {
    query = Appointment.findByClientId(req.user.id);
  } 
  else if (req.user.role === 'barber') {
    const barber = await Barber.findOne({ user_id: req.user.id });
    if (!barber) {
      return next(new ErrorResponse('Perfil de barbeiro não encontrado', 404));
    }
    query = Appointment.findByBarberId(barber.id);
  } 
  else {
    query = Appointment.findAll();
  }
  
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
  const appointment = await Appointment.findById(req.params.id);
  
  if (!appointment) {
    return next(new ErrorResponse(`Agendamento não encontrado com id ${req.params.id}`, 404));
  }
  
  if (
    req.user.role === 'client' && appointment.client_id.id.toString() !== req.user.id &&
    req.user.role === 'barber' && appointment.barber_id.user_id.toString() !== req.user.id
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
  
  if (
    req.user.role === 'client' && 
    appointment.client_id.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(new ErrorResponse('Não autorizado a atualizar este agendamento', 401));
  }
  
  if (appointment.status === 'concluído' || appointment.status === 'cancelado') {
    return next(new ErrorResponse('Não é possível modificar um agendamento concluído ou cancelado', 400));
  }
  
  if (req.body.date || req.body.start_time || req.body.barber_id) {
    const date = req.body.date || appointment.date;
    const startTime = req.body.start_time || appointment.start_time;
    const barberId = req.body.barber_id || appointment.barber_id;
    
    if (req.body.service_id) {
      const service = await Service.findById(req.body.service_id);
      if (!service) {
        return next(new ErrorResponse(`Serviço não encontrado com id ${req.body.service_id}`, 404));
      }
      
      const startHour = parseInt(startTime.split(':')[0]);
      const startMinute = parseInt(startTime.split(':')[1]);
      
      const durationMinutes = service.duration;
      
      let endHour = startHour + Math.floor((startMinute + durationMinutes) / 60);
      let endMinute = (startMinute + durationMinutes) % 60;
      
      req.body.end_time = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
      req.body.total_price = service.price;
    }
    
    const endTime = req.body.end_time || appointment.end_time;
    
    const { data: overlappingAppointment, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('barber_id', barberId)
      .eq('date', date)
      .neq('id', req.params.id)
      .neq('status', 'cancelado')
      .or(`start_time.lt.${endTime},end_time.gt.${startTime}`);

    if (error) {
      return next(new ErrorResponse(error.message, 500));
    }

    if (overlappingAppointment && overlappingAppointment.length > 0) {
      return next(new ErrorResponse('Horário não disponível para este barbeiro', 400));
    }
  }
  
  appointment = await Appointment.update(req.params.id, req.body);
  
  const client = await User.findById(appointment.client_id);
  
  await sendEmail({
    email: client.email,
    subject: 'Agendamento Atualizado',
    message: `Seu agendamento foi atualizado para ${appointment.date} às ${appointment.start_time}.`
  });
  
  await Notification.create({
    recipient_id: appointment.client_id,
    type: 'appointment_confirmation',
    title: 'Agendamento Atualizado',
    message: `Seu agendamento foi atualizado para ${appointment.date} às ${appointment.start_time}.`,
    related_to: appointment.id,
    on_model: 'Appointment',
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
  
  if (
    req.user.role === 'client' && 
    appointment.client_id.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(new ErrorResponse('Não autorizado a excluir este agendamento', 401));
  }
  
  await Appointment.delete(req.params.id);
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Obter agendamentos de um barbeiro
// @route   GET /api/appointments/barber/:barberId
// @access  Private (Barbeiro, Admin)
exports.getBarberAppointments = asyncHandler(async (req, res, next) => {
  const appointments = await Appointment.findByBarberId(req.params.barberId);
  
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
  const { data: appointments, error } = await supabase
    .from('appointments')
    .select('*, client:client_id(*), barber:barber_id(*), service:service_id(*)')
    .eq('barbershop_id', req.params.barbershopId);

  if (error) {
    return next(new ErrorResponse(error.message, 500));
  }
  
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
  
  const updatedAppointment = await Appointment.update(req.params.id, { status: 'confirmado' });
  
  const client = await User.findById(appointment.client_id);
  
  await sendEmail({
    email: client.email,
    subject: 'Agendamento Confirmado pelo Barbeiro',
    message: `Seu agendamento para ${appointment.date} às ${appointment.start_time} foi confirmado pelo barbeiro.`
  });
  
  await sendSMS({
    phone: client.phone,
    message: `Seu agendamento para ${appointment.date} às ${appointment.start_time} foi confirmado pelo barbeiro.`
  });
  
  await Notification.create({
    recipient_id: appointment.client_id,
    type: 'appointment_confirmation',
    title: 'Agendamento Confirmado pelo Barbeiro',
    message: `Seu agendamento para ${appointment.date} às ${appointment.start_time} foi confirmado pelo barbeiro.`,
    related_to: appointment.id,
    on_model: 'Appointment',
    channel: 'sms'
  });
  
  res.status(200).json({
    success: true,
    data: updatedAppointment
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
  
  if (
    req.user.role === 'client' && 
    appointment.client_id.toString() !== req.user.id
  ) {
    return next(new ErrorResponse('Não autorizado a cancelar este agendamento', 401));
  }
  
  const updatedAppointment = await Appointment.update(req.params.id, { status: 'cancelado' });
  
  const cancelledBy = req.user.role === 'client' ? 'cliente' : 'barbeiro';
  
  if (req.user.role !== 'client') {
    const client = await User.findById(appointment.client_id);
    
    await sendEmail({
      email: client.email,
      subject: 'Agendamento Cancelado',
      message: `Seu agendamento para ${appointment.date} às ${appointment.start_time} foi cancelado pelo ${cancelledBy}.`
    });
    
    await Notification.create({
      recipient_id: appointment.client_id,
      type: 'appointment_cancelation',
      title: 'Agendamento Cancelado',
      message: `Seu agendamento para ${appointment.date} às ${appointment.start_time} foi cancelado pelo ${cancelledBy}.`,
      related_to: appointment.id,
      on_model: 'Appointment',
      channel: 'email'
    });
  } else {
    const barber = await Barber.findById(appointment.barber_id);
    const barberUser = await User.findById(barber.user_id);
    
    await sendEmail({
      email: barberUser.email,
      subject: 'Agendamento Cancelado',
      message: `O agendamento para ${appointment.date} às ${appointment.start_time} foi cancelado pelo cliente.`
    });
    
    await Notification.create({
      recipient_id: barber.user_id,
      type: 'appointment_cancelation',
      title: 'Agendamento Cancelado',
      message: `O agendamento para ${appointment.date} às ${appointment.start_time} foi cancelado pelo cliente.`,
      related_to: appointment.id,
      on_model: 'Appointment',
      channel: 'email'
    });
  }
  
  res.status(200).json({
    success: true,
    data: updatedAppointment
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
  
  const updatedAppointment = await Appointment.update(req.params.id, {
    status: 'concluído',
    payment_status: req.body.payment_status || 'pago',
    payment_method: req.body.payment_method || appointment.payment_method
  });
  
  const client = await User.findById(appointment.client_id);
  
  await sendEmail({
    email: client.email,
    subject: 'Agendamento Concluído',
    message: `Seu agendamento para ${appointment.date} às ${appointment.start_time} foi concluído. Obrigado pela preferência!`
  });
  
  await Notification.create({
    recipient_id: appointment.client_id,
    type: 'review_request',
    title: 'Como foi seu atendimento?',
    message: `Seu agendamento foi concluído. Que tal avaliar o serviço que você recebeu?`,
    related_to: appointment.id,
    on_model: 'Appointment',
    channel: 'email'
  });
  
  res.status(200).json({
    success: true,
    data: updatedAppointment
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
  
  if (appointment.client_id.toString() !== req.user.id) {
    return next(new ErrorResponse('Não autorizado a avaliar este agendamento', 401));
  }
  
  if (appointment.status !== 'concluído') {
    return next(new ErrorResponse('Apenas agendamentos concluídos podem ser avaliados', 400));
  }
  
  const updatedAppointment = await Appointment.update(req.params.id, {
    rating: {
      score,
      comment,
      created_at: new Date()
    }
  });
  
  const barber = await Barber.findById(appointment.barber_id);
  
  const { data: ratedAppointments, error } = await supabase
    .from('appointments')
    .select('rating')
    .eq('barber_id', barber.id)
    .eq('status', 'concluído')
    .not('rating', 'is', null);

  if (error) {
    return next(new ErrorResponse(error.message, 500));
  }

  const totalRating = ratedAppointments.reduce((sum, app) => sum + app.rating.score, 0);
  const averageRating = totalRating / ratedAppointments.length;
  
  await Barber.update(barber.id, { rating: parseFloat(averageRating.toFixed(1)) });
  
  res.status(200).json({
    success: true,
    data: updatedAppointment
  });
});
