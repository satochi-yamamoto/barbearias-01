import React from 'react';
import styled from 'styled-components';
import { FaFacebook, FaInstagram, FaTwitter } from 'react-icons/fa';

const FooterContainer = styled.footer`
  background-color: var(--primary-color);
  color: #fff;
  padding: 2rem 0;
  margin-top: 2rem;
`;

const FooterContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  padding: 0 2rem;
`;

const FooterSection = styled.div`
  h3 {
    font-size: 1.2rem;
    margin-bottom: 1rem;
    color: var(--accent-color);
  }
  
  p {
    margin-bottom: 0.8rem;
  }
  
  a {
    color: #fff;
    text-decoration: none;
    
    &:hover {
      color: var(--accent-color);
    }
  }
`;

const SocialLinks = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  
  a {
    color: #fff;
    font-size: 1.5rem;
    
    &:hover {
      color: var(--accent-color);
    }
  }
`;

const Copyright = styled.div`
  text-align: center;
  padding-top: 2rem;
  font-size: 0.9rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  margin-top: 2rem;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
  padding-left: 2rem;
  padding-right: 2rem;
`;

const Footer = () => {
  const year = new Date().getFullYear();
  
  return (
    <FooterContainer>
      <FooterContent>
        <FooterSection>
          <h3>Barbearias SaaS</h3>
          <p>Sistema de agendamentos para barbearias modernas e eficientes.</p>
          <SocialLinks>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
              <FaFacebook />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
              <FaInstagram />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
              <FaTwitter />
            </a>
          </SocialLinks>
        </FooterSection>
        
        <FooterSection>
          <h3>Links Rápidos</h3>
          <p><a href="/">Início</a></p>
          <p><a href="/about">Sobre</a></p>
          <p><a href="/login">Entrar</a></p>
          <p><a href="/register">Cadastrar</a></p>
        </FooterSection>
        
        <FooterSection>
          <h3>Contato</h3>
          <p>Email: contato@barbearias-saas.com</p>
          <p>Telefone: (11) 99999-9999</p>
          <p>Endereço: Rua das Barbearias, 123 - São Paulo/SP</p>
        </FooterSection>
      </FooterContent>
      
      <Copyright>
        &copy; {year} Barbearias SaaS. Todos os direitos reservados.
      </Copyright>
    </FooterContainer>
  );
};

export default Footer;
