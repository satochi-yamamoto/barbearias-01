const supabase = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');

/**
 * Serviço para gerenciar barbeiros
 */
const barberService = {
  /**
   * Criar um novo perfil de barbeiro
   * @param {Object} barberData - Dados do barbeiro
   * @returns {Promise<Object>} - Perfil de barbeiro criado
   */
  async createBarber(barberData) {
    try {
      // Gerar ID único
      const barberId = uuidv4();

      // Adicionar datas
      barberData.id = barberId;
      barberData.created_at = new Date();
      barberData.is_active = true;
      barberData.rating = 0;

      // Criar o barbeiro no Supabase
      const { data, error } = await supabase
        .from('barbers')
        .insert(barberData)
        .select()
        .single();

      if (error) throw new Error(error.message);

      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obter barbeiro pelo ID
   * @param {string} barberId - ID do barbeiro
   * @returns {Promise<Object>} - Dados do barbeiro
   */
  async getBarberById(barberId) {
    try {
      const { data, error } = await supabase
        .from('barbers')
        .select(`
          *,
          user:users(id, name, email, phone),
          barbershop:barbershops(id, name, address, phone)
        `)
        .eq('id', barberId)
        .single();

      if (error) throw new Error('Barbeiro não encontrado');

      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Listar todos os barbeiros
   * @param {Object} filter - Filtros opcionais
   * @returns {Promise<Array>} - Lista de barbeiros
   */
  async listBarbers(filter = {}) {
    try {
      let query = supabase
        .from('barbers')
        .select(`
          *,
          user:users(id, name, email, phone),
          barbershop:barbershops(id, name)
        `);

      // Aplicar filtros se houver
      if (filter.barbershop_id) {
        query = query.eq('barbershop_id', filter.barbershop_id);
      }

      if (filter.user_id) {
        query = query.eq('user_id', filter.user_id);
      }

      if (filter.is_active !== undefined) {
        query = query.eq('is_active', filter.is_active);
      }

      // Ordenar por avaliação (rating)
      query = query.order('rating', { ascending: false });

      const { data, error } = await query;

      if (error) throw new Error('Erro ao listar barbeiros');

      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Atualizar um barbeiro
   * @param {string} barberId - ID do barbeiro
   * @param {Object} barberData - Novos dados do barbeiro
   * @returns {Promise<Object>} - Barbeiro atualizado
   */
  async updateBarber(barberId, barberData) {
    try {
      // Remover campos que não devem ser atualizados diretamente
      delete barberData.id;
      delete barberData.user_id;
      delete barberData.barbershop_id;
      delete barberData.created_at;
      delete barberData.rating; // A avaliação é calculada separadamente

      const { data, error } = await supabase
        .from('barbers')
        .update(barberData)
        .eq('id', barberId)
        .select()
        .single();

      if (error) throw new Error('Erro ao atualizar barbeiro');

      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Excluir um barbeiro
   * @param {string} barberId - ID do barbeiro a ser excluído
   * @returns {Promise<boolean>} - True se o barbeiro foi excluído com sucesso
   */
  async deleteBarber(barberId) {
    try {
      // Em vez de excluir, apenas desativar
      const { error } = await supabase
        .from('barbers')
        .update({ is_active: false })
        .eq('id', barberId);

      if (error) throw new Error('Erro ao excluir barbeiro');

      return true;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Atualizar horário de trabalho do barbeiro
   * @param {string} barberId - ID do barbeiro
   * @param {Array} workingHours - Novos horários de trabalho
   * @returns {Promise<Object>} - Barbeiro atualizado
   */
  async updateWorkingHours(barberId, workingHours) {
    try {
      const { data, error } = await supabase
        .from('barbers')
        .update({ working_hours: workingHours })
        .eq('id', barberId)
        .select()
        .single();

      if (error) throw new Error('Erro ao atualizar horários de trabalho');

      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Adicionar avaliação a um barbeiro
   * @param {string} barberId - ID do barbeiro
   * @param {Object} reviewData - Dados da avaliação
   * @returns {Promise<Object>} - Barbeiro atualizado
   */
  async addReview(barberId, reviewData) {
    try {
      // Buscar barbeiro para verificar avaliações existentes
      const { data: barber, error: barberError } = await supabase
        .from('barbers')
        .select('reviews, rating')
        .eq('id', barberId)
        .single();

      if (barberError) throw new Error('Barbeiro não encontrado');

      // Preparar a nova avaliação
      const newReview = {
        id: uuidv4(),
        user_id: reviewData.user_id,
        text: reviewData.text,
        rating: reviewData.rating,
        created_at: new Date()
      };

      // Adicionar à lista de avaliações
      const reviews = barber.reviews || [];
      reviews.push(newReview);

      // Calcular nova avaliação média
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / reviews.length;

      // Atualizar barbeiro com nova avaliação e média
      const { data, error } = await supabase
        .from('barbers')
        .update({
          reviews,
          rating: parseFloat(averageRating.toFixed(1))
        })
        .eq('id', barberId)
        .select()
        .single();

      if (error) throw new Error('Erro ao adicionar avaliação');

      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Buscar barbeiros por especialidade
   * @param {string} specialty - Especialidade
   * @returns {Promise<Array>} - Lista de barbeiros
   */
  async findBarbersBySpecialty(specialty) {
    try {
      const { data, error } = await supabase
        .from('barbers')
        .select(`
          *,
          user:users(id, name, email, phone),
          barbershop:barbershops(id, name)
        `)
        .contains('specialties', [specialty])
        .eq('is_active', true)
        .order('rating', { ascending: false });

      if (error) throw new Error('Erro ao buscar barbeiros por especialidade');

      return data;
    } catch (error) {
      throw error;
    }
  }
};

module.exports = barberService;
