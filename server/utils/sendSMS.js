// Este é um utilitário simulado para envio de SMS
// Em produção, você usaria um serviço real como Twilio, MessageBird, etc.

const sendSMS = async options => {
  console.log(`SIMULAÇÃO DE SMS PARA: ${options.phone}`);
  console.log(`MENSAGEM: ${options.message}`);
  
  // Em produção, você implementaria a integração com um serviço de SMS
  // Exemplo com Twilio:
  /*
  const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  
  const message = await client.messages.create({
    body: options.message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: options.phone
  });
  
  return message.sid;
  */
  
  return 'sms-simulado-' + Date.now();
};

module.exports = sendSMS;
