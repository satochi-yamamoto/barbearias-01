import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../context/auth/authContext';
import styled from 'styled-components';
import { FaSignInAlt } from 'react-icons/fa';

const LoginContainer = styled.div`
  max-width: 500px;
  margin: 4rem auto;
  padding: 2rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
`;

const FormHeader = styled.div`
  text-align: center;
  margin-bottom: 2rem;
  
  h1 {
    color: var(--primary-color);
    margin-bottom: 0.5rem;
  }
  
  p {
    color: #666;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
  
  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: var(--dark-color);
  }
  
  input {
    width: 100%;
    padding: 0.8rem;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    font-size: 1rem;
    
    &:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 2px rgba(26, 26, 46, 0.2);
    }
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 0.8rem;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  justify-content: center;
  align-items: center;
  
  svg {
    margin-right: 0.5rem;
  }
  
  &:hover {
    background-color: var(--secondary-color);
  }
`;

const Alert = styled.div`
  padding: 0.8rem;
  margin: 1rem 0;
  background-color: #f8d7da;
  color: #721c24;
  border-radius: 4px;
  text-align: center;
`;

const FormFooter = styled.div`
  text-align: center;
  margin-top: 1.5rem;
  color: #666;
  
  a {
    color: var(--primary-color);
    font-weight: 600;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

const Login = () => {
  const authContext = useContext(AuthContext);
  const { login, error, clearErrors, isAuthenticated } = authContext;
  
  const navigate = useNavigate();
  
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);
  
  const [user, setUser] = useState({
    email: '',
    password: ''
  });
  
  const { email, password } = user;
  
  const onChange = e => setUser({ ...user, [e.target.name]: e.target.value });
  
  const onSubmit = e => {
    e.preventDefault();
    if (email === '' || password === '') {
      alert('Por favor, preencha todos os campos');
    } else {
      login({
        email,
        password
      });
    }
  };
  
  return (
    <LoginContainer>
      <FormHeader>
        <h1>Entrar</h1>
        <p>Acesse sua conta para gerenciar agendamentos</p>
      </FormHeader>
      
      {error && <Alert>{error}</Alert>}
      
      <form onSubmit={onSubmit}>
        <FormGroup>
          <label htmlFor="email">Email</label>
          <input
            type="email"
            name="email"
            value={email}
            onChange={onChange}
            required
          />
        </FormGroup>
        
        <FormGroup>
          <label htmlFor="password">Senha</label>
          <input
            type="password"
            name="password"
            value={password}
            onChange={onChange}
            required
          />
        </FormGroup>
        
        <SubmitButton type="submit">
          <FaSignInAlt /> Entrar
        </SubmitButton>
      </form>
      
      <FormFooter>
        Não tem uma conta? <Link to="/register">Cadastre-se</Link>
      </FormFooter>
    </LoginContainer>
  );
};

export default Login;
