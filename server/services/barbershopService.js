const supabase = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');

/**
 * Serviço para gerenciar barbearias usando o Supabase
 */
const barbershopService = {
  /**
   * Criar uma nova barbearia
   * @param {Object} barbershopData - Dados da barbearia
   * @returns {Promise<Object>} - Barbearia criada
   */
  async createBarbershop(barbershopData) {
    try {
      // Gerar ID único
      const barbershopId = uuidv4();

      // Adicionar datas
      barbershopData.id = barbershopId;
      barbershopData.created_at = new Date();
      barbershopData.is_active = true;

      // Criar a barbearia no Supabase
      const { data, error } = await supabase
        .from('barbershops')
        .insert(barbershopData)
        .select()
        .single();

      if (error) throw new Error(error.message);

      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obter barbearia pelo ID
   * @param {string} barbershopId - ID da barbearia
   * @returns {Promise<Object>} - Dados da barbearia
   */
  async getBarbershopById(barbershopId) {
    try {
      const { data, error } = await supabase
        .from('barbershops')
        .select('*, owner:users(id, name, email, phone)')
        .eq('id', barbershopId)
        .single();

      if (error) throw new Error('Barbearia não encontrada');

      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Listar todas as barbearias
   * @param {Object} filter - Filtros opcionais
   * @returns {Promise<Array>} - Lista de barbearias
   */
  async listBarbershops(filter = {}) {
    try {
      let query = supabase
        .from('barbershops')
        .select('*, owner:users(id, name, email, phone)');

      // Aplicar filtros se houver
      if (filter.owner_id) {
        query = query.eq('owner_id', filter.owner_id);
      }

      if (filter.is_active !== undefined) {
        query = query.eq('is_active', filter.is_active);
      }

      // Ordenar por nome
      query = query.order('name', { ascending: true });

      const { data, error } = await query;

      if (error) throw new Error('Erro ao listar barbearias');

      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Atualizar uma barbearia
   * @param {string} barbershopId - ID da barbearia
   * @param {Object} barbershopData - Novos dados da barbearia
   * @returns {Promise<Object>} - Barbearia atualizada
   */
  async updateBarbershop(barbershopId, barbershopData) {
    try {
      // Remover campos que não devem ser atualizados diretamente
      delete barbershopData.id;
      delete barbershopData.owner_id;
      delete barbershopData.created_at;

      const { data, error } = await supabase
        .from('barbershops')
        .update(barbershopData)
        .eq('id', barbershopId)
        .select()
        .single();

      if (error) throw new Error('Erro ao atualizar barbearia');

      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Excluir uma barbearia
   * @param {string} barbershopId - ID da barbearia a ser excluída
   * @returns {Promise<boolean>} - True se a barbearia foi excluída com sucesso
   */
  async deleteBarbershop(barbershopId) {
    try {
      // Em vez de excluir, apenas desativar
      const { error } = await supabase
        .from('barbershops')
        .update({ is_active: false })
        .eq('id', barbershopId);

      if (error) throw new Error('Erro ao excluir barbearia');

      return true;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Buscar barbearias por localização
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {number} radius - Raio em km
   * @returns {Promise<Array>} - Lista de barbearias
   */
  async findBarbershopsByLocation(lat, lng, radius = 10) {
    try {
      // Aqui precisamos usar uma função do PostgreSQL para calcular a distância
      // O Supabase usa PostgreSQL, então podemos usar a extensão PostGIS
      // Esta é uma simplificação, você precisaria configurar PostGIS no seu projeto Supabase
      const { data, error } = await supabase
        .rpc('find_barbershops_by_location', {
          lat,
          lng,
          radius_km: radius
        });

      if (error) throw new Error('Erro ao buscar barbearias por localização');

      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Atualizar horário de funcionamento da barbearia
   * @param {string} barbershopId - ID da barbearia
   * @param {Array} businessHours - Novos horários de funcionamento
   * @returns {Promise<Object>} - Barbearia atualizada
   */
  async updateBusinessHours(barbershopId, businessHours) {
    try {
      const { data, error } = await supabase
        .from('barbershops')
        .update({ business_hours: businessHours })
        .eq('id', barbershopId)
        .select()
        .single();

      if (error) throw new Error('Erro ao atualizar horários de funcionamento');

      return data;
    } catch (error) {
      throw error;
    }
  }
};

module.exports = barbershopService;
