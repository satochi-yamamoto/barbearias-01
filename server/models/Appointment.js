const supabase = require('../config/supabase');

const Appointment = {
  async create(appointment) {
    const { data, error } = await supabase.from('appointments').insert(appointment).select();
    if (error) throw error;
    return data[0];
  },

  async findById(id) {
    const { data, error } = await supabase.from('appointments').select('*, client:client_id(*), barber:barber_id(*), barbershop:barbershop_id(*), service:service_id(*)').eq('id', id);
    if (error) throw error;
    return data[0];
  },

  async findByClientId(clientId) {
    const { data, error } = await supabase.from('appointments').select('*, client:client_id(*), barber:barber_id(*), barbershop:barbershop_id(*), service:service_id(*)').eq('client_id', clientId);
    if (error) throw error;
    return data;
  },

  async findByBarberId(barberId) {
    const { data, error } = await supabase.from('appointments').select('*, client:client_id(*), barber:barber_id(*), barbershop:barbershop_id(*), service:service_id(*)').eq('barber_id', barberId);
    if (error) throw error;
    return data;
  },

  async update(id, updates) {
    const { data, error } = await supabase.from('appointments').update(updates).eq('id', id).select();
    if (error) throw error;
    return data[0];
  },

  async delete(id) {
    const { data, error } = await supabase.from('appointments').delete().eq('id', id);
    if (error) throw error;
    return data;
  }
};

module.exports = Appointment;