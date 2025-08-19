import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import AuthContext from '../../context/auth/authContext';

const PrivateRoute = ({ component: Component, role }) => {
  const authContext = useContext(AuthContext);
  const { isAuthenticated, loading, user } = authContext;
  
  // Se ainda estiver carregando, renderizar nada
  if (loading) return null;
  
  // Se não estiver autenticado, redirecionar para login
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  // Se for necessário um papel específico e o usuário não tiver, redirecionar para o dashboard
  if (role && user.role !== role) {
    return <Navigate to="/dashboard" />;
  }
  
  // Se estiver autenticado e tiver o papel correto, renderizar o componente
  return <Component />;
};

export default PrivateRoute;
