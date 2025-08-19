import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { FaCalendarAlt, FaCut, FaUsers, FaBell } from 'react-icons/fa';

const HeroSection = styled.section`
  background: linear-gradient(rgba(26, 26, 46, 0.8), rgba(22, 33, 62, 0.9)), url('/images/barbershop-bg.jpg');
  background-size: cover;
  background-position: center;
  color: white;
  padding: 6rem 2rem;
  text-align: center;
`;

const HeroTitle = styled.h1`
  font-size: 3rem;
  margin-bottom: 1.5rem;
`;

const HeroSubtitle = styled.p`
  font-size: 1.2rem;
  max-width: 800px;
  margin: 0 auto 2rem;
  line-height: 1.6;
`;

const Button = styled(Link)`
  display: inline-block;
  background-color: var(--accent-color);
  color: white;
  padding: 0.8rem 2rem;
  border-radius: 4px;
  font-weight: 600;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: #d03a54;
    transform: translateY(-3px);
  }
`;

const FeaturesSection = styled.section`
  padding: 4rem 2rem;
`;

const SectionTitle = styled.h2`
  text-align: center;
  margin-bottom: 3rem;
  font-size: 2.2rem;
  color: var(--primary-color);
  
  &:after {
    content: '';
    display: block;
    width: 80px;
    height: 4px;
    background-color: var(--accent-color);
    margin: 1rem auto 0;
  }
`;

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const FeatureCard = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  text-align: center;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-10px);
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.15);
  }
`;

const FeatureIcon = styled.div`
  font-size: 3rem;
  color: var(--accent-color);
  margin-bottom: 1.5rem;
`;

const FeatureTitle = styled.h3`
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: var(--primary-color);
`;

const FeatureDescription = styled.p`
  color: #666;
  line-height: 1.6;
`;

const CtaSection = styled.section`
  background-color: var(--primary-color);
  color: white;
  padding: 4rem 2rem;
  text-align: center;
`;

const CtaTitle = styled.h2`
  font-size: 2.2rem;
  margin-bottom: 1.5rem;
`;

const CtaText = styled.p`
  max-width: 800px;
  margin: 0 auto 2rem;
  font-size: 1.1rem;
  line-height: 1.6;
`;

const Home = () => {
  return (
    <>
      <HeroSection>
        <HeroTitle>Sistema de Agendamento para Barbearias</HeroTitle>
        <HeroSubtitle>
          Uma plataforma completa para gerenciar agendamentos, clientes, serviços
          e impulsionar o crescimento da sua barbearia.
        </HeroSubtitle>
        <Button to="/register">Comece Agora</Button>
      </HeroSection>
      
      <FeaturesSection>
        <SectionTitle>Por que escolher nossa plataforma?</SectionTitle>
        <FeatureGrid>
          <FeatureCard>
            <FeatureIcon>
              <FaCalendarAlt />
            </FeatureIcon>
            <FeatureTitle>Agendamento Fácil</FeatureTitle>
            <FeatureDescription>
              Sistema intuitivo de agendamento online para seus clientes marcarem horários 24/7,
              sem a necessidade de telefonemas ou mensagens.
            </FeatureDescription>
          </FeatureCard>
          
          <FeatureCard>
            <FeatureIcon>
              <FaBell />
            </FeatureIcon>
            <FeatureTitle>Notificações Automáticas</FeatureTitle>
            <FeatureDescription>
              Envie lembretes automáticos por e-mail e SMS para reduzir faltas e
              manter seus clientes informados sobre seus agendamentos.
            </FeatureDescription>
          </FeatureCard>
          
          <FeatureCard>
            <FeatureIcon>
              <FaCut />
            </FeatureIcon>
            <FeatureTitle>Gestão de Serviços</FeatureTitle>
            <FeatureDescription>
              Cadastre seus serviços, preços e durações para oferecer um catálogo
              completo aos seus clientes e facilitar o processo de agendamento.
            </FeatureDescription>
          </FeatureCard>
          
          <FeatureCard>
            <FeatureIcon>
              <FaUsers />
            </FeatureIcon>
            <FeatureTitle>Múltiplos Barbeiros</FeatureTitle>
            <FeatureDescription>
              Gerencie a agenda de vários barbeiros, definindo horários de trabalho,
              especialidades e mantendo tudo organizado em um só lugar.
            </FeatureDescription>
          </FeatureCard>
        </FeatureGrid>
      </FeaturesSection>
      
      <CtaSection>
        <CtaTitle>Pronto para transformar sua barbearia?</CtaTitle>
        <CtaText>
          Junte-se a centenas de barbearias que já estão utilizando nossa plataforma para
          simplificar o gerenciamento, aumentar a satisfação dos clientes e impulsionar o crescimento.
        </CtaText>
        <Button to="/register">Experimente Gratuitamente</Button>
      </CtaSection>
    </>
  );
};

export default Home;
