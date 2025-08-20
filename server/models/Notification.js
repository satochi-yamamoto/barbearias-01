const supabase = require('../config/supabase');

const Notification = {
  async create(notification) {
    const { data, error } = await supabase.from('notifications').insert(notification).select();
    if (error) throw error;
    return data[0];
  },

  async findByRecipientId(recipientId) {
    const { data, error } = await supabase.from('notifications').select('*').eq('recipient_id', recipientId);
    if (error) throw error;
    return data;
  },

  async markAsRead(id) {
    const { data, error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id).select();
    if (error) throw error;
    return data[0];
  }
};

module.exports = Notification;