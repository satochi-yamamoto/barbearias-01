const supabase = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');

/**
 * Serviço para gerenciar serviços oferecidos pelas barbearias
 */
const serviceService = {
  /**
   * Criar um novo serviço
   * @param {Object} serviceData - Dados do serviço
   * @returns {Promise<Object>} - Serviço criado
   */
  async createService(serviceData) {
    try {
      // Gerar ID único
      const serviceId = uuidv4();

      // Adicionar datas
      serviceData.id = serviceId;
      serviceData.created_at = new Date();
      serviceData.is_active = true;

      // Criar o serviço no Supabase
      const { data, error } = await supabase
        .from('services')
        .insert(serviceData)
        .select()
        .single();

      if (error) throw new Error(error.message);

      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obter serviço pelo ID
   * @param {string} serviceId - ID do serviço
   * @returns {Promise<Object>} - Dados do serviço
   */
  async getServiceById(serviceId) {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*, barbershop:barbershops(id, name)')
        .eq('id', serviceId)
        .single();

      if (error) throw new Error('Serviço não encontrado');

      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Listar todos os serviços
   * @param {Object} filter - Filtros opcionais
   * @returns {Promise<Array>} - Lista de serviços
   */
  async listServices(filter = {}) {
    try {
      let query = supabase
        .from('services')
        .select('*, barbershop:barbershops(id, name)');

      // Aplicar filtros se houver
      if (filter.barbershop_id) {
        query = query.eq('barbershop_id', filter.barbershop_id);
      }

      if (filter.category) {
        query = query.eq('category', filter.category);
      }

      if (filter.is_active !== undefined) {
        query = query.eq('is_active', filter.is_active);
      }

      // Ordenar por nome
      query = query.order('name', { ascending: true });

      const { data, error } = await query;

      if (error) throw new Error('Erro ao listar serviços');

      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Atualizar um serviço
   * @param {string} serviceId - ID do serviço
   * @param {Object} serviceData - Novos dados do serviço
   * @returns {Promise<Object>} - Serviço atualizado
   */
  async updateService(serviceId, serviceData) {
    try {
      // Remover campos que não devem ser atualizados diretamente
      delete serviceData.id;
      delete serviceData.barbershop_id;
      delete serviceData.created_at;

      const { data, error } = await supabase
        .from('services')
        .update(serviceData)
        .eq('id', serviceId)
        .select()
        .single();

      if (error) throw new Error('Erro ao atualizar serviço');

      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Excluir um serviço
   * @param {string} serviceId - ID do serviço a ser excluído
   * @returns {Promise<boolean>} - True se o serviço foi excluído com sucesso
   */
  async deleteService(serviceId) {
    try {
      // Em vez de excluir, apenas desativar
      const { error } = await supabase
        .from('services')
        .update({ is_active: false })
        .eq('id', serviceId);

      if (error) throw new Error('Erro ao excluir serviço');

      return true;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Buscar serviços por categoria
   * @param {string} category - Categoria do serviço
   * @returns {Promise<Array>} - Lista de serviços
   */
  async findServicesByCategory(category) {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*, barbershop:barbershops(id, name)')
        .eq('category', category)
        .eq('is_active', true);

      if (error) throw new Error('Erro ao buscar serviços por categoria');

      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Buscar serviços por faixa de preço
   * @param {number} minPrice - Preço mínimo
   * @param {number} maxPrice - Preço máximo
   * @returns {Promise<Array>} - Lista de serviços
   */
  async findServicesByPriceRange(minPrice, maxPrice) {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*, barbershop:barbershops(id, name)')
        .gte('price', minPrice)
        .lte('price', maxPrice)
        .eq('is_active', true);

      if (error) throw new Error('Erro ao buscar serviços por faixa de preço');

      return data;
    } catch (error) {
      throw error;
    }
  }
};

module.exports = serviceService;
