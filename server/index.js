require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const supabase = require('./config/supabase');

// Inicialização do app
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Testar conexão com Supabase
(async () => {
  const { data, error } = await supabase.from('health_check').select('*').limit(1);
  if (error) {
    console.error('Erro na conexão com Supabase:', error);
  } else {
    console.log('Supabase conectado com sucesso');
  }
})();

// Rotas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/barbers', require('./routes/barbers'));
app.use('/api/services', require('./routes/services'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/notifications', require('./routes/notifications'));

// Servir arquivos estáticos em produção
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

// Porta do servidor
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
