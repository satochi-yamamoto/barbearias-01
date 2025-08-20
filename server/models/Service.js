const supabase = require('../config/supabase');

const Service = {
  async create(service) {
    const { data, error } = await supabase.from('services').insert(service).select();
    if (error) throw error;
    return data[0];
  },

  async findById(id) {
    const { data, error } = await supabase.from('services').select('*, barbershop:barbershop_id(*)').eq('id', id);
    if (error) throw error;
    return data[0];
  },

  async findByBarbershopId(barbershopId) {
    const { data, error } = await supabase.from('services').select('*, barbershop:barbershop_id(*)').eq('barbershop_id', barbershopId);
    if (error) throw error;
    return data;
  },

  async update(id, updates) {
    const { data, error } = await supabase.from('services').update(updates).eq('id', id).select();
    if (error) throw error;
    return data[0];
  },

  async delete(id) {
    const { data, error } = await supabase.from('services').delete().eq('id', id);
    if (error) throw error;
    return data;
  }
};

module.exports = Service;