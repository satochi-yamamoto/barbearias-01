import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Formatar data para exibição (formato: quinta-feira, 10 de janeiro de 2023)
export const formatDate = dateString => {
  const date = parseISO(dateString);
  return format(date, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
};

// Formatar hora para exibição (formato: 14:30)
export const formatTime = timeString => {
  return timeString;
};

// Formatação para status de agendamento
export const formatAppointmentStatus = status => {
  const statusMap = {
    agendado: { text: 'Agendado', color: 'warning' },
    confirmado: { text: 'Confirmado', color: 'primary' },
    cancelado: { text: 'Cancelado', color: 'danger' },
    concluído: { text: 'Concluído', color: 'success' }
  };
  
  return statusMap[status] || { text: status, color: 'secondary' };
};

// Formatação para status de pagamento
export const formatPaymentStatus = status => {
  const statusMap = {
    pendente: { text: 'Pendente', color: 'warning' },
    pago: { text: 'Pago', color: 'success' },
    reembolsado: { text: 'Reembolsado', color: 'info' }
  };
  
  return statusMap[status] || { text: status, color: 'secondary' };
};

// Formatação para método de pagamento
export const formatPaymentMethod = method => {
  const methodMap = {
    dinheiro: 'Dinheiro',
    cartão: 'Cartão',
    pix: 'PIX',
    outro: 'Outro'
  };
  
  return methodMap[method] || method;
};

// Formatação para valor monetário
export const formatCurrency = value => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};
