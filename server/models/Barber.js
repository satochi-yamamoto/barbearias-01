const supabase = require('../config/supabase');

const Barber = {
  async create(barber) {
    const { data, error } = await supabase.from('barbers').insert(barber).select();
    if (error) throw error;
    return data[0];
  },

  async findById(id) {
    const { data, error } = await supabase.from('barbers').select('*, user:user_id(*), barbershop:barbershop_id(*)').eq('id', id);
    if (error) throw error;
    return data[0];
  },

  async findByBarbershopId(barbershopId) {
    const { data, error } = await supabase.from('barbers').select('*, user:user_id(*), barbershop:barbershop_id(*)').eq('barbershop_id', barbershopId);
    if (error) throw error;
    return data;
  },

  async update(id, updates) {
    const { data, error } = await supabase.from('barbers').update(updates).eq('id', id).select();
    if (error) throw error;
    return data[0];
  },

  async delete(id) {
    const { data, error } = await supabase.from('barbers').delete().eq('id', id);
    if (error) throw error;
    return data;
  }
};

module.exports = Barber;