const supabase = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');

/**
 * Serviço para gerenciar notificações
 */
const notificationService = {
  /**
   * Criar uma nova notificação
   * @param {Object} notificationData - Dados da notificação
   * @returns {Promise<Object>} - Notificação criada
   */
  async createNotification(notificationData) {
    try {
      // Validar dados necessários
      if (!notificationData.recipient_id) {
        throw new Error('ID do destinatário é obrigatório');
      }
      
      if (!notificationData.type) {
        throw new Error('Tipo da notificação é obrigatório');
      }
      
      if (!notificationData.title || !notificationData.message) {
        throw new Error('Título e mensagem são obrigatórios');
      }
      
      // Gerar ID único
      const notificationId = uuidv4();
      
      // Preparar dados da notificação
      const newNotification = {
        id: notificationId,
        recipient_id: notificationData.recipient_id,
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        related_to: notificationData.related_to || null,
        on_model: notificationData.on_model || null,
        is_read: false,
        channel: notificationData.channel || 'app',
        sent: false,
        error: null,
        created_at: new Date()
      };
      
      // Inserir no banco de dados
      const { data, error } = await supabase
        .from('notifications')
        .insert(newNotification)
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      
      // Se for notificação por email ou SMS, enviar
      if (notificationData.channel === 'email' || notificationData.channel === 'sms') {
        await this.sendNotification(notificationId);
      }
      
      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Enviar uma notificação por email ou SMS
   * @param {string} notificationId - ID da notificação
   * @returns {Promise<Object>} - Notificação atualizada
   */
  async sendNotification(notificationId) {
    try {
      // Buscar a notificação
      const { data: notification, error } = await supabase
        .from('notifications')
        .select(`
          *,
          recipient:users!recipient_id(email, phone)
        `)
        .eq('id', notificationId)
        .single();
      
      if (error) throw new Error('Notificação não encontrada');
      
      // Verificar o canal de envio
      let success = false;
      let errorMessage = null;
      
      try {
        if (notification.channel === 'email') {
          // Enviar email
          await this.sendEmail(
            notification.recipient.email,
            notification.title,
            notification.message
          );
          success = true;
        } else if (notification.channel === 'sms') {
          // Enviar SMS
          await this.sendSMS(
            notification.recipient.phone,
            notification.message
          );
          success = true;
        } else {
          throw new Error(`Canal de envio não suportado: ${notification.channel}`);
        }
      } catch (sendError) {
        errorMessage = sendError.message;
      }
      
      // Atualizar status da notificação
      const { data, error: updateError } = await supabase
        .from('notifications')
        .update({
          sent: success,
          error: errorMessage,
          sent_at: success ? new Date() : null
        })
        .eq('id', notificationId)
        .select()
        .single();
      
      if (updateError) throw new Error('Erro ao atualizar status da notificação');
      
      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Enviar email
   * @param {string} to - Email do destinatário
   * @param {string} subject - Assunto do email
   * @param {string} body - Corpo do email
   * @returns {Promise<void>}
   */
  async sendEmail(to, subject, body) {
    try {
      // Em um ambiente real, aqui seria a integração com um serviço de email como Nodemailer
      // Para fins de demonstração, vamos apenas simular o envio
      
      console.log(`Enviando email para ${to}:`);
      console.log(`Assunto: ${subject}`);
      console.log(`Mensagem: ${body}`);
      
      // Simular delay de envio
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Em produção, você usaria um serviço real como:
      /*
      const nodemailer = require('nodemailer');
      
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
      
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: to,
        subject: subject,
        text: body,
        html: `<div>${body}</div>`
      });
      */
      
      return true;
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      throw error;
    }
  },

  /**
   * Enviar SMS
   * @param {string} to - Número de telefone do destinatário
   * @param {string} message - Mensagem do SMS
   * @returns {Promise<void>}
   */
  async sendSMS(to, message) {
    try {
      // Em um ambiente real, aqui seria a integração com um serviço de SMS como Twilio
      // Para fins de demonstração, vamos apenas simular o envio
      
      console.log(`Enviando SMS para ${to}:`);
      console.log(`Mensagem: ${message}`);
      
      // Simular delay de envio
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Em produção, você usaria um serviço real como:
      /*
      const twilio = require('twilio');
      
      const client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      
      await client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: to
      });
      */
      
      return true;
    } catch (error) {
      console.error('Erro ao enviar SMS:', error);
      throw error;
    }
  },

  /**
   * Listar notificações de um usuário
   * @param {string} userId - ID do usuário
   * @param {Object} filter - Filtros opcionais
   * @returns {Promise<Array>} - Lista de notificações
   */
  async listUserNotifications(userId, filter = {}) {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', userId);
      
      // Aplicar filtros
      if (filter.is_read !== undefined) {
        query = query.eq('is_read', filter.is_read);
      }
      
      if (filter.type) {
        query = query.eq('type', filter.type);
      }
      
      if (filter.channel) {
        query = query.eq('channel', filter.channel);
      }
      
      // Ordenar por data de criação (mais recente primeiro)
      query = query.order('created_at', { ascending: false });
      
      // Limitar resultados se necessário
      if (filter.limit) {
        query = query.limit(filter.limit);
      }
      
      const { data, error } = await query;
      
      if (error) throw new Error('Erro ao listar notificações');
      
      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Marcar notificação como lida
   * @param {string} notificationId - ID da notificação
   * @param {string} userId - ID do usuário que está marcando como lida
   * @returns {Promise<Object>} - Notificação atualizada
   */
  async markAsRead(notificationId, userId) {
    try {
      // Verificar se a notificação pertence ao usuário
      const { data: notification, error: checkError } = await supabase
        .from('notifications')
        .select('recipient_id')
        .eq('id', notificationId)
        .single();
      
      if (checkError) throw new Error('Notificação não encontrada');
      
      if (notification.recipient_id !== userId) {
        throw new Error('Não autorizado a marcar esta notificação como lida');
      }
      
      // Atualizar notificação
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .select()
        .single();
      
      if (error) throw new Error('Erro ao marcar notificação como lida');
      
      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Marcar todas as notificações de um usuário como lidas
   * @param {string} userId - ID do usuário
   * @returns {Promise<number>} - Número de notificações atualizadas
   */
  async markAllAsRead(userId) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('recipient_id', userId)
        .eq('is_read', false);
      
      if (error) throw new Error('Erro ao marcar notificações como lidas');
      
      // Retorna o número de registros atualizados
      return data ? data.length : 0;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Excluir uma notificação
   * @param {string} notificationId - ID da notificação
   * @param {string} userId - ID do usuário que está excluindo
   * @returns {Promise<boolean>} - Verdadeiro se excluída com sucesso
   */
  async deleteNotification(notificationId, userId) {
    try {
      // Verificar se a notificação pertence ao usuário
      const { data: notification, error: checkError } = await supabase
        .from('notifications')
        .select('recipient_id')
        .eq('id', notificationId)
        .single();
      
      if (checkError) throw new Error('Notificação não encontrada');
      
      if (notification.recipient_id !== userId) {
        throw new Error('Não autorizado a excluir esta notificação');
      }
      
      // Excluir notificação
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);
      
      if (error) throw new Error('Erro ao excluir notificação');
      
      return true;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Enviar lembretes para agendamentos próximos
   * @returns {Promise<number>} - Número de lembretes enviados
   */
  async sendAppointmentReminders() {
    try {
      // Buscar data atual
      const today = new Date();
      const formattedDate = today.toISOString().split('T')[0];
      
      // Buscar agendamentos para o dia seguinte que ainda não receberam lembrete
      const { data: appointments, error } = await supabase
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
        .eq('date', formattedDate)
        .eq('status', 'agendado')
        .is('notification_status->reminder_sent', false);
      
      if (error) throw new Error('Erro ao buscar agendamentos para lembrete');
      
      let remindersSent = 0;
      
      // Enviar lembretes para cada agendamento
      for (const appointment of appointments) {
        try {
          // Criar notificação de lembrete
          await this.createNotification({
            recipient_id: appointment.client.id,
            type: 'appointment_reminder',
            title: 'Lembrete de Agendamento',
            message: `Lembrete: Você tem um agendamento amanhã, ${appointment.date}, às ${appointment.start_time} na barbearia ${appointment.barbershop.name} com o barbeiro ${appointment.barber.user.name}. Serviço: ${appointment.service.name}.`,
            related_to: appointment.id,
            on_model: 'appointment',
            channel: 'email'
          });
          
          // Também enviar por SMS
          await this.createNotification({
            recipient_id: appointment.client.id,
            type: 'appointment_reminder',
            title: 'Lembrete de Agendamento',
            message: `Lembrete: Agendamento amanhã, ${appointment.date}, ${appointment.start_time}, na ${appointment.barbershop.name}.`,
            related_to: appointment.id,
            on_model: 'appointment',
            channel: 'sms'
          });
          
          // Atualizar status de notificação do agendamento
          const notificationStatus = {
            ...appointment.notification_status,
            reminder_sent: true
          };
          
          await supabase
            .from('appointments')
            .update({ notification_status: notificationStatus })
            .eq('id', appointment.id);
          
          remindersSent++;
        } catch (notifError) {
          console.error(`Erro ao enviar lembrete para agendamento ${appointment.id}:`, notifError);
          // Continuar com os próximos agendamentos
        }
      }
      
      return remindersSent;
    } catch (error) {
      throw error;
    }
  }
};

module.exports = notificationService;
