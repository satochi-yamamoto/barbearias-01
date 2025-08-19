import React, { useReducer } from 'react';
import axios from 'axios';
import AppointmentContext from './appointmentContext';
import appointmentReducer from './appointmentReducer';
import {
  GET_APPOINTMENTS,
  GET_APPOINTMENT,
  CREATE_APPOINTMENT,
  UPDATE_APPOINTMENT,
  DELETE_APPOINTMENT,
  APPOINTMENT_ERROR,
  CLEAR_APPOINTMENTS,
  CLEAR_CURRENT,
  SET_CURRENT,
  FILTER_APPOINTMENTS,
  CLEAR_FILTER
} from '../types';

const AppointmentState = props => {
  const initialState = {
    appointments: null,
    current: null,
    filtered: null,
    error: null,
    loading: true
  };

  const [state, dispatch] = useReducer(appointmentReducer, initialState);

  // Obter agendamentos
  const getAppointments = async () => {
    try {
      const res = await axios.get('/api/appointments');

      dispatch({
        type: GET_APPOINTMENTS,
        payload: res.data.data
      });
    } catch (err) {
      dispatch({
        type: APPOINTMENT_ERROR,
        payload: err.response.data.error
      });
    }
  };

  // Obter agendamento específico
  const getAppointment = async id => {
    try {
      const res = await axios.get(`/api/appointments/${id}`);

      dispatch({
        type: GET_APPOINTMENT,
        payload: res.data.data
      });
    } catch (err) {
      dispatch({
        type: APPOINTMENT_ERROR,
        payload: err.response.data.error
      });
    }
  };

  // Criar agendamento
  const createAppointment = async appointment => {
    const config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };

    try {
      const res = await axios.post('/api/appointments', appointment, config);

      dispatch({
        type: CREATE_APPOINTMENT,
        payload: res.data.data
      });
    } catch (err) {
      dispatch({
        type: APPOINTMENT_ERROR,
        payload: err.response.data.error
      });
    }
  };

  // Atualizar agendamento
  const updateAppointment = async appointment => {
    const config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };

    try {
      const res = await axios.put(
        `/api/appointments/${appointment._id}`,
        appointment,
        config
      );

      dispatch({
        type: UPDATE_APPOINTMENT,
        payload: res.data.data
      });
    } catch (err) {
      dispatch({
        type: APPOINTMENT_ERROR,
        payload: err.response.data.error
      });
    }
  };

  // Cancelar agendamento
  const cancelAppointment = async id => {
    try {
      await axios.put(`/api/appointments/${id}/cancel`);

      getAppointment(id);
    } catch (err) {
      dispatch({
        type: APPOINTMENT_ERROR,
        payload: err.response.data.error
      });
    }
  };

  // Confirmar agendamento (apenas barbeiro)
  const confirmAppointment = async id => {
    try {
      await axios.put(`/api/appointments/${id}/confirm`);

      getAppointment(id);
    } catch (err) {
      dispatch({
        type: APPOINTMENT_ERROR,
        payload: err.response.data.error
      });
    }
  };

  // Completar agendamento (apenas barbeiro)
  const completeAppointment = async (id, paymentInfo) => {
    const config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };

    try {
      await axios.put(`/api/appointments/${id}/complete`, paymentInfo, config);

      getAppointment(id);
    } catch (err) {
      dispatch({
        type: APPOINTMENT_ERROR,
        payload: err.response.data.error
      });
    }
  };

  // Avaliar agendamento (apenas cliente)
  const rateAppointment = async (id, rating) => {
    const config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };

    try {
      await axios.put(`/api/appointments/${id}/rate`, rating, config);

      getAppointment(id);
    } catch (err) {
      dispatch({
        type: APPOINTMENT_ERROR,
        payload: err.response.data.error
      });
    }
  };

  // Excluir agendamento
  const deleteAppointment = async id => {
    try {
      await axios.delete(`/api/appointments/${id}`);

      dispatch({
        type: DELETE_APPOINTMENT,
        payload: id
      });
    } catch (err) {
      dispatch({
        type: APPOINTMENT_ERROR,
        payload: err.response.data.error
      });
    }
  };

  // Limpar agendamentos
  const clearAppointments = () => {
    dispatch({ type: CLEAR_APPOINTMENTS });
  };

  // Definir agendamento atual
  const setCurrent = appointment => {
    dispatch({
      type: SET_CURRENT,
      payload: appointment
    });
  };

  // Limpar agendamento atual
  const clearCurrent = () => {
    dispatch({ type: CLEAR_CURRENT });
  };

  // Filtrar agendamentos
  const filterAppointments = text => {
    dispatch({
      type: FILTER_APPOINTMENTS,
      payload: text
    });
  };

  // Limpar filtro
  const clearFilter = () => {
    dispatch({ type: CLEAR_FILTER });
  };

  return (
    <AppointmentContext.Provider
      value={{
        appointments: state.appointments,
        current: state.current,
        filtered: state.filtered,
        error: state.error,
        loading: state.loading,
        getAppointments,
        getAppointment,
        createAppointment,
        updateAppointment,
        deleteAppointment,
        clearAppointments,
        setCurrent,
        clearCurrent,
        filterAppointments,
        clearFilter,
        cancelAppointment,
        confirmAppointment,
        completeAppointment,
        rateAppointment
      }}
    >
      {props.children}
    </AppointmentContext.Provider>
  );
};

export default AppointmentState;
