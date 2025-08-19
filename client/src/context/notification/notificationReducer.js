import {
  GET_NOTIFICATIONS,
  NOTIFICATION_ERROR,
  MARK_READ,
  DELETE_NOTIFICATION,
  SEND_REMINDER,
  SEND_CONFIRMATION,
  CLEAR_NOTIFICATIONS
} from '../types';

export default (state, action) => {
  switch (action.type) {
    case GET_NOTIFICATIONS:
      return {
        ...state,
        notifications: action.payload,
        loading: false,
        unreadNotifications: action.payload.filter(notification => !notification.isRead).length
      };
    case MARK_READ:
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          notification._id === action.payload._id ? action.payload : notification
        ),
        unreadNotifications: state.unreadNotifications - 1,
        loading: false
      };
    case DELETE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter(
          notification => notification._id !== action.payload
        ),
        unreadNotifications: state.notifications.filter(
          notification => notification._id !== action.payload && !notification.isRead
        ).length,
        loading: false
      };
    case SEND_REMINDER:
    case SEND_CONFIRMATION:
      return {
        ...state,
        loading: false
      };
    case NOTIFICATION_ERROR:
      return {
        ...state,
        error: action.payload
      };
    case CLEAR_NOTIFICATIONS:
      return {
        ...state,
        notifications: null,
        error: null,
        unreadNotifications: 0,
        loading: true
      };
    default:
      return state;
  }
};
