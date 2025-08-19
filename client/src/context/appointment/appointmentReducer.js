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

export default (state, action) => {
  switch (action.type) {
    case GET_APPOINTMENTS:
      return {
        ...state,
        appointments: action.payload,
        loading: false
      };
    case GET_APPOINTMENT:
      return {
        ...state,
        current: action.payload,
        loading: false
      };
    case CREATE_APPOINTMENT:
      return {
        ...state,
        appointments: [action.payload, ...state.appointments],
        loading: false
      };
    case UPDATE_APPOINTMENT:
      return {
        ...state,
        appointments: state.appointments.map(appointment =>
          appointment._id === action.payload._id ? action.payload : appointment
        ),
        loading: false
      };
    case DELETE_APPOINTMENT:
      return {
        ...state,
        appointments: state.appointments.filter(
          appointment => appointment._id !== action.payload
        ),
        loading: false
      };
    case CLEAR_APPOINTMENTS:
      return {
        ...state,
        appointments: null,
        filtered: null,
        error: null,
        current: null
      };
    case SET_CURRENT:
      return {
        ...state,
        current: action.payload
      };
    case CLEAR_CURRENT:
      return {
        ...state,
        current: null
      };
    case FILTER_APPOINTMENTS:
      return {
        ...state,
        filtered: state.appointments.filter(appointment => {
          const regex = new RegExp(`${action.payload}`, 'gi');
          return (
            appointment.service.name.match(regex) ||
            appointment.barber.user.name.match(regex) ||
            appointment.status.match(regex)
          );
        })
      };
    case CLEAR_FILTER:
      return {
        ...state,
        filtered: null
      };
    case APPOINTMENT_ERROR:
      return {
        ...state,
        error: action.payload
      };
    default:
      return state;
  }
};
