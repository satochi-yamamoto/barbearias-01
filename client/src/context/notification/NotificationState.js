import React, { useReducer } from 'react';
import axios from 'axios';
import NotificationContext from './notificationContext';
import notificationReducer from './notificationReducer';
import {
  GET_NOTIFICATIONS,
  NOTIFICATION_ERROR,
  MARK_READ,
  DELETE_NOTIFICATION,
  SEND_REMINDER,
  SEND_CONFIRMATION,
  CLEAR_NOTIFICATIONS
} from '../types';

const NotificationState = props => {
  const initialState = {
    notifications: null,
    error: null,
    loading: true,
    unreadNotifications: 0
  };

  const [state, dispatch] = useReducer(notificationReducer, initialState);

  // Obter notificações
  const getNotifications = async () => {
    try {
      const res = await axios.get('/api/notifications');

      dispatch({
        type: GET_NOTIFICATIONS,
        payload: res.data.data
      });
    } catch (err) {
      dispatch({
        type: NOTIFICATION_ERROR,
        payload: err.response.data.error
      });
    }
  };

  // Marcar notificação como lida
  const markAsRead = async id => {
    try {
      const res = await axios.put(`/api/notifications/${id}`);

      dispatch({
        type: MARK_READ,
        payload: res.data.data
      });
    } catch (err) {
      dispatch({
        type: NOTIFICATION_ERROR,
        payload: err.response.data.error
      });
    }
  };

  // Excluir notificação
  const deleteNotification = async id => {
    try {
      await axios.delete(`/api/notifications/${id}`);

      dispatch({
        type: DELETE_NOTIFICATION,
        payload: id
      });
    } catch (err) {
      dispatch({
        type: NOTIFICATION_ERROR,
        payload: err.response.data.error
      });
    }
  };

  // Enviar lembrete de agendamento
  const sendAppointmentReminder = async appointmentId => {
    try {
      await axios.post(`/api/notifications/send/appointment-reminder/${appointmentId}`);

      dispatch({
        type: SEND_REMINDER
      });
    } catch (err) {
      dispatch({
        type: NOTIFICATION_ERROR,
        payload: err.response.data.error
      });
    }
  };

  // Enviar confirmação de agendamento
  const sendAppointmentConfirmation = async appointmentId => {
    try {
      await axios.post(`/api/notifications/send/appointment-confirmation/${appointmentId}`);

      dispatch({
        type: SEND_CONFIRMATION
      });
    } catch (err) {
      dispatch({
        type: NOTIFICATION_ERROR,
        payload: err.response.data.error
      });
    }
  };

  // Limpar notificações
  const clearNotifications = () => {
    dispatch({ type: CLEAR_NOTIFICATIONS });
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications: state.notifications,
        error: state.error,
        loading: state.loading,
        unreadNotifications: state.unreadNotifications,
        getNotifications,
        markAsRead,
        deleteNotification,
        sendAppointmentReminder,
        sendAppointmentConfirmation,
        clearNotifications
      }}
    >
      {props.children}
    </NotificationContext.Provider>
  );
};

export default NotificationState;
