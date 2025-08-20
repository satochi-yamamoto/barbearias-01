const supabase = require('../config/supabase');

const Barbershop = {
  async create(barbershop) {
    const { data, error } = await supabase.from('barbershops').insert(barbershop).select();
    if (error) throw error;
    return data[0];
  },

  async findById(id) {
    const { data, error } = await supabase.from('barbershops').select('*, owner:owner_id(*)').eq('id', id);
    if (error) throw error;
    return data[0];
  },

  async findAll() {
    const { data, error } = await supabase.from('barbershops').select('*, owner:owner_id(*)');
    if (error) throw error;
    return data;
  },

  async update(id, updates) {
    const { data, error } = await supabase.from('barbershops').update(updates).eq('id', id).select();
    if (error) throw error;
    return data[0];
  },

  async delete(id) {
    const { data, error } = await supabase.from('barbershops').delete().eq('id', id);
    if (error) throw error;
    return data;
  }
};

module.exports = Barbershop;