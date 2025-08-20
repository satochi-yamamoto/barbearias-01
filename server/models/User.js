const supabase = require('../config/supabase');

const User = {
  async create(user) {
    const { data, error } = await supabase.from('users').insert(user).select();
    if (error) throw error;
    return data[0];
  },

  async findByEmail(email) {
    const { data, error } = await supabase.from('users').select('*').eq('email', email);
    if (error) throw error;
    return data[0];
  },

  async findById(id) {
    const { data, error } = await supabase.from('users').select('*').eq('id', id);
    if (error) throw error;
    return data[0];
  },

  async findByIdAndUpdate(id, fieldsToUpdate) {
    const { data, error } = await supabase.from('users').update(fieldsToUpdate).eq('id', id).select();
    if (error) throw error;
    return data[0];
  }
};

module.exports = User;