const supabase = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');
const userService = require('./userService');
const barberService = require('./barberService');
const serviceService = require('./serviceService');
const notificationService = require('./notificationService');

/**
 * Serviço para gerenciar agendamentos
 */
const appointmentService = {
  /**
   * Criar um novo agendamento
   * @param {Object} appointmentData - Dados do agendamento
   * @returns {Promise<Object>} - Agendamento criado
   */
  async createAppointment(appointmentData) {
    try {
      // Verificar se o serviço existe
      const service = await serviceService.getServiceById(appointmentData.service_id);
      
      if (!service) {
        throw new Error(`Serviço não encontrado com id ${appointmentData.service_id}`);
      }
      
      // Verificar se o barbeiro existe
      const barber = await barberService.getBarberById(appointmentData.barber_id);
      
      if (!barber) {
        throw new Error(`Barbeiro não encontrado com id ${appointmentData.barber_id}`);
      }
      
      // Calcular horário de término com base na duração do serviço
      const startTime = appointmentData.start_time;
      const startHour = parseInt(startTime.split(':')[0]);
      const startMinute = parseInt(startTime.split(':')[1]);
      
      const durationMinutes = service.duration;
      
      let endHour = startHour + Math.floor((startMinute + durationMinutes) / 60);
      let endMinute = (startMinute + durationMinutes) % 60;
      
      const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
      
      // Adicionar horário de término e preço total ao agendamento
      appointmentData.end_time = endTime;
      appointmentData.total_price = service.price;
      
      // Verificar disponibilidade do horário
      const { data: overlappingAppointments, error: checkError } = await supabase
        .from('appointments')
        .select('*')
        .eq('barber_id', appointmentData.barber_id)
        .eq('date', appointmentData.date)
        .neq('status', 'cancelado')
        .or(`start_time.lt.${endTime},end_time.gt.${startTime}`);
      
      if (checkError) throw new Error('Erro ao verificar disponibilidade');
      
      if (overlappingAppointments && overlappingAppointments.length > 0) {
        throw new Error('Horário não disponível para este barbeiro');
      }
      
      // Gerar ID único
      const appointmentId = uuidv4();
      
      // Preparar dados do agendamento
      const newAppointment = {
        id: appointmentId,
        client_id: appointmentData.client_id,
        barber_id: appointmentData.barber_id,
        barbershop_id: barber.barbershop_id,
        service_id: appointmentData.service_id,
        date: appointmentData.date,
        start_time: startTime,
        end_time: endTime,
        status: 'agendado',
        total_price: service.price,
        payment_status: 'pendente',
        payment_method: appointmentData.payment_method || 'dinheiro',
        notes: appointmentData.notes || '',
        notification_status: {
          reminder_sent: false,
          confirmation_sent: false
        },
        created_at: new Date()
      };
      
      // Criar o agendamento no Supabase
      const { data, error } = await supabase
        .from('appointments')
        .insert(newAppointment)
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      
      // Enviar notificação por email para o cliente
      try {
        const client = await userService.getUserById(appointmentData.client_id);
        
        // Criar notificação no sistema
        await notificationService.createNotification({
          recipient_id: appointmentData.client_id,
          type: 'appointment_confirmation',
          title: 'Agendamento Confirmado',
          message: `Seu agendamento foi confirmado para ${appointmentData.date} às ${appointmentData.start_time}. Serviço: ${service.name}.`,
          related_to: appointmentId,
          on_model: 'appointment',
          channel: 'email'
        });
      } catch (notifError) {
        console.error('Erro ao enviar notificação:', notifError);
        // Não interromper o fluxo se a notificação falhar
      }
      
      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obter agendamento pelo ID
   * @param {string} appointmentId - ID do agendamento
   * @returns {Promise<Object>} - Dados do agendamento
   */
  async getAppointmentById(appointmentId) {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          client:users!client_id(*),
          barber:barbers!barber_id(
            *,
            user:users(*)
          ),
          service:services(*),
          barbershop:barbershops(*)
        `)
        .eq('id', appointmentId)
        .single();

      if (error) throw new Error('Agendamento não encontrado');

      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Listar todos os agendamentos
   * @param {Object} filter - Filtros opcionais
   * @returns {Promise<Array>} - Lista de agendamentos
   */
  async listAppointments(filter = {}) {
    try {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          client:users!client_id(id, name, email, phone),
          barber:barbers!barber_id(
            id,
            user:users(id, name)
          ),
          service:services(id, name, price, duration),
          barbershop:barbershops(id, name, address)
        `);

      // Aplicar filtros se houver
      if (filter.client_id) {
        query = query.eq('client_id', filter.client_id);
      }

      if (filter.barber_id) {
        query = query.eq('barber_id', filter.barber_id);
      }

      if (filter.barbershop_id) {
        query = query.eq('barbershop_id', filter.barbershop_id);
      }

      if (filter.status) {
        query = query.eq('status', filter.status);
      }

      if (filter.date) {
        query = query.eq('date', filter.date);
      }

      if (filter.date_from && filter.date_to) {
        query = query
          .gte('date', filter.date_from)
          .lte('date', filter.date_to);
      }

      // Ordenar por data e hora
      query = query.order('date', { ascending: true }).order('start_time', { ascending: true });

      const { data, error } = await query;

      if (error) throw new Error('Erro ao listar agendamentos');

      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Atualizar um agendamento
   * @param {string} appointmentId - ID do agendamento
   * @param {Object} appointmentData - Novos dados do agendamento
   * @returns {Promise<Object>} - Agendamento atualizado
   */
  async updateAppointment(appointmentId, appointmentData, userId) {
    try {
      // Buscar o agendamento atual
      const currentAppointment = await this.getAppointmentById(appointmentId);
      
      if (!currentAppointment) {
        throw new Error('Agendamento não encontrado');
      }
      
      // Verificar permissão (cliente só pode atualizar seus próprios agendamentos)
      if (currentAppointment.client.id !== userId && userId !== currentAppointment.barber.user.id) {
        throw new Error('Não autorizado a atualizar este agendamento');
      }
      
      // Não permitir alterações em agendamentos concluídos ou cancelados
      if (currentAppointment.status === 'concluído' || currentAppointment.status === 'cancelado') {
        throw new Error('Não é possível modificar um agendamento concluído ou cancelado');
      }
      
      // Se a data, hora ou barbeiro estiver sendo alterado, verificar disponibilidade
      if (appointmentData.date || appointmentData.start_time || appointmentData.barber_id) {
        const date = appointmentData.date || currentAppointment.date;
        const startTime = appointmentData.start_time || currentAppointment.start_time;
        const barberId = appointmentData.barber_id || currentAppointment.barber_id;
        
        // Se o serviço estiver sendo alterado, recalcular o horário de término
        let endTime = currentAppointment.end_time;
        let totalPrice = currentAppointment.total_price;
        
        if (appointmentData.service_id) {
          const service = await serviceService.getServiceById(appointmentData.service_id);
          
          if (!service) {
            throw new Error(`Serviço não encontrado com id ${appointmentData.service_id}`);
          }
          
          const startHour = parseInt(startTime.split(':')[0]);
          const startMinute = parseInt(startTime.split(':')[1]);
          
          const durationMinutes = service.duration;
          
          let endHour = startHour + Math.floor((startMinute + durationMinutes) / 60);
          let endMinute = (startMinute + durationMinutes) % 60;
          
          endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
          totalPrice = service.price;
          
          appointmentData.end_time = endTime;
          appointmentData.total_price = totalPrice;
        }
        
        // Verificar disponibilidade do horário
        const { data: overlappingAppointments, error: checkError } = await supabase
          .from('appointments')
          .select('*')
          .eq('barber_id', barberId)
          .eq('date', date)
          .neq('id', appointmentId) // Excluir o próprio agendamento
          .neq('status', 'cancelado')
          .or(`start_time.lt.${endTime},end_time.gt.${startTime}`);
        
        if (checkError) throw new Error('Erro ao verificar disponibilidade');
        
        if (overlappingAppointments && overlappingAppointments.length > 0) {
          throw new Error('Horário não disponível para este barbeiro');
        }
      }
      
      // Remover campos que não devem ser atualizados diretamente
      delete appointmentData.id;
      delete appointmentData.client_id;
      delete appointmentData.created_at;
      
      // Atualizar o agendamento
      const { data, error } = await supabase
        .from('appointments')
        .update(appointmentData)
        .eq('id', appointmentId)
        .select()
        .single();
      
      if (error) throw new Error('Erro ao atualizar agendamento');
      
      // Enviar notificação sobre a atualização
      try {
        await notificationService.createNotification({
          recipient_id: currentAppointment.client_id,
          type: 'appointment_confirmation',
          title: 'Agendamento Atualizado',
          message: `Seu agendamento foi atualizado para ${appointmentData.date || currentAppointment.date} às ${appointmentData.start_time || currentAppointment.start_time}.`,
          related_to: appointmentId,
          on_model: 'appointment',
          channel: 'email'
        });
      } catch (notifError) {
        console.error('Erro ao enviar notificação:', notifError);
        // Não interromper o fluxo se a notificação falhar
      }
      
      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Cancelar um agendamento
   * @param {string} appointmentId - ID do agendamento
   * @param {string} userId - ID do usuário que está cancelando
   * @returns {Promise<Object>} - Agendamento cancelado
   */
  async cancelAppointment(appointmentId, userId) {
    try {
      // Buscar o agendamento atual
      const appointment = await this.getAppointmentById(appointmentId);
      
      if (!appointment) {
        throw new Error('Agendamento não encontrado');
      }
      
      // Verificar permissão (cliente só pode cancelar seus próprios agendamentos)
      const isClient = appointment.client.id === userId;
      const isBarber = appointment.barber.user.id === userId;
      
      if (!isClient && !isBarber) {
        throw new Error('Não autorizado a cancelar este agendamento');
      }
      
      // Atualizar o status do agendamento
      const { data, error } = await supabase
        .from('appointments')
        .update({ status: 'cancelado' })
        .eq('id', appointmentId)
        .select()
        .single();
      
      if (error) throw new Error('Erro ao cancelar agendamento');
      
      // Determinar quem cancela
      const cancelledBy = isClient ? 'cliente' : 'barbeiro';
      
      // Enviar notificação apropriada
      try {
        if (!isClient) {
          // Barbeiro cancelou, notificar cliente
          await notificationService.createNotification({
            recipient_id: appointment.client.id,
            type: 'appointment_cancelation',
            title: 'Agendamento Cancelado',
            message: `Seu agendamento para ${appointment.date} às ${appointment.start_time} foi cancelado pelo ${cancelledBy}.`,
            related_to: appointmentId,
            on_model: 'appointment',
            channel: 'email'
          });
        } else {
          // Cliente cancelou, notificar barbeiro
          await notificationService.createNotification({
            recipient_id: appointment.barber.user.id,
            type: 'appointment_cancelation',
            title: 'Agendamento Cancelado',
            message: `O agendamento para ${appointment.date} às ${appointment.start_time} foi cancelado pelo cliente.`,
            related_to: appointmentId,
            on_model: 'appointment',
            channel: 'email'
          });
        }
      } catch (notifError) {
        console.error('Erro ao enviar notificação:', notifError);
        // Não interromper o fluxo se a notificação falhar
      }
      
      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Confirmar um agendamento (apenas barbeiro)
   * @param {string} appointmentId - ID do agendamento
   * @param {string} barberId - ID do barbeiro que está confirmando
   * @returns {Promise<Object>} - Agendamento confirmado
   */
  async confirmAppointment(appointmentId, barberId) {
    try {
      // Buscar o agendamento atual
      const appointment = await this.getAppointmentById(appointmentId);
      
      if (!appointment) {
        throw new Error('Agendamento não encontrado');
      }
      
      // Verificar permissão
      if (appointment.barber.id !== barberId) {
        throw new Error('Não autorizado a confirmar este agendamento');
      }
      
      // Atualizar o status do agendamento
      const { data, error } = await supabase
        .from('appointments')
        .update({ status: 'confirmado' })
        .eq('id', appointmentId)
        .select()
        .single();
      
      if (error) throw new Error('Erro ao confirmar agendamento');
      
      // Enviar notificação para o cliente
      try {
        await notificationService.createNotification({
          recipient_id: appointment.client.id,
          type: 'appointment_confirmation',
          title: 'Agendamento Confirmado pelo Barbeiro',
          message: `Seu agendamento para ${appointment.date} às ${appointment.start_time} foi confirmado pelo barbeiro.`,
          related_to: appointmentId,
          on_model: 'appointment',
          channel: 'email'
        });
        
        // Também enviar por SMS
        await notificationService.createNotification({
          recipient_id: appointment.client.id,
          type: 'appointment_confirmation',
          title: 'Agendamento Confirmado pelo Barbeiro',
          message: `Seu agendamento para ${appointment.date} às ${appointment.start_time} foi confirmado pelo barbeiro.`,
          related_to: appointmentId,
          on_model: 'appointment',
          channel: 'sms'
        });
      } catch (notifError) {
        console.error('Erro ao enviar notificação:', notifError);
        // Não interromper o fluxo se a notificação falhar
      }
      
      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Marcar agendamento como concluído (apenas barbeiro)
   * @param {string} appointmentId - ID do agendamento
   * @param {string} barberId - ID do barbeiro que está marcando como concluído
   * @param {Object} paymentInfo - Informações do pagamento
   * @returns {Promise<Object>} - Agendamento concluído
   */
  async completeAppointment(appointmentId, barberId, paymentInfo = {}) {
    try {
      // Buscar o agendamento atual
      const appointment = await this.getAppointmentById(appointmentId);
      
      if (!appointment) {
        throw new Error('Agendamento não encontrado');
      }
      
      // Verificar permissão
      if (appointment.barber.id !== barberId) {
        throw new Error('Não autorizado a concluir este agendamento');
      }
      
      // Preparar dados de atualização
      const updateData = {
        status: 'concluído',
        payment_status: paymentInfo.payment_status || 'pago',
        payment_method: paymentInfo.payment_method || appointment.payment_method
      };
      
      // Atualizar o agendamento
      const { data, error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', appointmentId)
        .select()
        .single();
      
      if (error) throw new Error('Erro ao concluir agendamento');
      
      // Enviar notificação para o cliente
      try {
        await notificationService.createNotification({
          recipient_id: appointment.client.id,
          type: 'appointment_completed',
          title: 'Agendamento Concluído',
          message: `Seu agendamento para ${appointment.date} às ${appointment.start_time} foi concluído. Obrigado pela preferência!`,
          related_to: appointmentId,
          on_model: 'appointment',
          channel: 'email'
        });
        
        // Também enviar solicitação de avaliação
        await notificationService.createNotification({
          recipient_id: appointment.client.id,
          type: 'review_request',
          title: 'Como foi seu atendimento?',
          message: `Seu agendamento foi concluído. Que tal avaliar o serviço que você recebeu?`,
          related_to: appointmentId,
          on_model: 'appointment',
          channel: 'email'
        });
      } catch (notifError) {
        console.error('Erro ao enviar notificação:', notifError);
        // Não interromper o fluxo se a notificação falhar
      }
      
      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Avaliar um agendamento (apenas cliente)
   * @param {string} appointmentId - ID do agendamento
   * @param {string} clientId - ID do cliente que está avaliando
   * @param {Object} ratingData - Dados da avaliação
   * @returns {Promise<Object>} - Agendamento avaliado
   */
  async rateAppointment(appointmentId, clientId, ratingData) {
    try {
      // Verificar se a avaliação é válida
      if (!ratingData.score || ratingData.score < 1 || ratingData.score > 5) {
        throw new Error('Por favor, forneça uma avaliação válida (1-5)');
      }
      
      // Buscar o agendamento atual
      const appointment = await this.getAppointmentById(appointmentId);
      
      if (!appointment) {
        throw new Error('Agendamento não encontrado');
      }
      
      // Verificar permissão
      if (appointment.client.id !== clientId) {
        throw new Error('Não autorizado a avaliar este agendamento');
      }
      
      // Verificar se o agendamento foi concluído
      if (appointment.status !== 'concluído') {
        throw new Error('Apenas agendamentos concluídos podem ser avaliados');
      }
      
      // Adicionar avaliação ao agendamento
      const rating = {
        score: ratingData.score,
        comment: ratingData.comment || '',
        created_at: new Date()
      };
      
      // Atualizar o agendamento
      const { data, error } = await supabase
        .from('appointments')
        .update({ rating })
        .eq('id', appointmentId)
        .select()
        .single();
      
      if (error) throw new Error('Erro ao avaliar agendamento');
      
      // Adicionar avaliação à lista de reviews do barbeiro
      try {
        await barberService.addReview(appointment.barber.id, {
          user_id: clientId,
          text: ratingData.comment || '',
          rating: ratingData.score
        });
      } catch (reviewError) {
        console.error('Erro ao adicionar review ao barbeiro:', reviewError);
        // Não interromper o fluxo se falhar
      }
      
      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Buscar disponibilidade de um barbeiro em uma data específica
   * @param {string} barberId - ID do barbeiro
   * @param {string} date - Data no formato YYYY-MM-DD
   * @returns {Promise<Array>} - Lista de horários disponíveis
   */
  async getBarberAvailability(barberId, date) {
    try {
      // Buscar informações do barbeiro
      const barber = await barberService.getBarberById(barberId);
      
      if (!barber) {
        throw new Error('Barbeiro não encontrado');
      }
      
      // Obter dia da semana (0-6, onde 0 é domingo)
      const dayOfWeek = new Date(date).getDay();
      
      // Buscar horário de trabalho do barbeiro para este dia
      const workDay = barber.working_hours.find(day => day.day === dayOfWeek);
      
      if (!workDay || !workDay.is_available) {
        return []; // Barbeiro não trabalha neste dia
      }
      
      // Definir intervalos de tempo (assumindo intervalos de 30 minutos)
      const timeSlots = [];
      
      const startHour = parseInt(workDay.start.split(':')[0]);
      const startMinute = parseInt(workDay.start.split(':')[1]);
      const endHour = parseInt(workDay.end.split(':')[0]);
      const endMinute = parseInt(workDay.end.split(':')[1]);
      
      // Horário atual em minutos desde o início do dia
      let currentTime = startHour * 60 + startMinute;
      const endTime = endHour * 60 + endMinute;
      
      // Gerar slots de 30 minutos
      while (currentTime < endTime) {
        const hour = Math.floor(currentTime / 60);
        const minute = currentTime % 60;
        
        timeSlots.push(
          `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        );
        
        // Avançar 30 minutos
        currentTime += 30;
      }
      
      // Buscar agendamentos existentes para este barbeiro nesta data
      const { data: existingAppointments, error } = await supabase
        .from('appointments')
        .select('start_time, end_time')
        .eq('barber_id', barberId)
        .eq('date', date)
        .neq('status', 'cancelado');
      
      if (error) throw new Error('Erro ao buscar agendamentos existentes');
      
      // Filtrar slots ocupados
      const availableSlots = timeSlots.filter(slot => {
        // Verificar se este slot não conflita com nenhum agendamento existente
        return !existingAppointments.some(appointment => {
          const slotTime = slot;
          const startTime = appointment.start_time;
          const endTime = appointment.end_time;
          
          // Verificar se o slot está dentro de um agendamento existente
          return slotTime >= startTime && slotTime < endTime;
        });
      });
      
      return availableSlots;
    } catch (error) {
      throw error;
    }
  }
};

module.exports = appointmentService;
