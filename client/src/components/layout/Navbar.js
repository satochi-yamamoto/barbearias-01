import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import AuthContext from '../../context/auth/authContext';
import NotificationContext from '../../context/notification/notificationContext';
import styled from 'styled-components';
import { FaUserCircle, FaBell } from 'react-icons/fa';

const NavbarContainer = styled.nav`
  background-color: var(--primary-color);
  color: #fff;
  padding: 0.7rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const Logo = styled(Link)`
  color: #fff;
  font-size: 1.5rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  
  &:hover {
    color: var(--accent-color);
  }
`;

const NavLinks = styled.ul`
  display: flex;
  align-items: center;
`;

const NavItem = styled.li`
  margin-left: 1.5rem;
`;

const NavLink = styled(Link)`
  color: #fff;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  
  &:hover {
    color: var(--accent-color);
  }
`;

const NotificationBadge = styled.span`
  position: relative;
  
  .badge {
    position: absolute;
    top: -8px;
    right: -8px;
    background-color: var(--accent-color);
    color: white;
    border-radius: 50%;
    width: 18px;
    height: 18px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 0.7rem;
  }
`;

const Navbar = ({ title }) => {
  const authContext = useContext(AuthContext);
  const notificationContext = useContext(NotificationContext);
  
  const { isAuthenticated, logout, user } = authContext;
  const { unreadNotifications } = notificationContext;
  
  const onLogout = () => {
    logout();
  };
  
  const authLinks = (
    <>
      <NavItem>
        <NavLink to="/notifications">
          <NotificationBadge>
            <FaBell size={20} />
            {unreadNotifications > 0 && (
              <span className="badge">{unreadNotifications}</span>
            )}
          </NotificationBadge>
        </NavLink>
      </NavItem>
      <NavItem>
        <NavLink to="/profile">
          <FaUserCircle size={20} style={{ marginRight: '5px' }} />
          {user && user.name}
        </NavLink>
      </NavItem>
      <NavItem>
        <NavLink onClick={onLogout} to="#!">
          Sair
        </NavLink>
      </NavItem>
    </>
  );
  
  const guestLinks = (
    <>
      <NavItem>
        <NavLink to="/register">Cadastrar</NavLink>
      </NavItem>
      <NavItem>
        <NavLink to="/login">Entrar</NavLink>
      </NavItem>
    </>
  );
  
  return (
    <NavbarContainer>
      <Logo to="/">
        {title}
      </Logo>
      <NavLinks>
        <NavItem>
          <NavLink to="/">Início</NavLink>
        </NavItem>
        <NavItem>
          <NavLink to="/about">Sobre</NavLink>
        </NavItem>
        {isAuthenticated ? authLinks : guestLinks}
      </NavLinks>
    </NavbarContainer>
  );
};

Navbar.propTypes = {
  title: PropTypes.string.isRequired
};

Navbar.defaultProps = {
  title: 'Barbearias SaaS'
};

export default Navbar;
