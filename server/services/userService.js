const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

/**
 * Serviço para gerenciar usuários usando o Supabase
 */
const userService = {
  /**
   * Registrar um novo usuário
   * @param {Object} userData - Dados do usuário a ser registrado
   * @returns {Promise<Object>} - Usuário registrado
   */
  async register(userData) {
    try {
      // Verificar se o email já existe
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', userData.email)
        .single();

      if (existingUser) {
        throw new Error('Usuário já existe com este email');
      }

      // Criptografar a senha
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      // Criar ID único
      const userId = uuidv4();

      // Criar usuário no Supabase
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: userId,
          name: userData.name,
          email: userData.email,
          password: hashedPassword,
          phone: userData.phone,
          role: userData.role || 'client',
          created_at: new Date()
        })
        .select()
        .single();

      if (error) throw new Error(error.message);

      // Remover a senha do objeto retornado
      delete data.password;

      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Login de usuário
   * @param {string} email - Email do usuário
   * @param {string} password - Senha do usuário
   * @returns {Promise<Object>} - Token JWT e dados do usuário
   */
  async login(email, password) {
    try {
      // Buscar usuário pelo email
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !user) {
        throw new Error('Credenciais inválidas');
      }

      // Verificar a senha
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        throw new Error('Credenciais inválidas');
      }

      // Gerar JWT
      const token = this.generateToken(user.id);

      // Remover senha do objeto de retorno
      delete user.password;

      return { token, user };
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obter usuário pelo ID
   * @param {string} userId - ID do usuário
   * @returns {Promise<Object>} - Dados do usuário
   */
  async getUserById(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, phone, role, created_at')
        .eq('id', userId)
        .single();

      if (error) throw new Error('Usuário não encontrado');

      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Atualizar dados do usuário
   * @param {string} userId - ID do usuário
   * @param {Object} userData - Novos dados do usuário
   * @returns {Promise<Object>} - Usuário atualizado
   */
  async updateUser(userId, userData) {
    try {
      // Remover campos que não devem ser atualizados diretamente
      delete userData.password;
      delete userData.id;
      delete userData.created_at;

      const { data, error } = await supabase
        .from('users')
        .update(userData)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw new Error('Erro ao atualizar usuário');

      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Atualizar senha do usuário
   * @param {string} userId - ID do usuário
   * @param {string} currentPassword - Senha atual
   * @param {string} newPassword - Nova senha
   * @returns {Promise<boolean>} - True se a senha foi atualizada com sucesso
   */
  async updatePassword(userId, currentPassword, newPassword) {
    try {
      // Buscar usuário com senha
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !user) {
        throw new Error('Usuário não encontrado');
      }

      // Verificar senha atual
      const isMatch = await bcrypt.compare(currentPassword, user.password);

      if (!isMatch) {
        throw new Error('Senha atual incorreta');
      }

      // Criptografar nova senha
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Atualizar senha
      const { error: updateError } = await supabase
        .from('users')
        .update({ password: hashedPassword })
        .eq('id', userId);

      if (updateError) throw new Error('Erro ao atualizar senha');

      return true;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Gerar token JWT
   * @param {string} userId - ID do usuário
   * @returns {string} - Token JWT
   */
  generateToken(userId) {
    return jwt.sign(
      { id: userId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '30d' }
    );
  },

  /**
   * Listar todos os usuários (para administradores)
   * @returns {Promise<Array>} - Lista de usuários
   */
  async listUsers() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, phone, role, created_at');

      if (error) throw new Error('Erro ao listar usuários');

      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Excluir um usuário
   * @param {string} userId - ID do usuário a ser excluído
   * @returns {Promise<boolean>} - True se o usuário foi excluído com sucesso
   */
  async deleteUser(userId) {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw new Error('Erro ao excluir usuário');

      return true;
    } catch (error) {
      throw error;
    }
  }
};

module.exports = userService;
